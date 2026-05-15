class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.type = '',
    this.complaintId,
    this.complaintTicket,
  });

  final String id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final DateTime? createdAt;
  final String? complaintId;
  final String? complaintTicket;

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'].toString(),
      title: (json['title'] as String?) ?? '',
      message: (json['message'] as String?) ?? '',
      type: (json['type'] as String?) ?? '',
      isRead: (json['is_read'] as bool?) ?? false,
      createdAt: DateTime.tryParse((json['created_at'] as String?) ?? ''),
      complaintId: json['complaint']?.toString(),
      complaintTicket: json['complaint_ticket'] as String?,
    );
  }
}
