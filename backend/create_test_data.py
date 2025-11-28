import os
import django
import sys
from datetime import datetime, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Session, SessionAttendee

# Create test users
print("Creating test users...")
admin_user, _ = User.objects.get_or_create(username='admin', defaults={'is_staff': True, 'is_superuser': True})
admin_user.is_staff = True
admin_user.is_superuser = True
admin_user.set_password('admin')
admin_user.save()

# Use admin as the trainer
trainer = admin_user

print(f"Created/verified admin as trainer")

# Create test sessions
print("Creating test sessions...")
base_date = datetime.now().date()
activities = ['cardio', 'weights', 'yoga', 'hiit', 'pilates']
times = ['09:00:00', '11:00:00', '14:00:00', '17:00:00', '19:00:00']

sessions_created = []

# Past sessions (for testing attendance marking)
for i in range(5):
    date = base_date - timedelta(days=i+1)
    session = Session.objects.create(
        activity_type=activities[i % len(activities)],
        trainer=trainer,
        date=date,
        time=times[i % len(times)],
        capacity=10
    )
    sessions_created.append(session)
    
    print(f"  Past session: {session.activity_type} on {date} at {session.time}")

# Future sessions (for testing booking)
for i in range(10):
    date = base_date + timedelta(days=i+1)
    session = Session.objects.create(
        activity_type=activities[i % len(activities)],
        trainer=trainer,
        date=date,
        time=times[i % len(times)],
        capacity=10
    )
    sessions_created.append(session)
    print(f"  Future session: {session.activity_type} on {date} at {session.time} (available)")

print(f"\nTest data created successfully!")
print(f"Total sessions: {len(sessions_created)}")
print(f"\nLogin credentials:")
print(f"  Admin/Trainer: admin / admin")
print(f"\nYou can now register your own users via the frontend or Django admin.")
