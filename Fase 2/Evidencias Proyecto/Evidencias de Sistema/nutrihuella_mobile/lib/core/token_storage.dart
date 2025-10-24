/// lib/core/token_storage.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const _key = 'auth_token';
  static const _storage = FlutterSecureStorage();

  static Future<void> writeToken(String token) => _storage.write(key: _key, value: token);
  static Future<String?> readToken() => _storage.read(key: _key);
  static Future<void> clear() => _storage.delete(key: _key);
}
