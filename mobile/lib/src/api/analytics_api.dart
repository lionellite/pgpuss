import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/dashboard_stats.dart';
import 'dio_provider.dart';

final analyticsApiProvider = Provider<AnalyticsApi>((ref) {
  return AnalyticsApi(ref.read(dioProvider));
});

class AnalyticsApi {
  AnalyticsApi(this._dio);

  final Dio _dio;

  Future<DashboardStats> dashboard() async {
    final res =
        await _dio.get<Map<String, dynamic>>('/api/analytics/dashboard/');
    return DashboardStats.fromJson(res.data ?? const {});
  }

  Future<void> submitSatisfaction({
    required String complaintId,
    required int rating,
    String? comment,
  }) async {
    await _dio.post('/api/analytics/satisfaction/', data: {
      'complaint': complaintId,
      'rating': rating,
      if (comment != null && comment.isNotEmpty) 'comment': comment,
    });
  }
}
