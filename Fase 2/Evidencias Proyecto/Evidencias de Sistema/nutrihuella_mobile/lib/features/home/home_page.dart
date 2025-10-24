// lib/features/home/home_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/env.dart';

// Páginas ya existentes:
import '../pets/pet_list_page.dart';
import '../pantry/pantry_page.dart';
import '../recipes/recipes_page.dart';
import '../favorites/favorites_page.dart';
import '../profile/profile_page.dart';

/// Home principal con un único Scaffold y BottomNavigationBar.
/// - Evita Scaffolds anidados (que causaban títulos y FAB duplicados).
/// - Muestra “Bienvenido a NutriHuella, {nombre}” usando /api/auth/me.
/// - Cada pestaña es un body “embebido”; las pantallas de detalle siguen
///   navegándose por rutas (pet-details, clinical, etc.).
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _index = 0;
  String? _userName;
  bool _fetchingUser = false;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    setState(() => _fetchingUser = true);
    try {
      final api = await ApiClient.create();
      final res = await api.get<Map<String, dynamic>>(ApiPaths.authMe);
      // Se asume que /api/auth/me responde algo como { user: { name: ... } }
      final data = res.data;
      if (data != null) {
        final user = (data['user'] as Map?) ?? data; // tolerante a variantes
        final name = user['name'] ?? user['fullName'] ?? user['email'];
        if (mounted) setState(() => _userName = name?.toString());
      }
    } catch (_) {
      // Silencio: si falla, simplemente no mostramos el nombre
    } finally {
      if (mounted) setState(() => _fetchingUser = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tabs = <Widget>[
      // Mascotas: usamos la lista embebida SIN Scaffold ni FAB para no duplicar.
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(
              _fetchingUser
                  ? 'Bienvenido a NutriHuella…'
                  : 'Bienvenido a NutriHuella${_userName != null ? ', $_userName' : ''}',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ),
          const Divider(height: 1),
          const Expanded(
            // Este constructor embebido NO crea Scaffold ni FAB.
            child: PetListPage(embedded: true),
          ),
        ],
      ),

      // Despensa, Recetas y Favoritos: sus páginas ya existentes.
      const PantryPage(),
      const RecipesPage(),
      const FavoritesPage(),

      // Perfil: mantenemos la misma pantalla (incluye cerrar sesión allí).
      const ProfilePage(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('NutriHuella'),
        centerTitle: false,
        automaticallyImplyLeading: false,
      ),
      body: IndexedStack(index: _index, children: tabs),

      // Menú inferior único para toda la app.
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.pets_outlined),
            selectedIcon: Icon(Icons.pets),
            label: 'Mascotas',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: 'Despensa',
          ),
        NavigationDestination(
            icon: Icon(Icons.restaurant_menu_outlined),
            selectedIcon: Icon(Icons.restaurant_menu),
            label: 'Recetas',
          ),
          NavigationDestination(
            icon: Icon(Icons.bookmark_border),
            selectedIcon: Icon(Icons.bookmark),
            label: 'Favoritos',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}
