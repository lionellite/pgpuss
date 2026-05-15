class HistoryEntry {
  const HistoryEntry({
    required this.action,
    required this.timestamp,
    this.notes,
    this.actorName,
  });

  final String action;
  final DateTime? timestamp;
  final String? notes;
  final String? actorName;

  factory HistoryEntry.fromJson(Map<String, dynamic> json) {
    return HistoryEntry(
      action: (json['action'] as String?) ?? '',
      timestamp: DateTime.tryParse((json['timestamp'] as String?) ?? ''),
      notes: json['notes'] as String?,
      actorName: json['actor_name'] as String?,
    );
  }
}
