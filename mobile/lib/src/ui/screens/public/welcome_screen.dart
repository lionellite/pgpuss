import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../api/dio_provider.dart';
import '../../theme.dart';
import '../../widgets/app_chrome.dart';
import '../../widgets/a11y_widgets.dart';

// ─────────────────────────────────────────────────────────────────
//  WelcomeScreen — Refonte Stitch "Accueil Mobile Version Mise à Jour"
//  Design: bannière urgence, header simple, titre centré, image 16/9,
//  CTAs, bento stats, processus vertical, bottom nav 4 items.
// ─────────────────────────────────────────────────────────────────

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  Map<String, dynamic>? _stats;
  bool _loadingStats = true;

  // Steps data
  static const _steps = [
    (
      icon: Icons.inbox,
      title: 'Signalement',
      desc:
          'Remplissez le formulaire en ligne ou via la ligne 136 pour enregistrer votre plainte officielle.',
    ),
    (
      icon: Icons.support_agent,
      title: 'Instruction',
      desc:
          "Nos équipes analysent votre dossier et contactent l'établissement de santé concerné sous 48h.",
    ),
    (
      icon: Icons.task_alt,
      title: 'Résolution',
      desc:
          'Vous recevez une notification dès que la solution est validée et le litige clos.',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final dio = ref.read(dioProvider);
      final res =
          await dio.get<Map<String, dynamic>>('/api/analytics/public-stats/');
      if (mounted) setState(() => _stats = res.data);
    } catch (_) {
      // Stats optionnelles
    } finally {
      if (mounted) setState(() => _loadingStats = false);
    }
  }

  Future<void> _callGreenLine() async {
    final uri = Uri.parse('tel:136');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  // ── Typography helpers ─────────────────────────────────────────

  TextStyle get _displayStyle => GoogleFonts.atkinsonHyperlegible(
        fontWeight: FontWeight.w700,
        color: AppColors.primary,
      );

  String _formatStat(dynamic value) {
    final n = num.tryParse(value.toString());
    if (n != null && n >= 1000) {
      return '${n.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]} ')}+';
    }
    return value.toString();
  }

  // ── Build ──────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final treated =
        _stats?['resolved_complaints'] ?? _stats?['total_complaints'];
    final satisfaction = _stats?['satisfaction_avg'];

    final satStr = satisfaction != null
        ? '${((satisfaction as num) / 5 * 100).round()}%'
        : '94%';
    final treatedStr =
        treated != null ? _formatStat(treated) : '1,248';

    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Bannière urgence rouge sticky ───────────────────
          _buildEmergencyBanner(),
          // ── Contenu scrollable ───────────────────────────────
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 72),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Header simple (logo + profil)
                  _buildTopBar(),
                  // 2. Message de bienvenue centré
                  _buildWelcomeTitle(),
                  // 3. Image hero 16/9
                  _buildHeroImage(),
                  const SizedBox(height: 16),
                  // 4. CTAs primaire + secondaire
                  _buildPrimaryActions(),
                  const SizedBox(height: 24),
                  // 5. Section stats bento "Transparence et Chiffres"
                  if (!_loadingStats)
                    _buildStatsSection(treatedStr, satStr),
                  if (!_loadingStats) const SizedBox(height: 24),
                  // 6. Comment ça marche (vertical stepper)
                  _buildHowItWorks(),
                  const SizedBox(height: 24),
                  // 7. Footer
                  _buildFooter(),
                ],
              ),
            ),
          ),
        ],
      ),
      // Bottom navigation fixe
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  // ── BANNIÈRE URGENCE ──────────────────────────────────────────

  Widget _buildEmergencyBanner() {
    return Material(
      color: AppColors.emergency,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              const Icon(Icons.emergency, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Urgence : Appelez le 136 (Ligne Verte)',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _callGreenLine,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    'Appeler',
                    style: TextStyle(
                      color: AppColors.emergency,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── TOP BAR ───────────────────────────────────────────────────

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Row(
            children: [
              Image.asset(
                'assets/images/logo.png',
                height: 36,
                width: 36,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.account_balance,
                  color: AppColors.primary,
                  size: 32,
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PGP-USS',
                    style: _displayStyle.copyWith(
                      fontSize: 18,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    'République du Bénin',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainer,
              shape: BoxShape.circle,
            ),
            child: IconButton(
              onPressed: () => context.go('/login'),
              icon: const Icon(Icons.person_outline,
                  color: AppColors.primary, size: 22),
              tooltip: 'Se connecter',
              padding: EdgeInsets.zero,
            ),
          ),
        ],
      ),
    );
  }

  // ── TITRE DE BIENVENUE ────────────────────────────────────────

  Widget _buildWelcomeTitle() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Text(
        'Bienvenue sur la plateforme de gestion des plaintes des usagers des services de santé',
        textAlign: TextAlign.center,
        style: GoogleFonts.atkinsonHyperlegible(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          height: 1.3,
        ),
      ),
    );
  }

  // ── IMAGE HERO 16/9 ───────────────────────────────────────────

  Widget _buildHeroImage() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.network(
                'https://lh3.googleusercontent.com/aida/AP1WRLsL3sBMyy47MeBWVErVXqHVp2LY7MhBPUinxmpSsFC0xZ1pzasB9xvtc4XJhnT_d8c7vUVnHCasrF1DAaSHYTMngc7lB_UurRKzyBtKBkMpVxiYWwhrS9bHN56bwjIIDLCDqsLwA3Mw-vXgI02I1eslPH_UKUCs6LBUGn4yjx9lM7sVctReUWz-JsL-V9RPvyusvYJP1NV_Fe-uu_gmp6aF5yML2Qn30FBvtKpuKMfDkqca9LFYDaUjHg',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Image.asset(
                  'assets/images/hero_consultation.jpg',
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    child: const Center(
                      child: Icon(Icons.local_hospital,
                          size: 64, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
              // Gradient bottom overlay
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.4),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── ACTIONS PRIMAIRES ─────────────────────────────────────────

  Widget _buildPrimaryActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Bouton primaire "Déposer une plainte"
          FilledButton.icon(
            onPressed: () => context.go('/deposit-public'),
            icon: const Icon(Icons.add_circle_outline, size: 20),
            label: const Text(
              'Déposer une plainte',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primaryContainer,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Bouton secondaire "Suivre ma plainte"
          OutlinedButton.icon(
            onPressed: () => context.go('/track'),
            icon: const Icon(Icons.search, size: 20),
            label: const Text(
              'Suivre ma plainte',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primaryContainer,
              side: const BorderSide(
                  color: AppColors.primaryContainer, width: 2),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── STATISTIQUES BENTO ────────────────────────────────────────

  Widget _buildStatsSection(String treatedStr, String satStr) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.insights, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Text(
                'Transparence et Chiffres',
                style: _displayStyle.copyWith(
                    fontSize: 18, color: AppColors.textPrimary),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Grille 2 colonnes
          Row(
            children: [
              Expanded(
                child: _BentoStatCard(
                  label: 'Plaintes traitées',
                  value: treatedStr,
                  accent: AppColors.primaryContainer,
                  trailing: Row(
                    children: [
                      Icon(Icons.trending_up,
                          size: 14, color: AppColors.secondary),
                      const SizedBox(width: 4),
                      Text(
                        '+12% cette semaine',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.secondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _BentoStatCard(
                  label: 'Satisfaction',
                  value: satStr,
                  accent: AppColors.secondary,
                  valueColor: AppColors.secondary,
                  trailing: Row(
                    children: List.generate(
                      3,
                      (_) => Icon(Icons.star,
                          size: 14, color: AppColors.secondary),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Carte pleine largeur – délai moyen
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border(
                left: BorderSide(color: const Color(0xFF1976D2), width: 4),
                top: BorderSide(color: AppColors.divider),
                right: BorderSide(color: AppColors.divider),
                bottom: BorderSide(color: AppColors.divider),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Délai moyen de résolution',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '4.2 Jours',
                      style: GoogleFonts.atkinsonHyperlegible(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1976D2).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.timer,
                      color: Color(0xFF1976D2), size: 22),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── COMMENT ÇA MARCHE (Stepper vertical) ─────────────────────

  Widget _buildHowItWorks() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Comment ça marche ?',
            style: _displayStyle.copyWith(
                fontSize: 18, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 16),
          // Stepper vertical avec ligne de connexion
          Stack(
            children: [
              // Ligne verticale de connexion
              Positioned(
                left: 19,
                top: 40,
                bottom: 40,
                child: Container(
                  width: 2,
                  color: AppColors.divider,
                ),
              ),
              Column(
                children: List.generate(_steps.length, (i) {
                  final step = _steps[i];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Numéro de l'étape
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.3),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              '${i + 1}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Carte de l'étape
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.divider),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.04),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  step.title,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  step.desc,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary,
                                    height: 1.45,
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
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── FOOTER ───────────────────────────────────────────────────

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        border: Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        children: [
          Image.asset(
            'assets/images/logo.png',
            height: 36,
            width: 36,
            errorBuilder: (_, __, ___) => const Icon(
              Icons.account_balance,
              color: AppColors.primary,
              size: 32,
            ),
          ),
          const SizedBox(height: 8),
          Text('PGP-USS Bénin',
              style: _displayStyle.copyWith(fontSize: 18)),
          const SizedBox(height: 12),
          const Wrap(
            alignment: WrapAlignment.center,
            spacing: 16,
            runSpacing: 8,
            children: [
              Text('Mentions Légales',
                  style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      decoration: TextDecoration.underline)),
              Text('Politique de Confidentialité',
                  style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      decoration: TextDecoration.underline)),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            '© 2024 Ministère de la Santé du Bénin.\nTous droits réservés.',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 12,
                color: AppColors.textMuted,
                height: 1.5),
          ),
        ],
      ),
    );
  }

  // ── BOTTOM NAV ───────────────────────────────────────────────

  Widget _buildBottomNav() {
    return Material(
      color: Colors.white,
      elevation: 0,
      child: SafeArea(
        top: false,
        child: Container(
          height: 72,
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: AppColors.divider)),
          ),
          child: Row(
            children: [
              Expanded(
                child: _bottomNavItem(
                  icon: Icons.home,
                  activeIcon: Icons.home,
                  label: 'Accueil',
                  isActive: true,
                  onTap: () {},
                ),
              ),
              Expanded(
                child: _bottomNavItem(
                  icon: Icons.add_circle_outline,
                  activeIcon: Icons.add_circle,
                  label: 'Déposer',
                  onTap: () => context.go('/deposit-public'),
                ),
              ),
              Expanded(
                child: _bottomNavItem(
                  icon: Icons.search,
                  activeIcon: Icons.search,
                  label: 'Suivre',
                  onTap: () => context.go('/track'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _bottomNavItem({
    required IconData icon,
    required IconData activeIcon,
    required String label,
    bool isActive = false,
    required VoidCallback onTap,
  }) {
    final color = isActive ? AppColors.primary : AppColors.textMuted;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(isActive ? activeIcon : icon, size: 24, color: color),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight:
                    isActive ? FontWeight.w700 : FontWeight.w500,
                color: color,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
//  Bento stat card widget
// ─────────────────────────────────────────────────────────────────

class _BentoStatCard extends StatelessWidget {
  const _BentoStatCard({
    required this.value,
    required this.label,
    required this.accent,
    this.valueColor,
    this.trailing,
  });

  final String value;
  final String label;
  final Color accent;
  final Color? valueColor;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.atkinsonHyperlegible(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: valueColor ?? accent,
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(height: 6),
            trailing!,
          ],
        ],
      ),
    );
  }
}
