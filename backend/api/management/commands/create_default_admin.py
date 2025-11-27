from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
import os

class Command(BaseCommand):
    help = "Create a default superuser if it does not already exist (idempotent)."\
           " Uses environment variables ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD."\
           " Will not overwrite an existing user."

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get("ADMIN_USERNAME")
        email = os.environ.get("ADMIN_EMAIL")
        password = os.environ.get("ADMIN_PASSWORD")

        if not (username and email and password):
            self.stdout.write(self.style.ERROR(
                "Missing one or more required env vars: ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD"
            ))
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f"User '{username}' already exists; skipping."))
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Created superuser '{username}'."))
