# GymFlex Testing

# GymFlex Testing Documentation

## Introduction

This document outlines the testing process for **GymFlex**, a gym management web application that allows users to register, book sessions, and interact with trainers through an intuitive interface.

Testing was conducted to ensure that all features of GymFlex function as intended, that the user experience is consistent across devices and browsers, and that both clients and trainers can interact with the system without errors or usability issues.

The testing strategy followed a combination of **Behaviour-Driven Development (BDD)** and **Test-Driven Development (TDD)** principles:

- **BDD (Behaviour-Driven Development):** Focused on real-world user stories, such as *“As a user, I want to book a session so that I can reserve my spot in advance.”*  
- **TDD (Test-Driven Development):** Automated tests were written before implementing each feature to ensure correctness and maintainable code.

Both **manual** and **automated** testing methods were used to validate the functionality, usability, and accessibility of the application.

Key areas covered in testing include:
- User registration and authentication  
- Session booking and cancellation  
- Trainer session management  
- Data integrity and permission control  
- Cross-browser and mobile responsiveness  
- Accessibility compliance (WCAG standards)

For each user story, **black box testing** was applied — evaluating the system purely from the user's perspective without knowledge of internal code logic.  

All discovered bugs, fixes, and retests are documented throughout this file.

For additional project details and technical information, including instructions on running the site, please refer to the [README.md](./README.md)

---

- [GymFlex Testing](#gymflex-testing)
- [GymFlex Testing Documentation](#gymflex-testing-documentation)
  - [Introduction](#introduction)
- [GymFlex – UAT / Black Box Testing](#gymflex--uat--black-box-testing)
  - [1. User Registration](#1-user-registration)
  - [2. User Login](#2-user-login)
  - [3. View Timetable](#3-view-timetable)
  - [4. Book a Session](#4-book-a-session)
  - [5. Cancel a Booking](#5-cancel-a-booking)
  - [6. Trainer Session Management](#6-trainer-session-management)
  - [7. Track Bookings](#7-track-bookings)
  - [8. Accessibility](#8-accessibility)
  - [9. Adding Test Data to the Database](#9-adding-test-data-to-the-database)
    - [Using Django Admin](#using-django-admin)
      - [1. Create a superuser (if required)](#1-create-a-superuser-if-required)
- [Activate your virtual environment first](#activate-your-virtual-environment-first)
- [Windows](#windows)
- [macOS/Linux](#macoslinux)
- [Create Django superuser](#create-django-superuser)
- [Using Django Shell](#using-django-shell)
- [Examples of testing data added below](#examples-of-testing-data-added-below)
- [Run the following commands as needed:](#run-the-following-commands-as-needed)
- [Windows](#windows-1)
- [Select Backend](#select-backend)
- [Start Django shell:\*\*](#start-django-shell)
- [Add test data](#add-test-data)
- [Get existing users](#get-existing-users)
- [Create sessions](#create-sessions)
- [Add test user as attendee](#add-test-user-as-attendee)
  - [Bug Log](#bug-log)


# GymFlex – UAT / Black Box Testing

## 1. User Registration

**Story:**  
As a new user, I want to create an account so that I can access GymFlex features like booking sessions and tracking my workouts.

**Acceptance Criteria:**  
- When I provide valid information and submit the registration form  
- Then my account is created  
- And I can log in immediately after registration

**Tasks:**  
- [ ] Design registration form UI  
- [ ] Implement backend registration logic  
- [ ] Validate input and handle errors  
- [ ] Test registration workflow  

**Bug Tracking / Notes:**  
- [ ]  

---

## 2. User Login

**Story:**  
As a registered user, I want to log in so that I can securely access my account and personal timetable.

**Acceptance Criteria:**  
- Given I am a registered user  
- When I submit correct credentials  
- Then I am redirected to my dashboard  
- And an authentication token/session is created

**Tasks:**  
- [ ] Implement login form UI  
- [ ] Connect to backend authentication (JWT/DRF)  
- [ ] Handle login errors and messages  
- [ ] Test login flow  

**Bug Tracking / Notes:**  
- [ ]  

---

## 3. View Timetable

**Story:**  
As a user, I want to view the gym timetable so that I can see available sessions and plan my schedule.

**Acceptance Criteria:**  
- Given I am logged in  
- When I access the timetable page  
- Then I can see all upcoming sessions with time, trainer, and availability  
- And sessions are updated in real-time if changes occur

**Tasks:**  
- [ ] Design timetable UI  
- [ ] Implement backend session retrieval  
- [ ] Test real-time updates or refresh functionality  

**Bug Tracking / Notes:**  
- [ ]  

---

## 4. Book a Session

**Story:**  
As a user, I want to book a gym session so that I can reserve my spot in advance.

**Acceptance Criteria:**  
- Given I view a session with available spots  
- When I click “Book”  
- Then my booking is confirmed  
- And the availability updates immediately

**Tasks:**  
- [ ] Implement booking button and backend logic  
- [ ] Handle capacity constraints and conflicts  
- [ ] Provide confirmation feedback to the user  
- [ ] Test booking process  

**Bug Tracking / Notes:**  
- [ ]  

---

## 5. Cancel a Booking

**Story:**  
As a user, I want to cancel a previously booked session so that I can free up my spot if I cannot attend.

**Acceptance Criteria:**  
- Given I have a booking  
- When I click “Cancel”  
- Then the booking is removed  
- And the session availability updates

**Tasks:**  
- [ ] Implement cancel booking UI  
- [ ] Update backend booking status  
- [ ] Test cancellation flow and availability updates  

**Bug Tracking / Notes:**  
- [ ]  

---

## 6. Trainer Session Management

**Story:**  
As a trainer, I want to create, edit, and delete sessions so that I can manage my classes and client bookings effectively.

**Acceptance Criteria:**  
- Given I am a trainer  
- When I add, edit, or remove a session  
- Then the timetable updates for all users  
- And users are notified of changes if applicable

**Tasks:**  
- [ ] Design trainer dashboard UI  
- [ ] Implement session CRUD functionality  
- [ ] Test session updates on client dashboards  

**Bug Tracking / Notes:**  
- [ ]  

---

## 7. Track Bookings

**Story:**  
As a user, I want to view my past and upcoming bookings so that I can track my gym activities.

**Acceptance Criteria:**  
- Given I am logged in  
- When I navigate to “My Bookings”  
- Then I can see all current and past bookings with details  
- And bookings are ordered chronologically

**Tasks:**  
- [ ] Implement bookings list UI  
- [ ] Fetch data from backend  
- [ ] Test correct ordering and completeness  

**Bug Tracking / Notes:**  
- [ ]  

---

## 8. Accessibility

**Story:**  
As a visually impaired or mobility-challenged user, I want to navigate GymFlex using assistive technologies so that I can independently browse, book, and manage sessions.

**Acceptance Criteria:**  
- Given I use a screen reader or keyboard navigation  
- When I browse and interact with the timetable, bookings, or forms  
- Then all interactive elements are accessible and labeled clearly  
- And layouts remain functional under zoom or high-contrast settings

**Tasks:**  
- [ ] Apply semantic HTML and ARIA labels  
- [ ] Test keyboard-only navigation  
- [ ] Verify screen reader compatibility  
- [ ] Ensure responsive layout under zoom/high-contrast  

**Bug Tracking / Notes:**  
- [ ]  

## 9. Adding Test Data to the Database

**Story:**  
As a developer, I want to populate the GymFlex database with test data so that I can verify features without manually creating records.

**Acceptance Criteria:**  
- Given I have VS Code open with the GymFlex project  
- When I run Django shell commands, load fixtures, or use the admin panel  
- Then users, sessions, and bookings are created for testing  
- And data is immediately available to the React frontend via API

**Tasks:**  
- [ ] Add sample users, trainers, sessions, and bookings  
- [ ] Load data using shell, fixtures, or admin  
- [ ] Verify data exists via admin, DB viewer, or API

### Using Django Admin

#### 1. Create a superuser (if required)

In VS Code terminal:

```bash
# Activate your virtual environment first

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Create Django superuser
python manage.py createsuperuser

# Using Django Shell

# Examples of testing data added below

1. **Open VS Code terminal:**

# Run the following commands as needed:
```bash

# Windows
.\venv\Scripts\activate

# Select Backend
cd backend

# Start Django shell:**
python manage.py shell

# Add test data
from django.contrib.auth.models import User
from api.models import Session
from datetime import date, time, timedelta
from django.utils import timezone

# Get existing users
admin_trainer = User.objects.get(username='admin')
test_user = User.objects.get(username='test1')

# Create sessions
session1, created = Session.objects.get_or_create(
    title="Morning Strength",
    trainer=admin_trainer,
    date=timezone.now().date() + timedelta(days=1),
    time=time(9, 0),
    capacity=12
)

session2, created = Session.objects.get_or_create(
    title="Evening Cardio",
    trainer=admin_trainer,
    date=timezone.now().date() + timedelta(days=1),
    time=time(18, 0),
    capacity=15
)

# Add test user as attendee
session1.attendees.add(test_user)
session2.attendees.add(test_user)

## Bug Log

| User Story / Feature          | Bug Description                                                               | Severity | Status | Notes / Steps to Reproduce                                                                                                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- | -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User Registration / App Start | ImportError: cannot import name 'Note' from 'api.models'                      | High     | Fixed  | Issue caused by importing `Note` in `serializers.py` without a corresponding model. Removed the import. App now starts successfully.                                                                                                         |
| User Registration / App Start | OperationalError: connection to PostgreSQL failed due to no password supplied | High     | Fixed  | Issue caused by Django trying to connect to a PostgreSQL server without credentials. Switched `DATABASES` to use SQLite for local development. App now starts and migrations run successfully.                                               |
| App Routing / URL Mapping     | The empty path didn’t match any of these.                                     | Medium   | Open   | Running the app root URL (`/`) produced a “no matching URL patterns” message. Django tried the following paths: `admin/`, `api/register/`, `api/token/`, `api/token/refresh/`, and `api-auth/`. Add a default route or homepage view to fix. |
