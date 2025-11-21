from django.db import models
from django.contrib.auth.models import User

# ---------------------
# Note model
# ---------------------
class Note(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')

    def __str__(self):
        return self.title

# ---------------------
# Session model
# ---------------------
class Session(models.Model):
    title = models.CharField(max_length=100)

    # Activity type for dropdown (cardio, weights, etc.)
    ACTIVITY_CHOICES = [
        ('cardio', 'Cardio'),
        ('weights', 'Weightlifting'),
        ('yoga', 'Yoga'),
        ('hiit', 'HIIT'),
        ('pilates', 'Pilates'),
    ]
    activity_type = models.CharField(
        max_length=20,
        choices=ACTIVITY_CHOICES,
        default='cardio'
    )

    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="trainer_sessions")
    date = models.DateField()
    time = models.TimeField()
    capacity = models.IntegerField(default=10)
    attendees = models.ManyToManyField(User, related_name="booked_sessions", blank=True)

    def __str__(self):
        return f"{self.title} ({self.activity_type}) with {self.trainer.username} on {self.date} at {self.time}"
