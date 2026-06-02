# Cafe Fausse

Dockerized full-stack restaurant web application for the Web Application and Interface Design project.

## Architecture

- `ingress`: Nginx entrypoint for `fausse-cafe.com`
- `frontend`: React and JSX website
- `backend`: Flask API server
- `db`: PostgreSQL database

The browser enters through `http://fausse-cafe.com`. Nginx routes normal page traffic to React and `/api` traffic to Flask.

## Local DNS

Add this local host entry before opening the site:

```text
127.0.0.1 fausse-cafe.com
```

You can add it with:

```bash
./scripts/add-local-dns.sh
```

If the script asks for a password, enter your computer login password. This is required because `/etc/hosts` is a system file.

## Run

```bash
docker compose up --build
```

Open:

```text
http://fausse-cafe.com
```

## Show Database Changes

```bash
docker compose exec db psql -U cafe_user -d cafe_fausse
```

Useful demo queries:

```sql
SELECT * FROM customers;
SELECT * FROM reservations;
```

## Main Requirements Covered

- Five React pages: Home, Menu, Reservations, About Us, Gallery
- Newsletter signup form
- Reservation form
- Flask backend API
- PostgreSQL Customers and Reservations tables
- Reservation logic with 30 available tables per time slot
- Dockerized frontend, backend, database, and ingress
# Fausse-Resto
