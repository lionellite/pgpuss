from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from establishments.models import Establishment
from accounts.models import UserRole

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Inscription : email OU téléphone obligatoire.
    Le rôle est toujours USAGER à l'inscription publique.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=20)

    class Meta:
        model = User
        fields = ['email', 'phone', 'first_name', 'last_name', 'password', 'password_confirm']

    def validate_email(self, value):
        if value is None:
            return None
        value = str(value).strip()
        return value or None

    def validate_phone(self, value):
        if value is None:
            return None
        value = str(value).strip()
        return value or None

    def validate(self, attrs):
        email = attrs.get('email')
        phone = attrs.get('phone')

        if not email and not phone:
            raise serializers.ValidationError({
                'non_field_errors': 'Veuillez fournir un email ou un numéro de téléphone.'
            })

        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Les mots de passe ne correspondent pas.'
            })

        try:
            validate_password(attrs['password'])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})

        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'Cet email est déjà utilisé.'})

        if phone:
            phone_normalized = phone.replace(' ', '').replace('-', '').replace('.', '')
            attrs['phone'] = phone_normalized
            if User.objects.filter(phone=phone_normalized).exists():
                raise serializers.ValidationError({'phone': 'Ce numéro de téléphone est déjà utilisé.'})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        # Forcer le rôle USAGER à l'auto-inscription
        validated_data['role'] = 'USAGER'
        user = User.objects.create_user(**validated_data)
        return user


class PhoneLoginSerializer(serializers.Serializer):
    """
    Connexion par numéro de téléphone ou email.
    Le champ 'username' accepte les deux.
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = (attrs.get('username') or '').strip()
        password = attrs.get('password') or ''

        # On veut distinguer : "compte introuvable" vs "mot de passe erroné".
        # Le backend authenticate() retourne None dans les deux cas, donc on fait le lookup ici.
        normalized_phone = None
        try:
            if '@' in username:
                user = User.objects.filter(email=username, is_active=True).first()
            else:
                normalized_phone = username.replace(' ', '').replace('-', '').replace('.', '')
                user = User.objects.filter(phone=normalized_phone, is_active=True).first()
        except Exception:
            user = None

        if not user:
            raise serializers.ValidationError(
                {"detail": "Aucun compte actif n'a été trouvé avec ces identifiants."}
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                {"detail": "Mot de passe erroné."}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Ce compte a été désactivé."}
            )

        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    establishment_name = serializers.CharField(source='establishment.name', read_only=True, default=None)
    zone_sanitaire_name = serializers.CharField(source='zone_sanitaire.name', read_only=True, default=None)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'avatar', 'language_pref',
            'establishment', 'establishment_name',
            'zone_sanitaire', 'zone_sanitaire_name',
            'departement',
            'is_active', 'must_change_password', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'role', 'is_active',
                            'establishment', 'zone_sanitaire', 'departement', 'must_change_password']


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """
    Réservé à l'admin plateforme : modifier infos, rôle, établissement, statut.
    """
    establishment = serializers.PrimaryKeyRelatedField(
        queryset=Establishment.objects.all(), required=False, allow_null=True
    )
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=20)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone',
            'role', 'is_active',
            'establishment', 'departement',
            'zone_sanitaire',
        ]

    def validate_email(self, value):
        if value:
            value = value.strip() or None
            if value and User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError('Cet email est déjà utilisé.')
        return value or None

    def validate_phone(self, value):
        if value:
            value = value.strip().replace(' ', '').replace('-', '').replace('.', '') or None
            if value and User.objects.filter(phone=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError('Ce numéro est déjà utilisé.')
        return value or None


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'avatar', 'language_pref']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Ancien mot de passe incorrect.')
        return value


class AdminPasswordResetSerializer(serializers.Serializer):
    """
    L'admin initie un reset de mot de passe pour un utilisateur.
    Retourne un token à transmettre à l'utilisateur.
    """
    new_password = serializers.CharField(
        required=False,
        validators=[validate_password],
        help_text="Si fourni, définit directement le nouveau mot de passe."
    )

    def validate_new_password(self, value):
        return value or None


class PFEStaffCreateSerializer(serializers.ModelSerializer):
    """Création d'un agent interne par le PFE de l'établissement."""
    password = serializers.CharField(write_only=True, required=False, min_length=8, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=20)

    class Meta:
        model = User
        fields = ['email', 'phone', 'first_name', 'last_name', 'password']

    def validate_email(self, value):
        if value is None:
            return None
        value = str(value).strip()
        return value or None

    def validate_phone(self, value):
        if value is None:
            return None
        value = str(value).strip()
        return value or None

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or request.user.role != UserRole.PFE:
            raise serializers.ValidationError({'non_field_errors': 'Action réservée au PFE.'})
        if not request.user.establishment_id:
            raise serializers.ValidationError({'non_field_errors': 'Votre compte PFE n\'est pas rattaché à un établissement.'})

        email = attrs.get('email')
        phone = attrs.get('phone')
        if not email and not phone:
            raise serializers.ValidationError({
                'non_field_errors': 'Indiquez un email ou un numéro de téléphone pour l\'agent.'
            })

        password = (attrs.get('password') or '').strip()
        if password:
            try:
                validate_password(password)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({'password': list(exc.messages)})
        else:
            attrs['password'] = 'ChangeMe123!'

        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'Cet email est déjà utilisé.'})
        if phone:
            phone = phone.replace(' ', '').replace('-', '').replace('.', '')
            attrs['phone'] = phone
            if User.objects.filter(phone=phone).exists():
                raise serializers.ValidationError({'phone': 'Ce numéro est déjà utilisé.'})
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        password = validated_data.pop('password', 'ChangeMe123!')
        validated_data['role'] = UserRole.AGENT_INTERNE
        validated_data['establishment'] = request.user.establishment
        user = User.objects.create_user(password=password, **validated_data)
        user.must_change_password = True
        user.save(update_fields=['must_change_password'])
        return user


class PFEStaffUpdateSerializer(serializers.ModelSerializer):
    """Modification d'un agent interne par le PFE."""
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=20)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone', 'is_active']

    def validate_email(self, value):
        if value:
            value = value.strip() or None
            if value and User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError('Cet email est déjà utilisé.')
        return value or None

    def validate_phone(self, value):
        if value:
            value = value.strip().replace(' ', '').replace('-', '').replace('.', '') or None
            if value and User.objects.filter(phone=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError('Ce numéro est déjà utilisé.')
        return value or None
