class DashboardStats {
  const DashboardStats({
    required this.totalComplaints,
    required this.openComplaints,
    required this.resolvedComplaints,
    required this.overdueComplaints,
    required this.avgResolutionTime,
    required this.satisfactionAvg,
    this.complaintsByStatus,
    this.complaintsByPriority,
    this.complaintsByCategory,
    this.complaintsByChannel,
    this.complaintsByEstablishment,
    this.complaintsByMonth,
    this.recentComplaints,
  });

  final int totalComplaints;
  final int openComplaints;
  final int resolvedComplaints;
  final int overdueComplaints;
  final double avgResolutionTime;
  final double satisfactionAvg;
  final Map<String, int>? complaintsByStatus;
  final Map<String, int>? complaintsByPriority;
  final List<Map<String, dynamic>>? complaintsByCategory;
  final Map<String, int>? complaintsByChannel;
  final List<Map<String, dynamic>>? complaintsByEstablishment;
  final List<Map<String, dynamic>>? complaintsByMonth;
  final List<Map<String, dynamic>>? recentComplaints;

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalComplaints: (json['total_complaints'] as int?) ?? 0,
      openComplaints: (json['open_complaints'] as int?) ?? 0,
      resolvedComplaints: (json['resolved_complaints'] as int?) ?? 0,
      overdueComplaints: (json['overdue_complaints'] as int?) ?? 0,
      avgResolutionTime:
          (json['avg_resolution_time'] as num?)?.toDouble() ?? 0,
      satisfactionAvg: (json['satisfaction_avg'] as num?)?.toDouble() ?? 0,
      complaintsByStatus: _intMap(json['complaints_by_status']),
      complaintsByPriority: _intMap(json['complaints_by_priority']),
      complaintsByCategory: _listMap(json['complaints_by_category']),
      complaintsByChannel: _intMap(json['complaints_by_channel']),
      complaintsByEstablishment:
          _listMap(json['complaints_by_establishment']),
      complaintsByMonth: _listMap(json['complaints_by_month']),
      recentComplaints: _listMap(json['recent_complaints']),
    );
  }
}

Map<String, int>? _intMap(Object? raw) {
  if (raw is! Map) return null;
  return raw.map((k, v) => MapEntry(k.toString(), (v as num?)?.toInt() ?? 0));
}

List<Map<String, dynamic>>? _listMap(Object? raw) {
  if (raw is! List) return null;
  return raw.whereType<Map<String, dynamic>>().toList(growable: false);
}
