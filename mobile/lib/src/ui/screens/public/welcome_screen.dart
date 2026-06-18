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
//  WelcomeScreen — Refonte Stitch "Accueil Mobile (Style Immersif)"
// ─────────────────────────────────────────────────────────────────

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _stats;
  bool _loadingStats = true;
  bool _menuOpen = false;

  // Carousel scroll controller
  final _carouselCtrl = ScrollController();
  int _carouselIdx = 0;

  // Steps data
  static const _steps = [
    (
      icon: Icons.edit_document,
      title: '1. Soumission',
      desc:
          'Remplissez le formulaire en ligne ou appelez le 136 pour enregistrer votre grief.',
    ),
    (
      icon: Icons.query_stats,
      title: '2. Analyse',
      desc:
          "Nos équipes qualifient la plainte et l'orientent vers le service concerné.",
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
    _carouselCtrl.addListener(_onCarouselScroll);
  }

  @override
  void dispose() {
    _carouselCtrl.removeListener(_onCarouselScroll);
    _carouselCtrl.dispose();
    super.dispose();
  }

  void _onCarouselScroll() {
    final idx = (_carouselCtrl.offset / 292).round().clamp(0, 2);
    if (idx != _carouselIdx) setState(() => _carouselIdx = idx);
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

  // ── Build ──────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final treated =
        _stats?['resolved_complaints'] ?? _stats?['total_complaints'];
    final satisfaction = _stats?['satisfaction_avg'];

    return Scaffold(
      backgroundColor: AppColors.surfaceGray,
      body: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Gov flag bar (thin institutional stripe)
              const GovFlagBar(),
              // Top nav
              _buildTopNav(),
              // Scrollable content
              Expanded(
                child: SingleChildScrollView(
                  // Extra bottom padding for the fixed bottom nav
                  padding: const EdgeInsets.only(bottom: 80),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. Hero image with gradient overlay + title
                      _buildHero(),
                      const SizedBox(height: 16),
                      // 2. Emergency hotline card (red)
                      _buildEmergencyCard(),
                      const SizedBox(height: 16),
                      // 3. Primary CTA actions
                      _buildPrimaryActions(),
                      const SizedBox(height: 24),
                      // 4. Stats mini-bento
                      if (!_loadingStats)
                        _buildStatsSection(treated, satisfaction),
                      if (!_loadingStats) const SizedBox(height: 24),
                      // 5. How it works carousel
                      _buildStepsCarousel(),
                      const SizedBox(height: 24),
                      // 6. Trust / data protection block
                      _buildTrustSection(),
                      const SizedBox(height: 24),
                      // 7. Footer
                      _buildFooter(),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Side drawer overlay
          if (_menuOpen) _buildDrawer(),
          // Fixed bottom navigation bar
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildBottomNav(),
          ),
        ],
      ),
    );
  }

  // ── TOP NAV ───────────────────────────────────────────────────

  Widget _buildTopNav() {
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
              tooltip: 'Ouvrir le menu',
            ),
          ],
        ),
      ),
    );
  }

  // ── DRAWER ───────────────────────────────────────────────────

  Widget _buildDrawer() {
    return Material(
      color: Colors.black54,
      child: GestureDetector(
        onTap: () => setState(() => _menuOpen = false),
        child: Row(
          children: [
            const Spacer(),
            // Slide-in from right
            GestureDetector(
              onTap: () {}, // absorb taps inside the drawer
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
                          Text('Menu',
                              style: _displayStyle.copyWith(fontSize: 18)),
                          IconButton(
                            onPressed: () =>
                                setState(() => _menuOpen = false),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      _drawerLink('Accueil',
                          isActive: true,
                          onTap: () => setState(() => _menuOpen = false)),
                      _drawerLink('Comment ça marche',
                          onTap: () => setState(() => _menuOpen = false)),
                      _drawerLink('Statistiques',
                          onTap: () => setState(() => _menuOpen = false)),
                      _drawerLink('Contact',
                          onTap: () => setState(() => _menuOpen = false)),
                      const Spacer(),
                      FilledButton(
                        onPressed: () {
                          setState(() => _menuOpen = false);
                          context.go('/deposit-public');
                        },
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primaryContainer,
                          padding:
                              const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
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
                          side:
                              const BorderSide(color: AppColors.primary),
                          padding:
                              const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
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

  Widget _drawerLink(String label,
      {bool isActive = false, required VoidCallback onTap}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onTap,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 18,
            fontWeight:
                isActive ? FontWeight.w700 : FontWeight.w400,
            color: isActive
                ? AppColors.primary
                : AppColors.textSecondary,
            decoration:
                isActive ? TextDecoration.underline : null,
            decorationColor: AppColors.primary,
          ),
        ),
      ),
    );
  }

  // ── HERO ─────────────────────────────────────────────────────

  Widget _buildHero() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Hero image
              Image.asset(
                'assets/images/hero-stitch-mobile.jpg',
                fit: BoxFit.cover,
              ),
              // Gradient overlay bottom → top
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
              // Title overlay
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

  // ── EMERGENCY CARD ───────────────────────────────────────────

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
                const Icon(Icons.phone_in_talk,
                    color: Colors.white, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Besoin d'aide immédiate ?",
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.white
                              .withValues(alpha: 0.9),
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
                const Icon(Icons.arrow_forward,
                    color: Colors.white),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── PRIMARY ACTIONS ──────────────────────────────────────────

  Widget _buildPrimaryActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Déposer une plainte
          FilledButton.icon(
            onPressed: () => context.go('/deposit-public'),
            icon: const Icon(Icons.add_circle_outline),
            label: const Text('DÉPOSER UNE PLAINTE'),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              minimumSize: const Size.fromHeight(56),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 12),
          // Suivre ma plainte
          OutlinedButton.icon(
            onPressed: () => context.go('/track'),
            icon: const Icon(Icons.track_changes),
            label: const Text('SUIVRE MA PLAINTE'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: const BorderSide(
                  color: AppColors.primary, width: 2),
              minimumSize: const Size.fromHeight(56),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 12),
          // Se connecter / S'inscrire row
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.go('/login'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(
                        color: AppColors.primary, width: 2),
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('SE CONNECTER',
                      style:
                          TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () => context.go('/register'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text("S'INSCRIRE",
                      style:
                          TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── STATS BENTO ──────────────────────────────────────────────

  Widget _buildStatsSection(dynamic treated, dynamic satisfaction) {
    final treatedStr =
        treated != null ? _formatStat(treated) : '1 240';
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
            style: _displayStyle.copyWith(
                fontSize: 18, color: AppColors.textPrimary),
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

  String _formatStat(dynamic value) {
    final n = num.tryParse(value.toString());
    if (n != null && n >= 1000) {
      return '${n.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]} ')}+';
    }
    return value.toString();
  }

  // ── STEPS CAROUSEL ───────────────────────────────────────────

  Widget _buildStepsCarousel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Comment ça marche ?',
                style: _displayStyle.copyWith(
                    fontSize: 18, color: AppColors.textPrimary),
              ),
              TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary),
                child: const Text('Voir tout',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 190,
          child: ListView.separated(
            controller: _carouselCtrl,
            padding:
                const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: _steps.length,
            separatorBuilder: (_, __) =>
                const SizedBox(width: 12),
            itemBuilder: (context, i) {
              final step = _steps[i];
              return SizedBox(
                width: 280,
                child: Card(
                  margin: EdgeInsets.zero,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                        color: AppColors.divider),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.primaryContainer
                                .withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(step.icon,
                              color: AppColors.primary),
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
        const SizedBox(height: 10),
        // Progress dots
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _steps.length,
            (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _carouselIdx == i ? 20 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: _carouselIdx == i
                    ? AppColors.primary
                    : AppColors.divider,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── TRUST SECTION ────────────────────────────────────────────

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
              style: TextStyle(
                  fontSize: 15,
                  color: AppColors.textSecondary,
                  height: 1.45),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.verified_user,
                    color: AppColors.secondary, size: 20),
                const SizedBox(width: 8),
                const Expanded(
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

  // ── FOOTER ───────────────────────────────────────────────────

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: AppColors.surfaceContainer,
        border:
            Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        children: [
          Text('PGP-USS Bénin',
              style: _displayStyle.copyWith(fontSize: 18)),
          const SizedBox(height: 12),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 16,
            runSpacing: 8,
            children: const [
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
              Text('Portail Gouvernemental',
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
      child: Container(
        height: 64,
        decoration: const BoxDecoration(
          border: Border(
              top: BorderSide(color: AppColors.divider)),
        ),
        child: Row(
          children: [
            Expanded(
                child: _bottomNavItem(Icons.home, 'Accueil',
                    isActive: true, onTap: () {})),
            Expanded(
                child: _bottomNavItem(
                    Icons.add_circle_outline, 'Déposer',
                    onTap: () => context.go('/deposit-public'))),
            Expanded(
                child: _bottomNavItem(Icons.history, 'Suivre',
                    onTap: () => context.go('/track'))),
            Expanded(
                child: _bottomNavItem(
                    Icons.person_outline, 'Profil',
                    onTap: () => context.go('/login'))),
          ],
        ),
      ),
    );
  }

  Widget _bottomNavItem(IconData icon, String label,
      {bool isActive = false, required VoidCallback onTap}) {
    final color =
        isActive ? AppColors.primary : AppColors.textMuted;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: 4, vertical: 8),
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
                  fontWeight: isActive
                      ? FontWeight.w700
                      : FontWeight.w500,
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

// ─────────────────────────────────────────────────────────────────
//  Bento stat card widget
// ─────────────────────────────────────────────────────────────────

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
          Text(label,
              style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}
