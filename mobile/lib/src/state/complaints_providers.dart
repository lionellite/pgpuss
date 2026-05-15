import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/complaints_api.dart';
import '../models/complaint.dart';
import '../models/paginated.dart';

final complaintsPageProvider = FutureProvider.family<
    Paginated<ComplaintListItem>, Map<String, dynamic>>((ref, params) async {
  return ref.read(complaintsApiProvider).list(
        page: (params['page'] as int?) ?? 1,
        search: params['search'] as String?,
        status: params['status'] as String?,
        priority: params['priority'] as String?,
        channel: params['channel'] as String?,
      );
});

final complaintDetailProvider =
    FutureProvider.family<ComplaintDetail, String>((ref, id) async {
  return ref.read(complaintsApiProvider).getDetail(id);
});

final categoriesProvider = FutureProvider((ref) async {
  return ref.read(complaintsApiProvider).categories();
});
