import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../state/auth_controller.dart';
import 'router_refresh.dart';
import '../ui/screens/auth/register_screen.dart';
import '../ui/screens/login_screen.dart';
import '../ui/screens/public/deposit_screen.dart';
import '../ui/screens/public/track_screen.dart';
import '../ui/screens/public/welcome_screen.dart';
import '../ui/screens/user/my_complaints_screen.dart';
import '../ui/screens/user/notifications_screen.dart';
import '../ui/screens/user/profile_screen.dart';
import '../ui/screens/user/user_complaint_detail_screen.dart';
import '../ui/shells/user_shell.dart';

const _publicPaths = {
  '/',
  '/login',
  '/register',
  '/track',
  '/deposit-public',
};

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ref.read(routerRefreshProvider);

  return GoRouter(
    refreshListenable: refresh,
    initialLocation: '/',
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final path = state.uri.path;

      if (auth.isBootstrapping) {
        return null;
      }

      final loggedIn = auth.isLoggedIn;

      if (_publicPaths.contains(path)) {
        if (loggedIn && (path == '/' || path == '/login' || path == '/register')) {
          return '/complaints';
        }
        return null;
      }

      if (!loggedIn) {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(
        path: '/track',
        builder: (_, state) => TrackScreen(
          initialTicket: state.uri.queryParameters['ticket'],
        ),
      ),
      GoRoute(path: '/deposit-public', builder: (_, _) => const DepositScreen()),

      ShellRoute(
        builder: (_, _, child) => UserShell(child: child),
        routes: [
          GoRoute(path: '/complaints', builder: (_, _) => const MyComplaintsScreen()),
          GoRoute(path: '/deposit', builder: (_, _) => const DepositScreen()),
          GoRoute(path: '/notifications', builder: (_, _) => const NotificationsScreen()),
          GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
        ],
      ),

      GoRoute(
        path: '/complaints/:id',
        builder: (_, state) => UserComplaintDetailScreen(
          complaintId: state.pathParameters['id']!,
        ),
      ),
    ],
  );
});
