#!/bin/bash

# Apply Django migrations
echo "Applying database migrations..."
python manage.py migrate --no-input

# Then start gunicorn
echo "Starting Gunicorn server..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120 --max-requests 500 --max-requests-jitter 50