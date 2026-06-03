import os
import random
import re
import smtplib
from datetime import date, datetime, time, timedelta
from email.message import EmailMessage

import psycopg
from psycopg import errors
from flask import Flask, jsonify, request
from flask_cors import CORS


DATABASE_URL = os.environ.get("DATABASE_URL")
# The restaurant has 30 tables. This is configurable only to make "slot full" and
# "day full" states easy to exercise in testing (e.g. TABLE_COUNT=1); keep it at
# 30 for the real demo. Values stay within the DB's CHECK (table_number 1..30).
TABLE_COUNT = max(1, min(30, int(os.environ.get("TABLE_COUNT", "30"))))
MAX_BOOKING_ATTEMPTS = 5

# Cafe Fausse seats on the hour, 5:00 PM through 10:00 PM, and is closed Mondays.
OPEN_HOURS = (17, 18, 19, 20, 21, 22)
CLOSED_WEEKDAY = 0  # Monday

# Optional SMTP settings for reservation confirmation emails. When SMTP_HOST is
# unset (the default for local demos) the confirmation is logged instead of sent.
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
MAIL_FROM = os.environ.get("MAIL_FROM", "reservations@fausse-cafe.com")

# Larger parties are booked as special group events by the restaurant directly
# (see the "Good to know" panel), so the online form tops out here.
MAX_GUESTS_PER_RESERVATION = 10

# Pragmatic email check: a local part, an "@", and a dotted domain, no spaces.
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_valid_email(email):
    return bool(EMAIL_PATTERN.match(email))


def create_app():
    app = Flask(__name__)
    CORS(app, origins=os.environ.get("CORS_ORIGINS", "*").split(","))

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "cafe-fausse-api"})

    @app.post("/api/newsletter")
    def newsletter_signup():
        payload = request.get_json(silent=True) or {}
        name = (payload.get("name") or "").strip()
        email = (payload.get("email") or "").strip().lower()
        phone = (payload.get("phone") or "").strip() or None

        if not name or not is_valid_email(email):
            return jsonify({"message": "Please enter a valid name and email."}), 400

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO customers (customer_name, customer_email, phone_number, newsletter_signup)
                    VALUES (%s, %s, %s, TRUE)
                    ON CONFLICT (customer_email)
                    DO UPDATE SET
                        customer_name = EXCLUDED.customer_name,
                        phone_number = COALESCE(EXCLUDED.phone_number, customers.phone_number),
                        newsletter_signup = TRUE
                    RETURNING customer_id;
                    """,
                    (name, email, phone),
                )
                customer_id = cur.fetchone()[0]
            conn.commit()

        return jsonify(
            {
                "message": "Thank you for signing up for the Cafe Fausse newsletter.",
                "customerId": customer_id,
            }
        )

    @app.get("/api/availability")
    def availability():
        time_slot_raw = (request.args.get("timeSlot") or "").strip()
        if not time_slot_raw:
            return jsonify({"message": "Please provide a timeSlot."}), 400

        try:
            time_slot = datetime.fromisoformat(time_slot_raw)
        except ValueError:
            return jsonify({"message": "Invalid timeSlot."}), 400

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*) FROM reservations WHERE time_slot = %s;",
                    (time_slot,),
                )
                booked = cur.fetchone()[0]

        return jsonify(
            {
                "timeSlot": time_slot.isoformat(),
                "totalTables": TABLE_COUNT,
                "bookedTables": booked,
                "availableTables": max(TABLE_COUNT - booked, 0),
            }
        )

    @app.get("/api/availability/day")
    def availability_day():
        try:
            day = date.fromisoformat((request.args.get("date") or "").strip())
        except ValueError:
            return jsonify({"message": "Invalid or missing date."}), 400

        day_start = datetime.combine(day, time.min)
        now = datetime.now()
        with get_connection() as conn:
            booked_counts = read_booked_counts(conn, day_start, day_start + timedelta(days=1))

        slots, closed = compute_day_slots(day, booked_counts, now)
        return jsonify(
            {
                "date": day.isoformat(),
                "closed": closed,
                "slots": slots,
                "dayBookable": any(s["bookable"] for s in slots),
            }
        )

    @app.get("/api/availability/month")
    def availability_month():
        try:
            year = int(request.args.get("year"))
            month = int(request.args.get("month"))
            first = date(year, month, 1)
        except (TypeError, ValueError):
            return jsonify({"message": "Invalid or missing year/month."}), 400

        next_first = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
        now = datetime.now()
        with get_connection() as conn:
            booked_counts = read_booked_counts(
                conn, datetime.combine(first, time.min), datetime.combine(next_first, time.min)
            )

        days = {}
        cursor = first
        while cursor < next_first:
            slots, closed = compute_day_slots(cursor, booked_counts, now)
            days[cursor.isoformat()] = {
                "bookable": any(s["bookable"] for s in slots),
                "closed": closed,
                "past": cursor < now.date(),
            }
            cursor += timedelta(days=1)

        return jsonify({"year": year, "month": month, "days": days})

    @app.post("/api/reservations")
    def create_reservation():
        payload = request.get_json(silent=True) or {}
        name = (payload.get("name") or "").strip()
        email = (payload.get("email") or "").strip().lower()
        phone = (payload.get("phone") or "").strip() or None
        time_slot_raw = (payload.get("timeSlot") or "").strip()
        guest_count = payload.get("guestCount")
        newsletter_signup = bool(payload.get("newsletterSignup"))

        validation_error = validate_reservation_payload(name, email, time_slot_raw, guest_count)
        if validation_error:
            return jsonify({"message": validation_error}), 400

        time_slot = datetime.fromisoformat(time_slot_raw)
        guest_count = int(guest_count)
        full_message = "That time slot is full. Please choose another time."

        with get_connection() as conn:
            if len(read_booked_tables(conn, time_slot)) >= TABLE_COUNT:
                return jsonify({"message": full_message}), 409

            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO customers (customer_name, customer_email, phone_number, newsletter_signup)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (customer_email)
                    DO UPDATE SET
                        customer_name = EXCLUDED.customer_name,
                        phone_number = COALESCE(EXCLUDED.phone_number, customers.phone_number),
                        newsletter_signup = customers.newsletter_signup OR EXCLUDED.newsletter_signup
                    RETURNING customer_id;
                    """,
                    (name, email, phone, newsletter_signup),
                )
                customer_id = cur.fetchone()[0]
            conn.commit()

            # Two concurrent bookings can land on the same open table; the
            # UNIQUE (time_slot, table_number) constraint rejects the loser, so
            # retry with a freshly chosen table until one sticks or the slot fills.
            reservation_id = None
            table_number = None
            for _ in range(MAX_BOOKING_ATTEMPTS):
                booked_tables = read_booked_tables(conn, time_slot)
                available_tables = [t for t in range(1, TABLE_COUNT + 1) if t not in booked_tables]
                if not available_tables:
                    break

                table_number = random.choice(available_tables)
                try:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            INSERT INTO reservations (customer_id, time_slot, guest_count, table_number)
                            VALUES (%s, %s, %s, %s)
                            RETURNING reservation_id;
                            """,
                            (customer_id, time_slot, guest_count, table_number),
                        )
                        reservation_id = cur.fetchone()[0]
                    conn.commit()
                    break
                except errors.UniqueViolation:
                    conn.rollback()

            if reservation_id is None:
                return jsonify({"message": full_message}), 409

        email_sent = send_confirmation_email(
            app, email, name, time_slot, guest_count, table_number, reservation_id
        )

        return jsonify(
            {
                "message": "Reservation confirmed.",
                "reservationId": reservation_id,
                "customerId": customer_id,
                "tableNumber": table_number,
                "guestCount": guest_count,
                "timeSlot": time_slot.isoformat(),
                "emailSent": email_sent,
            }
        ), 201

    @app.get("/api/customers")
    def list_customers():
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup
                    FROM customers
                    ORDER BY customer_id DESC;
                    """
                )
                rows = cur.fetchall()

        return jsonify(
            [
                {
                    "customerId": row[0],
                    "name": row[1],
                    "email": row[2],
                    "phone": row[3],
                    "newsletterSignup": row[4],
                }
                for row in rows
            ]
        )

    @app.get("/api/reservations")
    def list_reservations():
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT r.reservation_id, c.customer_name, c.customer_email, r.time_slot,
                           r.guest_count, r.table_number
                    FROM reservations r
                    JOIN customers c ON c.customer_id = r.customer_id
                    ORDER BY r.reservation_id DESC;
                    """
                )
                rows = cur.fetchall()

        return jsonify(
            [
                {
                    "reservationId": row[0],
                    "customerName": row[1],
                    "customerEmail": row[2],
                    "timeSlot": row[3].isoformat(),
                    "guestCount": row[4],
                    "tableNumber": row[5],
                }
                for row in rows
            ]
        )

    return app


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL environment variable is required.")
    return psycopg.connect(DATABASE_URL)


def send_confirmation_email(app, to_email, name, time_slot, guest_count, table_number, reservation_id):
    """Best-effort reservation confirmation email.

    Returns True only if a message was actually dispatched. Never raises: a
    mail failure must not undo a confirmed booking. When SMTP is not configured
    (e.g. the local demo) the message is logged instead of sent.
    """
    when = time_slot.strftime("%A, %B %d, %Y at %I:%M %p")
    body = (
        f"Hello {name},\n\n"
        "Your reservation at Cafe Fausse is confirmed.\n\n"
        f"  When:           {when}\n"
        f"  Party:          {guest_count} guest(s)\n"
        f"  Table:          #{table_number}\n"
        f"  Confirmation #: {reservation_id}\n\n"
        "We hold tables for 15 minutes past the reservation time. To change or "
        "cancel, please call (212) 555-0148 at least 24 hours ahead.\n\n"
        "We look forward to welcoming you.\n"
        "Cafe Fausse\n"
    )

    if not SMTP_HOST:
        app.logger.info(
            "SMTP not configured; confirmation for %s not emailed:\n%s", to_email, body
        )
        return False

    message = EmailMessage()
    message["Subject"] = "Your Cafe Fausse reservation is confirmed"
    message["From"] = MAIL_FROM
    message["To"] = to_email
    message.set_content(body)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
            smtp.starttls()
            if SMTP_USER:
                smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.send_message(message)
        return True
    except Exception:  # mail must never break a confirmed booking
        app.logger.exception("Failed to send confirmation email to %s", to_email)
        return False


def read_booked_tables(conn, time_slot):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT table_number FROM reservations WHERE time_slot = %s;",
            (time_slot,),
        )
        return {row[0] for row in cur.fetchall()}


def read_booked_counts(conn, start_dt, end_dt):
    """Return {time_slot: booked_table_count} for slots in [start_dt, end_dt)."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT time_slot, COUNT(*)
            FROM reservations
            WHERE time_slot >= %s AND time_slot < %s
            GROUP BY time_slot;
            """,
            (start_dt, end_dt),
        )
        return {row[0]: row[1] for row in cur.fetchall()}


def compute_day_slots(day, booked_counts, now):
    """Build the seating slots for a day with per-slot availability.

    A slot is bookable when the day is open (not Monday), the slot is in the
    future, and at least one of the TABLE_COUNT tables is free.
    """
    closed = day.weekday() == CLOSED_WEEKDAY
    slots = []
    for hour in OPEN_HOURS:
        slot_dt = datetime.combine(day, time(hour))
        booked = booked_counts.get(slot_dt, 0)
        available = max(TABLE_COUNT - booked, 0)
        bookable = (not closed) and (slot_dt > now) and (available > 0)
        slots.append(
            {
                "time": f"{hour:02d}:00",
                "available": available,
                "total": TABLE_COUNT,
                "bookable": bookable,
            }
        )
    return slots, closed


def validate_reservation_payload(name, email, time_slot_raw, guest_count):
    if not name:
        return "Please enter your name."
    if not is_valid_email(email):
        return "Please enter a valid email address."
    if not time_slot_raw:
        return "Please select a reservation date and time."

    try:
        time_slot = datetime.fromisoformat(time_slot_raw)
    except ValueError:
        return "Please select a valid reservation date and time."

    if time_slot < datetime.now():
        return "Please choose a reservation time in the future."

    # Cafe Fausse seats on the hour, 5:00 PM - 10:00 PM, and is closed Mondays.
    if time_slot.weekday() == CLOSED_WEEKDAY:
        return "Cafe Fausse is closed on Mondays. Please choose another day."
    if time_slot.minute != 0:
        return "Seatings are on the hour only. Please choose a time such as 5:00 PM, 9:00 PM, etc."
    if time_slot.hour not in OPEN_HOURS:
        return "Seatings are available from 5:00 PM to 10:00 PM. Please choose a valid time."

    try:
        guest_count_value = int(guest_count)
    except (TypeError, ValueError):
        return "Please enter a valid guest count."

    if guest_count_value < 1:
        return "Guest count must be at least 1."
    if guest_count_value > MAX_GUESTS_PER_RESERVATION:
        return (
            f"Parties of more than {MAX_GUESTS_PER_RESERVATION} are booked as special "
            "group events. Please contact the restaurant at (212) 555-0148."
        )

    return None


app = create_app()
