from django.db import models
from django.contrib.auth.models import User

# The Note model represents a simple note or message created by a user.
# It includes a title, content, timestamps, and a link to the author (User).

class Note(models.Model):
    # The title of the note, limited to 100 characters for brevity.
    title = models.CharField(max_length=100)

    # The main content/body of the note, allowing unlimited text.
    content = models.TextField()

    # Automatically stores the date and time when the note is first created.
    created_at = models.DateTimeField(auto_now_add=True)

    # Automatically updates the date and time whenever the note is modified.
    updated_at = models.DateTimeField(auto_now=True)

    # A foreign key linking each note to a specific user.
    # If the user is deleted, all their notes are also deleted (CASCADE).
    # 'related_name' allows reverse access — e.g. user.notes.all()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')

    # This defines how the note is represented as a string — useful in admin and debugging.
    def __str__(self):
        return self.title
