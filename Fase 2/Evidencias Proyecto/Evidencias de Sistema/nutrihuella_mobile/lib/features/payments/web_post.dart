// lib/features/payments/web_post.dart
class WebPostRequest {
  /// URL de destino (Webpay u otra pasarela).
  final String action;

  /// Campos a postear (p.ej. {'token_ws': '...'}).
  final Map<String, String> fields;

  const WebPostRequest({
    required this.action,
    required this.fields,
  });
}
