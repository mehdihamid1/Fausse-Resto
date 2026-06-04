# Café Fausse — Demo Presentation Script

A run-of-show for the recorded demo (Quantic *Web Application & Interface
Design*). Three speakers, **~9 minutes**, screen-share + cameras on.

> **Format:** three contiguous sections, one per speaker (**Speaker 1**,
> **Speaker 2**, **Speaker 3**). The only hard rules: **all three speak** and
> **all three show ID + state their name**.

---

## Rubric coverage map (what proves each requirement)

| Rubric requirement (top "5" band) | Where we show it | Section |
|---|---|---|
| 5+ pages built in React/JSX + navigation | Nav bar across Home, Menu, Reservations, About, Gallery | 1–3 |
| Contact info: address, phone, hours | Home info cards + footer | 1 |
| Menu by categories | Menu page (Chef's Specials + 6 sections) | 1 |
| About Us highlighting the owners | About page "Meet the Owners" | 2 |
| Photo gallery + judicious imagery | Gallery page + lightbox; imagery throughout | 2 |
| Awards & positive reviews | Home "Awards & Praise" + review cards | 1 |
| Newsletter email sign-up (form + validation + DB) | Home newsletter form | 2 |
| Reservation system (timeslot, guests, name, email, optional phone) | Reservations page | 3 |
| **Effect on backend DB shown in the DB itself (not an admin page)** | `psql` split-screen, before/after | 2 & 3 |
| **Sophisticated reservation logic** | Live availability, random table, concurrency-safety, full-slot 409 | 3 |
| Consistent CSS theme, Flexbox/Grid, responsive | Theme toggle + responsive resize | 1 |
| Flask + PostgreSQL integrated with React | Architecture talking points | 3 |
| AI tooling documented | `ai-tooling.md` talking points | 3 |
| Each member: government ID + state name | Top of Section 1 | 1 |

---

## Before you hit record (setup checklist)

1. **Launch the stack** (one terminal):
   ```bash
   ./scripts/add-local-dns.sh        # one time only — maps fausse-cafe.com
   docker compose up --build
   ```
2. **Use the realistic 30-table count for the main demo.** In
   `docker-compose.yml`, make sure the backend env has `TABLE_COUNT` **commented
   out** (defaults to 30) so availability reads "30 of 30 tables":
   ```yaml
   # - TABLE_COUNT=1
   ```
   Recreate if you changed it: `docker compose up -d backend`.
3. **Start from a clean database + inbox** so the before/after is obvious:
   ```bash
   ./scripts/demo_reset.sh
   ```
4. **Open and arrange your screen** (this is the layout you'll record):
   - **Browser tab A:** `http://fausse-cafe.com` (the site)
   - **Browser tab B:** `http://localhost:8025` (Mailpit inbox)
   - **Terminal**, docked beside the browser, with a live psql session:
     ```bash
     docker compose exec db psql -U cafe_user -d cafe_fausse
     ```
     Keep these two queries ready to paste:
     ```sql
     SELECT customer_id, customer_name, customer_email, newsletter_signup FROM customers ORDER BY customer_id;
     SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations ORDER BY reservation_id;
     ```
     *(Or just run `./scripts/demo_show_db.sh` in a second terminal — it prints
     both tables.)*
5. Pick the data you'll type live (so nobody fumbles on camera):
   - Newsletter: `Ada Lovelace` / `ada@example.com`
   - Reservation: `Grace Hopper` / `grace@example.com` / phone optional / a
     future **Tue–Sun** date / a **5–10 PM** time / 2 guests.
6. Do one full dry-run, then `./scripts/demo_reset.sh` again right before the
   real take.

---

## Recording logistics (rubric-mandatory — don't skip)

- All three cameras **on** and visible the whole time.
- **Every speaker talks at least once** (the split below guarantees it).
- **Every speaker shows a government ID to the camera and states their name**
  (top of Section 1).
- Target **5–10 min**; this script lands ~9. If you're running long, trim the
  Menu walk-through and the responsive resize first.
- Don't use "Invite People" to share — just submit the recording link.

---

# Run of show (~9:00)

## Section 1 — Speaker 1 · ~3:00

**Identity & intro (all three on camera)**
- **[DO]** Each speaker, in turn, holds their government ID to the camera and
  clearly states their name.
- **[SAY — Speaker 1]** "Hi, we're presenting **Café Fausse**, a full-stack
  restaurant web app built with React, Flask, and PostgreSQL, running locally in
  Docker. We'll walk through all five pages, the newsletter and reservation
  systems, and show the real effect on the database. I'll start with the front
  of house."

**Home**
- **[DO]** Land on `http://fausse-cafe.com` (Home).
- **[SAY]** "The home page opens on the hero and the **contact essentials the
  client asked for — address, phone, and hours** — right here in these cards,
  and repeated in the footer on every page."
- **[DO]** Point to the **"Tonight's Chef's Pick"** banner, then scroll to
  **"Awards & Praise"**.
- **[SAY]** "We showcase the restaurant's **awards and guest reviews** here, one
  of the explicit requirements."

**Menu**
- **[DO]** Click **Menu** in the nav.
- **[SAY]** "The menu is **broken into categories** — Chef's Specials up top,
  then Starters, Salads, Mains, Desserts, Wine & Cocktails, and Non-Alcoholic —
  each dish with its own royalty-free or AI-generated image, served locally."

**Design / theme / responsive**
- **[DO]** Toggle **light/dark** in the header.
- **[SAY]** "The whole site shares one consistent theme through CSS custom
  properties, with a light/dark toggle. Layout is **CSS Grid and Flexbox**
  throughout."
- **[DO]** Narrow the browser window (or open device toolbar) to show it reflow
  to a single column.
- **[SAY]** "And it's **responsive** across desktop, tablet, and phone. Over to
  Speaker 2 for About, the Gallery, and the newsletter."

---

## Section 2 — Speaker 2 · ~2:30

**About**
- **[DO]** Click **About Us**.
- **[SAY]** "The About page tells the restaurant's story and **highlights the
  owners** — Chef Antonio Rossi and Maria Lopez — with their backgrounds and
  achievements, as the brief required."

**Gallery**
- **[DO]** Click **Gallery**, then click a photo to open the lightbox; use the
  arrows / Esc.
- **[SAY]** "The gallery is a responsive grid with a keyboard-accessible
  lightbox — arrow keys to move, Escape to close."

**Newsletter — form + validation + DB effect**
- **[DO]** Go to **Home**, scroll to the **Newsletter** form. First, show
  validation: try submitting a clearly bad email and let the form reject it.
- **[SAY]** "The newsletter sign-up is a real form with **input validation** on
  the name and email."
- **[DO]** *Split-screen moment.* In the terminal, run the **customers** query —
  show there's no Ada row yet.
- **[SAY]** "Here's the **customers table in PostgreSQL right now**."
- **[DO]** Fill `Ada Lovelace` / `ada@example.com`, submit, see the success
  message. Re-run the **customers** query.
- **[SAY]** "On submit, a new row appears in the database with
  `newsletter_signup = true`. **This is the database itself, not an admin page**
  — the requirement is that the real backend effect is visible, and it is. Over
  to Speaker 3 for reservations."

---

## Section 3 — Speaker 3 · ~3:30

**Make a reservation**
- **[DO]** Click **Reservations**. Show the calendar: point out that **Mondays,
  past dates, and fully-booked days are greyed out**.
- **[SAY]** "Reservations are the core of the brief. The calendar only lets you
  pick valid days — we're **closed Mondays**, no past dates, and the system
  enforces seatings on the hour from **5 to 10 PM**."
- **[DO]** Pick a valid date; open the time dropdown.
- **[SAY]** "As I choose a time, the form polls the backend for **live
  availability** and shows how many of the **30 tables** are open for that slot."
- **[DO]** Fill name `Grace Hopper`, email `grace@example.com`, leave phone
  empty (it's optional), 2 guests. Before submitting, run the **reservations**
  query in the terminal to show it's empty for that slot.
- **[SAY]** "Required name and email, optional phone — exactly the SRS fields.
  Here's the empty reservations table."
- **[DO]** Submit. Show the **confirmation card**: date/time, party size,
  **table number**, and **confirmation number**.
- **[SAY]** "On success we get a confirmation with the **randomly assigned
  table** and a confirmation number."

**DB effect + email**
- **[DO]** Re-run the **reservations** and **customers** queries.
- **[SAY]** "And in the database: a new **reservation row** linked to a new
  **customer row** — again, shown directly in PostgreSQL."
- **[DO]** Switch to the **Mailpit** tab (`localhost:8025`); open the
  confirmation email.
- **[SAY]** "We also send a **confirmation email** — captured locally by Mailpit
  for the demo so nothing leaves the machine."

**Sophisticated logic — the "full slot" path**
- **[DO]** Demonstrate the slot-full behavior. Easiest on camera:
  ```bash
  ./scripts/test_04_limit.sh          # fills all 30 tables for a slot, then tries one more
  ```
  Show the API returning **HTTP 409** with *"That time slot is full. Please
  choose another time."* Then `./scripts/test_04_limit_rollback.sh` to clean up.
- **[SAY]** "When every one of the 30 tables for a slot is taken, the system
  refuses the booking and tells the guest to **pick another time**. Under the
  hood the table assignment is **concurrency-safe**: a unique constraint on
  (time slot, table number) means two simultaneous bookings can't grab the same
  table — the loser automatically retries another free table."

**Architecture & AI tooling (close)**
- **[SAY]** "Quickly on the build: it's **four Docker services** — an Nginx
  ingress that routes page traffic to the **React/Vite** front end and `/api`
  traffic to the **Flask** back end, which talks to **PostgreSQL**. The schema
  is exactly the two tables the brief specifies — **Customers** and
  **Reservations**. For tooling, our **`ai-tooling.md`** documents it: we used
  **Codex** to scaffold the project and **Claude Code** to build out the pages,
  the live availability, the reservation hardening, and an accessibility pass.
  That's Café Fausse — thanks for watching."

---

## Reset between takes

```bash
./scripts/demo_reset.sh     # clears customers + reservations + the Mailpit inbox
```

For a totally fresh database (re-applies the schema):
```bash
docker compose down -v && docker compose up --build
```

## Quick command reference

| Need | Command |
|---|---|
| Start everything | `docker compose up --build` |
| Open the DB | `docker compose exec db psql -U cafe_user -d cafe_fausse` |
| Show both tables | `./scripts/demo_show_db.sh` |
| Reset to clean slate | `./scripts/demo_reset.sh` |
| Slot-full demo | `./scripts/test_04_limit.sh` then `..._rollback.sh` |
| Site | `http://fausse-cafe.com` |
| Mailpit inbox | `http://localhost:8025` |
