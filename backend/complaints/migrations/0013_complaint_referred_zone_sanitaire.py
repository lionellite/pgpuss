import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('establishments', '0003_zone_sanitaire'),
        ('complaints', '0012_whatsappsession'),
    ]

    operations = [
        migrations.AddField(
            model_name='complaint',
            name='referred_zone_sanitaire',
            field=models.ForeignKey(
                blank=True,
                help_text="Zone sanitaire orientée par le call center (établissement inconnu).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='referred_complaints',
                to='establishments.zonesanitaire',
            ),
        ),
    ]
