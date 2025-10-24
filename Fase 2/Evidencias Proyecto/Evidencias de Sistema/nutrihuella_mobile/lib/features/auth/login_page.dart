// lib/features/auth/login_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../core/api_client.dart';
import '../../core/env.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() { _loading = true; _error = null; });

    try {
      final api = await ApiClient.create();
      final res = await api.post(ApiPaths.authLogin, data: {
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = res.data is Map ? res.data as Map : {};
        final token = data['token'] ??
            data['access_token'] ??
            data['accessToken'] ??
            data['jwt'];
        if (token is String && token.isNotEmpty) {
          await ApiClient.saveToken(token);
          if (mounted) context.go('/dashboard');
          return;
        }
        throw Exception('Respuesta de login inválida (sin token).');
      } else if (res.statusCode == 401) {
        throw Exception('Login inválido (401).');
      } else {
        throw Exception('Error ${res.statusCode}: ${res.statusMessage ?? 'desconocido'}');
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loginWithGoogle() async {
    setState(() { _loading = true; _error = null; });
    try {
      // Si usas Web, especifica tu clientId web si lo necesitas:
      final googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
        // clientId opcional en Web si lo requieres:
        // clientId: const String.fromEnvironment('GOOGLE_CLIENT_ID', defaultValue: ''),
      );

      final acct = await googleSignIn.signIn();
      if (acct == null) {
        throw Exception('Inicio de sesión cancelado.');
      }
      final auth = await acct.authentication;
      final idToken = auth.idToken;
      if (idToken == null || idToken.isEmpty) {
        throw Exception('No se obtuvo idToken de Google.');
      }

      final api = await ApiClient.create();
      final res = await api.post(ApiPaths.authGoogle, data: {
        'idToken': idToken,
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = res.data is Map ? res.data as Map : {};
        final token = data['token'] ??
            data['access_token'] ??
            data['accessToken'] ??
            data['jwt'];
        if (token is String && token.isNotEmpty) {
          await ApiClient.saveToken(token);
          if (mounted) context.go('/dashboard');
          return;
        }
        throw Exception('Respuesta Google inválida (sin token).');
      } else {
        throw Exception('Error Google ${res.statusCode}: ${res.statusMessage ?? 'desconocido'}');
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Card(
            margin: const EdgeInsets.all(24),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(height: 4),
                    const Text('Bienvenido a NutriHuella',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 16),

                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email'),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Ingresa tu email';
                        return null;
                      },
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _passCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Contraseña'),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Ingresa tu contraseña';
                        return null;
                      },
                    ),

                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                    ],

                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      child: Text(_loading ? 'Procesando…' : 'Ingresar'),
                    ),

                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: _loading ? null : _loginWithGoogle,
                      icon: const Icon(Icons.login),
                      label: const Text('Continuar con Google'),
                    ),

                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: _loading ? null : () => context.push('/register'),
                      child: const Text('¿No tienes cuenta? Regístrate'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
