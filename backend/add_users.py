import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

# Create users


users_data = [
    ('Edie', 'edie'),
    ('Elliot', 'elliot'),
    ('Matthew', 'matthew'),
]

for username, password in users_data:
    user, created = User.objects.get_or_create(username=username)
    user.set_password(password)
    user.save()
    status = "Created" if created else "Updated"



