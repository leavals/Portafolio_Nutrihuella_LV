// lib/features/favorites/favorite_list_page.dart
//
// Lista de favoritos con actualización en tiempo real y expansión por ítem.
// - Se escucha FavoriteAddedEvent para refrescar automáticamente.
// - Al tocar una tarjeta, se expande/contrae y muestra detalle completo
//   (kcal, comidas, instrucciones, ingredientes, notas).

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../recipes/recipe_service.dart';
import '../../core/event_bus.dart';

final favoriteListProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final svc = RecipeService();
  return await svc.favorites();
});

class FavoriteListPage extends ConsumerStatefulWidget {
  const FavoriteListPage({super.key});

  @override
  ConsumerState<FavoriteListPage> createState() => _FavoriteListPageState();
}

class _FavoriteListPageState extends ConsumerState<FavoriteListPage> {
  StreamSubscription? _favSub;

  // IDs expandidos
  final Set<String> _expanded = {};

  @override
  void initState() {
    super.initState();
    _favSub = eventBus.on<FavoriteAddedEvent>().listen((_) {
      ref.invalidate(favoriteListProvider);
    });
  }

  @override
  void dispose() {
    _favSub?.cancel();
    super.dispose();
  }

  Future<void> _confirmDelete(
      BuildContext context, WidgetRef ref, Map<String, dynamic> recipe) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Eliminar receta'),
        content: Text(
            '¿Deseas eliminar "${recipe['title'] ?? 'esta receta'}" de tus favoritos?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Volver'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade400,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final svc = RecipeService();
      await svc.removeFavorite(recipe['id']);
      ref.invalidate(favoriteListProvider);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Receta "${recipe['title'] ?? 'sin título'}" eliminada de favoritos.',
          ),
        ),
      );
    }
  }

  // ---------- Helpers ----------

  String _fmtQtyUnit(dynamic qty, dynamic unit) {
    final q = (qty == null) ? '' : qty.toString();
    final u = (unit == null) ? '' : unit.toString();
    if (q.isEmpty && u.isEmpty) return '';
    if (q.isNotEmpty && u.isEmpty) return q;
    if (q.isEmpty && u.isNotEmpty) return u;
    return '$q $u';
  }

  Widget _buildMealCard(Map<String, dynamic> meal) {
    final name = (meal['name'] ?? '').toString();
    final instructions = (meal['instructions'] ?? '').toString();

    final ingredients = (meal['ingredients'] is List)
        ? (meal['ingredients'] as List)
            .whereType<Map>()
            .map((m) => m.cast<String, dynamic>())
            .toList()
        : const <Map<String, dynamic>>[];

    final children = <Widget>[
      Text(
        name,
        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ];

    if (instructions.isNotEmpty) {
      children.addAll(const [
        SizedBox(height: 8),
        Text('Instrucciones:', style: TextStyle(fontWeight: FontWeight.w600)),
        SizedBox(height: 4),
      ]);
      children.add(Text(instructions));
    }

    if (ingredients.isNotEmpty) {
      children.addAll(const [
        SizedBox(height: 8),
        Text('Ingredientes:', style: TextStyle(fontWeight: FontWeight.w600)),
        SizedBox(height: 4),
      ]);
      children.addAll(ingredients.map((ing) {
        final n = (ing['name'] ?? '').toString();
        final qty = ing['qty'] ?? ing['quantity'];
        final unit = ing['unit'];
        final tail = _fmtQtyUnit(qty, unit);
        final text = tail.isNotEmpty ? '• $n: $tail' : '• $n';
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Text(text),
        );
      }));
    }

    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF4E8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _buildRecipeDetail(Map<String, dynamic> recipeJson) {
    final kcal = recipeJson['totalDailyKcal'];
    final notes = (recipeJson['notes'] ?? '').toString();

    final meals = (recipeJson['meals'] is List)
        ? (recipeJson['meals'] as List)
            .whereType<Map>()
            .map((m) => m.cast<String, dynamic>())
            .toList()
        : const <Map<String, dynamic>>[];

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (kcal != null) ...[
            Text(
              'Kcal diarias (estimadas): $kcal',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
            ),
            const SizedBox(height: 6),
          ],
          ...meals.map<Widget>(_buildMealCard),
          if (notes.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('Notas:', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(notes),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final favsAsync = ref.watch(favoriteListProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAF4),
      appBar: AppBar(
        title: const Text(
          'Tus Recetas Favoritas',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: const Color(0xFFF6F6ED),
      ),
      body: favsAsync.when(
        data: (items) {
          if (items.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Aún no tienes recetas favoritas guardadas.',
                  style: TextStyle(fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(favoriteListProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemCount: items.length,
              itemBuilder: (context, i) {
                final row = items[i];

                final id = (row['id'] ?? '').toString();
                final title = row['title']?.toString() ?? 'Sin título';
                final plan =
                    row['planType']?.toString().toUpperCase() ?? '';
                final createdAt = row['createdAt']?.toString() ?? '';
                final recipeJson = (row['recipe'] is Map)
                    ? (row['recipe'] as Map).cast<String, dynamic>()
                    : <String, dynamic>{};

                final isExpanded = _expanded.contains(id);

                return Card(
                  elevation: 1.5,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: Colors.grey.shade300),
                  ),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () {
                      setState(() {
                        if (isExpanded) {
                          _expanded.remove(id);
                        } else {
                          _expanded.add(id);
                        }
                      });
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Encabezado
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      title,
                                      style: const TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    if (plan.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        plan,
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: Colors.grey.shade600,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                    if (createdAt.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        createdAt,
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey.shade500,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(
                                isExpanded
                                    ? Icons.keyboard_arrow_up
                                    : Icons.keyboard_arrow_down,
                              ),
                            ],
                          ),

                          // Cuerpo expandible
                          AnimatedCrossFade(
                            firstChild: const SizedBox.shrink(),
                            secondChild: recipeJson.isEmpty
                                ? const SizedBox.shrink()
                                : _buildRecipeDetail(recipeJson),
                            crossFadeState: isExpanded
                                ? CrossFadeState.showSecond
                                : CrossFadeState.showFirst,
                            duration: const Duration(milliseconds: 200),
                          ),

                          const SizedBox(height: 12),
                          Align(
                            alignment: Alignment.centerRight,
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.delete_outline),
                              label: const Text('Eliminar'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.red.shade400,
                                side: BorderSide(color: Colors.red.shade300),
                              ),
                              onPressed: () =>
                                  _confirmDelete(context, ref, row),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Error al cargar favoritos: $e',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}
