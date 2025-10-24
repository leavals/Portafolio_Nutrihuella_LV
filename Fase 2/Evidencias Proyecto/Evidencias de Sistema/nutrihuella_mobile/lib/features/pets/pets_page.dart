// lib/features/pets/pets_page.dart
//
// Cambios mínimos y focalizados:
// - Se agrega un “tick de recarga” (_reloadTick) y una Key variable al PetListPage.
//   Cada vez que volvemos de crear/eliminar (pop(true)), incrementamos el tick,
//   forzando a que PetListPage se reconstruya desde cero (initState incluido).
// - El FAB vive aquí (tab Mascotas) y abre la ruta con nombre 'pet-new'.
// - PetListPage se usa en modo embebido (embedded: true) para NO duplicar AppBar/FAB.
// - No se modifica ningún otro tab, estilo o dependencia.
//
// Notas de integración:
// - Cualquier pantalla que cree/edite/elimine una mascota debe hacer `context.pop(true)`
//   al regresar para que este Scaffold incremente el _reloadTick y fuerce la recarga.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'pet_list_page.dart';
import '../profile/profile_page.dart';

class PetsPage extends StatefulWidget {
  const PetsPage({super.key});

  @override
  State<PetsPage> createState() => _PetsPageState();
}

class _PetsPageState extends State<PetsPage> {
  int _index = 0;

  // Tick de recarga para forzar que PetListPage se reconstruya
  // y ejecute su ciclo de carga cada vez que cambie este valor.
  int _reloadTick = 0;

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      // Usamos PetListPage en modo embebido y con Key basada en _reloadTick.
      // Cada incremento de _reloadTick monta de nuevo el widget (initState -> recarga).
      PetListPage(key: ValueKey<int>(_reloadTick), embedded: true), // Mascotas
      const _SimplePlaceholder('Despensa'),                         // Despensa
      const _SimplePlaceholder('Recetas'),                          // Recetas
      const _SimplePlaceholder('Favoritos'),                        // Favoritos
      const ProfilePage(),                                          // Perfil
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('NutriHuella')),
      body: pages[_index],

      // FAB solo visible en el tab de Mascotas.
      floatingActionButton: _index == 0
          ? FloatingActionButton.extended(
              onPressed: () async {
                // Abre el formulario de nueva mascota (ruta con nombre existente).
                // El formulario debe hacer context.pop(true) si crea correctamente.
                final bool? ok = await context.pushNamed<bool>('pet-new');

                // Si el resultado es true, incrementamos el tick para recargar el listado.
                if (ok == true && mounted) {
                  setState(() {
                    _reloadTick++;
                  });
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Nueva mascota'),
            )
          : null,

      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.pets),
            label: 'Mascotas',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            label: 'Despensa',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.restaurant_menu),
            label: 'Recetas',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bookmark_border),
            label: 'Favoritos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}

class _SimplePlaceholder extends StatelessWidget {
  final String title;
  const _SimplePlaceholder(this.title);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        '$title (en construcción)',
        style: Theme.of(context).textTheme.titleMedium,
      ),
    );
  }
}
