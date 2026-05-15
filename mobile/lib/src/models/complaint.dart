import 'history_entry.dart';

class ComplaintListItem {
  const ComplaintListItem({
    required this.id,
    required this.ticketNumber,
    required this.title,
    required this.status,
    required this.statusDisplay,
    required this.priority,
    required this.priorityDisplay,
    this.establishmentName,
    this.categoryName,
    this.channelDisplay,
    this.isOverdue = false,
    this.createdAt,
  });

  final String id;
  final String ticketNumber;
  final String title;
  final String status;
  final String statusDisplay;
  final String priority;
  final String priorityDisplay;
  final String? establishmentName;
  final String? categoryName;
  final String? channelDisplay;
  final bool isOverdue;
  final DateTime? createdAt;

  factory ComplaintListItem.fromJson(Map<String, dynamic> json) {
    return ComplaintListItem(
      id: json['id'].toString(),
      ticketNumber: (json['ticket_number'] as String?) ?? '',
      title: (json['title'] as String?) ?? '',
      status: (json['status'] as String?) ?? '',
      statusDisplay: (json['status_display'] as String?) ?? '',
      priority: (json['priority'] as String?) ?? '',
      priorityDisplay: (json['priority_display'] as String?) ?? '',
      establishmentName: json['establishment_name'] as String?,
      categoryName: json['category_name'] as String?,
      channelDisplay: json['channel_display'] as String?,
      isOverdue: (json['is_overdue'] as bool?) ?? false,
      createdAt: _dt(json['created_at']),
    );
  }
}

class ComplaintDetail {
  const ComplaintDetail({
    required this.id,
    required this.ticketNumber,
    required this.title,
    required this.description,
    required this.status,
    required this.statusDisplay,
    required this.priority,
    required this.priorityDisplay,
    this.establishmentName,
    this.serviceName,
    this.categoryName,
    this.channelDisplay,
    this.complainantDisplay,
    this.assignedToName,
    this.resolutionNotes,
    this.correctiveActions,
    this.voiceFileUrl,
    this.isOverdue = false,
    this.createdAt,
    this.history,
  });

  final String id;
  final String ticketNumber;
  final String title;
  final String description;
  final String status;
  final String statusDisplay;
  final String priority;
  final String priorityDisplay;
  final String? establishmentName;
  final String? serviceName;
  final String? categoryName;
  final String? channelDisplay;
  final String? complainantDisplay;
  final String? assignedToName;
  final String? resolutionNotes;
  final String? correctiveActions;
  final String? voiceFileUrl;
  final bool isOverdue;
  final DateTime? createdAt;
  final List<HistoryEntry>? history;

  factory ComplaintDetail.fromJson(Map<String, dynamic> json) {
    return ComplaintDetail(
      id: json['id'].toString(),
      ticketNumber: (json['ticket_number'] as String?) ?? '',
      title: (json['title'] as String?) ?? '',
      description: (json['description'] as String?) ?? '',
      status: (json['status'] as String?) ?? '',
      statusDisplay: (json['status_display'] as String?) ?? '',
      priority: (json['priority'] as String?) ?? '',
      priorityDisplay: (json['priority_display'] as String?) ?? '',
      establishmentName: json['establishment_name'] as String?,
      serviceName: json['service_name'] as String?,
      categoryName: json['category_name'] as String?,
      channelDisplay: json['channel_display'] as String?,
      complainantDisplay: json['complainant_display'] as String?,
      assignedToName: json['assigned_to_name'] as String?,
      resolutionNotes: json['resolution_notes'] as String?,
      correctiveActions: json['corrective_actions'] as String?,
      voiceFileUrl: json['voice_file_url'] as String?,
      isOverdue: (json['is_overdue'] as bool?) ?? false,
      createdAt: _dt(json['created_at']),
      history: (json['history'] as List?)
          ?.whereType<Map<String, dynamic>>()
          .map(HistoryEntry.fromJson)
          .toList(growable: false),
    );
  }
}

DateTime? _dt(Object? raw) {
  final s = raw as String?;
  if (s == null || s.isEmpty) return null;
  return DateTime.tryParse(s);
}
