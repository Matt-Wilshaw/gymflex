from django.db import models
from django.contrib.auth.models import User

# ---------------------
# Note model
# ---------------------
class Note(models.Model):
    # The title of the note, limited to 100 characters
    title = models.CharField(max_length=100)

    # The main content/body of the note
    content = models.TextField()

    # Automatically stores the date and time when the note is first created
    created_at = models.DateTimeField(auto_now_add=True)

    # Automatically updates the date and time whenever the note is modified
    updated_at = models.DateTimeField(auto_now=True)

    # A foreign key linking each note to a specific user
    # If the user is deleted, all their notes are also deleted (CASCADE)
    # 'related_name' allows reverse access — e.g. user.notes.all()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')

    # String representation for admin/debugging
    def __str__(self):
        return self.title

# ---------------------
# Session model
# ---------------------
class Session(models.Model):
    # Name or type of the session
    title = models.CharField(max_length=100)

    # Which trainer runs this session
    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="trainer_sessions")

    # Date and time of the session
    date = models.DateField()
    time = models.TimeField()

    # Maximum number of clients who can attend
    capacity = models.IntegerField(default=10)

    # Users who have booked this session
    attendees = models.ManyToManyField(User, related_name="booked_sessions", blank=True)

    # String representation for admin/debugging
    def __str__(self):
        return f"{self.title} with {self.trainer.username} on {self.date} at {self.time}"
