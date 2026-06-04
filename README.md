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
  optional phone, future date/time only (the reservation calendar limits
  selection to a 90-day window), open hours enforced
  (Tue–Sun, 5:00–10:00 PM seating; closed Monday), and 1–6 guests online
  (parties of 7+ are directed to the events line).
- **Availability** — `GET /api/availability/day` and `/api/availability/month`
  report how many of the 30 tables are open per slot; the calendar and time
  picker poll them live as the date and time are chosen.
- **Table assignment** — a random open table (1–30) is assigned per time slot.
- **Concurrency-safe** — a `UNIQUE (time_slot, table_number)` constraint backs
  the assignment; on a concurrent collision the backend retries with a freshly
  chosen table (up to `MAX_BOOKING_ATTEMPTS`) before reporting the slot full.
- **Full slot** — when all 30 tables are booked, the API returns a
  "choose another time" message (HTTP 409).
- **Confirmation** — on success the UI shows date/time, party size, table, and
  a confirmation number.

## API endpoints

| Method & path | Purpose |
|---------------|---------|
| `GET /api/health` | Service health check |
| `POST /api/newsletter` | Newsletter signup (validated, upserts customer) |
| `GET /api/availability/day` | Per-slot open table counts for a date |
| `GET /api/availability/month` | Per-day bookable/closed/past flags for a month |
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

## Developer guide

Everything runs as Docker Compose services on a private network
(`fausse_cafe_net`). Source for `frontend` and `backend` is bind-mounted into
the containers, so both hot-reload on edits — you rarely need to rebuild.

### Launching the stack

```bash
./scripts/add-local-dns.sh     # one time: maps 127.0.0.1 fausse-cafe.com (sudo)
docker compose up --build      # build images and start all services
docker compose ps              # confirm every service is "running"/"healthy"
```

Stop with `Ctrl-C`, or `docker compose down` (add `-v` to also wipe the
database and reset to an empty schema).

### Containers at a glance

Only **ingress** and **mailpit** publish ports to your host. `frontend`,
`backend`, and `db` are reachable only from inside the Docker network — you
talk to them *through the ingress* or with `docker compose exec`.

| Service | Purpose | Image | Reach it from your host |
|---------|---------|-------|--------------------------|
| `ingress` | Nginx front door; routes `/` → frontend and `/api` → backend | `nginx:1.27-alpine` | **http://fausse-cafe.com** (port 80) |
| `frontend` | React + Vite single-page app | built from `frontend/` | via the ingress (internal port 5173) |
| `backend` | Flask REST API under `/api` | built from `backend/` | via the ingress at `/api` (internal port 5000) |
| `db` | PostgreSQL 16 data store | `postgres:16-alpine` | `docker compose exec` only (internal port 5432) |
| `mailpit` | Captures outgoing confirmation emails | `axllent/mailpit:v1.21` | **http://localhost:8025** (web inbox) |

### Connecting to / inspecting each container

```bash
# Ingress — watch routing / 502s
docker compose logs -f ingress

# Frontend — Vite dev server logs, or a shell in the container
docker compose logs -f frontend
docker compose exec frontend sh

# Backend — Flask logs (confirmation emails are logged here if SMTP is off),
# or a shell / Python REPL in the container
docker compose logs -f backend
docker compose exec backend sh

# Database — open a psql session (user/db/password come from docker-compose.yml)
docker compose exec db psql -U cafe_user -d cafe_fausse
#   then, e.g.:  SELECT * FROM customers;  SELECT * FROM reservations;

# Mailpit — the email inbox is a web UI; just open it in a browser
open http://localhost:8025          # macOS  (Linux: xdg-open)
```

> The database, backend, and frontend ports are intentionally not published to
> the host. To connect an external client (e.g. a Postgres GUI to `db`), add a
> `ports:` mapping for that service in `docker-compose.yml` and restart it.

### Hitting the app to check it out

- **In the browser:** open **http://fausse-cafe.com** and click through Home →
  Menu → Reservations → About Us → Gallery. Book a table on the Reservations
  page to exercise the full flow.
- **The API directly** (through the ingress — note the `Host` header so Nginx
  routes it):

  ```bash
  curl -H "Host: fausse-cafe.com" http://localhost/api/health

  curl -H "Host: fausse-cafe.com" -H "Content-Type: application/json" \
    -X POST http://localhost/api/reservations \
    -d '{"name":"Ada","email":"ada@example.com","timeSlot":"2026-06-12T19:00","guestCount":2}'
  ```

- **Confirm the side effects:** the new row shows up via
  `docker compose exec db psql -U cafe_user -d cafe_fausse -c "SELECT * FROM reservations;"`,
  and the confirmation email appears in the Mailpit inbox at
  **http://localhost:8025**.

## Reservation confirmation emails

On a successful booking the backend sends a confirmation email. For local
development the stack includes **Mailpit**, a self-contained mail server that
**captures** every message in a web inbox instead of delivering it to the real
internet — so nothing leaves your machine and no accounts or credentials are
needed. It starts automatically with `docker compose up`.

To verify it works:

1. Book a reservation at `http://fausse-cafe.com` (the confirmation card shows
   "A confirmation email is on its way").
2. Open the Mailpit inbox: **http://localhost:8025**
3. The confirmation email appears there, addressed to whatever email you booked
   with, showing the date/time, party size, table, and confirmation number.

To send through a real mail provider instead (e.g. in production), point the
`backend` service's SMTP variables in `docker-compose.yml` at it —
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, and set
`SMTP_USE_TLS=true` (the default) for providers that use STARTTLS on port 587.
When `SMTP_HOST` is unset entirely, the confirmation is written to the backend
logs instead of sent. A mail failure never fails a confirmed booking.

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
