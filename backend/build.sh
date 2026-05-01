#!/bin/bash

echo "BUILD START"

# Install dependencies
# Using python3 for better compatibility in Vercel environment
python3 -m pip install -r requirements.txt

# Collect static files
# Necessary for WhiteNoise to serve CSS/JS/Images in production
python3 manage.py collectstatic --noinput --clear

# Run migrations (Uncomment if you want automatic migrations on each deploy)
# python3 manage.py migrate --noinput

echo "BUILD END"
