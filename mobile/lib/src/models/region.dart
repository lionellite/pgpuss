class Region {
  const Region({required this.id, required this.name});

  final String id;
  final String name;

  factory Region.fromJson(Map<String, dynamic> json) {
    return Region(
      id: json['id'].toString(),
      name: (json['name'] as String?) ?? '',
    );
  }
}
