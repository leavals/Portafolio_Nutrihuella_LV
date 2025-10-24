// lib/features/recipes/widgets/recipe_view.dart
//
// Renderizado flexible de recetas:
// - Soporta el shape antiguo: { ingredients, steps, summary }
// - Y el shape del frontend web: { title, totalDailyKcal, meals: [ {name, instructions, ingredients[]/items[]} ], warnings, notes }
//
// Si vienen "meals", se muestran por bloque (como en la web).
// Si no, se muestra la versión simple Ingredientes/Pasos.

import 'package:flutter/material.dart';

class RecipeView extends StatelessWidget {
  const RecipeView({super.key, required this.recipe});

  final Map<String, dynamic> recipe;

  List _asList(dynamic v) {
    if (v == null) return const [];
    if (v is List) return v;
    if (v is String) {
      return v
          .split(RegExp(r'\r?\n'))
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();
    }
    return const [];
  }

  @override
  Widget build(BuildContext context) {
    final title = (recipe['title'] ?? recipe['name'] ?? 'Receta generada').toString();
    final summary = (recipe['summary'] ?? recipe['resumen'] ?? '').toString();

    final mealsRaw = recipe['meals'] ?? recipe['menu'];
    final meals = _asList(mealsRaw);

    final totalDailyKcal = recipe['totalDailyKcal'] ?? recipe['kcal'] ?? recipe['calories'];

    // Shape moderno (con meals): bloques por comida
    if (meals.isNotEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          if (totalDailyKcal != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Kcal diarias (estimadas): ${totalDailyKcal.toString()}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          const SizedBox(height: 12),
          if (summary.isNotEmpty) ...[
            Text(summary),
            const SizedBox(height: 12),
          ],
          ...meals.map<Widget>((m) {
            final Map mm = (m is Map) ? m : const {};
            final name = (mm['name'] ?? mm['title'] ?? 'Comida').toString();
            final instr = (mm['instructions'] ?? mm['instrucciones'] ?? '').toString();

            // ingredientes puede llegar como lista de objetos o strings, o como "items"
            final rawIngs = mm['ingredients'] ?? mm['ingredientes'] ?? mm['items'];
            final ings = _asList(rawIngs);

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8EB),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.orange.withOpacity(0.25)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.w700)),
                  if (instr.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text('Instrucciones:', style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 2),
                    Text(instr),
                  ],
                  const SizedBox(height: 6),
                  Text('Ingredientes:', style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 2),
                  if (ings.isEmpty)
                    const Text('—')
                  else
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: ings.map<Widget>((it) {
                        String line;
                        if (it is Map) {
                          final name = (it['name'] ?? it['ingrediente'] ?? '').toString();
                          final qty = (it['qty'] ?? it['quantity'] ?? '').toString();
                          final unit = (it['unit'] ?? '').toString();
                          final sep = qty.isNotEmpty ? ' ' : '';
                          final right = [qty, unit].where((x) => x.toString().trim().isNotEmpty).join(sep);
                          line = right.isNotEmpty ? '$name: $right' : name;
                        } else {
                          line = it.toString();
                        }
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('• '),
                              Expanded(child: Text(line)),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                ],
              ),
            );
          }).toList(),
          // Warnings / notas si existen
          if ((recipe['notes'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('Notas:', style: Theme.of(context).textTheme.bodyMedium),
            Text((recipe['notes']).toString()),
          ],
          if (recipe['warnings'] is List && (recipe['warnings'] as List).isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('Advertencias:', style: Theme.of(context).textTheme.bodyMedium),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: (recipe['warnings'] as List).map<Widget>((w) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• '),
                      Expanded(child: Text(w.toString())),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      );
    }

    // Fallback: shape simple (ingredients/steps)
    final rawIngredients = recipe['ingredients'] ?? recipe['ingredientes'];
    final ingredients = _asList(rawIngredients);
    final rawSteps = recipe['steps'] ?? recipe['instrucciones'] ?? recipe['instructions'];
    final steps = _asList(rawSteps);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        if (summary.isNotEmpty) ...[
          Text(summary),
          const SizedBox(height: 12),
        ],
        Text('Ingredientes', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        if (ingredients.isEmpty)
          const Text('—')
        else
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: ingredients.map<Widget>((it) {
              String line;
              if (it is Map) {
                final name = (it['name'] ?? it['ingrediente'] ?? '').toString();
                final qty = (it['quantity'] ?? it['qty'] ?? '').toString();
                final unit = (it['unit'] ?? '').toString();
                final sep = qty.isNotEmpty ? ' ' : '';
                line = [qty, unit].where((x) => x.toString().trim().isNotEmpty).join(sep);
                line = line.isNotEmpty ? '$name — $line' : name;
              } else {
                line = it.toString();
              }
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• '),
                    Expanded(child: Text(line)),
                  ],
                ),
              );
            }).toList(),
          ),
        const SizedBox(height: 16),
        Text('Pasos', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        if (steps.isEmpty)
          const Text('—')
        else
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (int i = 0; i < steps.length; i++)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${i + 1}. '),
                      Expanded(child: Text(steps[i].toString())),
                    ],
                  ),
                ),
            ],
          ),
      ],
    );
  }
}
