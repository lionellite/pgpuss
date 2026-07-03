import uuid

import django.utils.timezone
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('sequence', models.PositiveBigIntegerField(editable=False, unique=True)),
                ('event_type', models.CharField(choices=[('AUTH', 'Authentification'), ('COMPLAINT', 'Plainte'), ('USER', 'Utilisateur'), ('EXPORT', 'Export'), ('SYSTEM', 'Système'), ('WEBHOOK', 'Webhook')], db_index=True, max_length=20)),
                ('action', models.CharField(db_index=True, max_length=200)),
                ('actor_role', models.CharField(blank=True, db_index=True, max_length=30)),
                ('actor_label', models.CharField(blank=True, max_length=200)),
                ('resource_type', models.CharField(blank=True, db_index=True, max_length=50)),
                ('resource_id', models.CharField(blank=True, db_index=True, max_length=100)),
                ('resource_label', models.CharField(blank=True, max_length=300)),
                ('old_value', models.JSONField(blank=True, null=True)),
                ('new_value', models.JSONField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.CharField(blank=True, max_length=500)),
                ('prev_hash', models.CharField(blank=True, max_length=64)),
                ('entry_hash', models.CharField(editable=False, max_length=64, unique=True)),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': "Entrée de journal d'audit",
                'verbose_name_plural': "Journal d'audit",
                'ordering': ['-sequence'],
            },
        ),
    ]
