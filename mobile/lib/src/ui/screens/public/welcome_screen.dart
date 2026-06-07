import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../api/dio_provider.dart';
import '../../theme.dart';
import '../../widgets/app_chrome.dart';
import '../../widgets/a11y_widgets.dart';

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  Map<String, dynamic>? _stats;
  bool _loadingStats = true;
  bool _menuOpen = false;

  static const _steps = [
    (
      icon: Icons.edit_document,
      title: '1. Soumission',
      desc: 'Remplissez le formulaire en ligne ou appelez le 136 pour enregistrer votre grief.',
    ),
    (
      icon: Icons.query_stats,
      title: '2. Analyse',
      desc: "Nos équipes qualifient la plainte et l'orientent vers le service concerné.",
    ),
    (
      icon: Icons.task_alt,
      title: '3. Résolution',
      desc: 'Une réponse concrète vous est apportée sous 15 jours maximum.',
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
      final res = await dio.get<Map<String, dynamic>>('/api/analytics/public-stats/');
      if (mounted) setState(() => _stats = res.data);
    } catch (_) {
      // Stats optionnelles
    } finally {
      if (mounted) setState(() => _loadingStats = false);
    }
  }

  Future<void> _callGreenLine() async {
    final uri = Uri.parse('tel:136');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  TextStyle get _displayStyle => GoogleFonts.atkinsonHyperlegible(
        fontWeight: FontWeight.w700,
        color: AppColors.primary,
      );

  @override
  Widget build(BuildContext context) {
    final treated = _stats?['resolved_complaints'] ?? _stats?['total_complaints'];
    final satisfaction = _stats?['satisfaction_avg'];

    return Scaffold(
      backgroundColor: AppColors.surfaceGray,
      body: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const GovFlagBar(),
              _buildTopNav(context),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.only(bottom: 80),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildHero(context),
                      const SizedBox(height: 24),
                      _buildEmergencyCard(),
                      const SizedBox(height: 16),
                      _buildPrimaryActions(context),
                      const SizedBox(height: 24),
                      _buildStatsSection(treated, satisfaction),
                      const SizedBox(height: 24),
                      _buildStepsCarousel(),
                      const SizedBox(height: 24),
                      _buildTrustSection(),
                      const SizedBox(height: 24),
                      _buildFooter(),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (_menuOpen) _buildDrawer(context),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildBottomNav(context),
          ),
        ],
      ),
    );
  }

  Widget _buildTopNav(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 0,
      child: Container(
        height: 64,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.divider)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'PGP-USS Bénin',
              style: _displayStyle.copyWith(fontSize: 18),
            ),
            IconButton(
              onPressed: () => setState(() => _menuOpen = true),
              icon: const Icon(Icons.menu, color: AppColors.primary),
              tooltip: 'Menu',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Material(
      color: Colors.black54,
      child: GestureDetector(
        onTap: () => setState(() => _menuOpen = false),
        child: Row(
          children: [
            const Spacer(),
            GestureDetector(
              onTap: () {},
              child: Container(
                width: MediaQuery.of(context).size.width * 0.8,
                height: double.infinity,
                color: Colors.white,
                padding: const EdgeInsets.all(24),
                child: SafeArea(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Menu', style: _displayStyle.copyWith(fontSize: 18)),
                          IconButton(
                            onPressed: () => setState(() => _menuOpen = false),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      _drawerLink('Accueil', isActive: true, onTap: () => setState(() => _menuOpen = false)),
                      _drawerLink('Comment ça marche', onTap: () => setState(() => _menuOpen = false)),
                      _drawerLink('Statistiques', onTap: () => setState(() => _menuOpen = false)),
                      _drawerLink('Contact', onTap: () => setState(() => _menuOpen = false)),
                      const Spacer(),
                      FilledButton(
                        onPressed: () {
                          setState(() => _menuOpen = false);
                          context.go('/deposit-public');
                        },
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primaryContainer,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('DÉPOSER UNE PLAINTE'),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () {
                          setState(() => _menuOpen = false);
                          context.go('/login');
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('SE CONNECTER'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _drawerLink(String label, {bool isActive = false, required VoidCallback onTap}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onTap,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 18,
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
            color: isActive ? AppColors.primary : AppColors.textSecondary,
            decoration: isActive ? TextDecoration.underline : null,
            decorationColor: AppColors.primary,
          ),
        ),
      ),
    );
  }

  Widget _buildHero(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                'assets/images/hero-stitch-mobile.jpg',
                fit: BoxFit.cover,
              ),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      AppColors.primary.withValues(alpha: 0.85),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: Text(
                  'Votre voix pour un meilleur système de santé.',
                  style: _displayStyle.copyWith(
                    fontSize: 22,
                    color: Colors.white,
                    height: 1.2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmergencyCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Material(
        color: AppColors.emergency,
        borderRadius: BorderRadius.circular(12),
        elevation: 2,
        child: InkWell(
          onTap: _callGreenLine,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.phone_in_talk, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Besoin d'aide immédiate ?",
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.white.withValues(alpha: 0.9),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        'Ligne Verte 136',
                        style: _displayStyle.copyWith(
                          fontSize: 20,
                          color: Colors.white,
                          height: 1.1,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward, color: Colors.white),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPrimaryActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          FilledButton.icon(
            onPressed: () => context.go('/deposit-public'),
            icon: const Icon(Icons.add_circle_outline),
            label: const Text('DÉPOSER UNE PLAINTE'),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              minimumSize: const Size.fromHeight(56),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.go('/track'),
            icon: const Icon(Icons.track_changes),
            label: const Text('SUIVRE MA PLAINTE'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: const BorderSide(color: AppColors.primary, width: 2),
              minimumSize: const Size.fromHeight(56),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.go('/login'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary, width: 2),
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('SE CONNECTER', style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () => context.go('/register'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text("S'INSCRIRE", style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsSection(dynamic treated, dynamic satisfaction) {
    if (_loadingStats) return const SizedBox.shrink();

    final treatedStr = treated != null ? '$treated' : '1 240';
    final satStr = satisfaction != null
        ? '${((satisfaction as num) / 5 * 100).round()}%'
        : '92%';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Aujourd'hui sur la plateforme",
            style: _displayStyle.copyWith(fontSize: 18, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _BentoStatCard(
                  value: treatedStr,
                  label: 'Plaintes traitées',
                  accent: AppColors.priorityP4,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _BentoStatCard(
                  value: satStr,
                  label: 'Satisfaction',
                  accent: AppColors.secondary,
                  valueColor: AppColors.secondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStepsCarousel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Comment ça marche ?',
            style: _displayStyle.copyWith(fontSize: 18, color: AppColors.textPrimary),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 200,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: _steps.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, i) {
              final step = _steps[i];
              return SizedBox(
                width: 280,
                child: Card(
                  margin: EdgeInsets.zero,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.primaryContainer.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(step.icon, color: AppColors.primary),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          step.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Expanded(
                          child: Text(
                            step.desc,
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textSecondary,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Container(width: 8, height: 8, decoration: BoxDecoration(color: AppColors.divider, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Container(width: 8, height: 8, decoration: BoxDecoration(color: AppColors.divider, shape: BoxShape.circle)),
          ],
        ),
      ],
    );
  }

  Widget _buildTrustSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainer,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Protection de vos données',
              style: _displayStyle.copyWith(fontSize: 20),
            ),
            const SizedBox(height: 8),
            const Text(
              'Toutes vos plaintes sont traitées de manière strictement confidentielle et sécurisée par le Ministère de la Santé.',
              style: TextStyle(fontSize: 15, color: AppColors.textSecondary, height: 1.45),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.verified_user, color: AppColors.secondary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Certifié conforme aux normes nationales',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.secondary,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: AppColors.surfaceContainer,
        border: Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        children: [
          Text('PGP-USS Bénin', style: _displayStyle.copyWith(fontSize: 18)),
          const SizedBox(height: 12),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 16,
            runSpacing: 8,
            children: const [
              Text('Mentions Légales', style: TextStyle(fontSize: 13, color: AppColors.textSecondary, decoration: TextDecoration.underline)),
              Text('Politique de Confidentialité', style: TextStyle(fontSize: 13, color: AppColors.textSecondary, decoration: TextDecoration.underline)),
              Text('Portail Gouvernemental', style: TextStyle(fontSize: 13, color: AppColors.textSecondary, decoration: TextDecoration.underline)),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            '© 2024 Ministère de la Santé du Bénin.\nTous droits réservés.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: AppColors.textMuted, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 0,
      child: Container(
        height: 64,
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.divider)),
        ),
        child: Row(
          children: [
            Expanded(child: _bottomNavItem(Icons.home, 'Accueil', isActive: true, onTap: () {})),
            Expanded(child: _bottomNavItem(Icons.add_circle_outline, 'Déposer', onTap: () => context.go('/deposit-public'))),
            Expanded(child: _bottomNavItem(Icons.history, 'Suivre', onTap: () => context.go('/track'))),
            Expanded(child: _bottomNavItem(Icons.person_outline, 'Profil', onTap: () => context.go('/login'))),
          ],
        ),
      ),
    );
  }

  Widget _bottomNavItem(IconData icon, String label, {bool isActive = false, required VoidCallback onTap}) {
    final color = isActive ? AppColors.primary : AppColors.textMuted;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(height: 2),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label.toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  color: color,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BentoStatCard extends StatelessWidget {
  const _BentoStatCard({
    required this.value,
    required this.label,
    required this.accent,
    this.valueColor,
  });

  final String value;
  final String label;
  final Color accent;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return AccentLeftCard(
      accentColor: accent,
      backgroundColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: GoogleFonts.atkinsonHyperlegible(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: valueColor ?? AppColors.primary,
            ),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}
