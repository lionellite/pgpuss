import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../api/complaints_api.dart';
import '../../../models/complaint.dart';
import '../../theme.dart';
import '../../widgets/app_chrome.dart';
import '../../widgets/a11y_widgets.dart';
import '../../widgets/badges.dart';
import '../../widgets/timeline_widget.dart';

class UserComplaintDetailScreen extends ConsumerStatefulWidget {
  const UserComplaintDetailScreen({super.key, required this.complaintId});
  final String complaintId;

  @override
  ConsumerState<UserComplaintDetailScreen> createState() =>
      _UserComplaintDetailScreenState();
}

class _UserComplaintDetailScreenState
    extends ConsumerState<UserComplaintDetailScreen> {
  ComplaintDetail? _complaint;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final c = await ref
          .read(complaintsApiProvider)
          .getDetail(widget.complaintId);
      setState(() => _complaint = c);
    } catch (_) {
      if (mounted) Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const AppPageScaffold(
        title: 'Détail de la plainte',
        fallbackLocation: '/complaints',
        body: Center(child: CircularProgressIndicator()),
      );
    }
    final c = _complaint;
    if (c == null) return const SizedBox.shrink();

    return AppPageScaffold(
      title: c.ticketNumber,
      fallbackLocation: '/complaints',
      actions: [
        IconButton(icon: const Icon(Icons.refresh), onPressed: _load, tooltip: 'Actualiser'),
      ],
      body: RefreshIndicator(
        onRefresh: _load,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            c.ticketNumber,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Row(
                            children: [
                              StatusBadge(status: c.status),
                              const SizedBox(width: 6),
                              PriorityBadge(priority: c.priority),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        c.title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _infoGrid(c),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Description
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'DESCRIPTION',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textMuted,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        c.description,
                        style: const TextStyle(
                          fontSize: 14,
                          height: 1.7,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Resolution
              if (c.resolutionNotes != null &&
                  c.resolutionNotes!.isNotEmpty) ...[
                const SizedBox(height: 12),
                AccentLeftCard(
                  accentColor: AppColors.primary,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'RÉSOLUTION',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        c.resolutionNotes!,
                        style: const TextStyle(
                          fontSize: 14,
                          height: 1.7,
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // User Actions
              _buildUserActions(c),

              // History
              if (c.history != null && c.history!.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text(
                  'HISTORIQUE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textMuted,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 12),
                TimelineWidget(entries: c.history!.reversed.toList()),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoGrid(ComplaintDetail c) {
    final items = <_InfoItem>[
      _InfoItem('Établissement', c.establishmentName ?? '—'),
      _InfoItem('Service', c.serviceName ?? '—'),
      _InfoItem('Catégorie', c.categoryName ?? '—'),
      _InfoItem('Canal', c.channelDisplay ?? '—'),
      _InfoItem('Plaignant', c.complainantDisplay ?? '—'),
      _InfoItem('Affecté à', c.assignedToName ?? 'Non affecté'),
      if (c.createdAt != null)
        _InfoItem('Déposée le',
            '${c.createdAt!.day}/${c.createdAt!.month}/${c.createdAt!.year}'),
    ];

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: items.map((item) {
        return Container(
          width: (MediaQuery.of(context).size.width - 80) / 2,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.surfaceGray,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.divider),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.label.toUpperCase(),
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMuted,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                item.value,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildUserActions(ComplaintDetail c) {
    final actions = <Widget>[];

    // Provide additional info if requested
    if (c.status == 'SOUMISE' || c.status == 'ACCUSEE') {
      actions.add(_actionButton(
        'Fournir des informations',
        Icons.info_outline,
        () => _showActionSheet('provideInfo', 'Informations complémentaires',
            'Ajoutez des détails...'),
      ));
    }

    // Withdraw
    if (['SOUMISE', 'ACCUSEE', 'INSTRUITE'].contains(c.status)) {
      actions.add(_actionButton(
        'Retirer la plainte',
        Icons.cancel_outlined,
        () => _showActionSheet(
            'withdraw', 'Retirer la plainte', 'Motif du retrait...'),
        color: AppColors.danger,
      ));
    }

    if (actions.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'ACTIONS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMuted,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 12),
              ...actions,
            ],
          ),
        ),
      ),
    );
  }

  Widget _actionButton(String label, IconData icon, VoidCallback onTap,
      {Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 18),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          foregroundColor: color ?? AppColors.primary,
          side: BorderSide(
              color: (color ?? AppColors.primary).withValues(alpha: 0.3)),
        ),
      ),
    );
  }

  void _showActionSheet(
      String action, String title, String hint) {
    final ctrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            TextField(
              controller: ctrl,
              maxLines: 4,
              decoration: InputDecoration(hintText: hint),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  final api = ref.read(complaintsApiProvider);
                  if (action == 'provideInfo') {
                    await api.provideInfo(
                      widget.complaintId,
                      {'notes': ctrl.text},
                    );
                  } else if (action == 'withdraw') {
                    await api.withdraw(
                      widget.complaintId,
                      {'reason': ctrl.text},
                    );
                  }
                  _load();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Action effectuée !')),
                    );
                  }
                } catch (_) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Erreur lors de l\'action.')),
                    );
                  }
                }
              },
              child: const Text('Confirmer'),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoItem {
  const _InfoItem(this.label, this.value);
  final String label;
  final String value;
}
