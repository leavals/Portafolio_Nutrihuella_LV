// lib/features/pets/widgets/add_pet_fab.dart
//
// Botón flotante "Agregar mascota" que navega con GoRouter.
// Este widget usa rutas por path para evitar el error
// "Navigator.onGenerateRoute was null" generado por pushNamed.
//
// Cómo usarlo (sin modificar nada más del layout actual):
// En la pantalla donde listes mascotas, agrega:
//   floatingActionButton: const AddPetFAB(),
//
// Requisito de rutas (GoRouter):
// Debes tener una ruta que resuelva el path "/pets/new".
// Si en tu app usas rutas con nombre en GoRouter (por ejemplo "pet-create"),
// cambia la línea de navegación por context.pushNamed('pet-create').
//
// No realiza cambios colaterales ni depende de estado externo.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AddPetFAB extends StatelessWidget {
  const AddPetFAB({super.key});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton.extended(
      onPressed: () {
        // Navegación con GoRouter por path absoluto.
        // Alternativa con nombre (si la tienes): context.pushNamed('pet-create');
        context.push('/pets/new');
      },
      icon: const Icon(Icons.add),
      label: const Text('Agregar mascota'),
      tooltip: 'Agregar una nueva mascota',
    );
  }
}
