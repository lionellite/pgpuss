from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('complaints', '0008_clean_category_labels'),
    ]

    operations = [
        migrations.AddField(
            model_name='complaint',
            name='needs_call_center_assistance',
            field=models.BooleanField(
                default=False,
                help_text='Si vrai, les demandes de complément doivent être prises en charge par le call center.',
            ),
        ),
        migrations.AddField(
            model_name='complaint',
            name='info_request_open',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='complaint',
            name='info_request_notes',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='complaint',
            name='info_request_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='complaint',
            name='public_access_code_hash',
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name='complaint',
            name='public_access_code_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
