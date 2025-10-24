// lib/features/recipes/recipe_service.dart
//
// Servicio para generación de recetas con IA y manejo de favoritos.
// Correcciones:
// - Se actualiza la clave 'type' → 'planType' para mantener compatibilidad con backend y versión web.
// - Se conserva la selección del tipo de plan elegida por el usuario (desayuno, almuerzo, cena, etc.).
// - Lógica de favoritos intacta, sin dependencias UI.

import 'package:dio/dio.dart';
import '../../core/api_client.dart';
import '../../core/env.dart';

/// Tipos de generación disponibles.
enum RecipePlanKind {
  desayuno,
  almuerzo,
  cena,
  planDiario,
  planSemanal,
}

/// Serialización para el backend.
String recipePlanKindToApi(RecipePlanKind k) {
  switch (k) {
    case RecipePlanKind.desayuno:
      return 'breakfast';
    case RecipePlanKind.almuerzo:
      return 'lunch';
    case RecipePlanKind.cena:
      return 'dinner';
    case RecipePlanKind.planDiario:
      return 'daily';
    case RecipePlanKind.planSemanal:
      return 'weekly';
  }
}

/// Información estandarizada de rate limit.
class RateLimitInfo {
  final int? limit;
  final int? remaining;
  final DateTime? reset;

  const RateLimitInfo({this.limit, this.remaining, this.reset});
}

/// Excepción específica cuando se alcanza el límite de generación.
class RecipeLimitException implements Exception {
  final String message;
  final RateLimitInfo info;
  RecipeLimitException(this.message, this.info);

  @override
  String toString() => message;
}

/// Servicio principal de recetas y favoritos.
class RecipeService {
  final Future<ApiClient> _api = ApiClient.create();

  /// Carga mascotas para el selector (sólo id y nombre).
  Future<List<Map<String, dynamic>>> loadPets() async {
    final res = await _api.get<List>(Env.api(ApiPaths.pets));
    if (res.statusCode == 200 && res.data is List) {
      return (res.data as List)
          .whereType<Map>()
          .map((e) => {
                'id': e['id']?.toString(),
                'name': (e['name'] ?? '').toString(),
              })
          .toList()
          .cast<Map<String, dynamic>>();
    }
    throw Exception('No se pudieron cargar las mascotas (HTTP ${res.statusCode}).');
  }

  /// Genera una receta usando IA.
  Future<Map<String, dynamic>> generateRecipe({
    required String petId,
    String? prompt,
    bool usePantry = true,
    RecipePlanKind plan = RecipePlanKind.almuerzo,
  }) async {
    final body = <String, dynamic>{
      'petId': petId,
      if (prompt != null && prompt.trim().isNotEmpty) 'prompt': prompt.trim(),
      'usePantry': usePantry,
      // Clave actualizada para compatibilidad con backend y versión web.
      'planType': recipePlanKindToApi(plan),
    };

    final res = await _api.post<Map<String, dynamic>>(
      Env.api(ApiPaths.recipesGenerate),
      data: body,
      options: Options(
        validateStatus: (c) => c != null && c < 500,
        sendTimeout: const Duration(seconds: 150),
        receiveTimeout: const Duration(seconds: 150),
      ),
    );

    if (res.statusCode == 200 && res.data != null) {
      return res.data!;
    }

    if (res.statusCode == 429) {
      int? limit;
      int? remaining;
      DateTime? resetAt;

      if (res.data is Map) {
        final m = res.data as Map;
        if (m['limit'] != null) limit = int.tryParse(m['limit'].toString());
        if (m['remaining'] != null) remaining = int.tryParse(m['remaining'].toString());
        if (m['resetAt'] != null) {
          try {
            resetAt = DateTime.parse(m['resetAt'].toString()).toLocal();
          } catch (_) {}
        }
        if (m['reset'] != null && resetAt == null) {
          try {
            resetAt = DateTime.parse(m['reset'].toString()).toLocal();
          } catch (_) {}
        }
        if (m['resetSeconds'] != null && resetAt == null) {
          final secs = int.tryParse(m['resetSeconds'].toString());
          if (secs != null) {
            resetAt = DateTime.now().toLocal().add(Duration(seconds: secs));
          }
        }
      }

      final h = res.headers.map.map(
        (k, v) => MapEntry(k.toLowerCase(), v.join(',')),
      );
      limit ??= int.tryParse(h['x-ratelimit-limit'] ?? '');
      remaining ??= int.tryParse(h['x-ratelimit-remaining'] ?? '');
      if (resetAt == null && h['x-ratelimit-reset'] != null) {
        final val = int.tryParse(h['x-ratelimit-reset']!);
        if (val != null) {
          resetAt =
              DateTime.fromMillisecondsSinceEpoch(val * 1000, isUtc: true).toLocal();
        }
      }

      throw RecipeLimitException(
        'Límite alcanzado.',
        RateLimitInfo(limit: limit, remaining: remaining, reset: resetAt),
      );
    }

    final msg = res.data is Map && (res.data as Map)['message'] != null
        ? (res.data as Map)['message'].toString()
        : 'Error ${res.statusCode} al generar la receta.';
    throw Exception(msg);
  }

  /// Guarda en favoritos la receta generada.
  Future<void> saveFavorite(Map<String, dynamic> recipe) async {
    final res = await _api.post(
      Env.api(ApiPaths.recipesFavorites),
      data: recipe,
      options: Options(validateStatus: (c) => c != null && c < 500),
    );

    if (res.statusCode != 200 && res.statusCode != 201) {
      final msg = res.data is Map && (res.data as Map)['message'] != null
          ? (res.data as Map)['message'].toString()
          : 'No se pudo guardar (HTTP ${res.statusCode}).';
      throw Exception(msg);
    }
  }

  /// Obtiene todas las recetas guardadas como favoritas.
  Future<List<Map<String, dynamic>>> favorites() async {
    final res = await _api.get<List>(Env.api(ApiPaths.recipesFavorites));
    if (res.statusCode == 200 && res.data is List) {
      return (res.data as List)
          .whereType<Map>()
          .map((e) => e.map((k, v) => MapEntry(k.toString(), v)))
          .toList()
          .cast<Map<String, dynamic>>();
    }
    throw Exception('Error ${res.statusCode} al cargar favoritos.');
  }

  /// Elimina una receta de favoritos por ID.
  Future<void> removeFavorite(dynamic id) async {
    final url = Env.api('${ApiPaths.recipesFavorites}/$id');
    final res = await _api.delete(url,
        options: Options(validateStatus: (c) => c != null && c < 500));
    if (res.statusCode != 200 && res.statusCode != 204) {
      throw Exception('No se pudo eliminar el favorito (HTTP ${res.statusCode}).');
    }
  }
}
