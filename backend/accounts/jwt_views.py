from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenRefreshView


User = get_user_model()


class SafeTokenRefreshSerializer(TokenRefreshSerializer):
    """
    SimpleJWT peut lever User.DoesNotExist (ex: refresh token périmé/forgé
    ou utilisateur supprimé) et provoquer un 500. On renvoie un 401 standard.
    """

    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except User.DoesNotExist as exc:
            raise InvalidToken("Token invalide ou utilisateur introuvable.") from exc


class SafeTokenRefreshView(TokenRefreshView):
    serializer_class = SafeTokenRefreshSerializer

