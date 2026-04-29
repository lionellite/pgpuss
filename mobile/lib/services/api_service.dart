import 'package:dio/dio.dart';
import 'package:FlutterSecureStorage/FlutterSecureStorage.dart';

class ApiService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://10.0.2.2:8000/api', // Remplacer par l'IP réelle en test physique
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  final _storage = const FlutterSecureStorage();

  ApiService() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          // Logique de refresh token à implémenter ici
        }
        return handler.next(e);
      },
    ));
  }

  Future<Response> login(String email, String password) async {
    final response = await _dio.post('/auth/login/', data: {
      'email': email,
      'password': password,
    });
    if (response.statusCode == 200) {
      await _storage.write(key: 'access_token', value: response.data['access']);
      await _storage.write(key: 'refresh_token', value: response.data['refresh']);
    }
    return response;
  }

  Future<Response> getMyComplaints() async {
    return await _dio.get('/complaints/mobile/my-complaints/');
  }

  Future<Response> submitComplaint(Map<String, dynamic> data) async {
    return await _dio.post('/complaints/create/', data: data);
  }

  Future<Response> trackComplaint(String ticket) async {
    return await _dio.get('/complaints/track/$ticket/');
  }
}
