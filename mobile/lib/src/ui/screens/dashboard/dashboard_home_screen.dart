import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../models/dashboard_stats.dart';
import '../../../state/auth_controller.dart';
import '../../../state/extra_providers.dart';
import '../../theme.dart';
import '../../widgets/badges.dart';
import '../../widgets/common.dart';

class DashboardHomeScreen extends ConsumerWidget {
  const DashboardHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).session?.user;
    final statsAsync = ref.watch(dashboardProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Tableau de bord')),
      body: statsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const EmptyState(icon: Icons.error_outline, title: 'Données indisponibles'),
        data: (stats) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(dashboardProvider),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Bienvenue, ${user?.firstName ?? ""}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              _kpis(stats),
              const SizedBox(height: 20),
              _statusChart(stats),
              const SizedBox(height: 16),
              _priorityChart(stats),
              const SizedBox(height: 16),
              _recentComplaints(context, stats),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _kpis(DashboardStats s) {
    final items = [
      _K('Total', '${s.totalComplaints}', Icons.folder, AppColors.primary),
      _K('En cours', '${s.openComplaints}', Icons.hourglass_top, const Color(0xFFD97706)),
      _K('Résolues', '${s.resolvedComplaints}', Icons.check_circle, AppColors.primary),
      _K('En retard', '${s.overdueComplaints}', Icons.warning, AppColors.danger),
      _K('Délai moy.', s.avgResolutionTime > 0 ? '${s.avgResolutionTime.round()}h' : '—', Icons.timer, const Color(0xFF4F46E5)),
      _K('Satisfaction', s.satisfactionAvg > 0 ? '${s.satisfactionAvg.toStringAsFixed(1)}/5' : '—', Icons.star, const Color(0xFFD97706)),
    ];
    return GridView.count(
      crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 1.8,
      children: items.map((k) => StatCard(label: k.l, value: k.v, icon: k.i, color: k.c)).toList(),
    );
  }

  Widget _statusChart(DashboardStats s) {
    if (s.complaintsByStatus == null || s.complaintsByStatus!.isEmpty) return const SizedBox.shrink();
    const labels = {'SOUMISE':'Soumise','ACCUSEE':'Accusée','INSTRUITE':'Instruite','AFFECTEE':'Affectée',
      'EN_TRAITEMENT':'Investigation','RESOLUE':'Résolue','ARBITREE':'Arbitrée','CLOTUREE':'Clôturée','ESCALADEE':'Escaladée'};
    final total = s.totalComplaints > 0 ? s.totalComplaints : 1;
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('RÉPARTITION PAR STATUT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
          color: Colors.grey[500], letterSpacing: 0.5)),
        const SizedBox(height: 12),
        ...s.complaintsByStatus!.entries.map((e) {
          final pct = (e.value / total * 100).round();
          final color = AppColors.statusColor(e.key);
          return Padding(padding: const EdgeInsets.only(bottom: 8), child: Column(children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(labels[e.key] ?? e.key, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              Text('${e.value}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
            ]),
            const SizedBox(height: 4),
            ClipRRect(borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(value: pct / 100, minHeight: 6,
                backgroundColor: Colors.grey[200], color: color)),
          ]));
        }),
      ],
    )));
  }

  Widget _priorityChart(DashboardStats s) {
    if (s.complaintsByPriority == null || s.complaintsByPriority!.isEmpty) return const SizedBox.shrink();
    final total = s.totalComplaints > 0 ? s.totalComplaints : 1;
    final prios = [
      ('P1', 'Critique', AppColors.priorityP1), ('P2', 'Urgent', AppColors.priorityP2),
      ('P3', 'Élevé', AppColors.priorityP3), ('P4', 'Normal', AppColors.priorityP4),
      ('P5', 'Faible', AppColors.priorityP5),
    ];
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('RÉPARTITION PAR PRIORITÉ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
          color: Colors.grey[500], letterSpacing: 0.5)),
        const SizedBox(height: 12),
        ...prios.map((p) {
          final count = s.complaintsByPriority?[p.$1] ?? 0;
          final pct = (count / total * 100).round();
          return Padding(padding: const EdgeInsets.only(bottom: 8), child: Column(children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('${p.$1} ${p.$2}', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              Text('$count ($pct%)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: p.$3)),
            ]),
            const SizedBox(height: 4),
            ClipRRect(borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(value: pct / 100, minHeight: 6,
                backgroundColor: Colors.grey[200], color: p.$3)),
          ]));
        }),
      ],
    )));
  }

  Widget _recentComplaints(BuildContext context, DashboardStats s) {
    if (s.recentComplaints == null || s.recentComplaints!.isEmpty) return const SizedBox.shrink();
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('DOSSIERS RÉCENTS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
            color: Colors.grey[500], letterSpacing: 0.5)),
          TextButton(onPressed: () => context.go('/dashboard/complaints'),
            child: const Text('TOUT VOIR →', style: TextStyle(fontSize: 11))),
        ]),
        const SizedBox(height: 8),
        ...s.recentComplaints!.take(5).map((c) => InkWell(
          onTap: () => context.push('/dashboard/complaints/${c['id']}'),
          child: Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c['title']?.toString() ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                maxLines: 1, overflow: TextOverflow.ellipsis),
              Text('${c['ticket_number'] ?? ''} — ${c['establishment_name'] ?? ''}',
                style: TextStyle(fontSize: 11, color: Colors.grey[500])),
            ])),
            StatusBadge(status: c['status']?.toString() ?? ''),
          ])),
        )),
      ],
    )));
  }
}

class _K { const _K(this.l, this.v, this.i, this.c); final String l, v; final IconData i; final Color c; }
