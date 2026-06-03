# Cafe Fausse

A Dockerized full-stack restaurant web application built for the Quantic
"Web Application & Interface Design" project. Guests can explore the
restaurant, browse the menu and gallery, read about the owners and awards,
sign up for the newsletter, and book a table online with live availability.

## Stack

| Layer | Technology | Docker service |
|-------|------------|----------------|
| Ingress | Nginx | `ingress` |
| Frontend | React + JSX (Vite), CSS Grid/Flexbox | `frontend` |
| Backend | Flask / Python (psycopg) | `backend` |
| Database | PostgreSQL 16 | `db` |

The browser enters through `http://fausse-cafe.com`. Nginx routes page traffic
to the React app and `/api` traffic to Flask. Flask talks to PostgreSQL over
the internal Docker network.

## Pages & features

- **Home** — contact info (address, phone, hours), a "Tonight's Chef's Pick"
  banner, an Awards & Reviews showcase, and the newsletter signup.
- **Menu** — Chef's Specials plus six categorized sections (Starters, Salads,
  Mains, Desserts, Wine & Cocktails, Non-Alcoholic) with local food imagery.
- **Reservations** — booking form with live table availability, a detailed
  confirmation card, and a "Good to know" panel.
- **About Us** — restaurant story, "Meet the Owners" backstories, achievements.
- **Gallery** — responsive image grid with a keyboard-accessible lightbox.
- **Site-wide** — consistent theme via CSS custom properties, a light/dark mode
  toggle, responsive layouts (phone/tablet/desktop breakpoints), and accessible
  form status messaging.

All images are royalty-free (Unsplash) or AI-generated and are served locally
from `frontend/public/images/` rather than hotlinked.

## Reservation logic

The reservation system is the core requirement and is intentionally robust:

- **Validation** (frontend + backend): required name, real email pattern,
  optional phone, future date/time only, open hours enforced
  (Tue–Sun, 5:00–10:00 PM seating; closed Monday), and 1–6 guests online
  (parties of 7+ are directed to the events line).
- **Availability** — `GET /api/availability?timeSlot=...` reports how many of
  the 30 tables are open; the form polls it live as the time is chosen.
- **Table assignment** — a random open table (1–30) is assigned per time slot.
- **Concurrency-safe** — a `UNIQUE (time_slot, table_number)` constraint backs
  the assignment; on a concurrent collision the backend retries with a freshly
  chosen table (up to `MAX_BOOKING_ATTEMPTS`) before reporting the slot full.
- **Full slot** — when all 30 tables are booked, the API returns a
  "choose another time" message (HTTP 409).
- **Confirmation** — on success the UI shows date/time, party size, table, and
  a confirmation number, and the backend sends a best-effort confirmation email
  (see below).

## API endpoints

| Method & path | Purpose |
|---------------|---------|
| `GET /api/health` | Service health check |
| `POST /api/newsletter` | Newsletter signup (validated, upserts customer) |
| `GET /api/availability` | Open table count for a time slot |
| `POST /api/reservations` | Create a reservation (validation + availability) |
| `GET /api/customers` | List customers (development/demo only) |
| `GET /api/reservations` | List reservations (development/demo only) |

## Database

Two related tables (see `database/init.sql`):

- **customers** — `customer_id`, `customer_name`, `customer_email` (unique),
  `phone_number`, `newsletter_signup`, `created_at`.
- **reservations** — `reservation_id`, `customer_id` (FK), `time_slot`,
  `guest_count`, `table_number` (CHECK 1–30), `created_at`, with
  `UNIQUE (time_slot, table_number)`.

## Run it locally

1. Add the local DNS entry (one time):

   ```bash
   ./scripts/add-local-dns.sh
   ```

   This adds `127.0.0.1 fausse-cafe.com` to `/etc/hosts` (it will ask for your
   login password because `/etc/hosts` is a system file).

2. Build and start everything:

   ```bash
   docker compose up --build
   ```

3. Open the site:

   ```text
   http://fausse-cafe.com
   ```

## Confirmation email (optional)

Reservation confirmation emails are sent only when SMTP is configured via
environment variables on the `backend` service (see the commented block in
`docker-compose.yml`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`,
`MAIL_FROM`. When `SMTP_HOST` is unset (the default for local demos), the
confirmation is written to the backend logs instead of being sent, and the UI
only promises an email when one was actually dispatched. A mail failure never
fails a confirmed booking.

## Showing database changes (for the demo)

Show writes directly in PostgreSQL rather than via an admin page:

```bash
docker compose exec db psql -U cafe_user -d cafe_fausse
```

```sql
SELECT * FROM customers;
SELECT * FROM reservations;
```

## Test scenarios

Four test scenarios are included. Each test script shows the database state
**before** and **after** the action. Rollback scripts are separate so test data
can be inspected before it is removed.

All scripts accept optional environment variables to target a different
environment:

```bash
BASE_URL=http://staging.fausse-cafe.com ./scripts/test_02_reservation.sh
DB_CONTAINER=my_db ./scripts/test_04_limit.sh
```

---

### Test 01 — Visual walkthrough (manual)

Open the site and navigate through all five pages.

```text
http://fausse-cafe.com
```

Verify: Home → Menu → Reservations → About Us → Gallery. Check the reservation
form, newsletter signup, gallery lightbox, and light/dark mode toggle.

---

### Test 02 — Single reservation

Creates one booking via the API, verifies the response and checks the database.

```bash
# Run
./scripts/test_02_reservation.sh

# Rollback
./scripts/test_02_reservation_rollback.sh
```

Expected result: HTTP 201, reservation row in `reservations`, customer row in
`customers` with `newsletter_signup = f`.

---

### Test 03 — Newsletter signup

Signs up a customer for the newsletter via the API and verifies the database.

```bash
# Run
./scripts/test_03_newsletter.sh

# Rollback
./scripts/test_03_newsletter_rollback.sh
```

Expected result: HTTP 200, customer row in `customers` with
`newsletter_signup = t`.

---

### Test 04 — Reservation limit (30 tables)

Fills all 30 tables for a time slot directly in the database, then attempts a
31st booking via the API to confirm it is rejected.

```bash
# Run
./scripts/test_04_limit.sh

# Rollback
./scripts/test_04_limit_rollback.sh
```

Expected result: availability endpoint reports `availableTables: 0`, the 31st
booking attempt returns HTTP 409 with "That time slot is full."

---

## Project structure

```text
cafe-fausse/
  docker-compose.yml
  ingress/              # Nginx config for fausse-cafe.com
  frontend/             # React + Vite app (src/, public/images/)
  backend/              # Flask app (app/main.py)
  database/             # init.sql schema
  scripts/
    add-local-dns.sh
    test_02_reservation.sh          test_02_reservation_rollback.sh
    test_03_newsletter.sh           test_03_newsletter_rollback.sh
    test_04_limit.sh                test_04_limit_rollback.sh
  README.md
  ai-tooling.md
  staging.md
```
