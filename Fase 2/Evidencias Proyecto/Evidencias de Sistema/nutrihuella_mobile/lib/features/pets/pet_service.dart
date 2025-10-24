/// lib/features/pets/pet_service.dart
import 'package:dio/dio.dart';
import '../../core/api_client.dart';
import '../../core/env.dart';
import 'pet_model.dart';

class PetService {
  final Dio _dio;
  PetService(this._dio);

  Future<List<Pet>> list() async {
    final res = await _dio.get(ApiPaths.pets);
    final items = (res.data as List).cast<Map<String, dynamic>>();
    return items.map(Pet.fromJson).toList();
  }

  Future<Pet> createPet(Pet pet) async {
    final res = await _dio.post(ApiPaths.pets, data: pet.toJson());
    return Pet.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Pet> update(String id, Pet pet) async {
    final res = await _dio.put(ApiPaths.petById(id), data: pet.toJson());
    return Pet.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> remove(String id) async {
    await _dio.delete(ApiPaths.petById(id));
  }

  Future<List<WeightPoint>> weights(String petId) async {
    final res = await _dio.get(ApiPaths.petWeights(petId));
    final items = (res.data as List).cast<Map<String, dynamic>>();
    return items.map(WeightPoint.fromJson).toList();
  }

  Future<void> addWeight(String petId, double weightKg, {DateTime? date}) async {
    await _dio.post(ApiPaths.petWeights(petId), data: {
      'weightKg': weightKg,
      if (date != null) 'date': date.toIso8601String(),
    });
  }

  static Future<PetService> create() async {
    final api = await ApiClient.create();
    return PetService(api.dio);
  }
}
