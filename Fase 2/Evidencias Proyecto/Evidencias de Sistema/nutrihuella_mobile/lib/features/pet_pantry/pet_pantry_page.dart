import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class PetPantryPage extends StatefulWidget {
  final String petId;
  const PetPantryPage({super.key, required this.petId});

  @override
  State<PetPantryPage> createState() => _PetPantryPageState();
}

class _PetPantryPageState extends State<PetPantryPage> {
  bool _loading = true;
  String? _err;

  Map<String, dynamic>? _data;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _err = null; });
    final dio = ApiClient.create();
    try {
      final res = await dio.get('/api/pets/${widget.petId}/pantry-usable');
      _data = (res.data ?? {}) as Map<String,dynamic>;
    } catch (e) { _err = e.toString(); }
    finally { setState(()=> _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final data = _data;
    final petName = data?['pet']?['name'] ?? '';

    final aptos = (data?['aptos'] as List?)?.map((e)=> Map<String,dynamic>.from(e)).toList() ?? <Map<String,dynamic>>[];
    final prohibidos = (data?['prohibidos'] as List?)?.map((e)=> Map<String,dynamic>.from(e)).toList() ?? <Map<String,dynamic>>[];

    return Scaffold(
      appBar: AppBar(title: Text('Despensa para $petName')),
      body: _loading ? const Center(child: CircularProgressIndicator()) :
      _err != null ? Center(child: Text(_err!, style: const TextStyle(color: Colors.red))) :
      RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _section('Aptos (${aptos.length})', aptos, preferredChip: true),
            const SizedBox(height: 12),
            _section('Prohibidos / Evitar (${prohibidos.length})', prohibidos),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xffF8FAFC), borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xffe5e7eb))
              ),
              child: const Text(
                'Vista de solo lectura. Para gestionar inventario ve a /pantry. '
                'La IA usará “Aptos” + ficha nutricional para crear planes personalizados.',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, List<Map<String,dynamic>> items, {bool preferredChip = false}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white, borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xffe5e7eb)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(padding: const EdgeInsets.all(12), decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: Color(0xffe5e7eb)))
          ), child: Text(title, style: const TextStyle(fontWeight: FontWeight.w600))),
          if (items.isEmpty)
            const Padding(
              padding: EdgeInsets.all(12),
              child: Text('Sin registros.'),
            )
          else
            ...items.map((i) => Padding(
              padding: const EdgeInsets.all(12.0),
              child: Row(
                children: [
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(i['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text('${i['category'] ?? 'OTROS'} • ${i['quantity'] ?? '—'} ${i['unit'] ?? ''}', style: const TextStyle(color: Colors.black54)),
                      if (i['expiresAt'] != null)
                        Text('Caduca: ${(i['expiresAt'] as String).substring(0,10)}', style: const TextStyle(color: Colors.black45, fontSize: 12)),
                    ],
                  )),
                  if (preferredChip && i['preferred'] == true)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: const Color(0xffD1FAE5), borderRadius: BorderRadius.circular(999)),
                      child: const Text('Preferido', style: TextStyle(color: Color(0xff065F46), fontSize: 12)),
                    ),
                ],
              ),
            )),
        ],
      ),
    );
  }
}
