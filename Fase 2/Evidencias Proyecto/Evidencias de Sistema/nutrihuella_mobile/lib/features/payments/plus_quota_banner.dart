import 'package:flutter/material.dart';

class PlusQuotaBanner extends StatelessWidget {
  final String kind; // 'pets' | 'favorites' | 'generations'
  final Map<String, dynamic>? quota; // { used, limit, resetAt? }
  final VoidCallback onUpgrade;
  final VoidCallback? onClose;

  const PlusQuotaBanner({
    super.key,
    required this.kind,
    this.quota,
    required this.onUpgrade,
    this.onClose,
  });

  String get _title => switch (kind) {
    'pets' => 'Máximo de mascotas alcanzado',
    'favorites' => 'Máximo de favoritos alcanzado',
    'generations' => 'Máximo diario de recetas alcanzado',
    _ => 'Límite alcanzado',
  };

  @override
  Widget build(BuildContext context) {
    final q = quota;
    final extra = q == null ? '' : ' (uso: ${q['used']}/${q['limit']}${q['resetAt'] != null ? ' · reinicia: ${(q['resetAt'] as String).substring(11,16)}' : ''})';

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xffFFFBEB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xffF59E0B)),
      ),
      child: Row(
        children: [
          Expanded(child: Text('$_title$extra. Pásate a Plus para desbloquearlo.', style: const TextStyle(color: Color(0xff92400E)))),
          ElevatedButton(onPressed: onUpgrade, child: const Text('Actualizar a Plus')),
          if (onClose != null) IconButton(onPressed: onClose, icon: const Icon(Icons.close)),
        ],
      ),
    );
  }
}
