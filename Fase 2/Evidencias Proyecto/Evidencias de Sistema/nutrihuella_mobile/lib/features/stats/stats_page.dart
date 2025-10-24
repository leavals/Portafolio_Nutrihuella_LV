/// lib/features/stats/stats_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'stats_service.dart';

final statsServiceProvider = FutureProvider<StatsService>((ref) async => StatsService.create());
final dailyStatsProvider = FutureProvider<List<DailyStat>>((ref) async {
  final svc = await ref.watch(statsServiceProvider.future);
  return svc.daily();
});

class StatsPage extends ConsumerWidget {
  const StatsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dailyStatsProvider);
    return Scaffold(
      body: statsAsync.when(
        data: (items) => ListView.separated(
          padding: const EdgeInsets.all(12),
          itemCount: items.length,
          separatorBuilder: (_, __) => const Divider(),
          itemBuilder: (_, i) {
            final it = items[i];
            return ListTile(title: Text(it.dateKey), trailing: Text(it.recipesGeneratedCount.toString()));
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
