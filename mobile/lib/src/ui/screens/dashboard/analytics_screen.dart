import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/dashboard_stats.dart';
import '../../../state/extra_providers.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  static const _colors = [Color(0xFF008751), Color(0xFFFCD116), Color(0xFFE8112D),
    Color(0xFF0077B6), Color(0xFF6B5B95), Color(0xFFD97706), Color(0xFF2563EB), Color(0xFF616161)];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(dashboardProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Analytique')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const EmptyState(icon: Icons.error, title: 'Données indisponibles'),
        data: (s) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(dashboardProvider),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _kpis(s),
              const SizedBox(height: 20),
              _monthlyChart(s),
              const SizedBox(height: 16),
              _priorityBarChart(s),
              const SizedBox(height: 16),
              _statusPie(s),
              const SizedBox(height: 16),
              _categoryChart(s),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _kpis(DashboardStats s) {
    final items = [
      ('Total', '${s.totalComplaints}', Icons.folder, AppColors.primary),
      ('En cours', '${s.openComplaints}', Icons.hourglass_top, const Color(0xFFD97706)),
      ('Résolues', '${s.resolvedComplaints}', Icons.check_circle, AppColors.primary),
      ('En retard', '${s.overdueComplaints}', Icons.warning, AppColors.danger),
    ];
    return GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 1.9,
      children: items.map((k) => StatCard(label: k.$1, value: k.$2, icon: k.$3, color: k.$4)).toList());
  }

  Widget _monthlyChart(DashboardStats s) {
    final data = s.complaintsByMonth;
    if (data == null || data.isEmpty) return const SizedBox.shrink();
    final spots = <FlSpot>[];
    for (var i = 0; i < data.length; i++) {
      spots.add(FlSpot(i.toDouble(), (data[i]['count'] as num?)?.toDouble() ?? 0));
    }
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        _title('Évolution mensuelle'),
        const SizedBox(height: 16),
        SizedBox(height: 200, child: LineChart(LineChartData(
          gridData: const FlGridData(show: true, drawVerticalLine: false),
          titlesData: FlTitlesData(
            bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30,
              getTitlesWidget: (v, _) {
                final i = v.toInt();
                if (i < 0 || i >= data.length) return const SizedBox.shrink();
                final m = data[i]['month']?.toString() ?? '';
                return Text(m.length >= 7 ? m.substring(5, 7) : m, style: TextStyle(fontSize: 10, color: Colors.grey[600]));
              })),
            leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 32,
              getTitlesWidget: (v, _) => Text('${v.toInt()}', style: TextStyle(fontSize: 10, color: Colors.grey[600])))),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          borderData: FlBorderData(show: false),
          lineBarsData: [LineChartBarData(spots: spots, isCurved: true, color: AppColors.primary,
            barWidth: 3, dotData: const FlDotData(show: true),
            belowBarData: BarAreaData(show: true, color: AppColors.primary.withValues(alpha: 0.1)))],
        ))),
      ],
    )));
  }

  Widget _priorityBarChart(DashboardStats s) {
    if (s.complaintsByPriority == null || s.complaintsByPriority!.isEmpty) return const SizedBox.shrink();
    final prios = ['P1','P2','P3','P4','P5'];
    final colors = [AppColors.priorityP1, AppColors.priorityP2, AppColors.priorityP3, AppColors.priorityP4, AppColors.priorityP5];
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        _title('Répartition par priorité'),
        const SizedBox(height: 16),
        SizedBox(height: 180, child: BarChart(BarChartData(
          gridData: const FlGridData(show: true, drawVerticalLine: false),
          titlesData: FlTitlesData(
            bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 28,
              getTitlesWidget: (v, _) {
                final i = v.toInt();
                return i >= 0 && i < prios.length ? Text(prios[i], style: TextStyle(fontSize: 11, color: Colors.grey[600])) : const SizedBox.shrink();
              })),
            leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 28,
              getTitlesWidget: (v, _) => Text('${v.toInt()}', style: TextStyle(fontSize: 10, color: Colors.grey[600])))),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          borderData: FlBorderData(show: false),
          barGroups: List.generate(prios.length, (i) => BarChartGroupData(x: i, barRods: [
            BarChartRodData(toY: (s.complaintsByPriority?[prios[i]] ?? 0).toDouble(),
              color: colors[i], width: 20, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
          ])),
        ))),
      ],
    )));
  }

  Widget _statusPie(DashboardStats s) {
    if (s.complaintsByStatus == null || s.complaintsByStatus!.isEmpty) return const SizedBox.shrink();
    final entries = s.complaintsByStatus!.entries.toList();
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        _title('Répartition par statut'),
        const SizedBox(height: 16),
        SizedBox(height: 200, child: PieChart(PieChartData(
          sectionsSpace: 2, centerSpaceRadius: 40,
          sections: List.generate(entries.length, (i) => PieChartSectionData(
            value: entries[i].value.toDouble(),
            title: '${entries[i].value}',
            color: _colors[i % _colors.length],
            radius: 40, titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
          )),
        ))),
        const SizedBox(height: 12),
        Wrap(spacing: 12, runSpacing: 6, children: List.generate(entries.length, (i) => Row(
          mainAxisSize: MainAxisSize.min, children: [
            Container(width: 10, height: 10, decoration: BoxDecoration(color: _colors[i % _colors.length], shape: BoxShape.circle)),
            const SizedBox(width: 4),
            Text(entries[i].key.replaceAll('_', ' '), style: TextStyle(fontSize: 11, color: Colors.grey[600])),
          ],
        ))),
      ],
    )));
  }

  Widget _categoryChart(DashboardStats s) {
    if (s.complaintsByCategory == null || s.complaintsByCategory!.isEmpty) return const SizedBox.shrink();
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        _title('Top catégories'),
        const SizedBox(height: 12),
        ...s.complaintsByCategory!.take(8).map((c) {
          final name = (c['category__name']?.toString() ?? 'Autre');
          final count = (c['count'] as num?)?.toInt() ?? 0;
          return Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Expanded(child: Text(name, style: TextStyle(fontSize: 13, color: Colors.grey[700]), overflow: TextOverflow.ellipsis)),
              Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(color: AppColors.secondary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                child: Text('$count', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.secondary))),
            ],
          ));
        }),
      ],
    )));
  }

  Widget _title(String t) => Text(t.toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
    color: Colors.grey[500], letterSpacing: 0.5));
}
