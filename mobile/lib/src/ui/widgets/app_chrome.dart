import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config.dart';
import '../theme.dart';

/// Bandeau tricolore République du Bénin.
class GovFlagBar extends StatelessWidget {
  const GovFlagBar({super.key});

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 4,
      width: double.infinity,
      child: Row(
        children: [
          Expanded(child: ColoredBox(color: AppColors.primary)),
          Expanded(child: ColoredBox(color: AppColors.priorityP3)),
          Expanded(child: ColoredBox(color: AppColors.danger)),
        ],
      ),
    );
  }
}

/// Gère le bouton retour système Android / gesture iOS.
class AppBackScope extends StatelessWidget {
  const AppBackScope({
    super.key,
    required this.child,
    required this.fallbackLocation,
  });

  final Widget child;
  final String fallbackLocation;

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        if (context.canPop()) {
          context.pop();
        } else {
          context.go(fallbackLocation);
        }
      },
      child: child,
    );
  }
}

/// AppBar avec retour explicite + synchro bouton système.
class AppPageScaffold extends StatelessWidget {
  const AppPageScaffold({
    super.key,
    required this.title,
    required this.body,
    this.fallbackLocation = '/',
    this.actions,
    this.floatingActionButton,
    this.showFlagBar = true,
  });

  final String title;
  final Widget body;
  final String fallbackLocation;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final bool showFlagBar;

  @override
  Widget build(BuildContext context) {
    return AppBackScope(
      fallbackLocation: fallbackLocation,
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            tooltip: 'Retour',
            onPressed: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go(fallbackLocation);
              }
            },
          ),
          title: Text(title),
          actions: actions,
          bottom: showFlagBar
              ? const PreferredSize(
                  preferredSize: Size.fromHeight(4),
                  child: GovFlagBar(),
                )
              : null,
        ),
        body: body,
        floatingActionButton: floatingActionButton,
      ),
    );
  }
}

/// Layout Stitch — connexion / inscription (image + formulaire).
class StitchAuthLayout extends StatelessWidget {
  const StitchAuthLayout({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.child,
    this.footer,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget child;
  final Widget? footer;

  TextStyle get _display => GoogleFonts.atkinsonHyperlegible(
        fontWeight: FontWeight.w700,
        color: AppColors.primary,
      );

  @override
  Widget build(BuildContext context) {
    return AppBackScope(
      fallbackLocation: '/',
      child: Scaffold(
        backgroundColor: AppColors.surfaceGray,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const GovFlagBar(),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton.icon(
                          onPressed: () => context.go('/'),
                          icon: const Icon(Icons.arrow_back, size: 18),
                          label: const Text('Retour à l\'accueil'),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                        child: AspectRatio(
                          aspectRatio: 16 / 7,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.asset(
                                'assets/images/auth-healthcare.jpg',
                                fit: BoxFit.cover,
                              ),
                              DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.bottomCenter,
                                    end: Alignment.topCenter,
                                    colors: [
                                      AppColors.primaryContainer.withValues(alpha: 0.75),
                                      Colors.transparent,
                                    ],
                                  ),
                                ),
                              ),
                              Positioned(
                                left: 16,
                                right: 16,
                                bottom: 16,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Plateforme de Gestion des Plaintes',
                                      style: _display.copyWith(
                                        fontSize: 18,
                                        color: Colors.white,
                                        height: 1.2,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Suivi sécurisé de la qualité des soins au Bénin.',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.white.withValues(alpha: 0.95),
                                        height: 1.35,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppColors.cardBg,
                        border: Border.all(color: AppColors.divider),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Icon(icon, size: 48, color: AppColors.primaryContainer),
                          const SizedBox(height: 12),
                          Text(
                            title,
                            textAlign: TextAlign.center,
                            style: _display.copyWith(
                              fontSize: 22,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            subtitle,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 15,
                              color: AppColors.textSecondary,
                              height: 1.45,
                            ),
                          ),
                          const SizedBox(height: 24),
                          child,
                          if (footer != null) ...[
                            const SizedBox(height: 20),
                            const Divider(color: AppColors.divider),
                            const SizedBox(height: 16),
                            footer!,
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    _AuthFooter(),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AuthFooter extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      color: AppColors.surfaceContainer,
      child: Column(
        children: [
          Text(
            'Ministère de la Santé du Bénin',
            style: GoogleFonts.atkinsonHyperlegible(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            '© 2024 Ministère de la Santé du Bénin.\nTous droits réservés.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.4),
          ),
        ],
      ),
    );
  }
}

/// Champ de formulaire auth avec icône préfixe (style Stitch).
class AuthTextField extends StatelessWidget {
  const AuthTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.icon,
    this.hint,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.suffix,
    this.validator,
    this.onFieldSubmitted,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final String? hint;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final Widget? suffix;
  final String? Function(String?)? validator;
  final void Function(String)? onFieldSubmitted;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          autofillHints: autofillHints,
          validator: validator,
          onFieldSubmitted: onFieldSubmitted,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, color: AppColors.textMuted, size: 22),
            suffixIcon: suffix,
            filled: true,
            fillColor: AppColors.surface,
          ),
        ),
      ],
    );
  }
}

/// Mise en page des écrans publics (accueil, connexion, inscription).
class PublicAuthLayout extends StatelessWidget {
  const PublicAuthLayout({
    super.key,
    required this.title,
    this.subtitle,
    required this.child,
    this.showLogo = true,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final bool showLogo;

  @override
  Widget build(BuildContext context) {
    return AppBackScope(
      fallbackLocation: '/',
      child: Scaffold(
        backgroundColor: AppColors.surfaceGray,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const GovFlagBar(),
            Expanded(
              child: SafeArea(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (showLogo) ...[
                        Center(
                          child: Container(
                            width: 72,
                            height: 72,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.cardBg,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.divider),
                            ),
                            child: Image.asset('assets/images/logo.png'),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          AppConfig.appName,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'République du Bénin — Ministère de la Santé',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textMuted,
                              ),
                        ),
                        const SizedBox(height: 24),
                      ],
                      Text(
                        title,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          subtitle!,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                      const SizedBox(height: 20),
                      child,
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
}
