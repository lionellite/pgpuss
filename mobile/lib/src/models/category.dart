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
      icon: (json['icon'] as String?) ?? '📋',
    );
  }
}
