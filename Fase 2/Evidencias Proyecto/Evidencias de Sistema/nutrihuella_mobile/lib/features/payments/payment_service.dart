// lib/features/payments/payment_service.dart
//
// Servicio de pagos compatible con ambos endpoints de backend.
// Este servicio se encarga de iniciar una transacción Webpay o Plus.
//
// Comportamiento:
// 1. Intenta POST a /api/payments/webpay/init (endpoint principal).
// 2. Si recibe un 404 (no encontrado), hace fallback automático a /api/payments/plus/init.
// 3. Normaliza la respuesta para manejar distintos formatos de backend.
//    Acepta las variantes de respuesta:
//      - { url, token }
//      - { formUrl, token_ws }
//      - { action, fields.token_ws }
// 4. Devuelve una instancia de WebpayTx con los valores validados.

import 'package:dio/dio.dart';
import '../../core/api_client.dart';
import '../../core/env.dart';

class PaymentService {
  PaymentService._(this._dio);
  final Dio _dio;

  /// Crea una instancia del servicio usando ApiClient centralizado.
  static Future<PaymentService> create() async {
    final api = await ApiClient.create();
    return PaymentService._(api.dio);
  }

  /// Inicia una transacción de pago en el backend.
  /// Parámetros:
  ///   - [amount]: monto en pesos chilenos del pago.
  ///   - [finalUrl]: URL de retorno al frontend después del pago.
  /// Devuelve:
  ///   - [WebpayTx] con los campos [url] y [token] necesarios para realizar el POST.
  ///
  /// Ejemplo de uso:
  ///   final tx = await PaymentService.create().then(
  ///     (ps) => ps.init(amount: 11990, finalUrl: ApiPaths.webpayReturn),
  ///   );
  Future<WebpayTx> init({
    required int amount,
    required String finalUrl,
  }) async {
    Response res;

    // Intento principal: /api/payments/webpay/init
    res = await _dio.post(
      Env.api(ApiPaths.webpayInit),
      data: {
        'amount': amount,
        'finalUrl': finalUrl,
      },
      options: Options(validateStatus: (c) => c != null && c < 500),
    );

    // Fallback: /api/payments/plus/init (usado por el frontend web)
    if (res.statusCode == 404) {
      res = await _dio.post(
        Env.api(ApiPaths.paymentsPlusInit()),
        data: {
          'amount': amount,
          'finalUrl': finalUrl,
        },
        options: Options(validateStatus: (c) => c != null && c < 500),
      );
    }

    // Validación de respuesta HTTP
    if (res.statusCode != null && res.statusCode! >= 400) {
      throw Exception('Webpay init error ${res.statusCode}: ${res.data}');
    }

    // Parseo flexible del cuerpo de la respuesta
    final data = res.data is Map ? (res.data as Map) : const {};

    // Detecta el campo de URL según formato
    String url = (data['url'] ??
            data['formUrl'] ??
            data['action'] ??
            data['form_action'] ??
            '')
        .toString();

    // Detecta el campo de token según formato
    String token = (data['token'] ??
            data['token_ws'] ??
            data['tokenWs'] ??
            '')
        .toString();

    // En algunos casos, el token viene dentro de data['fields']
    if (token.isEmpty && data['fields'] is Map) {
      final fields = data['fields'] as Map;
      token = (fields['token_ws'] ?? fields['tokenWs'] ?? '').toString();
    }

    // Validación final de la respuesta
    if (url.isEmpty || token.isEmpty) {
      throw Exception('Respuesta inválida al iniciar el pago (falta url o token).');
    }

    // Devuelve el objeto de transacción normalizado
    return WebpayTx(url: url, token: token);
  }
}

/// Representa la transacción inicializada, con la URL del formulario
/// y el token_ws necesario para el POST hacia Webpay/Transbank.
class WebpayTx {
  final String url;
  final String token;
  WebpayTx({required this.url, required this.token});
}
