from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('complaints', '0006_complaint_manual_establishment'),
    ]

    operations = [
        migrations.AddField(
            model_name='complaint',
            name='media_upload_token',
            field=models.CharField(blank=True, editable=False, max_length=64),
        ),
    ]
