import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/analytics_api.dart';
import '../api/auth_api.dart';
import '../api/establishments_api.dart';
import '../api/notifications_api.dart';
import '../models/dashboard_stats.dart';
import '../models/establishment.dart';
import '../models/notification_item.dart';
import '../models/paginated.dart';
import '../models/region.dart';
import '../models/user.dart';

final notificationsProvider =
    FutureProvider<Paginated<NotificationItem>>((ref) {
  return ref.read(notificationsApiProvider).list();
});

final unreadCountProvider = FutureProvider<int>((ref) {
  return ref.read(notificationsApiProvider).unreadCount();
});

final establishmentsProvider =
    FutureProvider<Paginated<EstablishmentItem>>((ref) {
  return ref.read(establishmentsApiProvider).list();
});

final regionsProvider = FutureProvider<List<Region>>((ref) {
  return ref.read(establishmentsApiProvider).regions();
});

final dashboardProvider = FutureProvider<DashboardStats>((ref) {
  return ref.read(analyticsApiProvider).dashboard();
});

final usersProvider = FutureProvider.family<List<AppUser>,
    Map<String, String?>>((ref, params) {
  return ref.read(authApiProvider).listUsers(
        search: params['search'],
        role: params['role'],
      );
});
