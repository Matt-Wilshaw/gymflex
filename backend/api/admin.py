from django.contrib import admin
from django.contrib.auth.models import User
from django import forms
from .models import Note, Session, SessionAttendee
import datetime

# -------------------------
# Note Admin
# -------------------------
admin.site.register(Note)

# -------------------------
# SessionAttendee Admin
# -------------------------
admin.site.register(SessionAttendee)

# -------------------------
# Generate 30-minute time choices
# -------------------------
def generate_time_choices():
    times = []
    for hour in range(24):
        for minute in (0, 30):
            t = datetime.time(hour, minute)
            times.append((t.strftime("%H:%M"), t.strftime("%H:%M")))
    return times

# -------------------------
# Custom form for Session admin
# -------------------------
class SessionAdminForm(forms.ModelForm):
    time = forms.ChoiceField(choices=generate_time_choices(), label="Time")

    class Meta:
        model = Session
        fields = "__all__"

# -------------------------
# Session Admin
# -------------------------
class SessionAdmin(admin.ModelAdmin):
    form = SessionAdminForm
    exclude = ('trainer',)  # hide trainer field

    def save_model(self, request, obj, form, change):
        # Always assign the first superuser as trainer
        obj.trainer = User.objects.filter(is_superuser=True).first()
        super().save_model(request, obj, form, change)

admin.site.register(Session, SessionAdmin)
