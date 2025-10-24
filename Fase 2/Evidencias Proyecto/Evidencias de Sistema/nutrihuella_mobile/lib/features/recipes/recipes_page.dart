// lib/features/recipes/recipes_page.dart
//
// Ajuste final para guardar correctamente la receta en favoritos.
// Se corrige el cuerpo del POST: ahora envía { recipe: {...}, title, planType, petId }.
// No se altera ninguna otra lógica del flujo ni la UI.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/env.dart';
import '../../core/event_bus.dart';
import '../payments/payment_service.dart';
import '../payments/web_post.dart';
import 'recipe_service.dart';
import 'widgets/recipe_view.dart';

class RecipesPage extends StatefulWidget {
  const RecipesPage({super.key});

  @override
  State<RecipesPage> createState() => _RecipesPageState();
}

class _RecipesPageState extends State<RecipesPage> {
  final _formKey = GlobalKey<FormState>();
  final _promptCtrl = TextEditingController();
  final _svc = RecipeService();

  bool _loadingPets = false;
  bool _generating = false;
  bool _savingFav = false;

  List<Map<String, dynamic>> _pets = [];
  String? _petId;
  bool _usePantry = true;
  RecipePlanKind _plan = RecipePlanKind.almuerzo;

  Map<String, dynamic>? _recipe;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPets();
  }

  @override
  void dispose() {
    _promptCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadPets() async {
    setState(() {
      _loadingPets = true;
      _error = null;
    });
    try {
      final pets = await _svc.loadPets();
      setState(() {
        _pets = pets;
        if (_pets.isNotEmpty) _petId = _pets.first['id']?.toString();
      });
    } catch (e) {
      setState(() => _error = 'No se pudieron cargar mascotas: $e');
    } finally {
      if (mounted) setState(() => _loadingPets = false);
    }
  }

  Future<void> _generate() async {
    if (_petId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona una mascota.')),
      );
      return;
    }
    setState(() {
      _generating = true;
      _recipe = null;
      _error = null;
    });
    try {
      final r = await _svc.generateRecipe(
        petId: _petId!,
        prompt: _promptCtrl.text,
        usePantry: _usePantry,
        plan: _plan,
      );

      final data = r['recipe'] ?? r;
      data['planType'] ??= recipePlanKindToApi(_plan);
      setState(() => _recipe = data);
    } on RecipeLimitException catch (e) {
      await _showRateLimitDialog(e.info);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  // ✅ Corrección final: guardar en favoritos con estructura esperada por backend
  Future<void> _saveFavorite() async {
    if (_recipe == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No hay contenido para guardar.')),
      );
      return;
    }

    setState(() => _savingFav = true);
    try {
      final recipeToSave = {
        'recipe': _recipe, // backend espera este campo
        'title': _recipe!['title'] ?? 'Receta generada',
        'planType': _recipe!['planType'] ?? recipePlanKindToApi(_plan),
        'petId': _petId,
      };

      await _svc.saveFavorite(recipeToSave);

      if (!mounted) return;
      eventBus.fire(FavoriteAddedEvent());

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Receta guardada en favoritos.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo guardar: $e')),
      );
    } finally {
      if (mounted) setState(() => _savingFav = false);
    }
  }

  String _labelFor(RecipePlanKind k) {
    switch (k) {
      case RecipePlanKind.desayuno:
        return 'Desayuno';
      case RecipePlanKind.almuerzo:
        return 'Almuerzo';
      case RecipePlanKind.cena:
        return 'Cena';
      case RecipePlanKind.planDiario:
        return 'Plan diario';
      case RecipePlanKind.planSemanal:
        return 'Plan semanal';
    }
  }

  Future<void> _goToPlus() async {
    try {
      final ps = await PaymentService.create();
      final tx = await ps.init(amount: 11990, finalUrl: ApiPaths.webpayReturn);
      if (!mounted) return;
      context.pushNamed(
        'profile-upgrade',
        extra: WebPostRequest(
          action: tx.url,
          fields: {'token_ws': tx.token},
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo iniciar el pago: $e')),
      );
    }
  }

  Future<void> _showRateLimitDialog(RateLimitInfo info) async {
    final df = DateFormat('dd/MM/yyyy HH:mm');
    final resetText = info.reset != null ? df.format(info.reset!) : 'más tarde';
    final limitText = info.limit?.toString() ?? 'tu';
    final usedText = (info.limit != null && info.remaining != null)
        ? (info.limit! - (info.remaining! < 0 ? 0 : info.remaining!)).toString()
        : 'tus';

    return showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.hourglass_disabled_outlined),
            SizedBox(width: 8),
            Expanded(child: Text('Has alcanzado tu límite diario')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Has usado $usedText de $limitText generaciones de receta por hoy.'),
            const SizedBox(height: 8),
            Text('Se renovarán el: $resetText.', style: TextStyle(color: Colors.grey[700])),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.withOpacity(0.3)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('Actualiza a Plus para aumentar tus generaciones.'),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Volver'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _goToPlus();
            },
            child: const Text('Actualizar a Plus'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Generación de recetas con IA'), centerTitle: true),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: ListView(
          children: [
            Card(
              margin: const EdgeInsets.only(top: 8),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.auto_awesome),
                          const SizedBox(width: 8),
                          Text('Generar receta con IA',
                              style: Theme.of(context).textTheme.titleMedium),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (_loadingPets)
                        const CircularProgressIndicator(strokeWidth: 2)
                      else if (_pets.isEmpty)
                        const Text('No hay mascotas disponibles.')
                      else
                        DropdownButtonFormField<String>(
                          value: _petId,
                          decoration: const InputDecoration(
                            labelText: 'Mascota',
                            border: OutlineInputBorder(),
                          ),
                          items: _pets
                              .map((p) => DropdownMenuItem<String>(
                                    value: p['id']?.toString(),
                                    child: Text(p['name'] ?? '—'),
                                  ))
                              .toList(),
                          onChanged: (v) => setState(() => _petId = v),
                        ),

                      const SizedBox(height: 12),

                      DropdownButtonFormField<RecipePlanKind>(
                        value: _plan,
                        decoration: const InputDecoration(
                          labelText: 'Tipo de plan',
                          border: OutlineInputBorder(),
                        ),
                        items: RecipePlanKind.values
                            .map((k) => DropdownMenuItem<RecipePlanKind>(
                                  value: k,
                                  child: Text(_labelFor(k)),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) setState(() => _plan = v);
                        },
                      ),

                      const SizedBox(height: 12),

                      TextFormField(
                        controller: _promptCtrl,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Indicaciones (opcional)',
                          hintText: 'Ej: sin pollo, bajo en grasa…',
                          border: OutlineInputBorder(),
                        ),
                      ),

                      const SizedBox(height: 8),

                      SwitchListTile.adaptive(
                        value: _usePantry,
                        onChanged: (v) => setState(() => _usePantry = v),
                        title: const Text('Usar mi despensa'),
                        subtitle: const Text(
                          'Si está activado, la IA intentará aprovechar los ingredientes disponibles.',
                        ),
                        contentPadding: EdgeInsets.zero,
                      ),

                      const SizedBox(height: 8),

                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: _generating ? null : _generate,
                          icon: _generating
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.auto_awesome),
                          label: const Text('Generar receta'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            if (_recipe != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: RecipeView(recipe: _recipe!),
                ),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _savingFav ? null : _saveFavorite,
                icon: _savingFav
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.bookmark_add_outlined),
                label: const Text('Guardar en favoritos'),
              ),
            ],

            if (_error != null) ...[
              const SizedBox(height: 8),
              Text('Error: $_error', style: const TextStyle(color: Colors.red)),
            ],
          ],
        ),
      ),
    );
  }
}
