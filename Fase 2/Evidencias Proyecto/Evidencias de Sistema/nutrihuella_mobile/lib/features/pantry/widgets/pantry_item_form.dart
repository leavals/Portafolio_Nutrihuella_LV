// lib/features/pantry/widgets/pantry_item_form.dart
//
// Formulario para crear un ítem de despensa. Se muestra como bottom-sheet.
// Al guardar, realiza el POST y cierra devolviendo true.
// Se corrigió la construcción del Map "body" para evitar el error de compilación:
// ahora se usan entradas condicionales con "if (...)" en el literal del Map.

import 'package:flutter/material.dart';

import '../pantry_service.dart';

class PantryItemForm extends StatefulWidget {
  const PantryItemForm({super.key});

  @override
  State<PantryItemForm> createState() => _PantryItemFormState();
}

class _PantryItemFormState extends State<PantryItemForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  final _brandCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();

  String? _unit;
  DateTime? _expiresAt;
  bool _saving = false;

  final _units = const <String>['un', 'g', 'kg', 'ml', 'l', 'taza', 'cda', 'cdta'];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _qtyCtrl.dispose();
    _brandCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _expiresAt ?? now,
      firstDate: now, // desde hoy
      lastDate: now.add(const Duration(days: 3650)),
    );
    if (picked != null) {
      setState(() => _expiresAt = picked);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final qty = num.tryParse(_qtyCtrl.text.trim());
    final brand = _brandCtrl.text.trim();
    final note = _noteCtrl.text.trim();

    // CORRECCIÓN: usar claves condicionales dentro del literal del Map.
    final body = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      if (qty != null) 'quantity': qty,
      if (_unit != null && _unit!.isNotEmpty) 'unit': _unit,
      if (brand.isNotEmpty) 'brand': brand,
      if (note.isNotEmpty) 'note': note,
      if (_expiresAt != null) 'expiresAt': _expiresAt!.toIso8601String(),
    };

    setState(() => _saving = true);
    try {
      final svc = PantryService();
      await svc.create(body);
      if (!mounted) return;
      Navigator.of(context).pop(true); // devolvemos true para recargar lista
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al crear: $e')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets;
    return Padding(
      padding: EdgeInsets.only(bottom: viewInsets.bottom),
      child: Material(
        color: Theme.of(context).colorScheme.surface,
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Nuevo ítem de despensa',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _nameCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Producto',
                          hintText: 'Ej: Pollo pechuga',
                        ),
                        textInputAction: TextInputAction.next,
                        validator: (v) =>
                            (v == null || v.trim().isEmpty) ? 'Ingresa el nombre' : null,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _qtyCtrl,
                              decoration: const InputDecoration(
                                labelText: 'Cantidad',
                                hintText: 'Ej: 500',
                              ),
                              keyboardType:
                                  const TextInputType.numberWithOptions(decimal: true),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _unit,
                              items: _units
                                  .map(
                                    (u) => DropdownMenuItem<String>(
                                      value: u,
                                      child: Text(u),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (v) => setState(() => _unit = v),
                              decoration: const InputDecoration(
                                labelText: 'Unidad',
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _brandCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Marca (opcional)',
                        ),
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _noteCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Nota (opcional)',
                        ),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _pickDate,
                              icon: const Icon(Icons.event),
                              label: Text(
                                _expiresAt == null
                                    ? 'Fecha de vencimiento'
                                    : '${_expiresAt!.year}-${_expiresAt!.month.toString().padLeft(2, '0')}-${_expiresAt!.day.toString().padLeft(2, '0')}',
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _saving ? null : _save,
                          child: _saving
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text('Guardar'),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
