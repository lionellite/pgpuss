import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../state/auth_controller.dart';
import '../theme.dart';

class DashboardShell extends ConsumerWidget {
  const DashboardShell({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = _calcIndex(GoRouterState.of(context).uri.path);
    final user = ref.watch(authControllerProvider).session?.user;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (i) {
          if (i == 3) {
            _showMoreMenu(context, ref, user?.role ?? '');
          } else {
            _navigate(context, i);
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            selectedIcon: Icon(Icons.folder),
            label: 'Plaintes',
          ),
          NavigationDestination(
            icon: Icon(Icons.analytics_outlined),
            selectedIcon: Icon(Icons.analytics),
            label: 'Analytique',
          ),
          NavigationDestination(
            icon: Icon(Icons.more_horiz),
            selectedIcon: Icon(Icons.more_horiz),
            label: 'Plus',
          ),
        ],
      ),
    );
  }

  int _calcIndex(String path) {
    if (path.startsWith('/dashboard/complaints') ||
        path.startsWith('/dashboard/plaintes')) {
      return 1;
    }
    if (path.startsWith('/dashboard/analytics')) {
      return 2;
    }
    if (path.startsWith('/dashboard/users')) {
      return 3;
    }
    return 0;
  }

  void _navigate(BuildContext context, int i) {
    switch (i) {
      case 0:
        context.go('/dashboard');
      case 1:
        context.go('/dashboard/complaints');
      case 2:
        context.go('/dashboard/analytics');
    }
  }

  void _showMoreMenu(BuildContext context, WidgetRef ref, String role) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        final user = ref.read(authControllerProvider).session?.user;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // User info header
                if (user != null) Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                  child: Row(children: [
                    Container(
                      width: 44, height: 44,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [AppColors.primary, AppColors.primaryLight],
                        ),
                      ),
                      child: Center(child: Text(
                        '${user.firstName.isNotEmpty ? user.firstName[0] : ''}${user.lastName.isNotEmpty ? user.lastName[0] : ''}',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
                      )),
                    ),
                    const SizedBox(width: 14),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user.fullName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        Text(user.role, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                      ],
                    )),
                  ]),
                ),
                const Divider(height: 1),

                // Menu items
                if (role == 'ADMIN_PLATEFORME')
                  ListTile(
                    leading: const Icon(Icons.people_outlined),
                    title: const Text('Gestion des utilisateurs'),
                    onTap: () {
                      Navigator.pop(ctx);
                      context.go('/dashboard/users');
                    },
                  ),
                ListTile(
                  leading: const Icon(Icons.person_outline),
                  title: const Text('Mon profil'),
                  onTap: () {
                    Navigator.pop(ctx);
                    context.go('/profile');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.track_changes),
                  title: const Text('Suivre une plainte'),
                  onTap: () {
                    Navigator.pop(ctx);
                    context.go('/track');
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.logout, color: AppColors.danger),
                  title: const Text('Déconnexion', style: TextStyle(color: AppColors.danger)),
                  onTap: () {
                    Navigator.pop(ctx);
                    ref.read(authControllerProvider.notifier).logout();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
