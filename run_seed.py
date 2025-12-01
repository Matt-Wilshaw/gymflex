#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import and run the seed script
import sys
sys.path.insert(0, 'backend')
from seed_sessions import run

if __name__ == '__main__':
    run()
