/// lib/features/recipes/recipe_generator_page.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../pets/pet_list_page.dart';
import '../pets/pet_model.dart';
import 'recipe_service.dart';
import 'recipe_models.dart';
import '../favorites/favorite_list_page.dart';

class RecipeGeneratorPage extends ConsumerStatefulWidget {
  const RecipeGeneratorPage({super.key});
  @override
  ConsumerState<RecipeGeneratorPage> createState() => _RecipeGeneratorPageState();
}

class _RecipeGeneratorPageState extends ConsumerState<RecipeGeneratorPage> {
  String? selectedPetId;
  String planType = 'DAILY';
  String? goal;
  Recipe? result;
  bool loading = false;

  @override
  Widget build(BuildContext context) {
    final petsAsync = ref.watch(petListProvider);

    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Generar receta', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          petsAsync.when(
            data: (pets) => DropdownButtonFormField<String>(
              value: selectedPetId,
              decoration: const InputDecoration(labelText: 'Mascota (opcional)'),
              items: [
                const DropdownMenuItem(value: null, child: Text('Ninguna')),
                ...pets.map((p) => DropdownMenuItem(value: p.id, child: Text(p.name))),
              ],
              onChanged: loading ? null : (v) => setState(() => selectedPetId = v),
            ),
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => Text('Error al cargar mascotas: $e'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField(
            value: planType,
            decoration: const InputDecoration(labelText: 'Tipo de plan'),
            items: const [
              DropdownMenuItem(value: 'DAILY', child: Text('Diario')),
              DropdownMenuItem(value: 'WEEKLY', child: Text('Semanal')),
            ],
            onChanged: loading ? null : (v) => setState(() => planType = v as String),
          ),
          const SizedBox(height: 12),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Objetivo (opcional)', hintText: 'Mantenimiento / Bajar peso / Ganar masa'),
            enabled: !loading,
            onChanged: (v) => goal = v.trim().isEmpty ? null : v.trim(),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            icon: loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.auto_awesome),
            label: Text(loading ? 'Generando (1–2 min)...' : 'Generar'),
            onPressed: loading ? null : () async {
              setState(() { loading = true; result = null; });
              try {
                final svc = await ref.read(recipeServiceProvider.future);
                final recipe = await svc.generate(petId: selectedPetId, planType: planType, goal: goal);
                setState(() => result = recipe);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al generar: $e')));
                }
              } finally {
                if (mounted) setState(() => loading = false);
              }
            },
          ),
          const SizedBox(height: 16),
          if (result != null) ...[
            const Divider(),
            Text('Resultado', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            _RecipeView(recipe: result!),
            const SizedBox(height: 12),
            FilledButton.icon(
              icon: const Icon(Icons.bookmark_add_outlined),
              label: const Text('Guardar en favoritos'),
              onPressed: () async {
                final svc = await ref.read(recipeServiceProvider.future);
                await svc.saveFavorite(result!);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Guardado en favoritos')));
                  ref.invalidate(favoriteListProvider);
                }
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _RecipeView extends StatelessWidget {
  final Recipe recipe;
  const _RecipeView({required this.recipe});

  @override
  Widget build(BuildContext context) {
    Map<String, dynamic>? map;
    try { map = json.decode(recipe.contentJson) as Map<String, dynamic>; } catch (_) {}
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: map == null ? Text(recipe.contentJson) : Text(const JsonEncoder.withIndent('  ').convert(map)),
      ),
    );
  }
}
