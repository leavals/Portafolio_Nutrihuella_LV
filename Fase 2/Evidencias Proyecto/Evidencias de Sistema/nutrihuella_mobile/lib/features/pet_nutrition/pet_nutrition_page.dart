import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class PetNutritionPage extends StatefulWidget {
  final String petId;
  const PetNutritionPage({super.key, required this.petId});

  @override
  State<PetNutritionPage> createState() => _PetNutritionPageState();
}

class _PetNutritionPageState extends State<PetNutritionPage> {
  bool _loading = true;
  bool _editing = false;
  bool _hasExisting = false;
  String? _msg;
  String? _err;

  String dietType = 'MIXED';
  int mealsPerDay = 2;
  String activityLevel = 'MODERATE';
  String goal = 'MAINTENANCE';
  String preferredFoods = '';
  String forbiddenFoods = '';
  String intolerances = '';
  String foodAllergies = '';
  String supplements = '';
  String dailyCalories = '';
  String waterIntakeMl = '';
  String notes = '';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _msg = null; _err = null; });
    final dio = ApiClient.create();
    try {
      final res = await dio.get('/api/pets/${widget.petId}/nutrition');
      final data = (res.data ?? {}) as Map;
      _hasExisting = data.isNotEmpty;
      dietType = (data['dietType'] ?? 'MIXED') as String;
      mealsPerDay = (data['mealsPerDay'] ?? 2) as int;
      activityLevel = (data['activityLevel'] ?? 'MODERATE') as String;
      goal = (data['goal'] ?? 'MAINTENANCE') as String;
      preferredFoods = (data['preferredFoods'] as List?)?.join(', ') ?? '';
      forbiddenFoods = (data['forbiddenFoods'] as List?)?.join(', ') ?? '';
      intolerances = (data['intolerances'] as List?)?.join(', ') ?? '';
      foodAllergies = (data['foodAllergies'] as List?)?.join(', ') ?? '';
      supplements = (data['supplements'] as List?)?.join(', ') ?? '';
      dailyCalories = data['dailyCalories']?.toString() ?? '';
      waterIntakeMl = data['waterIntakeMl']?.toString() ?? '';
      notes = data['notes']?.toString() ?? '';

      _editing = !_hasExisting; // primera vez => edición
    } catch (e) {
      _err = e.toString();
    } finally { setState(() => _loading = false); }
  }

  List<String> _csvToArr(String s) =>
      s.split(',').map((v) => v.trim()).where((v) => v.isNotEmpty).toList();

  Future<void> _save() async {
    setState(() { _msg = null; _err = null; });
    final dio = ApiClient.create();
    try {
      await dio.put('/api/pets/${widget.petId}/nutrition', data: {
        'dietType': dietType,
        'mealsPerDay': mealsPerDay,
        'activityLevel': activityLevel,
        'goal': goal,
        'preferredFoods': _csvToArr(preferredFoods),
        'forbiddenFoods': _csvToArr(forbiddenFoods),
        'intolerances': _csvToArr(intolerances),
        'foodAllergies': _csvToArr(foodAllergies),
        'supplements': _csvToArr(supplements),
        'dailyCalories': dailyCalories.isEmpty ? null : int.parse(dailyCalories),
        'waterIntakeMl': waterIntakeMl.isEmpty ? null : int.parse(waterIntakeMl),
        'notes': notes.isEmpty ? null : notes,
      });
      setState(() { _msg = 'Ficha nutricional guardada.'; _editing = false; _hasExisting = true; });
    } catch (e) {
      setState(() => _err = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nutrición'),
        actions: [
          if (!_loading && _hasExisting && !_editing)
            TextButton(onPressed: () => setState(()=>_editing = true), child: const Text('Editar', style: TextStyle(color: Colors.white)))
        ],
      ),
      body: _loading ? const Center(child: CircularProgressIndicator())
        : Padding(
          padding: const EdgeInsets.all(16),
          child: _editing ? _editForm() : _summary(),
        ),
    );
  }

  Widget _summary() => ListView(
    children: [
      if (_msg != null) _alert(_msg!, Colors.green),
      if (_err != null) _alert(_err!, Colors.red),
      _kv('Tipo de dieta', dietType),
      _kv('Comidas/día', mealsPerDay.toString()),
      _kv('Actividad', activityLevel),
      _kv('Meta', goal),
      _kv('Preferidos', preferredFoods.isEmpty ? '—' : preferredFoods),
      _kv('Prohibidos', forbiddenFoods.isEmpty ? '—' : forbiddenFoods),
      _kv('Intolerancias', intolerances.isEmpty ? '—' : intolerances),
      _kv('Alergias alim.', foodAllergies.isEmpty ? '—' : foodAllergies),
      _kv('Suplementos', supplements.isEmpty ? '—' : supplements),
      _kv('Calorías/día', dailyCalories.isEmpty ? '—' : '$dailyCalories kcal'),
      _kv('Agua (ml)', waterIntakeMl.isEmpty ? '—' : '$waterIntakeMl ml'),
      _kv('Notas', notes.isEmpty ? '—' : notes),
    ],
  );

  Widget _editForm() => ListView(
    children: [
      if (_msg != null) _alert(_msg!, Colors.green),
      if (_err != null) _alert(_err!, Colors.red),
      _dropdown('Tipo de dieta', dietType, ['RAW','COOKED','COMMERCIAL','MIXED'], (v)=> setState(()=>dietType=v!)),
      _numField('Comidas/día', mealsPerDay, (v)=> setState(()=>mealsPerDay=v)),
      _dropdown('Actividad', activityLevel, ['LOW','MODERATE','HIGH'], (v)=> setState(()=>activityLevel=v!)),
      _dropdown('Meta', goal, ['MAINTENANCE','GAIN','LOSS'], (v)=> setState(()=>goal=v!)),
      _text('Preferidos (CSV)', preferredFoods, (v)=> setState(()=>preferredFoods=v)),
      _text('Prohibidos (CSV)', forbiddenFoods, (v)=> setState(()=>forbiddenFoods=v)),
      _text('Intolerancias (CSV)', intolerances, (v)=> setState(()=>intolerances=v)),
      _text('Alergias alimentarias (CSV)', foodAllergies, (v)=> setState(()=>foodAllergies=v)),
      _text('Suplementos (CSV)', supplements, (v)=> setState(()=>supplements=v)),
      _text('Calorías/día', dailyCalories, (v)=> setState(()=>dailyCalories=v), keyboard: TextInputType.number),
      _text('Agua (ml)', waterIntakeMl, (v)=> setState(()=>waterIntakeMl=v), keyboard: TextInputType.number),
      _area('Notas', notes, (v)=> setState(()=>notes=v)),
      const SizedBox(height: 12),
      Row(children: [
        ElevatedButton(onPressed: _save, child: const Text('Guardar')),
        const SizedBox(width: 8),
        if (_hasExisting) OutlinedButton(onPressed: ()=> setState(()=>_editing=false), child: const Text('Cancelar')),
      ]),
    ],
  );

  Widget _kv(String k, String v) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(children: [
      SizedBox(width: 160, child: Text(k, style: const TextStyle(color: Colors.grey))),
      Expanded(child: Text(v)),
    ]),
  );

  Widget _dropdown(String label, String value, List<String> items, ValueChanged<String?> onChanged) =>
    Padding(padding: const EdgeInsets.only(bottom: 12),
      child: InputDecorator(decoration: InputDecoration(labelText: label),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(isExpanded: true, value: value, items: items.map((e)=>DropdownMenuItem(value:e, child: Text(e))).toList(), onChanged: onChanged),
        ),
      ),
    );

  Widget _numField(String label, int val, ValueChanged<int> onChanged) =>
    Padding(padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        initialValue: '$val', decoration: InputDecoration(labelText: label), keyboardType: TextInputType.number,
        onChanged: (s){ final v = int.tryParse(s) ?? val; onChanged(v); },
      ),
    );

  Widget _text(String label, String v, ValueChanged<String> onChanged, {TextInputType? keyboard}) =>
    Padding(padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(initialValue: v, decoration: InputDecoration(labelText: label), keyboardType: keyboard, onChanged: onChanged),
    );

  Widget _area(String label, String v, ValueChanged<String> onChanged) =>
    Padding(padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(initialValue: v, decoration: InputDecoration(labelText: label), maxLines: 4, onChanged: onChanged),
    );

  Widget _alert(String t, Color color) => Container(
    width: double.infinity, padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: color.withOpacity(.08), borderRadius: BorderRadius.circular(12)),
    child: Text(t, style: TextStyle(color: color)),
  );
}
