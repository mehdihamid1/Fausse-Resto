import os
import random
import re
from datetime import datetime

import psycopg
from psycopg import errors
from flask import Flask, jsonify, request
from flask_cors import CORS


DATABASE_URL = os.environ.get("DATABASE_URL")
TABLE_COUNT = 30
MAX_BOOKING_ATTEMPTS = 5

# Parties of 7+ are handled by the events team (see the "Good to know" panel),
# so the online form tops out at 6 guests per reservation.
MAX_GUESTS_PER_RESERVATION = 6

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

        return jsonify(
            {
                "message": "Reservation confirmed.",
                "reservationId": reservation_id,
                "customerId": customer_id,
                "tableNumber": table_number,
                "guestCount": guest_count,
                "timeSlot": time_slot.isoformat(),
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


def read_booked_tables(conn, time_slot):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT table_number FROM reservations WHERE time_slot = %s;",
            (time_slot,),
        )
        return {row[0] for row in cur.fetchall()}


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

    # Cafe Fausse is open Tue-Sun, 5:00 PM - 11:00 PM (last seating 10:00 PM).
    if time_slot.weekday() == 0:
        return "Cafe Fausse is closed on Mondays. Please choose another day."
    if not 17 <= time_slot.hour <= 22:
        return "Please choose a time between 5:00 PM and 10:00 PM."

    try:
        guest_count_value = int(guest_count)
    except (TypeError, ValueError):
        return "Please enter a valid guest count."

    if guest_count_value < 1:
        return "Guest count must be at least 1."
    if guest_count_value > MAX_GUESTS_PER_RESERVATION:
        return (
            f"For parties larger than {MAX_GUESTS_PER_RESERVATION}, please call our "
            "events team at (212) 555-0148."
        )

    return None


app = create_app()
