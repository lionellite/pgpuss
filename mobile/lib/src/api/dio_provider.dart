import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config.dart';
import '../state/auth_controller.dart';
import 'token_storage.dart';

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.read(tokenStorageProvider);
  final authNotifier = ref.read(authControllerProvider.notifier);

  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: {
        'Accept': 'application/json',
      },
    ),
  );

  dio.interceptors.add(LogInterceptor(
    requestHeader: true,
    requestBody: true,
    responseBody: true,
    error: true,
  ));

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final session = ref.read(authControllerProvider).session;
        if (session != null) {
          options.headers['Authorization'] = 'Bearer ${session.accessToken}';
        } else {
          options.headers.remove('Authorization');
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode != 401 ||
            error.requestOptions.extra['_retry'] == true) {
          handler.next(error);
          return;
        }

        error.requestOptions.extra['_retry'] = true;
        final pair = await storage.read();
        if (pair == null) {
          handler.next(error);
          return;
        }

        try {
          final refreshDio = Dio(
            BaseOptions(
              baseUrl: AppConfig.apiBaseUrl,
              headers: {'Accept': 'application/json'},
            ),
          );
          final res = await refreshDio.post<Map<String, dynamic>>(
            '/api/auth/refresh/',
            data: {'refresh': pair.refreshToken},
          );
          final newAccess = res.data?['access'] as String?;
          if (newAccess != null && newAccess.isNotEmpty) {
            await storage.write(pair.copyWith(accessToken: newAccess));
            authNotifier.updateAccessToken(newAccess);
            error.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
            final retryRes = await dio.fetch(error.requestOptions);
            handler.resolve(retryRes);
            return;
          }
        } catch (_) {
          await storage.clear();
          authNotifier.forceLogout();
        }

        handler.next(error);
      },
    ),
  );

  return dio;
});
