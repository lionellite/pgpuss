"""
Backend d'authentification personnalisé pour PGP-USS.
Permet la connexion via email OU numéro de téléphone.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class PhoneOrEmailBackend(ModelBackend):
    """
    Authentifie un utilisateur avec son email ou son numéro de téléphone.
    Le mot de passe est toujours requis.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            return None

        # Normaliser: supprimer les espaces
        username = username.strip()

        # Chercher par email d'abord, puis par téléphone
        try:
            if '@' in username:
                user = User.objects.get(email=username)
            else:
                # Numéro de téléphone : normaliser les formats courants
                phone = username.replace(' ', '').replace('-', '').replace('.', '')
                user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            # Hachage factice pour éviter les timing attacks
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
