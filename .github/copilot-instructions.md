<!-- .github/copilot-instructions.md - Project-specific guidance for AI coding agents -->

# GymFlex — Copilot Instructions

Purpose: give AI coding agents immediate, actionable context to be productive in this mono-repo (Django backend + React/Vite frontend).

  - `backend/` — Django REST API (DRF + Simple JWT). Primary app is `api` (models, serializers, views, urls).
  - `frontend/` — React app bootstrapped with Vite. `src/api.js` contains the Axios instance; pages live under `src/pages`.
  - `db.sqlite3` — local SQLite DB used for development.

  - Frontend talks to backend under a single base path (expected as `VITE_API_URL`, e.g. `http://localhost:8000/api`).
  - Authentication: JWT (access + refresh). Endpoints: `POST /api/token/` and `POST /api/token/refresh/` (see `backend/backend/urls.py`).
  - Resources: `Session` viewset is exposed at `/api/sessions/` with a custom action `POST /api/sessions/{id}/book/` for (un)booking.
  - Role-based masking: `SessionSerializer.to_representation` intentionally hides attendees and trainer details for non-staff and unbooked users — frontend expects this behavior (see `backend/api/serializers.py`).

  - `backend/api/models.py` — Session and Note models.
  - `backend/api/serializers.py` — masking, computed fields (`available_slots`, `booked`).
  - `backend/api/views.py` and `backend/api/urls.py` — endpoints and permissions (`IsTrainerOrReadOnly`).
  - `backend/backend/urls.py` — token endpoints and top-level API include.
  - `backend/backend/settings.py` — JWT lifetimes, CORS, DB, DEBUG.
  - `frontend/src/api.js` — Axios instance and `VITE_API_URL` usage.
  - `frontend/src/pages/{Login,Register,Home}.jsx` and `frontend/src/components/ProtectedRoute.jsx` — how auth & routing work.

  - Backend (PowerShell from repo root):
    - `cd backend`
    - `.\env\Scripts\Activate.ps1` (if using included venv) or activate your virtualenv
    - `pip install -r requirements.txt`
    - `python manage.py migrate`
    - `python manage.py createsuperuser` (admin / trainer data)
    - `python manage.py runserver` (serves API at `http://127.0.0.1:8000/`)
  - Frontend (PowerShell):
    - `cd frontend`
    - `npm install` (if node_modules missing)
    - Create `.env` in `frontend/` with `VITE_API_URL=http://localhost:8000/api`
    - `npm run dev` (starts Vite dev server)

  - Tokens are stored in `localStorage` keys defined in `frontend/src/constants.js` (`access_token`, `refresh_token`). Use these keys when reading/writing tokens.
  - Inconsistency to watch: some frontend code uses the shared Axios `api` (`src/api.js`), but `Home.jsx` uses raw `axios` with hardcoded `http://localhost:8000/api/...` and manual `Authorization` headers. Prefer `src/api.js` for consistency.
  - There are two registration routes in the codebase: `backend/backend/urls.py` registers `api/user/register/` while `backend/api/urls.py` exposes `users/register/`. The frontend currently posts to `/register/` (which resolves to `/api/register/`) — this is likely a bug to fix or align.
  - Serializer masking: UI must not assume trainer/attendee details for non-booked users. If you need full details, ensure the requesting user is staff or already booked.
  - CORS is permissive in development (`CORS_ALLOW_ALL_ORIGINS = True`).

  - Login (frontend): `POST /api/token/` -> returns `{ access, refresh }` (frontend stores both in `localStorage`).
  - Get sessions: `GET /api/sessions/` (returns masked sessions according to requester).
  - Book/unbook: `POST /api/sessions/{id}/book/` with Authorization header.
  - Current user: `GET /api/users/me/` (used to show admin button in `Home.jsx`).

  - Login: `curl -X POST http://localhost:8000/api/token/ -H 'Content-Type: application/json' -d '{"username":"user","password":"pw"}'`
  - Fetch sessions: `curl http://localhost:8000/api/sessions/ -H 'Authorization: Bearer <ACCESS>'`
  - Book a session: `curl -X POST http://localhost:8000/api/sessions/12/book/ -H 'Authorization: Bearer <ACCESS>'`

  - There are no automated tests implemented (`backend/api/tests.py` is empty). Expect manual testing when changing behavior.

If anything above is unclear or you'd like the instructions expanded to include automated checks, linting, or a short onboarding script (`scripts/`), tell me which areas to expand and I will iterate. 
