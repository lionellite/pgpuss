import 'history_entry.dart';

class TrackResult {
  const TrackResult({
    required this.ticketNumber,
    required this.title,
    required this.status,
    required this.statusDisplay,
    required this.priority,
    required this.priorityDisplay,
    this.establishmentName,
    this.establishmentAddress,
    this.categoryName,
    this.description,
    this.createdAt,
    this.updatedAt,
    this.timeline,
  });

  final String ticketNumber;
  final String title;
  final String status;
  final String statusDisplay;
  final String priority;
  final String priorityDisplay;
  final String? establishmentName;
  final String? establishmentAddress;
  final String? categoryName;
  final String? description;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final List<HistoryEntry>? timeline;

  factory TrackResult.fromJson(Map<String, dynamic> json) {
    return TrackResult(
      ticketNumber: (json['ticket_number'] as String?) ?? '',
      title: (json['title'] as String?) ?? '',
      status: (json['status'] as String?) ?? '',
      statusDisplay: (json['status_display'] as String?) ?? '',
      priority: (json['priority'] as String?) ?? '',
      priorityDisplay: (json['priority_display'] as String?) ?? '',
      establishmentName: json['establishment_name'] as String?,
      establishmentAddress: json['establishment_address'] as String?,
      categoryName: json['category_name'] as String?,
      description: json['description'] as String?,
      createdAt: DateTime.tryParse((json['created_at'] as String?) ?? ''),
      updatedAt: DateTime.tryParse((json['updated_at'] as String?) ?? ''),
      timeline: (json['timeline'] as List?)
          ?.whereType<Map<String, dynamic>>()
          .map(HistoryEntry.fromJson)
          .toList(growable: false),
    );
  }
}
