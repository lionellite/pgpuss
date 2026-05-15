import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/notification_item.dart';
import '../models/paginated.dart';
import 'dio_provider.dart';

final notificationsApiProvider = Provider<NotificationsApi>((ref) {
  return NotificationsApi(ref.read(dioProvider));
});

class NotificationsApi {
  NotificationsApi(this._dio);

  final Dio _dio;

  Future<Paginated<NotificationItem>> list() async {
    final res = await _dio.get<Map<String, dynamic>>('/api/notifications/');
    return Paginated.fromJson(
      res.data ?? const {},
      decode: NotificationItem.fromJson,
    );
  }

  Future<int> unreadCount() async {
    final res = await _dio
        .get<Map<String, dynamic>>('/api/notifications/unread-count/');
    return (res.data?['unread_count'] as int?) ?? 0;
  }

  Future<void> markRead(String id) async {
    await _dio.post('/api/notifications/$id/read/');
  }

  Future<void> markAllRead() async {
    await _dio.post('/api/notifications/read-all/');
  }
}
