import 'package:flutter/material.dart';

class PlusUpgradeDialog extends StatelessWidget {
  final String kind; // 'pets' | 'favorites' | 'generations'
  final Map<String, dynamic>? quota;
  final VoidCallback onUpgrade;

  const PlusUpgradeDialog({super.key, required this.kind, this.quota, required this.onUpgrade});

  Map<String,String> get _label => switch (kind) {
    'pets' => {
      'title': 'Límite de mascotas alcanzado',
      'desc': 'El plan Básico permite hasta 2 mascotas. Pásate a Plus para crear perfiles ilimitados.',
    },
    'favorites' => {
      'title': 'Límite de favoritos alcanzado',
      'desc': 'El plan Básico permite 2 favoritos. Con Plus, guarda todos los que quieras.',
    },
    _ => {
      'title': 'Límite de generaciones alcanzado',
      'desc': 'Has llegado al máximo diario en Básico. Con Plus, genera recetas sin límites.',
    },
  };

  @override
  Widget build(BuildContext context) {
    final l = _label;
    return AlertDialog(
      title: Text(l['title']!),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l['desc']!),
          const SizedBox(height: 8),
          if (quota != null)
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xffF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xffe5e7eb)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Uso: ${quota!['used']}/${quota!['limit']}'),
                  if (quota!['resetAt'] != null) Text('Se reinicia: ${(quota!['resetAt'] as String)}'),
                ],
              ),
            ),
          const SizedBox(height: 8),
          const Text('• Recetas y favoritos ilimitados'),
          const Text('• Más estabilidad y rapidez'),
          const Text('• Soporte prioritario'),
        ],
      ),
      actions: [
        TextButton(onPressed: ()=> Navigator.of(context).pop(), child: const Text('Luego')),
        ElevatedButton(onPressed: onUpgrade, child: const Text('Actualizar a Plus')),
      ],
    );
  }
}
