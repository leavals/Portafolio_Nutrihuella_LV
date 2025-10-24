// lib/features/pets/pet_list_page.dart
//
// Correcciones clave:
// - FAB “Nueva mascota” ahora navega al formulario correcto (ruta 'pet-new')
//   y recarga la lista al volver con éxito.
// - Mantiene la API y el estilo actuales. No se toca el resto de la app.
//

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/env.dart';

class PetListPage extends StatefulWidget {
  const PetListPage({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<PetListPage> createState() => _PetListPageState();
}

class _PetListPageState extends State<PetListPage> {
  bool _loading = false;
  String? _err;
  List<Map<String, dynamic>> _pets = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _err = null;
    });
    try {
      final api = await ApiClient.create();
      final res = await api.get<List<dynamic>>(ApiPaths.pets);
      final list = (res.data ?? [])
          .cast<Map>()
          .map((e) => e.map((k, v) => MapEntry(k.toString(), v)))
          .toList();
      setState(() => _pets = list.cast<Map<String, dynamic>>());
    } catch (e) {
      setState(() => _err = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _newPet() async {
    // Abre el formulario nombrado 'pet-new' y, si vuelve true, recarga.
    final result = await context.pushNamed<bool>('pet-new');
    if (result == true) {
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mascota creada correctamente.')),
      );
    }
  }

  Widget _buildList(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_err != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            _err!,
            style: const TextStyle(color: Colors.red),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }
    if (_pets.isEmpty) {
      return const Center(child: Text('Aún no tienes mascotas.'));
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
      itemCount: _pets.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        final p = _pets[i];
        final breed = (p['breed'] ?? p['breedName'] ?? '').toString().toUpperCase();
        final species = (p['species'] ?? p['speciesName'] ?? '').toString().toUpperCase();
        final weightStr =
            (p['weight'] != null) ? '${p['weight']} kg' : (p['weightKg'] != null ? '${p['weightKg']} kg' : '');

        return Card(
          elevation: 1.5,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: const BorderSide(color: Color(0xffe5e7eb)),
          ),
          child: ListTile(
            leading: const Icon(Icons.pets),
            title: Text(p['name']?.toString() ?? 'Mascota',
                style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(
              [species, breed, weightStr].where((s) => s.isNotEmpty).join(' • '),
            ),
            trailing: const Icon(Icons.more_vert),
            onTap: () {
              final id = (p['id'] ?? p['_id']).toString();
              if (id.isNotEmpty) {
                context.pushNamed('pet-details', pathParameters: {'id': id});
              }
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final content = _buildList(context);

    if (widget.embedded) {
      return content;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('NutriHuella')),
      body: content,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _newPet,
        icon: const Icon(Icons.add),
        label: const Text('Nueva mascota'),
      ),
    );
  }
}
