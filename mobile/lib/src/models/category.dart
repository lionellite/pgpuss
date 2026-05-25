class Category {
  const Category({
    required this.id,
    required this.name,
    this.icon = '',
    this.displayNameOverride,
  });

  final String id;
  final String name;
  final String icon;
  final String? displayNameOverride;

  factory Category.fromJson(Map<String, dynamic> json) {
    final name = (json['name'] as String?) ?? '';
    final fromApi = json['display_name'] as String?;
    return Category(
      id: json['id'].toString(),
      name: name,
      displayNameOverride: (fromApi != null && fromApi.isNotEmpty)
          ? fromApi
          : _cleanLabel(name),
    );
  }

  /// Libellé affiché sans emoji, P1…P5 ni tirets décoratifs.
  String get displayName => displayNameOverride ?? _cleanLabel(name);

  static String _cleanLabel(String raw) {
    var label = raw;
    label = label.replaceAll(
      RegExp(r'[\u{1F300}-\u{1F9FF}\u2600-\u27BF]', unicode: true),
      '',
    );
    label = label.replaceAll(
      RegExp(r'^\s*P\d+\s*[—–\-:]\s*', caseSensitive: false),
      '',
    );
    label = label.replaceAll(
      RegExp(r'\bP[1-5]\b\s*[—–\-:]?\s*', caseSensitive: false),
      ' ',
    );
    label = label.replaceAll(RegExp(r'\s*[—–\-]+\s*'), ' ');
    return label.replaceAll(RegExp(r'\s{2,}'), ' ').trim();
  }
}
