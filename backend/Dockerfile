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

# Port exposé
EXPOSE 8000

# Commande par défaut (sera surchargée par docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
