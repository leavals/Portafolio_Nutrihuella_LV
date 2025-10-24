// lib/core/api_client.dart
//
// Cliente HTTP centralizado con Dio.
// Cambio puntual:
// - Aumentamos los timeouts por defecto para soportar requests largos
//   (p. ej. generación de recetas con IA). En particular, receiveTimeout pasa
//   de 20s a 180s y añadimos sendTimeout en 180s. connectTimeout queda en 20s.
//
// Nota: En llamadas que requieran todavía más tiempo, cada request puede
//       sobreescribir estos valores desde Options(...) (ver RecipeService).

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Lee el backend desde --dart-define=API_BASE_URL
/// ej.: flutter run ... --dart-define=API_BASE_URL=http://localhost:4000
const String _apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:4000',
);

class ApiClient {
  ApiClient._(this.dio);

  final Dio dio;

  static const _kTokenKey = 'auth_token';
  static const _storage = FlutterSecureStorage();

  /// Crea un Dio configurado con baseUrl y que agrega Authorization (Bearer)
  /// solo en rutas que NO son de autenticación.
  static Future<ApiClient> create() async {
    final dio = Dio(
      BaseOptions(
        baseUrl: _apiBaseUrl,
        // Mantén un connectTimeout razonable (20s).
        connectTimeout: const Duration(seconds: 20),
        // Envío/recepción más holgados para generación con IA:
        sendTimeout: const Duration(seconds: 180),
        receiveTimeout: const Duration(seconds: 180),
        headers: {'Content-Type': 'application/json'},
        // Dejamos que el caller maneje 4xx:
        validateStatus: (code) => code != null && code < 500,
      ),
    );

    // Interceptor para adjuntar (o quitar) el token en cada request.
    dio.interceptors.add(
      InterceptorsWrapper(onRequest: (options, handler) async {
        final p = options.path; // puede ser relativo (/api/...) o absoluto (http...)

        // No adjuntar Authorization en endpoints de auth:
        final isAuthRoute = p.endsWith('/api/auth/login') ||
            p.endsWith('/api/auth/register') ||
            p.endsWith('/api/auth/google');

        if (isAuthRoute) {
          options.headers.remove('Authorization');
          return handler.next(options);
        }

        final token = await _storage.read(key: _kTokenKey);
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        } else {
          options.headers.remove('Authorization');
        }
        handler.next(options);
      }),
    );

    return ApiClient._(dio);
  }

  /// Helpers opcionales por si usas la instancia directa.
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) =>
      dio.get<T>(path, queryParameters: queryParameters, options: options);

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) =>
      dio.post<T>(path, data: data, queryParameters: queryParameters, options: options);

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) =>
      dio.put<T>(path, data: data, queryParameters: queryParameters, options: options);

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) =>
      dio.patch<T>(path, data: data, queryParameters: queryParameters, options: options);

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) =>
      dio.delete<T>(path, data: data, queryParameters: queryParameters, options: options);

  /// Guardado / limpieza de token.
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _kTokenKey, value: token);
  }

  static Future<void> clearToken() async {
    await _storage.delete(key: _kTokenKey);
  }
}

/// Extensiones para que un Future<ApiClient> tenga .get/.post/etc.
/// Permite seguir usando:
///   final dio = ApiClient.create();
///   final res = await dio.get('/ruta');
extension ApiClientFutureHttp on Future<ApiClient> {
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final api = await this;
    return api.get<T>(path, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final api = await this;
    return api.post<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final api = await this;
    return api.put<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final api = await this;
    return api.patch<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final api = await this;
    return api.delete<T>(path, data: data, queryParameters: queryParameters, options: options);
  }
}
