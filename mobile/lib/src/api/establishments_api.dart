import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/establishment.dart';
import '../models/paginated.dart';
import '../models/region.dart';
import '../models/service_item.dart';
import 'dio_provider.dart';

final establishmentsApiProvider = Provider<EstablishmentsApi>((ref) {
  return EstablishmentsApi(ref.read(dioProvider));
});

class EstablishmentsApi {
  EstablishmentsApi(this._dio);

  final Dio _dio;

  Future<Paginated<EstablishmentItem>> list({String? regionId}) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/api/establishments/',
      queryParameters: regionId != null && regionId.isNotEmpty
          ? {'region': regionId}
          : null,
    );
    return Paginated.fromJson(
      res.data ?? const {},
      decode: EstablishmentItem.fromJson,
    );
  }

  Future<List<Region>> regions() async {
    final res = await _dio.get<dynamic>('/api/establishments/regions/');
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
        .map(Region.fromJson)
        .toList(growable: false);
  }

  Future<List<ServiceItem>> services(String establishmentId) async {
    final res = await _dio
        .get<dynamic>('/api/establishments/$establishmentId/services/');
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
        .map(ServiceItem.fromJson)
        .toList(growable: false);
  }
}
