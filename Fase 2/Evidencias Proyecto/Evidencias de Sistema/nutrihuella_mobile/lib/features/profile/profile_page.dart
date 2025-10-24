// lib/features/profile/profile_page.dart
//
// Pantalla de Perfil con diseño mejorado y acciones según plan.
// - Muestra avatar genérico, nombre, email y plan actual.
// - Si el plan es PLUS: muestra "Cuenta: Plus" y botón "Cancelar Plus".
// - Si el plan es BASIC (u otro): muestra "Cuenta: Básica" y botón "Actualizar a Plus".
// - Acciones: upgrade (abre flujo Webpay/Plus) y cancelación.
// - Incluye "Cerrar sesión" al final.
//
// Nota: Lee /api/auth/me para obtener el usuario y refresca el estado tras acciones.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/env.dart';
import '../auth/auth_models.dart';
import '../payments/payment_service.dart';
import '../payments/web_post.dart';
import '../payments/webpay_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  bool _loading = true;          // carga de /me
  bool _working = false;         // acciones (upgrade/cancel/logout)
  String? _error;
  UserMe? _me;

  @override
  void initState() {
    super.initState();
    _loadMe();
  }

  Future<void> _loadMe() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = await ApiClient.create();
      final res = await api.dio.get(Env.api(ApiPaths.authMe));
      final data = (res.data is Map) ? res.data as Map<String, dynamic> : <String, dynamic>{};
      _me = UserMe.fromJson(data);
    } catch (e) {
      _error = 'No se pudo obtener tu perfil: $e';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _upgradePlus() async {
    setState(() {
      _working = true;
      _error = null;
    });
    try {
      final ps = await PaymentService.create();

      // Inicia transacción (el servicio hace fallback a /payments/plus/init si /webpay/init no existe).
      final tx = await ps.init(
        amount: 11990,
        finalUrl: ApiPaths.webpayReturn,
      );

      if (!mounted) return;
      // Navega a la pantalla que hace POST automático con token_ws.
      context.pushNamed(
        'profile-upgrade',
        extra: WebPostRequest(
          action: tx.url,
          fields: {'token_ws': tx.token},
        ),
      );
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _working = false);
    }
  }

  Future<void> _cancelPlus() async {
    setState(() {
      _working = true;
      _error = null;
    });
    try {
      final api = await ApiClient.create();
      final res = await api.dio.post(Env.api(ApiPaths.userPlusCancel));
      if (res.statusCode != null && res.statusCode! >= 400) {
        throw Exception('HTTP ${res.statusCode}: ${res.data}');
      }
      // Vuelve a cargar /me para reflejar el plan actual.
      await _loadMe();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Suscripción Plus cancelada.')),
      );
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _working = false);
    }
  }

  Future<void> _logout() async {
    setState(() => _working = true);
    try {
      await ApiClient.clearToken();
      if (!mounted) return;
      context.goNamed('login');
    } finally {
      if (mounted) setState(() => _working = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Widget body;
    if (_loading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_error != null) {
      body = Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            _error!,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.red),
          ),
        ),
      );
    } else {
      final me = _me!;
      final isPlus = (me.plan).toUpperCase() == 'PLUS';

      body = ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Encabezado con avatar y datos
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                    child: Icon(Icons.person, size: 36, color: theme.colorScheme.primary),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          me.name ?? me.email.split('@').first,
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          me.email,
                          style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey[700]),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Chip(
                            label: Text(isPlus ? 'Cuenta: Plus' : 'Cuenta: Básica'),
                            backgroundColor: isPlus
                                ? Colors.amber.withOpacity(0.15)
                                : Colors.grey.withOpacity(0.15),
                            side: BorderSide(
                              color: isPlus ? Colors.amber.shade700 : Colors.grey.shade500,
                            ),
                            labelStyle: TextStyle(
                              color: isPlus ? Colors.amber.shade800 : Colors.grey.shade700,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Datos de la cuenta
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.badge_outlined),
                  title: const Text('Nombre'),
                  subtitle: Text(me.name ?? '—'),
                ),
                const Divider(height: 0),
                ListTile(
                  leading: const Icon(Icons.email_outlined),
                  title: const Text('Email'),
                  subtitle: Text(me.email),
                ),
                const Divider(height: 0),
                ListTile(
                  leading: const Icon(Icons.workspace_premium_outlined),
                  title: const Text('Plan actual'),
                  subtitle: Text(isPlus ? 'Plus' : 'Básica'),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Acciones según el plan
          if (isPlus) ...[
            FilledButton.tonalIcon(
              onPressed: _working ? null : _cancelPlus,
              icon: const Icon(Icons.cancel_schedule_send_outlined),
              label: Text(_working ? 'Procesando…' : 'Cancelar Plus'),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Seguirás con acceso hasta el final del período ya pagado.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey[700]),
            ),
          ] else ...[
            FilledButton.icon(
              onPressed: _working ? null : _upgradePlus,
              icon: const Icon(Icons.workspace_premium),
              label: Text(_working ? 'Procesando…' : 'Actualizar a Plus'),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Con Plus eliminas límites de mascotas, favoritos y generaciones de recetas.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey[700]),
            ),
          ],

          const SizedBox(height: 24),

          // Cerrar sesión
          TextButton.icon(
            onPressed: _working ? null : _logout,
            icon: const Icon(Icons.logout),
            label: const Text('Cerrar sesión'),
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Mi Perfil')),
      body: body,
    );
  }
}
