/// lib/features/auth/auth_repository.dart
import 'package:dio/dio.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../core/api_client.dart';
import '../../core/env.dart';
import '../../core/token_storage.dart';
import 'auth_models.dart';

class AuthRepository {
  final Dio _dio;
  AuthRepository(this._dio);

  Future<void> login(String email, String password) async {
    final res = await _dio.post(ApiPaths.authLogin, data: {'email': email, 'password': password});
    final token = res.data['token'] as String;
    await TokenStorage.writeToken(token);
  }

  Future<void> register(String email, String password, {String? name}) async {
    final res = await _dio.post(ApiPaths.authRegister, data: {'email': email, 'password': password, 'name': name});
    final token = res.data['token'] as String;
    await TokenStorage.writeToken(token);
  }

  Future<void> loginWithGoogle() async {
    final gsi = GoogleSignIn(scopes: ['email', 'profile']);
    final acc = await gsi.signIn();
    if (acc == null) throw Exception('Inicio de sesión cancelado');
    final auth = await acc.authentication;
    final idToken = auth.idToken;
    if (idToken == null) throw Exception('No se pudo obtener idToken de Google');
    final res = await _dio.post(ApiPaths.authGoogle, data: {'idToken': idToken});
    final token = res.data['token'] as String;
    await TokenStorage.writeToken(token);
  }

  Future<UserMe> me() async {
    final res = await _dio.get(ApiPaths.authMe);
    return UserMe.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> logout() async {
    await TokenStorage.clear();
    try { final gsi = GoogleSignIn(); await gsi.disconnect(); } catch (_) {}
  }

  static Future<AuthRepository> create() async {
    final api = await ApiClient.create();
    return AuthRepository(api.dio);
  }
}
