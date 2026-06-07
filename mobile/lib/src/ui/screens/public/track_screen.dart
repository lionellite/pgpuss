import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../api/complaints_api.dart';
import '../../../models/track_result.dart';
import '../../theme.dart';
import '../../widgets/app_chrome.dart';
import '../../widgets/a11y_widgets.dart';
import '../../widgets/badges.dart';
import '../../widgets/timeline_widget.dart';

class TrackScreen extends ConsumerStatefulWidget {
  const TrackScreen({super.key, this.initialTicket});

  final String? initialTicket;

  @override
  ConsumerState<TrackScreen> createState() => _TrackScreenState();
}

class _TrackScreenState extends ConsumerState<TrackScreen> {
  final _ticketCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  TrackResult? _result;
  String? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialTicket != null && widget.initialTicket!.isNotEmpty) {
      _ticketCtrl.text = widget.initialTicket!;
      WidgetsBinding.instance.addPostFrameCallback((_) => _search());
    }
  }

  @override
  void dispose() {
    _ticketCtrl.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    if (!_formKey.currentState!.validate()) return;

    final ticket = _ticketCtrl.text.trim().toUpperCase();
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
      _result = null;
    });

    try {
      final result = await ref.read(complaintsApiProvider).track(ticket);
      if (mounted) setState(() => _result = result);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Aucune plainte trouvée avec ce numéro de ticket.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppPageScaffold(
      title: 'Suivre ma plainte',
      fallbackLocation: '/',
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SectionHeader(
                title: 'Recherche par ticket',
                subtitle: 'Consultez l\'état d\'avancement de votre dossier. Aucune connexion requise.',
              ),

              Semantics(
                label: 'Formulaire de recherche de plainte',
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _ticketCtrl,
                        textCapitalization: TextCapitalization.characters,
                        decoration: const InputDecoration(
                          labelText: 'Numéro de ticket',
                          hintText: 'PGP-2026-AB1234',
                          prefixIcon: Icon(Icons.confirmation_number_outlined),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) {
                            return 'Veuillez entrer un numéro de ticket';
                          }
                          return null;
                        },
                        onFieldSubmitted: (_) => _search(),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: FilledButton(
                        onPressed: _loading ? null : _search,
                        child: _loading
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Rechercher'),
                      ),
                    ),
                  ],
                ),
              ),

              if (_loading)
                Padding(
                  padding: const EdgeInsets.only(top: 24),
                  child: Center(
                    child: Semantics(
                      label: 'Recherche en cours',
                      child: const CircularProgressIndicator(),
                    ),
                  ),
                ),

              if (_error != null) ...[
                const SizedBox(height: 20),
                Semantics(
                  liveRegion: true,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppColors.danger.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.danger),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _error!,
                            style: const TextStyle(color: AppColors.danger),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],

              if (_result != null) ...[
                const SizedBox(height: 24),
                Semantics(
                  label: 'Résultat de la recherche pour le ticket ${_result!.ticketNumber}',
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Numéro de ticket',
                                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                            color: AppColors.textMuted,
                                            fontWeight: FontWeight.w600,
                                          ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _result!.ticketNumber,
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.primary,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              StatusBadge(status: _result!.status),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _result!.title,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (_result!.categoryName != null &&
                              _result!.categoryName!.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(
                              'Catégorie : ${_result!.categoryName}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                          if (_result!.description != null &&
                              _result!.description!.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              _result!.description!,
                              style: const TextStyle(
                                fontSize: 14,
                                height: 1.4,
                              ),
                            ),
                          ],
                          const SizedBox(height: 12),
                          _infoRow('Établissement',
                              _result!.establishmentName ?? 'Non spécifié'),
                          if (_result!.establishmentAddress != null &&
                              _result!.establishmentAddress!.isNotEmpty)
                            _infoRow('Adresse', _result!.establishmentAddress!),
                          if (_result!.createdAt != null)
                            _infoRow(
                              'Date de dépôt',
                              _formatDate(_result!.createdAt!),
                            ),
                          if (_result!.infoRequestOpen) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.warning.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: AppColors.warning.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Text(
                                _result!.infoRequestNotes?.isNotEmpty == true
                                    ? 'Complément demandé : ${_result!.infoRequestNotes}'
                                    : 'Un complément d\'information est demandé pour cette plainte.',
                                style: const TextStyle(fontSize: 13),
                              ),
                            ),
                          ],
                          if (_result!.timeline != null &&
                              _result!.timeline!.isNotEmpty) ...[
                            const SizedBox(height: 20),
                            const SectionHeader(title: 'Historique du traitement'),
                            TimelineWidget(entries: _result!.timeline!),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ],

              if (_result == null && _error == null && !_loading)
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.15),
                      ),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, color: AppColors.primary),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Le suivi par numéro de ticket est public. Conservez le numéro reçu lors du dépôt de votre plainte.',
                            style: TextStyle(fontSize: 13, height: 1.4),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => context.go('/deposit-public'),
                icon: const Icon(Icons.edit_note_outlined),
                label: const Text('Déposer une nouvelle plainte'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 14)),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }
}
