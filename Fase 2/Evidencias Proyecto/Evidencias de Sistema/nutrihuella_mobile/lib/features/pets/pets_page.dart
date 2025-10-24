// lib/features/pets/pets_page.dart
//
// Cambios mínimos y focalizados:
// - Se agrega un “tick de recarga” (_reloadTick) y una Key variable al PetListPage.
//   Cada vez que volvemos de crear/eliminar (pop(true)), incrementamos el tick,
//   forzando a que PetListPage se reconstruya desde cero (initState incluido)
//   y, con ello, su recarga de datos.
// - Se mantiene la navegación con GoRouter usando la ruta con nombre 'pet-new'.
// - No se modifica ningún otro tab, estilo o dependencia.
//
// Notas de integración:
// - Cualquier pantalla que cree/edite/elimine una mascota debe hacer `context.pop(true)`
//   al regresar para que este Scaffold incremente el _reloadTick y fuerce la recarga.
// - Si tu flujo de eliminación muestra confirmación (como corresponde), tras confirmar
//   y completar la eliminación, haz `context.pop(true)` desde la pantalla que inició
//   el flujo (por ejemplo, detalles), o devuelve `true` si la acción se hace en un
//   diálogo modal con push. Con eso bastará para refrescar el listado al volver aquí.
//

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
      // Importante: quitamos "const" y le pasamos una Key basada en _reloadTick.
      // Cada incremento de _reloadTick provoca que Flutter considere este widget
      // como "nuevo" y lo vuelva a montar (initState -> recarga).
      PetListPage(key: ValueKey<int>(_reloadTick)), // Mascotas
      const _SimplePlaceholder('Despensa'),         // Despensa
      const _SimplePlaceholder('Recetas'),          // Recetas
      const _SimplePlaceholder('Favoritos'),        // Favoritos
      const ProfilePage(),                          // Perfil
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('NutriHuella')),
      body: pages[_index],

      // FAB solo visible en el tab de Mascotas.
      floatingActionButton: _index == 0
          ? FloatingActionButton.extended(
              onPressed: () async {
                // Navegamos al formulario de nueva mascota usando la ruta con nombre existente.
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
