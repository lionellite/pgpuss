import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config.dart';
import '../state/auth_controller.dart';
import 'token_storage.dart';

final dioProvider = Provider<Dio>((ref) {
  final auth = ref.watch(authControllerProvider);

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
        final token = auth.session?.accessToken;
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401 &&
            !(error.requestOptions.extra['_retry'] == true)) {
          error.requestOptions.extra['_retry'] = true;
          final storage = ref.read(tokenStorageProvider);
          final pair = await storage.read();
          if (pair != null) {
            try {
              final refreshDio = Dio(BaseOptions(
                baseUrl: AppConfig.apiBaseUrl,
                headers: {'Accept': 'application/json'},
              ));
              final res =
                  await refreshDio.post<Map<String, dynamic>>(
                '/api/auth/refresh/',
                data: {'refresh': pair.refreshToken},
              );
              final newAccess = res.data?['access'] as String?;
              if (newAccess != null) {
                await storage.write(pair.copyWith(accessToken: newAccess));
                error.requestOptions.headers['Authorization'] =
                    'Bearer $newAccess';
                final retryRes = await dio.fetch(error.requestOptions);
                return handler.resolve(retryRes);
              }
            } catch (_) {
              await storage.clear();
              ref.read(authControllerProvider.notifier).forceLogout();
            }
          }
        }
        handler.next(error);
      },
    ),
  );

  return dio;
});
