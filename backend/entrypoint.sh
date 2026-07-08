#!/bin/bash

# Apply Django migrations (only if not specified otherwise)
echo "Applying database migrations..."
python manage.py migrate --no-input

# If a command is provided, run it instead of Gunicorn
if [ $# -gt 0 ]; then
    echo "Running custom command: $*"
    exec "$@"
else
    # Otherwise start gunicorn
    echo "Starting Gunicorn server..."
    exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120 --max-requests 500 --max-requests-jitter 50
fi