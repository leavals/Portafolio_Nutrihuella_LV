// lib/core/app_router.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/login_page.dart';
import '../features/home/home_page.dart';

import '../features/pets/pets_page.dart';
import '../features/pet_details/pet_details_page.dart';
import '../features/pet_clinical/pet_clinical_page.dart';
import '../features/pet_nutrition/pet_nutrition_page.dart';
import '../features/pet_diseases/pet_diseases_page.dart';
import '../features/pet_vaccines/pet_vaccines_page.dart';
import '../features/pet_weights/pet_weights_page.dart';
import '../features/pet_pantry/pet_pantry_page.dart';

import '../features/profile/profile_page.dart';
import '../features/payments/webpay_page.dart';
import '../features/payments/web_post.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        name: 'login',
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),

      // Dashboard principal: ahora es el Home con el BottomNavigationBar.
      GoRoute(
        name: 'dashboard',
        path: '/dashboard',
        builder: (context, state) => const HomePage(),
      ),

      // Perfil y subruta de WebPay (se mantiene tal cual).
      GoRoute(
        name: 'profile',
        path: '/profile',
        builder: (context, state) => const ProfilePage(),
        routes: [
          GoRoute(
            name: 'profile-upgrade',
            path: 'upgrade',
            builder: (context, state) {
              final req = state.extra as WebPostRequest?;
              return WebPayPage(request: req);
            },
          ),
        ],
      ),

      // Rutas de detalle de mascota (estas no están en el menú inferior).
      GoRoute(
        name: 'pet-details',
        path: '/pets/:id',
        builder: (context, state) =>
            PetDetailsPage(petId: state.pathParameters['id']!),
        routes: [
          GoRoute(
            name: 'pet-clinical',
            path: 'clinical',
            builder: (context, state) =>
                PetClinicalPage(petId: state.pathParameters['id']!),
          ),
          GoRoute(
            name: 'pet-nutrition',
            path: 'nutrition',
            builder: (context, state) =>
                PetNutritionPage(petId: state.pathParameters['id']!),
          ),
          GoRoute(
            name: 'pet-diseases',
            path: 'diseases',
            builder: (context, state) =>
                PetDiseasesPage(petId: state.pathParameters['id']!),
          ),
          GoRoute(
            name: 'pet-vaccines',
            path: 'vaccines',
            builder: (context, state) =>
                PetVaccinesPage(petId: state.pathParameters['id']!),
          ),
          GoRoute(
            name: 'pet-weights',
            path: 'weights',
            builder: (context, state) =>
                PetWeightsPage(petId: state.pathParameters['id']!),
          ),
          GoRoute(
            name: 'pet-pantry',
            path: 'pantry',
            builder: (context, state) =>
                PetPantryPage(petId: state.pathParameters['id']!),
          ),
        ],
      ),

      // Ruta “legacy” para /pets si en algún enlace antiguo la usan.
      GoRoute(
        name: 'pets',
        path: '/pets',
        builder: (context, state) => const PetsPage(),
      ),
    ],
  );
});
