# Staging

This project runs **locally only** — there is no public staging server.

The full stack (Nginx ingress, React frontend, Flask backend, PostgreSQL) is
brought up with Docker Compose and accessed through a local DNS entry.

## Run locally

1. Add the local host entry (one time):

   ```bash
   ./scripts/add-local-dns.sh        # adds 127.0.0.1 fausse-cafe.com
   ```

2. Build and start the stack:

   ```bash
   docker compose up --build
   ```

3. Open `http://fausse-cafe.com`.

The recorded demo shows the application running this way, including reservation
and newsletter writes verified directly in PostgreSQL:

```bash
docker compose exec db psql -U cafe_user -d cafe_fausse
```

## If a hosted staging environment were added

The app is container-based and environment-driven, so deploying it would mean:

- Building and pushing the `frontend`, `backend`, and `ingress` images.
- Running the same compose stack (or equivalent) on a host with a managed
  PostgreSQL instance, pointing `DATABASE_URL` at it.
- Setting a real domain on the Nginx ingress and enabling TLS.
- Optionally configuring the SMTP variables (see `docker-compose.yml`) so
  reservation confirmation emails are sent rather than logged.
