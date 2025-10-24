/// lib/features/stats/stats_service.dart
import 'package:dio/dio.dart';
import '../../core/api_client.dart';
import '../../core/env.dart';

class DailyStat {
  final String dateKey; // YYYY-MM-DD
  final int recipesGeneratedCount;

  DailyStat(this.dateKey, this.recipesGeneratedCount);

  factory DailyStat.fromJson(Map<String, dynamic> json) =>
      DailyStat(json['dateKey'] as String, (json['recipesGeneratedCount'] as num).toInt());
}

class StatsService {
  final Dio _dio;
  StatsService(this._dio);

  Future<List<DailyStat>> daily() async {
    final res = await _dio.get(ApiPaths.dailyStats);
    final items = (res.data as List).cast<Map<String, dynamic>>();
    return items.map(DailyStat.fromJson).toList();
  }

  static Future<StatsService> create() async {
    final api = await ApiClient.create();
    return StatsService(api.dio);
  }
}
