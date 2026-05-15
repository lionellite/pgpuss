class EstablishmentItem {
  const EstablishmentItem({
    required this.id,
    required this.name,
    this.typeDisplay = '',
    this.regionName,
    this.address,
    this.phone,
    this.serviceCount = 0,
  });

  final String id;
  final String name;
  final String typeDisplay;
  final String? regionName;
  final String? address;
  final String? phone;
  final int serviceCount;

  factory EstablishmentItem.fromJson(Map<String, dynamic> json) {
    return EstablishmentItem(
      id: json['id'].toString(),
      name: (json['name'] as String?) ?? '',
      typeDisplay: (json['type_display'] as String?) ?? '',
      regionName: json['region_name'] as String?,
      address: json['address'] as String?,
      phone: json['phone'] as String?,
      serviceCount: (json['service_count'] as int?) ?? 0,
    );
  }
}
