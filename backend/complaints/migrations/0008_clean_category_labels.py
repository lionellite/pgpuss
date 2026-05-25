import re

from django.db import migrations

_EMOJI_RE = re.compile(
    r'[\U0001F300-\U0001F9FF\U0001FA00-\U0001FAFF\u2600-\u27BF]',
    flags=re.UNICODE,
)
_PREFIX_P_RE = re.compile(r'^\s*P\d+\s*[—–\-:]\s*', re.IGNORECASE)
_INLINE_P_RE = re.compile(r'\bP[1-5]\b\s*[—–\-:]?\s*', re.IGNORECASE)
_DASHES_RE = re.compile(r'\s*[—–\-]+\s*')
_SPACES_RE = re.compile(r'\s{2,}')


def _clean(name: str) -> str:
    if not name:
        return ''
    s = _EMOJI_RE.sub('', name)
    s = _PREFIX_P_RE.sub('', s)
    s = _INLINE_P_RE.sub(' ', s)
    s = _DASHES_RE.sub(' ', s)
    return _SPACES_RE.sub(' ', s).strip()


def clean_categories(apps, schema_editor):
    Category = apps.get_model('complaints', 'Category')
    for cat in Category.objects.all().only('id', 'name', 'icon'):
        cleaned = _clean(cat.name)
        if cleaned and cleaned != cat.name:
            cat.name = cleaned
            cat.icon = ''
            cat.save(update_fields=['name', 'icon'])


class Migration(migrations.Migration):

    dependencies = [
        ('complaints', '0007_complaint_media_upload_token'),
    ]

    operations = [
        migrations.RunPython(clean_categories, migrations.RunPython.noop),
    ]
