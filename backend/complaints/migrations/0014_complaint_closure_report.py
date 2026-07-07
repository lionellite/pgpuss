# Generated manually to add closure_report to Complaint model
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('complaints', '0013_complaint_referred_zone_sanitaire'),
    ]

    operations = [
        migrations.AddField(
            model_name='complaint',
            name='closure_report',
            field=models.TextField(
                blank=True,
                help_text="Rapport de clôture décrivant les actions menées et les résultats"
            ),
        ),
    ]