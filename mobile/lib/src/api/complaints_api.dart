import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/category.dart';
import '../models/complaint.dart';
import '../models/paginated.dart';
import '../models/track_result.dart';
import 'dio_provider.dart';

final complaintsApiProvider = Provider<ComplaintsApi>((ref) {
  return ComplaintsApi(ref.read(dioProvider));
});

class ComplaintsApi {
  ComplaintsApi(this._dio);

  final Dio _dio;

  Future<Paginated<ComplaintListItem>> list({
    int page = 1,
    String? search,
    String? status,
    String? priority,
    String? channel,
    int pageSize = 20,
  }) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/api/complaints/',
      queryParameters: {
        'page': page,
        'page_size': pageSize,
        if (search != null && search.isNotEmpty) 'search': search,
        if (status != null && status.isNotEmpty) 'status': status,
        if (priority != null && priority.isNotEmpty) 'priority': priority,
        if (channel != null && channel.isNotEmpty) 'channel': channel,
      },
    );
    return Paginated.fromJson(
      res.data ?? const {},
      decode: ComplaintListItem.fromJson,
    );
  }

  Future<ComplaintDetail> getDetail(String id) async {
    final res =
        await _dio.get<Map<String, dynamic>>('/api/complaints/$id/');
    return ComplaintDetail.fromJson(res.data ?? const {});
  }

  Future<TrackResult> track(String ticket) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/api/complaints/track/$ticket/',
    );
    return TrackResult.fromJson(res.data ?? const {});
  }

  Future<void> requestTrackAccessCode(String ticket) =>
      _dio.post('/api/complaints/track/$ticket/request-access-code/');

  Future<void> verifyTrackAccessCode(String ticket, String code) =>
      _dio.post('/api/complaints/track/$ticket/verify-access-code/', data: {'code': code});

  Future<void> provideTrackInfo(
    String ticket, {
    required String code,
    required String info,
    FormData? attachments,
  }) async {
    final data = attachments ?? FormData();
    data.fields.add(MapEntry('code', code));
    data.fields.add(MapEntry('info', info));
    await _dio.post('/api/complaints/track/$ticket/provide-info/', data: data);
  }

  Future<List<Category>> categories() async {
    final res = await _dio.get<dynamic>('/api/complaints/categories/');
    final data = res.data;
    List raw;
    if (data is Map<String, dynamic>) {
      raw = (data['results'] as List?) ?? [];
    } else if (data is List) {
      raw = data;
    } else {
      raw = [];
    }
    return raw
        .whereType<Map<String, dynamic>>()
        .map(Category.fromJson)
        .toList(growable: false);
  }

  /// Création JSON (rapide, compatible Vercel).
  Future<Map<String, dynamic>> createJson(Map<String, dynamic> body) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/api/complaints/create/',
      data: body,
    );
    return res.data ?? {};
  }

  /// Envoi d'un média après création (vocal ou pièce jointe, un fichier par appel).
  Future<void> uploadDepositMedia({
    required String complaintId,
    required String uploadToken,
    required FormData formData,
  }) async {
    formData.fields.add(MapEntry('upload_token', uploadToken));
    await _dio.post<void>(
      '/api/complaints/$complaintId/deposit-media/',
      data: formData,
    );
  }

  // ── Workflow actions ──────────────────────────────────────

  Future<void> acknowledge(String id) =>
      _dio.post('/api/complaints/$id/acknowledge/');

  Future<void> requestInfo(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/request-info/', data: data);

  Future<void> provideInfo(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/provide-info/', data: data);

  Future<void> qualify(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/qualify/', data: data);

  Future<void> assign(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/assign/', data: data);

  Future<void> acceptAssignment(String id,
          [Map<String, dynamic>? data]) =>
      _dio.post('/api/complaints/$id/accept-assignment/', data: data);

  Future<void> refuseAssignment(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/refuse-assignment/', data: data);

  Future<void> startInvestigation(String id) =>
      _dio.post('/api/complaints/$id/start-investigation/');

  Future<void> investigationLog(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/investigation-log/', data: data);

  Future<void> requestExtension(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/request-extension/', data: data);

  Future<void> resolve(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/resolve/', data: data);

  Future<void> acknowledgeResolution(
          String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/ack-resolution/', data: data);

  Future<void> validateResolution(
          String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/validate-resolution/', data: data);

  Future<void> rejectResolution(
          String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/reject-resolution/', data: data);

  Future<void> escalate(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/escalate/', data: data);

  Future<void> ddsAssignInspector(
          String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/dds-assign-inspector/', data: data);

  Future<void> ddsInvestigation(
          String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/dds-investigation/', data: data);

  Future<void> notifyParties(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/notify-parties/', data: data);

  Future<void> arbitrate(String id, Map<String, dynamic> data) =>
      _dio.post('/api/complaints/$id/arbitrate/', data: data);

  Future<void> close(String id, [Map<String, dynamic>? data]) =>
      _dio.post('/api/complaints/$id/close/', data: data);

  Future<void> withdraw(String id, [Map<String, dynamic>? data]) =>
      _dio.post('/api/complaints/$id/withdraw/', data: data);

  Future<void> reopen(String id, [Map<String, dynamic>? data]) =>
      _dio.post('/api/complaints/$id/reopen/', data: data);
}
