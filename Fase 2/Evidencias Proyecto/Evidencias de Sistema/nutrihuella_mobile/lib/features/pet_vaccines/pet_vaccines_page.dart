import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class PetVaccinesPage extends StatefulWidget {
  final String petId;
  const PetVaccinesPage({super.key, required this.petId});

  @override
  State<PetVaccinesPage> createState() => _PetVaccinesPageState();
}

class _PetVaccinesPageState extends State<PetVaccinesPage> {
  bool _loading = true;
  String? _err;

  final _name = TextEditingController();
  final _date = TextEditingController();

  List<Map<String, dynamic>> _rows = [];

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
      final res = await dio.get('/api/pets/${widget.petId}/clinical/vaccinations');
      _rows = ((res.data as List?) ?? []).map((e)=> Map<String,dynamic>.from(e)).toList();
    } catch (e) { _err = e.toString(); }
    finally { setState(()=> _loading = false); }
  }

  Future<void> _add() async {
    final name = _name.text.trim();
    final date = _date.text.trim();
    if (name.isEmpty || date.isEmpty) return;
    final dio = ApiClient.create();
    await dio.post('/api/pets/${widget.petId}/clinical/vaccinations', data: {'name': name, 'date': date});
    _name.clear(); _date.clear();
    await _load();
  }

  Future<void> _save(Map<String, dynamic> r) async {
    final dio = ApiClient.create();
    await dio.patch('/api/pets/${widget.petId}/clinical/vaccinations/${r['id']}', data: {'name': r['name'], 'date': r['date']});
    await _load();
  }

  Future<void> _remove(String id) async {
    final dio = ApiClient.create();
    await dio.delete('/api/pets/${widget.petId}/clinical/vaccinations/$id');
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vacunas')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
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
                                  child: Column(
                                    children: [
                                      TextField(
                                        decoration: const InputDecoration(labelText: 'Nombre'),
                                        controller: TextEditingController(text: r['name'] ?? ''),
                                        onChanged: (v)=> r['name']=v,
                                      ),
                                      const SizedBox(height: 8),
                                      TextField(
                                        decoration: const InputDecoration(labelText: 'Fecha (yyyy-MM-dd)'),
                                        controller: TextEditingController(text: _ymd(r['date'])),
                                        onChanged: (v)=> r['date']=v,
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          ElevatedButton(onPressed: ()=> _save(r), child: const Text('Guardar')),
                                          const Spacer(),
                                          TextButton(
                                            onPressed: ()=> _remove(r['id']),
                                            child: const Text('Eliminar', style: TextStyle(color: Colors.red)),
                                          ),
                                        ],
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
        TextField(decoration: const InputDecoration(labelText: 'Nombre'), controller: _name),
        const SizedBox(height: 8),
        TextField(decoration: const InputDecoration(labelText: 'Fecha (yyyy-MM-dd)'), controller: _date),
        const SizedBox(height: 8),
        ElevatedButton(onPressed: _add, child: const Text('Agregar')),
      ],
    ),
  );
}
