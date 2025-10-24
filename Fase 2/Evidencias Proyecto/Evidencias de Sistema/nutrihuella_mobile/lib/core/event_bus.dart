// lib/core/event_bus.dart
//
// Canal de eventos globales entre pantallas (para actualizar Favoritos, etc.)

import 'package:event_bus/event_bus.dart';

final EventBus eventBus = EventBus();

class FavoriteAddedEvent {}
