# GymFlex Architecture

This document provides a detailed, developer‑level walkthrough of how a request travels through the deployed GymFlex system and how the PostgreSQL database is selected and used. Use this for deep understanding; keep the README lean.

## High-Level Flow
```
Browser → Heroku Router → Gunicorn (WSGI) → Django (middleware + URL routing) → View / Serializer → Django ORM → psycopg2 → PostgreSQL → Response
```
 

## Layer Responsibilities
- **Browser**: Issues HTTP requests (e.g. `GET /api/sessions/`).
- **Heroku Router**: Receives the domain request and forwards it to the dyno.
- **Gunicorn**: Production WSGI server passing requests into Django.
- **Django WSGI App**: Constructs `HttpRequest`, runs middleware chain, resolves URL.
- **Middleware Stack**: Security, static shortcuts, sessions, CSRF exemption for `/api/`, auth population, etc.
- **URL Resolver**: Matches path to viewset/action.
- **View / ViewSet**: Executes business logic (`SessionViewSet.list`, `.book`, etc.).
- **Serializer**: Transforms model instances to JSON, applying role‑based masking.
- **Django ORM**: Builds SQL queries.
- **psycopg2**: Sends SQL to PostgreSQL and returns rows.
- **PostgreSQL**: Executes queries and returns results.

## Database Selection Logic
In `settings.py`:
```python
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600
    )
}
```
Decision:
1. If `DATABASE_URL` env var exists (Heroku sets it when the Postgres addon is provisioned) → parse and configure **PostgreSQL**.
2. Else → fall back to **SQLite** for local development.

## Detailed Request Lifecycle
1. **User navigates** to `/api/sessions/`.
2. **Heroku Router** forwards request to running dyno.
3. **Gunicorn** receives and calls Django’s WSGI app.
4. **Django** builds request, runs middleware in order:
   1. SecurityMiddleware
   2. WhiteNoise (may serve static assets directly)
   3. CORS middleware
   4. SessionMiddleware
   5. CommonMiddleware
   6. DisableCSRFForAPI (custom)
   7. CsrfViewMiddleware (skipped if exempt)
   8. AuthenticationMiddleware
   9. MessageMiddleware
   10. Clickjacking protection
5. **URL resolver** matches `/api/sessions/` → `SessionViewSet.list`.
6. **ViewSet** obtains queryset: `Session.objects.all().order_by('date','time')`.
7. **ORM** compiles SQL; **psycopg2** executes against PostgreSQL.
8. **Serializer** computes `attendees_count`, `available_slots`, `booked` and applies masking:
   - Staff: full attendee info
   - Booked user: own ID only
   - Unbooked user: trainer masked (`"TBA"`), attendees hidden
9. **Response** constructed and returned through Gunicorn → Heroku → Browser.

## Role-Based Masking Summary
| User Type       | Trainer Name | Attendees Field          | Activity Type |
| --------------- | ------------ | ------------------------ | ------------- |
| Staff/Trainer   | Real name    | List of `{id, username}` | Real          |
| Booked Client   | Real name    | Own user ID only         | Real          |
| Unbooked Client | TBA          | Empty list               | Real          |

## Multiple Queries Notes
- `attendees.count()` issues a `COUNT(*)` per session.
- `filter(pk=request.user.pk).exists()` issues a lightweight existence check.
- Consider `prefetch_related('attendees')` for scaling to larger datasets.

## Connection Reuse
`conn_max_age=600` keeps the DB connection open for up to 10 minutes—reduces overhead.

## ASCII Flow Diagram
```
Browser
  ↓
Heroku Router
  ↓
Gunicorn
  ↓
Django WSGI
  ↓
Middleware Chain
  ↓
URL Resolver
  ↓
View / ViewSet
  ↓
Serializer (masking)
  ↓
Django ORM
  ↓
psycopg2
  ↓
PostgreSQL
  ↑
JSON Response
```

## Key Files
- `backend/backend/settings.py` – database selection, middleware.
- `backend/backend/wsgi.py` – WSGI entry point.
- `backend/api/models.py` – `Session` model.
- `backend/api/serializers.py` – masking logic.
- `backend/api/views.py` – viewset actions and booking logic.
- `Procfile` – starts Gunicorn and runs migrations.

## Common Misconceptions
- Gunicorn does not choose the database; Django settings do.
- `DATABASE_URL` is an internal connection string, not a URL users visit.
- Switching environments does not require code changes—only environment variable presence.

## Summary
Django chooses PostgreSQL at startup by detecting `DATABASE_URL`; every request travels through Gunicorn → Django → ORM → psycopg2 → PostgreSQL, with serializers enforcing role-based privacy before the JSON response returns.
