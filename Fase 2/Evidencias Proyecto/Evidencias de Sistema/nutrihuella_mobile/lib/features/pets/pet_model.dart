/// lib/features/pets/pet_model.dart
class Pet {
  final String id;
  final String name;
  final String species;
  final String? breed;
  final double? weightKg;
  final String? photoUrl;

  Pet({
    required this.id,
    required this.name,
    required this.species,
    this.breed,
    this.weightKg,
    this.photoUrl,
  });

  factory Pet.fromJson(Map<String, dynamic> json) => Pet(
        id: json['id'] as String,
        name: json['name'] as String,
        species: json['species'] as String? ?? 'DOG',
        breed: json['breed'] as String?,
        weightKg: (json['weightKg'] as num?)?.toDouble(),
        photoUrl: json['photoUrl'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'species': species,
        'breed': breed,
        'weightKg': weightKg,
        'photoUrl': photoUrl,
      };
}

class WeightPoint {
  final DateTime date;
  final double weightKg;
  WeightPoint(this.date, this.weightKg);

  factory WeightPoint.fromJson(Map<String, dynamic> json) =>
      WeightPoint(DateTime.parse(json['date'] as String), (json['weightKg'] as num).toDouble());
}
