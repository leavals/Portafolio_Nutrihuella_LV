// lib/features/pets/pet_form_page.dart
//
// Formulario unificado de Mascota (crear/editar) con un diseño simple y claro.
// - Si `petId` es null => modo CREAR (POST /api/pets)
// - Si `petId` tiene valor  => modo EDITAR (PATCH /api/pets/:id)
// - Campos: nombre, fecha de nacimiento, especie, sexo, raza, tamaño, peso (kg), esterilizado.
// - Al guardar, hace pop(true) para que la lista se recargue.
//
// Nota: se evita añadir dependencias nuevas (p. ej. image picker) para mantener
// la compilación web. La subida de foto se puede implementar luego en un archivo
// dedicado sin tocar este flujo.

import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class PetFormPage extends StatefulWidget {
  const PetFormPage({super.key, this.petId});
  final String? petId;

  @override
  State<PetFormPage> createState() => _PetFormPageState();
}

class _PetFormPageState extends State<PetFormPage> {
  final _formKey = GlobalKey<FormState>();

  final _nameCtrl = TextEditingController();
  final _breedCtrl = TextEditingController();
  final _weightCtrl = TextEditingController();
  final _birthDateCtrl = TextEditingController();

  String _species = 'DOG';    // DOG | CAT | OTHER
  String _sex = 'MALE';       // MALE | FEMALE
  String _size = 'MEDIUM';    // TOY | SMALL | MEDIUM | LARGE | GIANT
  bool _sterilized = false;

  bool _loading = false;
  String? _err;

  static const _sizeLabels = {
    'TOY': 'Mini/Toy',
    'SMALL': 'Pequeño',
    'MEDIUM': 'Mediano',
    'LARGE': 'Grande',
    'GIANT': 'Gigante',
  };

  @override
  void initState() {
    super.initState();
    if (widget.petId != null) {
      _load();
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _breedCtrl.dispose();
    _weightCtrl.dispose();
    _birthDateCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _err = null;
    });
    try {
      final api = await ApiClient.create();
      final res = await api.get('/api/pets/${widget.petId}');
      final data = (res.data ?? {}) as Map;

      _nameCtrl.text = (data['name'] ?? '').toString();
      _species = (data['species'] ?? 'DOG').toString();
      _sex = (data['sex'] ?? 'MALE').toString();
      _breedCtrl.text = (data['breed'] ?? '').toString();
      _size = (data['size'] ?? 'MEDIUM').toString();
      _weightCtrl.text = (data['weightKg'] ?? '').toString();
      _birthDateCtrl.text = _ymd(data['birthDate']);
      _sterilized = data['sterilized'] == true;
    } catch (e) {
      _err = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _ymd(dynamic iso) {
    if (iso == null || (iso is String && iso.isEmpty)) return '';
    try {
      return DateTime.parse(iso.toString())
          .toIso8601String()
          .substring(0, 10);
    } catch (_) {
      return '';
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final double? weight =
        _weightCtrl.text.trim().isEmpty ? null : double.tryParse(_weightCtrl.text.trim());
    if (_weightCtrl.text.trim().isNotEmpty && (weight == null || weight <= 0)) {
      setState(() => _err = 'Ingresa un peso válido.');
      return;
    }

    setState(() {
      _loading = true;
      _err = null;
    });

    final payload = {
      'name': _nameCtrl.text.trim(),
      'species': _species,
      'sex': _sex,
      'breed': _breedCtrl.text.trim().isEmpty ? null : _breedCtrl.text.trim(),
      'size': _size,
      'weightKg': weight,
      'birthDate': _birthDateCtrl.text.trim().isEmpty
          ? null
          : DateTime.parse(_birthDateCtrl.text.trim()).toIso8601String(),
      'sterilized': _sterilized,
    };

    try {
      final api = await ApiClient.create();
      if (widget.petId == null) {
        await api.post('/api/pets', data: payload);
      } else {
        // reflejamos el flujo de la web (PATCH)
        await api.patch('/api/pets/${widget.petId}', data: payload);
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _err = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // limita la fecha máxima a hoy
  String get _todayYmd {
    final now = DateTime.now();
    final y = now.year.toString().padLeft(4, '0');
    final m = now.month.toString().padLeft(2, '0');
    final d = now.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.petId != null;

    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Editar mascota' : 'Nueva mascota')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      if (_err != null)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xffFEE2E2),
                            border: Border.all(color: const Color(0xffEF4444)),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(_err!, style: const TextStyle(color: Color(0xff991B1B))),
                        ),

                      // Card principal
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: const Color(0xffe5e7eb)),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              TextFormField(
                                controller: _nameCtrl,
                                decoration: const InputDecoration(labelText: 'Nombre *'),
                                validator: (v) =>
                                    (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _birthDateCtrl,
                                decoration: const InputDecoration(
                                    labelText: 'Fecha de nacimiento (yyyy-MM-dd) *'),
                                keyboardType: TextInputType.datetime,
                                validator: (v) =>
                                    (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                              ),
                              const SizedBox(height: 12),

                              // Fila especie / sexo
                              Row(
                                children: [
                                  Expanded(
                                    child: InputDecorator(
                                      decoration:
                                          const InputDecoration(labelText: 'Especie *'),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _species,
                                          isExpanded: true,
                                          items: const [
                                            DropdownMenuItem(
                                                value: 'DOG', child: Text('Perro')),
                                            DropdownMenuItem(
                                                value: 'CAT', child: Text('Gato')),
                                            DropdownMenuItem(
                                                value: 'OTHER', child: Text('Otro')),
                                          ],
                                          onChanged: (v) =>
                                              setState(() => _species = v ?? 'DOG'),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: InputDecorator(
                                      decoration: const InputDecoration(labelText: 'Sexo *'),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _sex,
                                          isExpanded: true,
                                          items: const [
                                            DropdownMenuItem(
                                                value: 'MALE', child: Text('Macho')),
                                            DropdownMenuItem(
                                                value: 'FEMALE', child: Text('Hembra')),
                                          ],
                                          onChanged: (v) =>
                                              setState(() => _sex = v ?? 'MALE'),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              TextFormField(
                                controller: _breedCtrl,
                                decoration: const InputDecoration(labelText: 'Raza *'),
                                validator: (v) =>
                                    (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                              ),
                              const SizedBox(height: 12),

                              // Fila tamaño / peso
                              Row(
                                children: [
                                  Expanded(
                                    child: InputDecorator(
                                      decoration:
                                          const InputDecoration(labelText: 'Tamaño *'),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _size,
                                          isExpanded: true,
                                          items: _sizeLabels.entries
                                              .map((e) => DropdownMenuItem(
                                                    value: e.key,
                                                    child: Text(e.value),
                                                  ))
                                              .toList(),
                                          onChanged: (v) =>
                                              setState(() => _size = v ?? 'MEDIUM'),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TextFormField(
                                      controller: _weightCtrl,
                                      decoration: const InputDecoration(
                                          labelText: 'Peso (kg) *'),
                                      keyboardType:
                                          const TextInputType.numberWithOptions(
                                              decimal: true),
                                      validator: (v) =>
                                          (v == null || v.trim().isEmpty)
                                              ? 'Requerido'
                                              : null,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              // Esterilizado
                              Row(
                                children: [
                                  Switch(
                                    value: _sterilized,
                                    onChanged: (v) =>
                                        setState(() => _sterilized = v),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text('Esterilizado'),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _loading ? null : _save,
                              child: Text(_loading
                                  ? 'Guardando…'
                                  : (isEdit ? 'Guardar cambios' : 'Crear')),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _loading
                                  ? null
                                  : () => Navigator.of(context).pop(false),
                              child: const Text('Cancelar'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Máx. fecha: $_todayYmd',
                          style: const TextStyle(
                              fontSize: 12, color: Colors.black54),
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
