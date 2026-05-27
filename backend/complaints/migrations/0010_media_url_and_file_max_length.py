from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('complaints', '0009_complaint_info_request_and_contact_flags'),
    ]

    operations = [
        migrations.AddField(
            model_name='attachment',
            name='media_url',
            field=models.URLField(blank=True, max_length=500, help_text='URL Cloudinary directe'),
        ),
        migrations.AddField(
            model_name='complaint',
            name='voice_media_url',
            field=models.URLField(blank=True, max_length=500, help_text='URL Cloudinary du message vocal'),
        ),
        migrations.AlterField(
            model_name='attachment',
            name='file',
            field=models.FileField(max_length=255, upload_to='attachments/%Y/%m/'),
        ),
        migrations.AlterField(
            model_name='complaint',
            name='voice_file',
            field=models.FileField(blank=True, max_length=255, null=True, upload_to='complaints/voice/%Y/%m/'),
        ),
    ]
