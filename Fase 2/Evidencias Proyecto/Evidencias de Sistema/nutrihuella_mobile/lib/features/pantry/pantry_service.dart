// lib/features/pantry/pantry_service.dart
//
// Capa de servicio para la Despensa. Centraliza las llamadas a /api/pantry.
// Mantiene los nombres y paths definidos en Env.ApiPaths.

import 'package:dio/dio.dart';

import '../../core/api_client.dart';
import '../../core/env.dart';

class PantryService {
  PantryService();

  /// Obtiene todos los ítems de la despensa del usuario.
  Future<List<Map<String, dynamic>>> fetchAll() async {
    final api = await ApiClient.create();
    final res = await api.get<List<dynamic>>(ApiPaths.pantry);

    final raw = res.data ?? const [];
    // Normaliza a List<Map<String, dynamic>>
    return raw
        .map((e) => (e as Map).map((k, v) => MapEntry(k.toString(), v)))
        .cast<Map<String, dynamic>>()
        .toList();
  }

  /// Crea un ítem de despensa.
  ///
  /// Los campos más comunes en el backend suelen ser:
  /// - name (String)         - requerido
  /// - quantity (num)        - opcional
  /// - unit (String)         - opcional
  /// - brand (String)        - opcional
  /// - note (String)         - opcional
  /// - expiresAt (String ISO) - opcional
  ///
  /// Si tu backend usa otras claves, puedes mapearlas antes del POST.
  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async {
    final api = await ApiClient.create();

    final Response res = await api.post(
      ApiPaths.pantry,
      data: body,
      options: Options(headers: {'Content-Type': 'application/json'}),
    );

    final data = (res.data as Map?) ?? const {};
    return data.map((k, v) => MapEntry(k.toString(), v));
  }
}
