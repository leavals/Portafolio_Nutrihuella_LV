import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class PetWeightsPage extends StatefulWidget {
  final String petId;
  const PetWeightsPage({super.key, required this.petId});

  @override
  State<PetWeightsPage> createState() => _PetWeightsPageState();
}

class _PetWeightsPageState extends State<PetWeightsPage> {
  bool _loading = true;
  String? _err;

  Map<String, dynamic>? _current;
  List<Map<String, dynamic>> _rows = [];

  final _date = TextEditingController(text: DateTime.now().toIso8601String().substring(0,10));
  final _kg = TextEditingController();

  @override
  void initState() { super.initState(); _load(); }

  String _ymd(dynamic iso) {
    if (iso == null || (iso is String && iso.isEmpty)) return '';
    try { return DateTime.parse(iso.toString()).toIso8601String().substring(0,10); }
    catch (_) { return ''; }
  }

  Future<void> _load() async {
    setState(() { _loading = true; _err = null; });
    final dio = ApiClient.create();
    try {
      final res = await dio.get('/api/pets/${widget.petId}/clinical/weights');
      final data = res.data;
      if (data is List) {
        _rows = data.map((e)=> Map<String,dynamic>.from(e)).toList();
        // intentar peso actual desde /pets/:id
        try {
          final petRes = await dio.get('/api/pets/${widget.petId}');
          final pet = petRes.data as Map;
          final dateStr = (pet['updatedAt'] ?? pet['createdAt']) as String?;
          if (pet['weightKg'] != null) {
            _current = {'weightKg': pet['weightKg'], 'date': dateStr};
          }
        } catch (_) {}
      } else if (data is Map) {
        _current = data['current'] == null ? null : Map<String,dynamic>.from(data['current']);
        final historics = (data['historics'] as List?) ?? [];
        _rows = historics.map((e)=> Map<String,dynamic>.from(e)).toList();
      } else {
        _rows = [];
        _current = null;
      }
    } catch (e) { _err = e.toString(); }
    finally { setState(()=> _loading = false); }
  }

  Future<void> _add() async {
    final sKg = _kg.text.trim();
    if (sKg.isEmpty) return;
    final kg = double.tryParse(sKg);
    if (kg == null || kg <= 0) return;

    final dio = ApiClient.create();
    await dio.post('/api/pets/${widget.petId}/clinical/weights', data: {
      'date': _date.text.trim().isEmpty ? DateTime.now().toIso8601String().substring(0,10) : _date.text.trim(),
      'weightKg': kg,
    });
    _kg.clear();
    await _load();
  }

  Future<void> _del(String id) async {
    final dio = ApiClient.create();
    await dio.delete('/api/pets/${widget.petId}/clinical/weights/$id');
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final cur = _current;

    return Scaffold(
      appBar: AppBar(title: const Text('Pesos')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (cur != null && cur['weightKg'] != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.white, borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xffe5e7eb))
                ),
                child: Row(
                  children: [
                    const Expanded(child: Text('Peso actual')),
                    Text('${(cur['weightKg'] as num).toStringAsFixed(1)} kg  •  ${_ymd(cur['date'])}')
                  ],
                ),
              ),
            _formAdd(),
            const SizedBox(height: 12),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _err != null
                      ? Center(child: Text(_err!, style: const TextStyle(color: Colors.red)))
                      : _rows.isEmpty
                          ? const Center(child: Text('Sin registros.'))
                          : ListView.separated(
                              itemCount: _rows.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (_, i) {
                                final r = _rows[i];
                                return Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white, borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xffe5e7eb))
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(child: Text(_ymd(r['date']))),
                                      Text('${(r['weightKg'] as num).toStringAsFixed(1)} kg'),
                                      const SizedBox(width: 8),
                                      TextButton(
                                        onPressed: ()=> _del(r['id']),
                                        child: const Text('Eliminar', style: TextStyle(color: Colors.red)),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _formAdd() => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: Colors.white, borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xffe5e7eb))
    ),
    child: Column(
      children: [
        TextField(decoration: const InputDecoration(labelText: 'Fecha (yyyy-MM-dd)'), controller: _date),
        const SizedBox(height: 8),
        TextField(decoration: const InputDecoration(labelText: 'Peso (kg)'), controller: _kg, keyboardType: TextInputType.number),
        const SizedBox(height: 8),
        ElevatedButton(onPressed: _add, child: const Text('Agregar')),
      ],
    ),
  );
}
