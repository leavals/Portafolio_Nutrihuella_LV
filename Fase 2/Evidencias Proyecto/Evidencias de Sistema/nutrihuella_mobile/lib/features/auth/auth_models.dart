/// lib/features/auth/auth_models.dart
class UserMe {
  final String id;
  final String email;
  final String? name;
  final String? picture;
  final String plan; // BASIC | PLUS

  UserMe({
    required this.id,
    required this.email,
    required this.plan,
    this.name,
    this.picture,
  });

  factory UserMe.fromJson(Map<String, dynamic> json) => UserMe(
        id: json['id'] as String,
        email: json['email'] as String,
        name: json['name'] as String?,
        picture: json['picture'] as String?,
        plan: json['plan'] as String? ?? 'BASIC',
      );
}
