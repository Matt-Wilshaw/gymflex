# GymFlex

GymFlex is a web-based gym management platform designed to help users book sessions, track their workouts, and communicate with trainers—all in one place.

At its core, GymFlex is built with HTML, CSS, JavaScript, Python, React, Django, and Bootstrap. These technologies power an interactive, responsive experience that makes managing gym schedules and bookings simple and intuitive.

"When is my next session, and can I book it easily?"

Check out the live demo here:

# Link → [GymFlex](https://matt-wilshaw.github.io/gymflex/)

---

## Table of Contents

- [GymFlex](#gymflex)
- [Link → GymFlex](#link--gymflex)
  - [Table of Contents](#table-of-contents)
  - [Installation / Setup](#installation--setup)
    - [1. Clone the repository](#1-clone-the-repository)
    - [2. Create a virtual environment (optional but recommended)](#2-create-a-virtual-environment-optional-but-recommended)
    - [3. Install dependencies](#3-install-dependencies)
    - [4. Apply database migrations](#4-apply-database-migrations)
    - [5. Create a superuser (optional, for admin access)](#5-create-a-superuser-optional-for-admin-access)
    - [6. Run the development server](#6-run-the-development-server)
  - [Testing Overview](#testing-overview)
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
  - [Future Enhancements](#future-enhancements)
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

---

## Installation / Setup

Follow these steps to set up GymFlex locally:

### 1. Clone the repository

```bash
git clone https://github.com/your-username/gymflex.git
cd gymflex
```

### 2. Create a virtual environment (optional but recommended)

```bash
python -m venv venv
# Activate it:
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Apply database migrations

```bash
python manage.py migrate
```

### 5. Create a superuser (optional, for admin access)

```bash
python manage.py createsuperuser
```

### 6. Run the development server

```bash
python manage.py runserver
```

Visit `http://127.0.0.1:8000/` in your browser to access GymFlex locally.

**Notes:**

* Make sure you have Python 3.11+ installed.
* Use `.env` for environment variables like `SECRET_KEY` and database settings.
* If using PostgreSQL locally, update `settings.py` with your local database credentials.

---

## Testing Overview

To ensure GymFlex is reliable, user-friendly, and works across devices and browsers, a comprehensive testing strategy was followed. The approach combined Behaviour-Driven Development (BDD) and Test-Driven Development (TDD):

BDD focused on user stories and real-world scenarios, for example:
"As a client, I want to book a gym session so I can secure my spot in advance."

TDD ensured that features were designed, implemented, and tested iteratively, with automated tests written before the functionality to guarantee correctness from the start.

This strategy kept testing user-focused while maintaining high technical quality. For full details on all tests, validations, and results, see the TESTING.md document.

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
* Responsive front-end built with Bootstrap and custom CSS
* Secure, relational data handling via Django
* Deployed on Heroku with a managed relational database (PostgreSQL)

---

## Technologies Used

* Frontend: HTML, CSS, JavaScript, Bootstrap
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
