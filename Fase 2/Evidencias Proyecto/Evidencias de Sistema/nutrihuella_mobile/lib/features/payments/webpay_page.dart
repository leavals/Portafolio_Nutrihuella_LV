// lib/features/payments/webpay_page.dart
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'web_post.dart';

// Import condicional: en web usamos dart:html, en otras plataformas el stub.
import 'webpay_post_stub.dart'
    if (dart.library.html) 'webpay_post_web.dart' as webimpl;

class WebPayPage extends StatefulWidget {
  final WebPostRequest? request; // <-- opcional

  const WebPayPage({super.key, this.request});

  @override
  State<WebPayPage> createState() => _WebPayPageState();
}

class _WebPayPageState extends State<WebPayPage> {
  bool _submitted = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (kIsWeb && widget.request != null && !_submitted) {
        _submitted = true;
        webimpl.postForm(widget.request!.action, widget.request!.fields);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final req = widget.request;

    return Scaffold(
      appBar: AppBar(title: const Text('Pago Plus')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Estamos preparando tu pago con Webpay.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              if (req == null) ...[
                const Text(
                  'No llegó una solicitud de pago. Vuelve al perfil y toca "Actualizar a Plus".',
                  textAlign: TextAlign.center,
                ),
              ] else ...[
                Text(
                  kIsWeb
                      ? 'Si no te redirige automáticamente, pulsa el botón.'
                      : 'En móvil, abriremos el flujo de pago compatible.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    if (kIsWeb) {
                      webimpl.postForm(req.action, req.fields);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Flujo móvil pendiente de WebView POST'),
                        ),
                      );
                    }
                  },
                  child: const Text('Continuar al pago'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
