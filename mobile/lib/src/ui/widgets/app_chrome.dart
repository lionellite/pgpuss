import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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
          Expanded(child: ColoredBox(color: AppColors.secondary)),
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
        backgroundColor: AppColors.surface,
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
                              color: Colors.white,
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
