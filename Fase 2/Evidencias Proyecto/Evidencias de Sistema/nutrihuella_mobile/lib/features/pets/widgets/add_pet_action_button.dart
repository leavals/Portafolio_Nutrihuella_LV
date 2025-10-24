// lib/features/pets/widgets/add_pet_action_button.dart
//
// Botón de acción para AppBar que navega con GoRouter a la pantalla de creación
// de mascota. Alternativa al FAB si prefieres el botón en la barra superior.
//
// Cómo usarlo:
// En el AppBar de tu pantalla de listado agrega:
//   actions: const [AddPetActionButton()],
//
// Requisito de rutas (GoRouter):
// Debes tener una ruta que resuelva el path "/pets/new".
// Si usas rutas con nombre en GoRouter (por ejemplo "pet-create"),
// cambia context.push('/pets/new') por context.pushNamed('pet-create').
//
// No realiza cambios colaterales ni depende de estado externo.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AddPetActionButton extends StatelessWidget {
  const AddPetActionButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Agregar mascota',
      icon: const Icon(Icons.add),
      onPressed: () {
        // Navegación con GoRouter por path absoluto.
        // Alternativa con nombre (si la tienes): context.pushNamed('pet-create');
        context.push('/pets/new');
      },
    );
  }
}
