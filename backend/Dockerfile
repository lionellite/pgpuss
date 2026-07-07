# Image de base Python
FROM python:3.11-slim

# Environnement
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Répertoire de travail
WORKDIR /app

# Installation des dépendances système pour PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Installation des dépendances Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copie du projet
COPY . /app/

# Création des répertoires nécessaires et collectstatic
# DJANGO_SECRET_KEY factice pour la phase de build uniquement
RUN mkdir -p /app/staticfiles && \
    DJANGO_SECRET_KEY=build-only-secret \
    python manage.py collectstatic --noinput --clear 2>/dev/null || true

# Port exposé
EXPOSE 8000

# Make entrypoint executable and use it
COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

# Entrypoint command
ENTRYPOINT ["/app/entrypoint.sh"]

