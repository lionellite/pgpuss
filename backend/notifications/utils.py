from .models import Notification, NotificationType

def notify_user(user, title, message, complaint=None):
    """Crée une notification in-app pour l'utilisateur"""
    if user:
        Notification.objects.create(
            user=user,
            title=title,
            message=message,
            complaint=complaint,
            type=NotificationType.IN_APP
        )
        # Ici on pourrait ajouter l'envoi d'email ou SMS réel si configuré
