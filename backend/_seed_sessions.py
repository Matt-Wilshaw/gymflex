import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
import django
django.setup()

from django.utils import timezone
from django.contrib.auth.models import User
from api.models import Session
from datetime import time, timedelta



# Ensure admin trainer exists and is staff
admin = User.objects.filter(username="admin").first()
if not admin:
    admin = User.objects.create_user(username="admin", password="admin")
if not admin.is_staff:
    admin.is_staff = True
    admin.save(update_fields=["is_staff"])

# Ensure target users exist
mw = User.objects.filter(username="mwilshaw").first()
if not mw:
    mw = User.objects.create_user(username="mwilshaw", password="mwilshaw")
cl = User.objects.filter(username="client").first()
if not cl:
    cl = User.objects.create_user(username="client", password="client")

# Session specs (5 per user)
TODAY = timezone.localdate()
plan = {
    "mwilshaw": [
        ("cardio", TODAY + timedelta(days=1), time(8, 0), 12),
        ("yoga", TODAY + timedelta(days=2), time(9, 30), 10),
        ("weights", TODAY + timedelta(days=3), time(12, 0), 8),
        ("hiit", TODAY + timedelta(days=5), time(17, 30), 12),
        ("pilates", TODAY + timedelta(days=7), time(19, 0), 10),
    ],
    "client": [
        ("weights", TODAY + timedelta(days=1), time(9, 0), 10),
        ("hiit", TODAY + timedelta(days=2), time(18, 0), 12),
        ("cardio", TODAY + timedelta(days=4), time(7, 30), 15),
        ("yoga", TODAY + timedelta(days=6), time(16, 0), 10),
        ("pilates", TODAY + timedelta(days=8), time(10, 30), 10),
    ],
}

created = []
for username, specs in plan.items():
    user = mw if username == "mwilshaw" else cl
    for act, d, t, cap in specs:
        obj, was_created = Session.objects.get_or_create(
            trainer=admin,
            activity_type=act,
            date=d,
            time=t,
            defaults={"capacity": cap},
        )
        if not was_created and obj.capacity != cap:
            obj.capacity = cap
            obj.save(update_fields=["capacity"])
        obj.attendees.add(user)
        created.append((obj.id, "created" if was_created else "existing", act, d.isoformat(), t.strftime("%H:%M"), username))


for sid, msg, act, d, t, user in sorted(created, key=lambda x: (x[3], x[4], x[0])):

