import os
import django
import sys
import random

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Session



# Get users (excluding admin)
users = list(User.objects.filter(username__in=['Edie', 'Elliot', 'Matthew']))
sessions = list(Session.objects.all())

if not users:

    sys.exit(1)

if not sessions:

    sys.exit(1)



# Create 30 random bookings (approximately 10 per user)
bookings_created = 0
attempts = 0
max_attempts = 100

while bookings_created < 30 and attempts < max_attempts:
    user = random.choice(users)
    session = random.choice(sessions)
    
    # Check if user already booked this session
    if not session.attendees.filter(id=user.id).exists():
        # Check if session has space
        if session.attendees.count() < session.capacity:
            session.attendees.add(user)
            bookings_created += 1

    
    attempts += 1



# Show distribution
for user in users:
    count = sum(1 for s in sessions if s.attendees.filter(id=user.id).exists())

