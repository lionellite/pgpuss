import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../state/extra_providers.dart';
class UserShell extends ConsumerWidget {
  const UserShell({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(unreadCountProvider);
    final path = GoRouterState.of(context).uri.path;
    final currentIndex = _calcIndex(path);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        if (path == '/complaints') {
          SystemNavigator.pop();
          return;
        }
        context.go('/complaints');
      },
      child: Scaffold(
        body: child,
        bottomNavigationBar: NavigationBar(
          selectedIndex: currentIndex,
          onDestinationSelected: (i) => _navigate(context, i),
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.list_alt_outlined),
              selectedIcon: Icon(Icons.list_alt),
              label: 'Plaintes',
            ),
            const NavigationDestination(
              icon: Icon(Icons.add_circle_outline),
              selectedIcon: Icon(Icons.add_circle),
              label: 'Déposer',
            ),
            NavigationDestination(
              icon: Badge(
                isLabelVisible: (unread.valueOrNull ?? 0) > 0,
                label: Text('${unread.valueOrNull ?? 0}'),
                child: const Icon(Icons.notifications_outlined),
              ),
              selectedIcon: Badge(
                isLabelVisible: (unread.valueOrNull ?? 0) > 0,
                label: Text('${unread.valueOrNull ?? 0}'),
                child: const Icon(Icons.notifications),
              ),
              label: 'Alertes',
            ),
            const NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }

  int _calcIndex(String path) {
    if (path.startsWith('/deposit')) return 1;
    if (path.startsWith('/notifications')) return 2;
    if (path.startsWith('/profile')) return 3;
    return 0;
  }

  void _navigate(BuildContext context, int i) {
    switch (i) {
      case 0:
        context.go('/complaints');
      case 1:
        context.go('/deposit');
      case 2:
        context.go('/notifications');
      case 3:
        context.go('/profile');
    }
  }
}
