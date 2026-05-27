import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme.dart';
import '../../widgets/app_chrome.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const GovFlagBar(),
        Expanded(
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 72,
                      height: 72,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.divider),
                      ),
                      child: Image.asset('assets/images/logo.png'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Plateforme de Gestion des Plaintes',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                          height: 1.15,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'des usagers des services de santé',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                          height: 1.4,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'République du Bénin — Ministère de la Santé',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textMuted,
                        ),
                  ),

                  const SizedBox(height: 18),
                  // Actions rapides (sans compte) — plus visibles
                  FilledButton.icon(
                    onPressed: () => context.go('/deposit-public'),
                    icon: const Icon(Icons.edit_note_outlined),
                    label: const Text('Déposer une plainte (sans compte)'),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: () => context.go('/track'),
                    icon: const Icon(Icons.search),
                    label: const Text('Suivre ma plainte'),
                  ),

                  const SizedBox(height: 18),
                  _FeatureTile(
                    icon: Icons.shield_outlined,
                    title: 'Confidentiel et sécurisé',
                    subtitle: 'Dépôt possible en mode anonyme, données protégées',
                  ),
                  const SizedBox(height: 10),
                  _FeatureTile(
                    icon: Icons.schedule_outlined,
                    title: 'Traitement structuré',
                    subtitle: 'Votre dossier est pris en charge par les services compétents',
                  ),

                  const SizedBox(height: 18),
                  Divider(color: AppColors.divider),
                  const SizedBox(height: 12),
                  Text(
                    'Vous avez un compte ?',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 10),
                  FilledButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Se connecter'),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton(
                    onPressed: () => context.go('/register'),
                    child: const Text('Créer un compte'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ]),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: AppColors.primary, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
