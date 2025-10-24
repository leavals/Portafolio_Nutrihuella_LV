// lib/features/pets/pet_list_page.dart
//
// Correcciones clave (focalizadas):
// - Este widget se usa embebido desde PetsPage (embedded: true), por lo que
//   NO define su propio FAB ni AppBar cuando está embebido (evitamos duplicados).
// - Al tocar una mascota, navegamos a 'pet-details' y si el detalle hace
//   context.pop(true) (por ejemplo tras eliminar con confirmación), recargamos.
// - Mantiene API y estilos actuales. No se toca el resto de la app.

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
            title: Text(
              p['name']?.toString() ?? 'Mascota',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              [species, breed, weightStr].where((s) => s.isNotEmpty).join(' • '),
            ),
            trailing: const Icon(Icons.more_vert),
            onTap: () async {
              final id = (p['id'] ?? p['_id']).toString();
              if (id.isNotEmpty) {
                // Al volver con true (p. ej., eliminar/editar), recargamos.
                final bool? changed = await context.pushNamed<bool>(
                  'pet-details',
                  pathParameters: {'id': id},
                );
                if (changed == true) {
                  await _load();
                }
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

    // En modo embebido NO devolvemos Scaffold con AppBar/FAB para evitar duplicados.
    if (widget.embedded) {
      return content;
    }

    // Compatibilidad si en otro flujo se usa como página completa.
    return Scaffold(
      appBar: AppBar(title: const Text('NutriHuella')),
      body: content,
    );
  }
}
