// lib/features/favorites/favorites_page.dart
//
// Pantalla principal de "Tus Recetas Favoritas".

import 'package:flutter/material.dart';
import 'favorite_list_page.dart';

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFFFAFAF4),
      body: SafeArea(
        child: FavoriteListPage(),
      ),
    );
  }
}
