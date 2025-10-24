// lib/features/pantry/pantry_page.dart
//
// Pantalla de Despensa con lista de ítems y botón para crear un nuevo ítem.
// Corrección mínima para mitigar el error de compilación:
// - Se reemplaza el uso incorrecto de `Stack` con parámetros `appBar`/`body` por un `Scaffold` válido.
// - Se mantiene el listado y el FAB "Nuevo ítem" sin cambiar otras pantallas, rutas ni modelos.
//
// Notas:
// - Al cerrar el formulario con éxito, se recarga la lista y se muestra un SnackBar.

import 'package:flutter/material.dart';

import '../../core/env.dart';
import '../../core/api_client.dart';
import 'pantry_service.dart';
import 'widgets/pantry_item_form.dart';

class PantryPage extends StatefulWidget {
  const PantryPage({super.key});

  @override
  State<PantryPage> createState() => _PantryPageState();
}

class _PantryPageState extends State<PantryPage> {
  final _service = PantryService();
  bool _loading = false;
  String? _err;
  List<Map<String, dynamic>> _items = [];

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
      final data = await _service.fetchAll();
      if (!mounted) return;
      setState(() => _items = data);
    } catch (e) {
      if (!mounted) return;
      setState(() => _err = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openCreate() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => const PantryItemForm(),
    );

    if (created == true) {
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ítem de despensa creado.')),
      );
    }
  }

  Widget _buildList() {
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
    if (_items.isEmpty) {
      return const Center(child: Text('No tienes productos en tu despensa.'));
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
      itemCount: _items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        final it = _items[i];

        // Campos tolerantes a backend; se muestran si existen.
        final name = (it['name'] ?? it['productName'] ?? 'Producto').toString();
        final qty = (it['quantity'] ?? it['amount']);
        final unit = (it['unit'] ?? it['unitName'] ?? '').toString();
        final brand = (it['brand'] ?? '').toString();
        final note = (it['note'] ?? '').toString();

        String subtitle = '';
        if (qty != null) subtitle = '$qty';
        if (unit.isNotEmpty) {
          subtitle = subtitle.isEmpty ? unit : '$subtitle $unit';
        }
        if (brand.isNotEmpty) {
          subtitle = subtitle.isEmpty ? brand : '$subtitle • $brand';
        }
        if (note.isNotEmpty) {
          subtitle = subtitle.isEmpty ? note : '$subtitle • $note';
        }

        // Expiración si viene
        final expiresAt = it['expiresAt'] ?? it['expirationDate'];
        final expiresStr =
            (expiresAt is String && expiresAt.isNotEmpty) ? expiresAt : null;

        return Card(
          child: ListTile(
            leading: const Icon(Icons.inventory_2_outlined),
            title: Text(name),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (subtitle.isNotEmpty) Text(subtitle),
                if (expiresStr != null)
                  Text('Vence: $expiresStr', style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Uso de Scaffold correcto (antes se intentaba usar Stack con appBar/body).
    return Scaffold(
      appBar: AppBar(
        title: const Text('Articulos de la despensa'),
        centerTitle: true,
      ),
      body: _buildList(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreate,
        icon: const Icon(Icons.add),
        label: const Text('Nuevo ítem'),
      ),
    );
  }
}
