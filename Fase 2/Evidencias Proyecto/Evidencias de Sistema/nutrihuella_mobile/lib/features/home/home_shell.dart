/// lib/features/home/home_shell.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/auth_controller.dart';

class HomeShell extends ConsumerWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = GoRouterState.of(context).uri.toString();
    int index = 0;
    if (current.startsWith('/pantry')) index = 1;
    if (current.startsWith('/recipes')) index = 2;
    if (current.startsWith('/favorites')) index = 3;
    if (current.startsWith('/profile')) index = 4;
    if (current.startsWith('/stats')) index = 5;

    return Scaffold(
      appBar: AppBar(
        title: const Text('NutriHuella'),
        actions: [
          IconButton(
            tooltip: 'Estadísticas',
            icon: const Icon(Icons.query_stats),
            onPressed: () => context.go('/stats'),
          ),
          IconButton(
            tooltip: 'Cerrar sesión',
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) {
          switch (i) {
            case 0: context.go('/'); break;
            case 1: context.go('/pantry'); break;
            case 2: context.go('/recipes'); break;
            case 3: context.go('/favorites'); break;
            case 4: context.go('/profile'); break;
            case 5: context.go('/stats'); break;
          }
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.pets_outlined), label: 'Mascotas'),
          NavigationDestination(icon: Icon(Icons.kitchen_outlined), label: 'Despensa'),
          NavigationDestination(icon: Icon(Icons.restaurant_menu), label: 'Recetas'),
          NavigationDestination(icon: Icon(Icons.bookmark_border), label: 'Favoritos'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Perfil'),
          NavigationDestination(icon: Icon(Icons.query_stats), label: 'Stats'),
        ],
      ),
    );
  }
}
