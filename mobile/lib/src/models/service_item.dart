class ServiceItem {
  const ServiceItem({required this.id, required this.name});

  final String id;
  final String name;

  factory ServiceItem.fromJson(Map<String, dynamic> json) {
    return ServiceItem(
      id: json['id'].toString(),
      name: (json['name'] as String?) ?? '',
    );
  }
}
