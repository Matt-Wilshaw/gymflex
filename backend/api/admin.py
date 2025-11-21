from django.contrib import admin
from .models import Note, Session   # Import your models so Django can register them


# -------------------------
# Register the Note model
# -------------------------
# This makes the Note model appear in the Django admin page.
# Without this, you cannot add/edit/delete Notes through the admin interface.
admin.site.register(Note)


# -------------------------
# Register the Session model
# -------------------------
# Same idea—this allows you to manage all gym sessions (HIIT, Yoga, etc.)
# directly from the admin dashboard.
admin.site.register(Session)
