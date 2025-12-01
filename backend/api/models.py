"""
Database models for the GymFlex API application.

This module defines the data structures (database tables) for the application:
- Note: Simple note-taking model (may be legacy/unused)
- Session: Fitness class sessions with trainers, schedules, and attendee bookings

Django ORM (Object-Relational Mapping) converts these Python classes into database tables
and provides a high-level API for querying and manipulating data without writing SQL.
"""

from django.db import models
from django.contrib.auth.models import User

# ---------------------
# SessionAttendee Through Model
# ---------------------
class SessionAttendee(models.Model):  # Through model linking Session and User with attendance flag
    session = models.ForeignKey('Session', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    attended = models.BooleanField(default=True, help_text="True if user attended; False if marked as no-show by admin")

    class Meta:
        unique_together = ('session', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.session} (attended: {self.attended})"
# ---------------------
# Note Model
# ---------------------
class Note(models.Model):
    """
    Represents a user-created note.
    
    This model appears to be from an earlier iteration of the project and may not be
    actively used in the current GymFlex application. It provides basic note-taking
    functionality with automatic timestamp tracking.
    
    Fields:
        title: Short text heading for the note (max 100 characters)
        created_at: Timestamp when note was first created (set automatically)
        updated_at: Timestamp when note was last modified (updated automatically)
        author: Link to the User who created this note (cascade delete on user removal)
    
    Database table name: api_note
    """
    title = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)  # Set once on creation
    updated_at = models.DateTimeField(auto_now=True)      # Updated on every save
    author = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,  # Delete note if author is deleted
        related_name='notes'        # Access user's notes via user.notes.all()
    )

    def __str__(self):
        """String representation shown in admin panel and shell."""
        return self.title


# ---------------------
# Session Model
# ---------------------
class Session(models.Model):
    """
    Represents a fitness class session at the gym.
    
    Core domain model for GymFlex. Each Session represents a scheduled fitness class
    with a specific activity type, trainer, date/time, capacity limit, and list of
    attendees who have booked a spot.
    
    Business rules:
    - Each session has one trainer (staff user)
    - Multiple users can book a session (up to capacity limit)
    - Attendees are tracked via a many-to-many relationship
    - Activity types are restricted to predefined choices
    
    Database table name: api_session
    """
    
    # Activity type choices for fitness class categorisation
    ACTIVITY_CHOICES = [
        ('cardio', 'Cardio'),
        ('weights', 'Weightlifting'),
        ('yoga', 'Yoga'),
        ('hiit', 'HIIT'),
        ('pilates', 'Pilates'),
    ]
    
    activity_type = models.CharField(
        max_length=20,
        choices=ACTIVITY_CHOICES,  # Restricts values to the defined choices
        default='cardio',
        help_text="Type of fitness activity for this session"
    )

    # Trainer relationship - links to Django's built-in User model
    # Staff users are designated as trainers
    trainer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,        # Delete sessions if trainer account is removed
        related_name="trainer_sessions",  # Access via user.trainer_sessions.all()
        help_text="Staff member leading this session"
    )
    
    # Session scheduling fields
    date = models.DateField(help_text="Date when this session takes place")
    time = models.TimeField(help_text="Start time for this session")
    duration_minutes = models.IntegerField(
        default=60,
        help_text="Duration of the session in minutes"
    )
    
    # Capacity management
    capacity = models.IntegerField(
        default=10,
        help_text="Maximum number of attendees allowed to book this session"
    )
    
    # Attendee bookings - many-to-many relationship via SessionAttendee
    attendees = models.ManyToManyField(
        User,
        through='SessionAttendee',
        related_name="booked_sessions",
        blank=True,
        help_text="Users who have booked a spot in this session"
    )

    def __str__(self):
        """
        Human-readable string representation for admin panel and debugging.
        
        Format: "Yoga with john_trainer on 2025-01-15 at 10:00:00"
        """
        return f"{self.activity_type} with {self.trainer.username} on {self.date} at {self.time}"
