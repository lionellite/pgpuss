from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('complaints', '0005_call_center_channel'),
    ]

    operations = [
        migrations.AddField(
            model_name='complaint',
            name='establishment_name_manual',
            field=models.CharField(
                blank=True,
                help_text="Nom de l'établissement si non présent dans le référentiel",
                max_length=300,
            ),
        ),
        migrations.AddField(
            model_name='complaint',
            name='establishment_address_manual',
            field=models.CharField(
                blank=True,
                help_text="Adresse ou localisation si établissement saisi manuellement",
                max_length=500,
            ),
        ),
    ]
