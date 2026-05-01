#!/bin/bash

echo "BUILD START"

# Install dependencies
python3.12 -m pip install -r requirements.txt

# Collect static files
python3.12 manage.py collectstatic --noinput --clear

# Run migrations (Optional: usually better to run from local or a separate task, but can be done here if DB is reachable)
# python3.12 manage.py migrate --noinput

echo "BUILD END"
