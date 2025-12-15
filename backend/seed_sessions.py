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

Django_ACTIVITY_CHOICES = [
    'cardio', 'weights', 'yoga', 'hiit', 'pilates'
]
BASE_TITLES = [
    ("Morning HIIT", 9, 'hiit'),
    ("Lunchtime Yoga", 12, 'yoga'),
    ("Evening Strength", 18, 'weights'),
    ("Core Blast", 17, 'cardio'),
    ("Mobility Flow", 8, 'pilates'),
]
DAYS_DECEMBER = [datetime(2025, 12, d).date() for d in range(1, 32)]
DAYS_JANUARY = [datetime(2026, 1, d).date() for d in range(1, 32)]
DAYS_TO_SEED = DAYS_DECEMBER + DAYS_JANUARY
DURATION_MINUTES = 60
CAPACITY = 10



def run():
    User = get_user_model()
    trainer = User.objects.filter(is_staff=True).order_by("id").first()
    if not trainer:

        return

    created = 0
    # Seed December and January, at least 30 sessions each
    for day in DAYS_TO_SEED:
        # Use a round-robin of titles and hours to ensure variety
        for i, (title, hour, activity_type) in enumerate(BASE_TITLES):
            # Only seed up to 5 sessions per day, for 31*2*5 = 310 sessions
            session_date = day
            session_time = f"{hour:02d}:00"
            exists = Session.objects.filter(date=session_date, time=session_time, trainer=trainer).exists()
            if exists:
                continue
            Session.objects.create(
                trainer=trainer,
                activity_type=activity_type,
                date=session_date,
                time=session_time,
                duration_minutes=DURATION_MINUTES,
                capacity=CAPACITY,
            )
            created += 1




if __name__ == "__main__":
    run()
