/// lib/core/env.dart
/// Configuración centralizada de entorno + paths REST.
/// - Usa `--dart-define=API_BASE_URL=http://localhost:4000` en Web.
/// - En Android emulador el valor por defecto usa 10.0.2.2.

class Env {
  /// Base URL del backend (sin barra final).
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000',
  );

  /// Helper para componer URLs absolutas.
  static String api(String path) => '$apiBaseUrl$path';
}

/// Endpoints del backend (sin baseUrl).
class ApiPaths {
  // ---- Auth
  static const String authLogin    = '/api/auth/login';
  static const String authRegister = '/api/auth/register';
  static const String authGoogle   = '/api/auth/google';
  static const String authMe       = '/api/auth/me';

  // ---- Pets
  static const String pets = '/api/pets';
  static String petById(String id) => '/api/pets/$id';

  // Clínico
  static String petClinical(String id) => '/api/pets/$id/clinical';
  static String petDiseases(String id) => '/api/pets/$id/clinical/diseases';
  static String petDisease(String id, String diseaseId) =>
      '/api/pets/$id/clinical/diseases/$diseaseId';
  static String petVaccinations(String id) =>
      '/api/pets/$id/clinical/vaccinations';
  static String petVaccination(String id, String vaccineId) =>
      '/api/pets/$id/clinical/vaccinations/$vaccineId';
  static String petWeights(String id) => '/api/pets/$id/clinical/weights';
  static String petWeight(String id, String weightId) =>
      '/api/pets/$id/clinical/weights/$weightId';

  // Nutrición
  static String petNutrition(String id) => '/api/pets/$id/nutrition';

  // Despensa por mascota (lectura)
  static String petPantryUsable(String id) => '/api/pets/$id/pantry-usable';

  // ---- Pantry (general)
  static const String pantry = '/api/pantry';
  static String pantryById(String id) => '/api/pantry/$id';

  // ---- Recetas
  static const String recipesGenerate  = '/api/recipes/generate';
  static const String recipesFavorites = '/api/recipes/favorites';
  static String favoriteById(String id) => '/api/recipes/favorites/$id';

  // ---- Stats (si se usa en algún lugar; no se muestra en menú)
  static const String dailyStats = '/api/stats/daily';

  // ---- Pagos / Webpay (usados por PaymentService y ProfilePage)
  static const String webpayInit   = '/api/payments/webpay/init';
  /// URL de retorno que tu backend espera recibir desde Webpay
  /// (si usas otra, cámbiala aquí).
  static const String webpayReturn = '/webpay/return';

  /// Cancelación de Plus del usuario (usado en ProfilePage).
  /// Ajusta si tu backend usa plural en la ruta.
  static const String userPlusCancel = '/api/user/plus/cancel';

  // ---- Opcionales: rutas estilo "plus/*" si tu backend también las expone
  static String paymentsPlusInit()   => '/api/payments/plus/init';
  static String paymentsPlusCommit() => '/api/payments/plus/commit';
  static String paymentsPlusStatus() => '/api/payments/plus/status';
  static String usersPlusCancel()    => '/api/users/plus/cancel';
}
