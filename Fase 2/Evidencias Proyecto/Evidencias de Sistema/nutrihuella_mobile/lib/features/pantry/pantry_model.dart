/// lib/features/pantry/pantry_model.dart
class PantryItemModel {
  final String id;
  final String name;
  final double? quantity;
  final String? unit;
  final String? category;
  final DateTime? expiresAt;
  final String? notes;

  PantryItemModel({
    required this.id,
    required this.name,
    this.quantity,
    this.unit,
    this.category,
    this.expiresAt,
    this.notes,
  });

  factory PantryItemModel.fromJson(Map<String, dynamic> json) => PantryItemModel(
        id: json['id'] as String,
        name: json['name'] as String,
        quantity: (json['quantity'] as num?)?.toDouble(),
        unit: json['unit'] as String?,
        category: json['category'] as String?,
        expiresAt: json['expiresAt'] != null ? DateTime.parse(json['expiresAt'] as String) : null,
        notes: json['notes'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'quantity': quantity,
        'unit': unit,
        'category': category,
        'expiresAt': expiresAt?.toIso8601String(),
        'notes': notes,
      };
}
