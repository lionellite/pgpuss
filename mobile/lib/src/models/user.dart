class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.fullName,
    required this.role,
    this.phone,
    this.establishmentName,
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String fullName;
  final String role;
  final String? phone;
  final String? establishmentName;
  final bool isActive;
  final DateTime? createdAt;

  bool get isAgent => const [
        'PFE',
        'AGENT_INTERNE',
        'DIRECTEUR_EST',
        'DDS',
        'DQSS',
        'CABINET',
        'ADMIN_PLATEFORME',
      ].contains(role);

  bool get isAdmin => role == 'ADMIN_PLATEFORME';

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'].toString(),
      email: (json['email'] as String?) ?? '',
      firstName: (json['first_name'] as String?) ?? '',
      lastName: (json['last_name'] as String?) ?? '',
      fullName: (json['full_name'] as String?) ??
          '${(json['first_name'] as String?) ?? ''} ${(json['last_name'] as String?) ?? ''}'
              .trim(),
      role: (json['role'] as String?) ?? 'USAGER',
      phone: json['phone'] as String?,
      establishmentName: json['establishment_name'] as String?,
      isActive: (json['is_active'] as bool?) ?? true,
      createdAt: DateTime.tryParse((json['created_at'] as String?) ?? ''),
    );
  }
}
