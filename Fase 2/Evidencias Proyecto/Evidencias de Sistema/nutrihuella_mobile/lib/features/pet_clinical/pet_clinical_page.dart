import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class PetClinicalPage extends StatefulWidget {
  final String petId;
  const PetClinicalPage({super.key, required this.petId});

  @override
  State<PetClinicalPage> createState() => _PetClinicalPageState();
}

class _PetClinicalPageState extends State<PetClinicalPage> {
  bool _loading = true;
  String? _msg;
  String? _err;

  final _allergies = TextEditingController();
  final _chronic = TextEditingController();
  final _meds = TextEditingController();
  final _surg = TextEditingController();
  final _lastVet = TextEditingController();
  final _lastDeworm = TextEditingController();
  final _lastFlea = TextEditingController();
  final _blood = TextEditingController();
  final _clinic = TextEditingController();
  final _phone = TextEditingController();
  final _notes = TextEditingController();

  @override
  void initState() {
    super.initState(); _load();
  }

  List<String> _toArr(String s) =>
      s.split(',').map((v) => v.trim()).where((v) => v.isNotEmpty).toList();

  Future<void> _load() async {
    setState(() { _loading = true; _msg = null; _err = null; });
    final dio = ApiClient.create();
    try {
      final res = await dio.get('/api/pets/${widget.petId}/clinical');
      final data = (res.data ?? {}) as Map;
      _allergies.text = (data['allergies'] as List?)?.join(', ') ?? '';
      _chronic.text = (data['chronicConditions'] as List?)?.join(', ') ?? '';
      _meds.text = (data['medications'] as List?)?.join(', ') ?? '';
      _surg.text = (data['surgeries'] as List?)?.join(', ') ?? '';
      _lastVet.text = _ymd(data['lastVetVisit']);
      _lastDeworm.text = _ymd(data['lastDeworming']);
      _lastFlea.text = _ymd(data['lastFleaTick']);
      _blood.text = data['bloodType'] ?? '';
      _clinic.text = data['vetClinic'] ?? '';
      _phone.text = data['vetPhone'] ?? '';
      _notes.text = data['notes'] ?? '';
    } catch (e) {
      _err = e.toString();
    } finally { setState(() => _loading = false); }
  }

  String _ymd(dynamic iso) {
    if (iso == null || (iso is String && iso.isEmpty)) return '';
    try { return DateTime.parse(iso.toString()).toIso8601String().substring(0,10); }
    catch (_) { return ''; }
  }

  String? _toISOorNull(String s) => s.trim().isEmpty ? null : DateTime.parse(s).toIso8601String();

  Future<void> _save() async {
    setState(() { _msg = null; _err = null; });
    final dio = ApiClient.create();
    try {
      await dio.put('/api/pets/${widget.petId}/clinical', data: {
        'allergies': _toArr(_allergies.text),
        'chronicConditions': _toArr(_chronic.text),
        'medications': _toArr(_meds.text),
        'surgeries': _toArr(_surg.text),
        'lastVetVisit': _toISOorNull(_lastVet.text),
        'lastDeworming': _toISOorNull(_lastDeworm.text),
        'lastFleaTick': _toISOorNull(_lastFlea.text),
        'bloodType': _blood.text.isEmpty ? null : _blood.text,
        'vetClinic': _clinic.text.isEmpty ? null : _clinic.text,
        'vetPhone': _phone.text.isEmpty ? null : _phone.text,
        'notes': _notes.text.isEmpty ? null : _notes.text,
      });
      setState(() => _msg = 'Ficha clínica guardada.');
    } catch (e) {
      setState(() => _err = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ficha clínica')),
      body: _loading ? const Center(child: CircularProgressIndicator()) :
      SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (_msg != null) _alert(_msg!, Colors.green),
            if (_err != null) _alert(_err!, Colors.red),
            const SizedBox(height: 8),
            _field('Alergias (CSV)', _allergies, hint: 'polen, césped'),
            _field('Condiciones crónicas (CSV)', _chronic, hint: 'diabetes'),
            _field('Medicamentos (CSV)', _meds, hint: 'ibuprofeno 50mg'),
            _field('Cirugías (CSV)', _surg, hint: 'esterilización'),
            _field('Última visita vet. (yyyy-MM-dd)', _lastVet),
            _field('Última desparasitación (yyyy-MM-dd)', _lastDeworm),
            _field('Última pulgas/garrapatas (yyyy-MM-dd)', _lastFlea),
            _field('Tipo de sangre', _blood),
            _field('Clínica', _clinic),
            _field('Fono vet.', _phone),
            _area('Notas', _notes),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _save, child: const Text('Guardar clínica')),
          ],
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController c, {String? hint}) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextField(decoration: InputDecoration(labelText: label, hintText: hint), controller: c),
  );

  Widget _area(String label, TextEditingController c) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextField(decoration: InputDecoration(labelText: label), controller: c, maxLines: 4),
  );

  Widget _alert(String t, Color color) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(12),
    margin: const EdgeInsets.only(bottom: 12),
    decoration: BoxDecoration(color: color.withOpacity(.08), borderRadius: BorderRadius.circular(12)),
    child: Text(t, style: TextStyle(color: color)),
  );
}
