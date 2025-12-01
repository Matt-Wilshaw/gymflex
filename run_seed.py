#!/usr/bin/env python
import os
import sys
import django

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import and run the seed script
from seed_sessions import run

if __name__ == '__main__':
    run()
