"""Libellés de catégories affichés sans emoji, codes P1–P5 ni tirets décoratifs."""
import re

_EMOJI_RE = re.compile(
    r'[\U0001F300-\U0001F9FF\U0001FA00-\U0001FAFF\u2600-\u27BF]',
    flags=re.UNICODE,
)
_PREFIX_P_RE = re.compile(r'^\s*P\d+\s*[—–\-:]\s*', re.IGNORECASE)
_INLINE_P_RE = re.compile(r'\bP[1-5]\b\s*[—–\-:]?\s*', re.IGNORECASE)
_DASHES_RE = re.compile(r'\s*[—–\-]+\s*')
_SPACES_RE = re.compile(r'\s{2,}')


def clean_category_label(name: str) -> str:
    if not name:
        return ''
    s = _EMOJI_RE.sub('', name)
    s = _PREFIX_P_RE.sub('', s)
    s = _INLINE_P_RE.sub(' ', s)
    s = _DASHES_RE.sub(' ', s)
    s = _SPACES_RE.sub(' ', s).strip()
    return s
