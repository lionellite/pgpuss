import 'package:flutter/material.dart';
import '../theme.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status, this.label});

  final String status;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final color = AppColors.statusColor(status);
    final display = label ?? _statusLabel(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        display,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  static String _statusLabel(String status) {
    const labels = {
      'SOUMISE': 'Soumise',
      'ACCUSEE': 'Accusée',
      'INSTRUITE': 'Instruite',
      'AFFECTEE': 'Affectée',
      'EN_TRAITEMENT': 'Investigation',
      'RESOLUE': 'Résolue',
      'ARBITREE': 'Arbitrée',
      'CLOTUREE': 'Clôturée',
      'ESCALADEE': 'Escaladée',
      'REJETEE': 'Rejetée',
    };
    return labels[status] ?? status;
  }
}

class PriorityBadge extends StatelessWidget {
  const PriorityBadge({super.key, required this.priority, this.label});

  final String priority;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final color = AppColors.priorityColor(priority);
    final display = label ?? priority;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        display,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
