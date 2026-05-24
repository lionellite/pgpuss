class EstablishmentItem {
  const EstablishmentItem({
    required this.id,
    required this.name,
    this.typeDisplay = '',
    this.regionId,
    this.regionName,
    this.address,
    this.phone,
    this.serviceCount = 0,
  });

  final String id;
  final String name;
  final String typeDisplay;
  final String? regionId;
  final String? regionName;
  final String? address;
  final String? phone;
  final int serviceCount;

  factory EstablishmentItem.fromJson(Map<String, dynamic> json) {
    return EstablishmentItem(
      id: json['id'].toString(),
      name: (json['name'] as String?) ?? '',
      typeDisplay: (json['type_display'] as String?) ?? '',
      regionId: json['region']?.toString(),
      regionName: json['region_name'] as String?,
      address: json['address'] as String?,
      phone: json['phone'] as String?,
      serviceCount: (json['service_count'] as int?) ?? 0,
    );
  }
}
