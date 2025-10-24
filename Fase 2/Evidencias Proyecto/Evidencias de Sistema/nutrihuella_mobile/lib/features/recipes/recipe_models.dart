/// lib/features/recipes/recipe_models.dart
class Recipe {
  final String id;
  final String title;
  final String planType;
  final String contentJson;

  Recipe({
    required this.id,
    required this.title,
    required this.planType,
    required this.contentJson,
  });

  factory Recipe.fromJson(Map<String, dynamic> json) => Recipe(
        id: json['id'] as String,
        title: (json['title'] ?? 'Receta').toString(),
        planType: (json['planType'] ?? 'DAILY').toString(),
        contentJson: (json['content'] ?? json['contentJson'] ?? '{}').toString(),
      );
}
