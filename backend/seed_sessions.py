from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from api.models import Session

"""
Idempotent development seeding for sessions only.
Industry-standard principles applied:
- No test users or passwords created.
- Safe to run multiple times (skips existing matching sessions).
- Creates a small window of past and future data for UI & attendance testing.
- Keeps logic deterministic (titles + date + hour).

To run locally:
    python manage.py shell < seed_sessions.py

To run on Heroku:
    heroku run python backend/manage.py shell < backend/seed_sessions.py

Adjust the BASE_TITLES or DAY_WINDOW as needed; keep capacity modest.
"""

BASE_TITLES = [
    ("Morning HIIT", 9),
    ("Lunchtime Yoga", 12),
    ("Evening Strength", 18),
    ("Core Blast", 17),
    ("Mobility Flow", 8),
]
DAY_WINDOW = 3  # Creates sessions from -3 days to +3 days
DURATION_MINUTES = 60
CAPACITY = 10


def run():  # django shell executes run() implicitly if called manually
    User = get_user_model()
    trainer = User.objects.filter(is_staff=True).order_by("id").first()
    if not trainer:
        print("No staff user found; create an admin/staff user first.")
        return

    today = datetime.utcnow().date()
    created = 0

    for offset in range(-DAY_WINDOW, DAY_WINDOW + 1):
        day = today + timedelta(days=offset)
        for title, hour in BASE_TITLES:
            start_dt = datetime(day.year, day.month, day.day, hour, 0)
            exists = Session.objects.filter(start_time=start_dt, trainer=trainer).exists()
            if exists:
                continue
            Session.objects.create(
                trainer=trainer,
                start_time=start_dt,
                duration_minutes=DURATION_MINUTES,
                capacity=CAPACITY,
                description=f"{title} session on {day.isoformat()}",
            )
            created += 1

    print(f"Seed complete. Sessions created: {created}. Total now: {Session.objects.count()}")


if __name__ == "__main__":
    run()
