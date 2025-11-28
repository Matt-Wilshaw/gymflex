# GymFlex

GymFlex is a web-based gym management platform designed to help users book sessions, track their workouts, and communicate with trainers—all in one place.

At its core, GymFlex is built with HTML, CSS, JavaScript, Python, React, Django, and Bootstrap. These technologies power an interactive, responsive experience that makes managing gym schedules and bookings simple and intuitive.

## Architecture Overview (Summary)
GymFlex is a full-stack application where a React (Vite) frontend is built into static assets and served by the Django backend in production (Heroku). Requests flow:

```
Browser → Heroku Router → Gunicorn → Django (middleware + URL routing) → View/Serializer → ORM → PostgreSQL → JSON Response
```

Database selection is automatic:
- Local development: falls back to SQLite (no `DATABASE_URL` set)
- Heroku deployment: PostgreSQL used via `DATABASE_URL` and `dj_database_url`

Privacy & masking: session responses hide trainer and attendee details for unbooked, non-staff users; booked users see their own ID only; staff see full context.

For the full in-depth architecture (middleware order, lifecycle, masking matrix) see: `[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)`.

Check out the live demo here:

# Link → [GymFlex](https://matt-wilshaw.github.io/gymflex/)

---

## Table of Contents

- [GymFlex](#gymflex)
  - [Architecture Overview (Summary)](#architecture-overview-summary)
- [Link → GymFlex](#link--gymflex)
  - [Table of Contents](#table-of-contents)
  - [Testing Overview](#testing-overview)
    - [Deployed Test Environment](#deployed-test-environment)
      - [Smoke Test (Production)](#smoke-test-production)
  - [Development Checklist](#development-checklist)
    - [Authentication \& User Management](#authentication--user-management)
    - [Sessions \& Booking](#sessions--booking)
    - [User Profiles](#user-profiles)
    - [Trainer/Admin Features](#traineradmin-features)
    - [Future Enhancements](#future-enhancements)
  - [Database Structure](#database-structure)
    - [User Table (`auth_user`)](#user-table-auth_user)
    - [Session Table (`Session`)](#session-table-session)
    - [Relationships](#relationships)
  - [Installation / Setup](#installation--setup)
    - [1. Clone the repository](#1-clone-the-repository)
    - [2. Create a virtual environment (optional but recommended)](#2-create-a-virtual-environment-optional-but-recommended)
- [Activate it:](#activate-it)
- [Windows](#windows)
- [macOS/Linux](#macoslinux)
    - [3. Install dependencies](#3-install-dependencies)
    - [4. Apply database migrations](#4-apply-database-migrations)
    - [5. Create a superuser (optional, for admin access)](#5-create-a-superuser-optional-for-admin-access)
    - [6. Run the development server](#6-run-the-development-server)
    - [Frontend (React)](#frontend-react)
    - [1. Navigate to the frontend folder:](#1-navigate-to-the-frontend-folder)
    - [2. Install dependencies:](#2-install-dependencies)
    - [3. Start the React development server:](#3-start-the-react-development-server)
  - [Key Outline](#key-outline)
- [Introduction](#introduction)
  - [Vision](#vision)
  - [Strategy (Why?)](#strategy-why)
  - [Scope (What?)](#scope-what)
    - [Functional Requirements](#functional-requirements)
    - [Content Requirements](#content-requirements)
  - [Structure (How is it organised?)](#structure-how-is-it-organised)
    - [Information Architecture](#information-architecture)
    - [Skeleton (Layout and Interaction)](#skeleton-layout-and-interaction)
  - [Features](#features)
  - [Technologies Used](#technologies-used)
  - [Future Enhancements](#future-enhancements-1)
- [GymFlex Deployment Guide](#gymflex-deployment-guide)
  - [Prerequisites](#prerequisites)
  - [Steps](#steps)
    - [1. Create a Heroku App](#1-create-a-heroku-app)
    - [2. Add PostgreSQL Add-on](#2-add-postgresql-add-on)
    - [3. Set Environment Variables](#3-set-environment-variables)
    - [4. Prepare Your Django App](#4-prepare-your-django-app)
    - [5. Collect Static Files](#5-collect-static-files)
    - [6. Apply Database Migrations](#6-apply-database-migrations)
    - [7. Push Code to Heroku](#7-push-code-to-heroku)
    - [8. Open the App](#8-open-the-app)
    - [Optional: Monitor Logs](#optional-monitor-logs)
  - [Tips](#tips)
  - [Author](#author)
  - [Restoring Development Data](#restoring-development-data)

---

## Testing Overview

To ensure GymFlex is reliable, user-friendly, and accessible across different devices and browsers, a comprehensive testing strategy was followed.  
The approach combined **Behaviour-Driven Development (BDD)** and **Test-Driven Development (TDD)** principles, focusing on both user experience and code reliability.

- **BDD** focused on real-world user scenarios, such as:  
  *“As a user, I want to book a gym session so that I can secure my spot in advance.”*

- **TDD** ensured that each feature was supported by automated tests written before implementation, improving long-term stability and maintainability.

This combined approach kept testing user-centred while maintaining strong technical quality and confidence in the codebase.  

For detailed information on all tests, validations, bugs, and results, please refer to the [TESTING.md](./TESTING.md) document.

### Deployed Test Environment
Production (Heroku) app: https://gymflex-5bb1d582f94c.herokuapp.com/  
API base URL: https://gymflex-5bb1d582f94c.herokuapp.com/api  
Use this environment for manual end-to-end verification (JWT login, session listing, booking/unbooking). Local development tests should continue to use `http://localhost:8000/api`. Note: if the dyno has been idle it may take a few seconds to “wake” on the first request.

#### Smoke Test (Production)
Run these quick steps after each deploy to verify core functionality:
1. Obtain tokens: `POST /api/token/` with valid JSON credentials; expect `200` and `{"access","refresh"}`.
2. List sessions: `GET /api/sessions/` with `Authorization: Bearer <access>`; expect `200` and an array. Confirm masking (trainer shows `TBA` if viewing an unbooked session as non-staff).
3. Book a session: `POST /api/sessions/{id}/book/` (same Authorization); expect `200` and `booked: true`, `available_slots` decrements.
4. Toggle (unbook): Repeat step 3 on same session; expect `booked: false`, `available_slots` increments.
5. Refresh token: `POST /api/token/refresh/` with `{"refresh": "<refresh>"}`; expect new `access`, then repeat step 2 to confirm continued authorised access.

Notes:
- Initial request may be slower due to Heroku dyno wake-up.
- If any step fails with `401`, check token expiry and repeat step 1.
- For debugging, compare the same endpoint locally (`http://localhost:8000/api/sessions/`) to distinguish deployment vs code issues.

## Development Checklist

This checklist shows what has been done and what is planned, all in one place for easy progress tracking. It is designed to help the development team (or yourself) maintain a clear overview of progress, identify what still needs work, and prioritise upcoming tasks. Each section is organised by major areas of functionality, with GitHub-flavoured checkboxes that can be ticked off as features are completed.  

The checklist is intended to serve multiple purposes:

- **Progress tracking:** Quickly see which features are implemented, in progress, or not started.  
- **Planning:** Outline the scope of work, break down tasks into manageable pieces, and plan next steps.  
- **Documentation:** Provide a live snapshot of project development for team members, supervisors, or portfolio purposes.  
- **Quality assurance:** Highlight areas where testing is needed, ensuring no functionality is overlooked.  

Use this checklist as a single source of truth for GymFlex development. Update it regularly as features move from “To Do” → “In Progress” → “Done.”


### Authentication & User Management
- [x] Django backend with REST Framework  
- [x] JWT authentication for login/logout  
- [x] React frontend with routing (React Router)  
- [x] Login page  
- [x] Logout functionality  
- [x] Registration page  
- [x] Protected routes for authenticated users  
- [x] LocalStorage storing access and refresh tokens  
- [x] 404 NotFound page  
- [x] Basic form and layout styling  

### Sessions & Booking
- [ ] Timetable display for gym sessions, react-big-calendar  
- [ ] Book session  
- [ ] Cancel/unbook session  
- [ ] View booking status/history  

### User Profiles
- [ ] View profile details (username, age, membership type)  
- [ ] Edit profile  
- [ ] Display past bookings  

### Trainer/Admin Features
- [ ] Create, edit, delete sessions  
- [ ] View client bookings  
- [ ] Communicate with clients (notifications/messages)  

### Future Enhancements
- [ ] Email notifications for bookings and reminders  
- [ ] Calendar view for trainers  
- [ ] Ratings and reviews for trainers  
- [ ] Blog/news section  
- [ ] Payment integration (e.g., Stripe)  
- [ ] Improved responsive design and accessibility  

## Database Structure

GymFlex stores data in two main tables: **Users** and **Sessions**.  
The database is normalised to avoid duplication and maintain clear relationships:

- Trainers (`is_staff=True`) can create and manage sessions.
- Clients can view sessions and book/unbook them.
- Each session is linked to a trainer and can have multiple attendees.

---

### User Table (`auth_user`)
Stores all users, including trainers and clients.

| Field        | Description          |
| ------------ | -------------------- |
| id           | Primary Key          |
| username     | User’s username      |
| email        | Email address        |
| password     | Hashed password      |
| is_staff     | Trainer/admin flag   |
| is_superuser | Superuser/admin flag |

---

### Session Table (`Session`)
Stores all gym sessions.

| Field      | Description                               |
| ---------- | ----------------------------------------- |
| id         | Primary Key                               |
| title      | Session name or type                      |
| trainer_id | FK → `User.id` (who runs the session)     |
| date       | Session date                              |
| time       | Session time                              |
| capacity   | Maximum number of clients                 |
| attendees  | ManyToMany → Users who booked the session |

---

### Relationships

- `trainer_sessions` links trainers to the sessions they run (One-to-Many).  
- `booked_sessions` links users to sessions they have booked (Many-to-Many).  
- Trainers can create/edit/delete sessions; clients can only view and book/unbook.  

## Installation / Setup

Follow these steps to set up GymFlex locally:

### 1. Clone the repository
git clone https://github.com/your-username/gymflex.git
cd gymflex

### 2. Create a virtual environment (optional but recommended)
python -m venv venv
# Activate it:
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate


### 3. Install dependencies
pip install -r requirements.txt

### 4. Apply database migrations
python manage.py migrate

### 5. Create a superuser (optional, for admin access)
python manage.py createsuperuser

### 6. Run the development server
python manage.py runserver

### Frontend (React)

### 1. Navigate to the frontend folder:
cd frontend

### 2. Install dependencies:
npm install

### 3. Start the React development server:
npm start

Visit in your browser: http://localhost:5173/

**Notes:**

* Make sure you have Python 3.11+ installed.
* Use `.env` for environment variables like `SECRET_KEY` and database settings.
* If using PostgreSQL locally, update `settings.py` with your local database credentials.

---

## Key Outline

GymFlex helps users manage their gym experience efficiently, solving common frustrations like missed sessions, unclear timetables, or difficulty communicating with trainers. The app enables users to:

* View and book gym sessions via a clear timetable
* Track personal bookings and session history
* Communicate with trainers about workouts or schedule changes
* Manage user profiles and account settings
* Allow trainers to manage sessions, view client bookings, and maintain the calendar

---

# Introduction

## Vision

GymFlex is about connection and convenience. By combining user accounts, personalised timetables, and trainer-managed sessions, the application becomes a central hub for gym clients and trainers alike.

Whether you're a regular gym-goer managing weekly sessions or a trainer coordinating multiple classes, GymFlex provides clarity, control, and efficiency.

---

## Strategy (Why?)

GymFlex aims to:

* Centralise access to gym schedules and session booking
* Provide a clean, intuitive interface for both clients and trainers
* Offer personalised views of booked sessions, upcoming classes, and availability
* Serve as a hub for communication between clients and trainers

**Target Users:**
Gym clients, personal trainers, and gym administrators looking for a streamlined way to manage bookings, timetables, and communications.

---

## Scope (What?)

### Functional Requirements

* User registration and profile management
* Session booking, cancellations, and history tracking
* Timetable display for sessions, trainers, and rooms
* Trainer interface to manage sessions, view bookings, and communicate with clients

### Content Requirements

* User account data and preferences
* Session details (title, trainer, date, time, capacity)
* Static content (about pages, FAQs, gym policies)

---

## Structure (How is it organised?)

The platform is structured around key user flows:

* Discover → Book → Attend
* Book → Track → Review

### Information Architecture

* Home
* Timetable
* My Bookings
* Trainer Dashboard (for trainers)

---

### Skeleton (Layout and Interaction)

* Built primarily with React for dynamic rendering and reusable components
* Bootstrap used for responsive layout and navigation
* Custom CSS applied for timetable cards, buttons, and notifications
* Semantic HTML ensures content is structured meaningfully and remains accessible

**UI Elements:**

* Timetable cards show session title, time, trainer, and availability at a glance
* Booking buttons allow clients to reserve or cancel spots easily
* Trainer panels provide modals for editing session details without leaving the page
* Notifications inform clients of upcoming sessions or changes

---

## Features

* User registration and authentication
* Trainer and client profile management
* Create, view, edit, and cancel bookings (CRUD functionality)
* Interactive calendar view for gym sessions** powered by react-big-calendar
* Responsive front-end built with Bootstrap and custom CSS
* Secure, relational data handling via Django
* Deployed on Heroku with a managed relational database (PostgreSQL)

---

## Technologies Used

* Frontend: HTML, CSS, JavaScript, Bootstrap, react-big-calendar
* Backend: Django (Python)
* Database: SQLite (development) / PostgreSQL (production)
* Hosting: Heroku
* Version Control: Git & GitHub
* Authentication: JWT (JSON Web Token), Django REST Framework (DRF)

---

## Future Enhancements

* Email notifications for booking confirmations and reminders
* Calendar view for trainers
* Ratings and reviews for trainers
* Integration with payment systems (e.g., Stripe)

---

# GymFlex Deployment Guide

This document explains how to deploy GymFlex to Heroku.

## Prerequisites

* Heroku account
* Git installed
* Python, Django, and project dependencies installed

## Steps

### 1. Create a Heroku App

```bash
heroku login
heroku create gymflex-app
```

### 2. Add PostgreSQL Add-on

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

* Provides a free PostgreSQL database for production.
* Heroku automatically sets the DATABASE_URL environment variable.

### 3. Set Environment Variables

```bash
heroku config:set DEBUG=False
heroku config:set SECRET_KEY='your-secret-key'
heroku config:set ALLOWED_HOSTS='your-heroku-app.herokuapp.com'
```

* Include any other environment variables (e.g., JWT settings, API keys).

### 4. Prepare Your Django App

* Ensure requirements.txt and Procfile are present:

```text
# Procfile
web: gunicorn backend.wsgi
```

* Optionally, specify Python version in runtime.txt:

```text
python-3.11.8
```

### 5. Collect Static Files

```bash
heroku run python manage.py collectstatic --noinput
```

* Prepares all static files for production.

### 6. Apply Database Migrations

```bash
heroku run python manage.py migrate
```

### 7. Push Code to Heroku

```bash
git push heroku main
```

### 8. Open the App

```bash
heroku open
```

* Your GymFlex app should now be live.

### Optional: Monitor Logs

```bash
heroku logs --tail
```

* Useful for debugging deployment issues or server errors.

## Tips

* Make sure ALLOWED_HOSTS includes your Heroku domain.
* Configure django-cors-headers for your frontend domain if using React separately.
* Use whitenoise to serve static files in production.

---

*This README section is intended for developers deploying GymFlex to Heroku.*

## Author

Developed by Matthew Wilson as part of a web development learning project.

## Restoring Development Data

To quickly populate your local database with sample users, sessions, and bookings, run:

```powershell
python manage.py loaddata backend/users.json
python manage.py loaddata backend/sessions.json
python manage.py loaddata backend/attendees.json
```

This will restore the core data for development and testing.
