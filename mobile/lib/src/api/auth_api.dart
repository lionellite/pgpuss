import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/login_result.dart';
import '../models/user.dart';
import 'dio_provider.dart';

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.read(dioProvider));
});

class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  /// Connexion email ou téléphone — aligné sur `/api/auth/login/phone/`.
  Future<LoginResult> loginWithCredentials({
    required String username,
    required String password,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/api/auth/login/phone/',
      data: {
        'username': username.trim(),
        'password': password,
      },
    );
    return LoginResult.fromJson(res.data ?? const {});
  }

  Future<void> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
  }) async {
    await _dio.post('/api/auth/register/', data: {
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'password': password,
      'password_confirm': password,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
    });
  }

  Future<AppUser> me({String? accessToken}) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/api/auth/me/',
      options: accessToken != null
          ? Options(headers: {'Authorization': 'Bearer $accessToken'})
          : null,
    );
    return AppUser.fromJson(res.data ?? const {});
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    await _dio.patch('/api/auth/me/', data: data);
  }

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    await _dio.post('/api/auth/change-password/', data: {
      'old_password': oldPassword,
      'new_password': newPassword,
    });
  }
}
