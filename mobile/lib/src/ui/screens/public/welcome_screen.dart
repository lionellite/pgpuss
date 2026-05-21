import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF008751), Color(0xFF005F3A), Color(0xFF003D2B)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              children: [
                const Spacer(flex: 2),

                // Logo
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.25),
                        blurRadius: 30,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Image.asset('assets/images/logo.png'),
                  ),
                ),
                const SizedBox(height: 28),

                // Title
                const Text(
                  'PGP-USS',
                  style: TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Plateforme de Gestion des Plaintes\ndes Usagers des Services de Santé',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(alpha: 0.85),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 12),

                // Benin flag bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(width: 30, height: 4, decoration: BoxDecoration(
                      color: AppColors.primary, borderRadius: BorderRadius.circular(2))),
                    const SizedBox(width: 4),
                    Container(width: 30, height: 4, decoration: BoxDecoration(
                      color: AppColors.secondary, borderRadius: BorderRadius.circular(2))),
                    const SizedBox(width: 4),
                    Container(width: 30, height: 4, decoration: BoxDecoration(
                      color: AppColors.danger, borderRadius: BorderRadius.circular(2))),
                  ],
                ),

                const Spacer(flex: 2),

                // Features list
                _featureItem(Icons.edit_note, 'Déposer une plainte',
                  'Signalez un problème rencontré dans un établissement de santé'),
                const SizedBox(height: 14),
                _featureItem(Icons.search, 'Suivre une plainte',
                  'Consultez l\'état de votre dossier avec votre numéro de ticket'),
                const SizedBox(height: 14),
                _featureItem(Icons.shield_outlined, 'Confidentiel & sécurisé',
                  'Possibilité de déposer anonymement, données protégées'),

                const Spacer(flex: 2),

                // CTA buttons
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton(
                    onPressed: () => context.go('/login'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    child: const Text('Se connecter'),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: OutlinedButton(
                    onPressed: () => context.go('/register'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white54, width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    child: const Text('Créer un compte'),
                  ),
                ),
                const SizedBox(height: 14),
                TextButton.icon(
                  onPressed: () => context.go('/track'),
                  icon: Icon(Icons.search, size: 18, color: Colors.white.withValues(alpha: 0.8)),
                  label: Text(
                    'Suivre ma plainte',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.8),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => context.go('/deposit-public'),
                  child: Text(
                    'Déposer sans compte →',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 13,
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Footer
                Text(
                  'République du Bénin 🇧🇯 — Ministère de la Santé',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.white.withValues(alpha: 0.4),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static Widget _featureItem(IconData icon, String title, String sub) {
    return Row(
      children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
            Text(sub, style: TextStyle(
              fontSize: 11, color: Colors.white.withValues(alpha: 0.6), height: 1.3)),
          ],
        )),
      ],
    );
  }
}
