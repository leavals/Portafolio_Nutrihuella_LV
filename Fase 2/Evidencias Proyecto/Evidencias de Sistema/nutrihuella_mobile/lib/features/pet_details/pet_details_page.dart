import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/api_client.dart';
import '../pets/pet_form_page.dart';
import 'package:go_router/go_router.dart';

class PetDetailsPage extends StatefulWidget {
  final String petId;
  const PetDetailsPage({super.key, required this.petId});

  @override
  State<PetDetailsPage> createState() => _PetDetailsPageState();
}

class _PetDetailsPageState extends State<PetDetailsPage> {
  bool _loading = true;
  String? _err;

  Map<String, dynamic>? _pet;
  Map<String, dynamic>? _nutrition;
  List<dynamic> _diseases = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _err = null; });
    final dio = ApiClient.create();
    try {
      final pet = await dio.get('/api/pets/${widget.petId}');
      final nutrition = await dio.get('/api/pets/${widget.petId}/nutrition');
      final diseases = await dio.get('/api/pets/${widget.petId}/clinical/diseases');
      setState(() {
        _pet = (pet.data is Map) ? Map<String,dynamic>.from(pet.data) : null;
        _nutrition = (nutrition.data is Map) ? Map<String,dynamic>.from(nutrition.data) : null;
        _diseases = (diseases.data is List) ? List.from(diseases.data) : <dynamic>[];
      });
    } catch (e) {
      setState(() => _err = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  String _fmtDate(String? iso) {
    if (iso == null) return '—';
    try {
      return DateFormat.yMd('es').format(DateTime.parse(iso));
    } catch (_) { return '—'; }
  }

  @override
  Widget build(BuildContext context) {
    final pet = _pet;

    return Scaffold(
      appBar: AppBar(
        title: Text(pet?['name'] ?? 'Mascota'),
        actions: [
          IconButton(
            tooltip: 'Editar',
            icon: const Icon(Icons.edit),
            onPressed: () async {
              // Abre el formulario en modo edición y recarga al volver con éxito.
              final ok = await Navigator.of(context).push<bool>(
                MaterialPageRoute(
                  builder: (_) => PetFormPage(petId: widget.petId),
                ),
              );
              if (ok == true) {
                await _load();
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Cambios guardados.')),
                );
              }
            },
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
                switch (v) {
                    case 'clinical':
                    context.push('/pets/${widget.petId}/clinical');
                    break;
                    case 'nutrition':
                    context.push('/pets/${widget.petId}/nutrition');
                    break;
                    case 'diseases':
                    context.push('/pets/${widget.petId}/diseases');
                    break;
                    case 'vaccines':
                    context.push('/pets/${widget.petId}/vaccines');
                    break;
                    case 'weights':
                    context.push('/pets/${widget.petId}/weights');
                    break;
                }
            },
            itemBuilder: (ctx) => const [
              PopupMenuItem(value: 'clinical', child: Text('Clínica')),
              PopupMenuItem(value: 'nutrition', child: Text('Nutrición')),
              PopupMenuItem(value: 'diseases', child: Text('Enfermedades')),
              PopupMenuItem(value: 'vaccines', child: Text('Vacunas')),
              PopupMenuItem(value: 'weights', child: Text('Pesos')),
              PopupMenuItem(value: 'pantry', child: Text('Despensa')),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _err != null
              ? Center(child: Text(_err!, style: const TextStyle(color: Colors.red)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _Card(
                        title: 'Datos básicos',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _row('Nombre', pet?['name']),
                            _row('Especie', switch (pet?['species']) {
                              'DOG' => 'Perro',
                              'CAT' => 'Gato',
                              'OTHER' => 'Otro',
                              _ => '—',
                            }),
                            _row('Sexo', pet?['sex'] == 'MALE' ? 'Macho' : pet?['sex'] == 'FEMALE' ? 'Hembra' : '—'),
                            _row('Raza', pet?['breed']),
                            _row('Fecha nacimiento', _fmtDate(pet?['birthDate'])),
                            _row('Tamaño', pet?['size']),
                            _row('Peso', pet?['weightKg'] != null ? '${pet!['weightKg']} kg' : '—'),
                            _row('Esterilizado', pet?['sterilized'] == true ? 'Sí' : 'No'),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      _Card(
                        title: 'Ficha Nutricional',
                        child: _nutrition == null
                            ? const Text('Sin datos nutricionales.')
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _row('Tipo de dieta', _nutrition!['dietType']),
                                  _row('Comidas por día', _nutrition!['mealsPerDay']?.toString()),
                                  _row('Actividad', _nutrition!['activityLevel']),
                                  _row('Meta', _nutrition!['goal']),
                                  _row('Calorías/día', _nutrition!['dailyCalories']?.toString()),
                                  _row('Agua (ml)', _nutrition!['waterIntakeMl']?.toString()),
                                  _row('Preferidos', (_nutrition!['preferredFoods'] as List?)?.join(', ')),
                                  _row('Prohibidos', (_nutrition!['forbiddenFoods'] as List?)?.join(', ')),
                                  _row('Intolerancias', (_nutrition!['intolerances'] as List?)?.join(', ')),
                                  _row('Alergias alim.', (_nutrition!['foodAllergies'] as List?)?.join(', ')),
                                  _row('Suplementos', (_nutrition!['supplements'] as List?)?.join(', ')),
                                ],
                              ),
                      ),
                      const SizedBox(height: 12),
                      _Card(
                        title: 'Enfermedades',
                        child: _diseases.isEmpty
                            ? const Text('Sin enfermedades registradas.')
                            : Table(
                                columnWidths: const {0: FlexColumnWidth(2), 1: FlexColumnWidth(), 2: FlexColumnWidth()},
                                children: [
                                  const TableRow(children: [
                                    _th('Nombre'), _th('Diagnóstico'), _th('Estado')
                                  ]),
                                  ..._diseases.map((d) => TableRow(
                                        children: [
                                          Padding(padding: const EdgeInsets.all(8), child: Text('${d['name'] ?? ''}')),
                                          Padding(padding: const EdgeInsets.all(8), child: Text(_fmtDate(d['diagnosedAt']))),
                                          Padding(padding: const EdgeInsets.all(8), child: Text(switch (d['status']) {
                                            'ACTIVE' => 'Activa',
                                            'RESOLVED' => 'Resuelta',
                                            'CRONIC' => 'Crónica',
                                            _ => '—',
                                          })),
                                        ],
                                      )),
                                ],
                              ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _row(String label, String? value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            SizedBox(width: 160, child: Text(label, style: const TextStyle(color: Colors.grey))),
            Expanded(child: Text(value == null || value.isEmpty ? '—' : value)),
          ],
        ),
      );
}

class _Card extends StatelessWidget {
  final String title;
  final Widget child;
  const _Card({required this.title, required this.child});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white, borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xffe5e7eb))
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(padding: const EdgeInsets.all(12), decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: Color(0xffe5e7eb)))
          ), child: Text(title, style: const TextStyle(fontWeight: FontWeight.w600))),
          Padding(padding: const EdgeInsets.all(12), child: child),
        ],
      ),
    );
  }
}

class _th extends StatelessWidget {
  final String text;
  const _th(this.text);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black54)),
    );
  }
}
