/// lib/main.dart
/// Entry point con ProviderScope, carga de .env y router.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'core/theme.dart';
import 'core/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try { await dotenv.load(fileName: '.env'); } catch (_) {}
  runApp(const ProviderScope(child: NutriHuellaApp()));
}

class NutriHuellaApp extends ConsumerWidget {
  const NutriHuellaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'NutriHuella',
      theme: buildTheme(),
      routerConfig: router,
    );
  }
}
