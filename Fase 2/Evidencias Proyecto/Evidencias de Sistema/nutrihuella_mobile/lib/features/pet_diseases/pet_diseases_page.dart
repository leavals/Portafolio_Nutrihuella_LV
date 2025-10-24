import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class PetDiseasesPage extends StatefulWidget {
  final String petId;
  const PetDiseasesPage({super.key, required this.petId});

  @override
  State<PetDiseasesPage> createState() => _PetDiseasesPageState();
}

class _PetDiseasesPageState extends State<PetDiseasesPage> {
  bool _loading = true;
  String? _err;

  final _name = TextEditingController();
  final _date = TextEditingController();
  String _status = 'ACTIVE';

  List<Map<String, dynamic>> _rows = [];
  String? _editingId;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _err = null; _editingId = null; });
    final dio = ApiClient.create();
    try {
      final res = await dio.get('/api/pets/${widget.petId}/clinical/diseases');
      final list = (res.data as List?) ?? [];
      _rows = list.map((e) => Map<String,dynamic>.from(e)).toList();
    } catch (e) {
      _err = e.toString();
    } finally { setState(() => _loading = false); }
  }

  String _ymd(dynamic iso) {
    if (iso == null || (iso is String && iso.isEmpty)) return '';
    try { return DateTime.parse(iso.toString()).toIso8601String().substring(0,10); }
    catch (_) { return ''; }
  }

  Future<void> _add() async {
    final name = _name.text.trim();
    final date = _date.text.trim();
    if (name.isEmpty || date.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nombre y fecha requeridos')));
      return;
    }
    final dio = ApiClient.create();
    await dio.post('/api/pets/${widget.petId}/clinical/diseases', data: {
      'name': name, 'diagnosedAt': date, 'status': _status
    });
    _name.clear(); _date.clear(); _status = 'ACTIVE';
    await _load();
  }

  Future<void> _save(Map<String, dynamic> row) async {
    final dio = ApiClient.create();
    await dio.patch('/api/pets/${widget.petId}/clinical/diseases/${row['id']}', data: {
      'diagnosedAt': row['diagnosedAt'],
      'status': row['status'],
    });
    setState(() => _editingId = null);
    await _load();
  }

  Future<void> _remove(String id) async {
    final dio = ApiClient.create();
    await dio.delete('/api/pets/${widget.petId}/clinical/diseases/$id');
    await _load();
  }

  Future<void> _ackNoDiseases() async {
    final dio = ApiClient.create();
    await dio.post('/api/pets/${widget.petId}/diseases/no-diseases-ack');
    if (!mounted) return;
    Navigator.of(context).pop(); // o vuelve a detalles
  }

  @override
  Widget build(BuildContext context) {
    final showAck = _rows.isEmpty; // en wizard podrías condicionar

    return Scaffold(
      appBar: AppBar(title: const Text('Enfermedades')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (showAck)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: const Color(0xffFEF3C7),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xffF59E0B))
                ),
                child: Row(
                  children: [
                    const Expanded(child: Text('Agrega enfermedades o confirma que no tiene.')),
                    OutlinedButton(onPressed: _ackNoDiseases, child: const Text('No tiene enfermedades')),
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
                                final isEditing = _editingId == r['id'];
                                return Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white, borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xffe5e7eb))
                                  ),
                                  child: Column(
                                    children: [
                                      TextField(readOnly: true, enabled: false,
                                        decoration: const InputDecoration(labelText: 'Nombre'),
                                        controller: TextEditingController(text: r['name'] ?? ''),
                                      ),
                                      const SizedBox(height: 8),
                                      TextField(
                                        decoration: const InputDecoration(labelText: 'Fecha diagnóstico (yyyy-MM-dd)'),
                                        controller: TextEditingController(text: _ymd(r['diagnosedAt'])),
                                        readOnly: !isEditing, enabled: isEditing,
                                        onChanged: (v)=> r['diagnosedAt']=v,
                                      ),
                                      const SizedBox(height: 8),
                                      InputDecorator(
                                        decoration: const InputDecoration(labelText: 'Estado'),
                                        child: DropdownButtonHideUnderline(
                                          child: DropdownButton<String>(
                                            isExpanded: true,
                                            value: (r['status'] ?? 'ACTIVE') as String,
                                            items: const [
                                              DropdownMenuItem(value: 'ACTIVE', child: Text('Activa')),
                                              DropdownMenuItem(value: 'RESOLVED', child: Text('Resuelta')),
                                              DropdownMenuItem(value: 'CRONIC', child: Text('Crónica')),
                                            ],
                                            onChanged: isEditing ? (v)=> setState(()=> r['status']=v) : null,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          if (!isEditing)
                                            OutlinedButton(onPressed: ()=> setState(()=> _editingId=r['id']), child: const Text('Editar'))
                                          else ...[
                                            ElevatedButton(onPressed: ()=> _save(r), child: const Text('Guardar')),
                                            const SizedBox(width: 8),
                                            OutlinedButton(onPressed: ()=> setState(()=> _editingId=null), child: const Text('Cancelar')),
                                          ],
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
        TextField(decoration: const InputDecoration(labelText: 'Fecha diagnóstico (yyyy-MM-dd)'), controller: _date),
        const SizedBox(height: 8),
        InputDecorator(
          decoration: const InputDecoration(labelText: 'Estado'),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true, value: _status,
              onChanged: (v)=> setState(()=> _status=v ?? 'ACTIVE'),
              items: const [
                DropdownMenuItem(value:'ACTIVE', child: Text('Activa')),
                DropdownMenuItem(value:'RESOLVED', child: Text('Resuelta')),
                DropdownMenuItem(value:'CRONIC', child: Text('Crónica')),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        ElevatedButton(onPressed: _add, child: const Text('Agregar')),
      ],
    ),
  );
}
