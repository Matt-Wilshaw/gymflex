from django.contrib import admin
from django.contrib.auth.models import User
from .models import Note, Session

# -------------------------
# Note Admin
# -------------------------
admin.site.register(Note)

# -------------------------
# Session Admin (force admin as trainer)
# -------------------------
class SessionAdmin(admin.ModelAdmin):
    # Hide the trainer field in the admin form
    exclude = ('trainer',)

    # Always assign the first superuser as the trainer
    def save_model(self, request, obj, form, change):
        obj.trainer = User.objects.filter(is_superuser=True).first()
        super().save_model(request, obj, form, change)

admin.site.register(Session, SessionAdmin)
