class Category {
  const Category({
    required this.id,
    required this.name,
    required this.icon,
  });

  final String id;
  final String name;
  final String icon;

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'].toString(),
      name: (json['name'] as String?) ?? '',
      icon: (json['icon'] as String?) ?? '',
    );
  }

  /// Libellé affiché sans emoji ni codes de priorité internes (P1…P5).
  String get displayName {
    var label = name;
    label = label.replaceAll(RegExp(r'[\u{1F300}-\u{1F9FF}]', unicode: true), '');
    label = label.replaceAll(RegExp(r'\bP[1-5]\b', caseSensitive: false), '');
    return label.replaceAll(RegExp(r'\s{2,}'), ' ').trim();
  }
}
