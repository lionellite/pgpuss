import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/history_entry.dart';
import '../theme.dart';

class TimelineWidget extends StatelessWidget {
  const TimelineWidget({super.key, required this.entries});

  final List<HistoryEntry> entries;

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return const Text(
        'Aucun historique',
        style: TextStyle(color: AppColors.textMuted, fontSize: 14),
      );
    }

    return Column(
      children: List.generate(entries.length, (i) {
        final entry = entries[i];
        final isLast = i == entries.length - 1;
        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 32,
                child: Column(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: i == 0 ? AppColors.primary : AppColors.divider,
                        border: Border.all(
                          color: i == 0 ? AppColors.primary : AppColors.textMuted,
                          width: 2,
                        ),
                      ),
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: AppColors.divider,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (entry.timestamp != null)
                        Text(
                          DateFormat('d MMM yyyy, HH:mm', 'fr_FR')
                              .format(entry.timestamp!),
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textMuted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      const SizedBox(height: 2),
                      Text(
                        entry.action,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (entry.actorName != null &&
                          entry.actorName!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            'par ${entry.actorName}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      if (entry.notes != null && entry.notes!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceGray,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppColors.divider),
                            ),
                            child: Text(
                              entry.notes!,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
