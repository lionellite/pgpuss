import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../state/auth_controller.dart';
import '../ui/screens/auth/register_screen.dart';
import '../ui/screens/dashboard/admin_complaint_detail_screen.dart';
import '../ui/screens/dashboard/admin_complaints_list_screen.dart';
import '../ui/screens/dashboard/analytics_screen.dart';
import '../ui/screens/dashboard/dashboard_home_screen.dart';
import '../ui/screens/dashboard/users_screen.dart';
import '../ui/screens/login_screen.dart';
import '../ui/screens/public/deposit_screen.dart';
import '../ui/screens/public/track_screen.dart';
import '../ui/screens/public/welcome_screen.dart';
import '../ui/screens/user/my_complaints_screen.dart';
import '../ui/screens/user/notifications_screen.dart';
import '../ui/screens/user/profile_screen.dart';
import '../ui/screens/user/user_complaint_detail_screen.dart';
import '../ui/shells/dashboard_shell.dart';
import '../ui/shells/user_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final path = state.uri.path;
      final loggedIn = auth.session != null;
      final isLoading = auth.isLoading;

      if (isLoading) return null;

      // Public routes — always accessible (no auth required)
      const publicPaths = ['/', '/login', '/register', '/track', '/deposit-public'];
      if (publicPaths.contains(path)) {
        // If logged in and on auth/welcome pages, redirect to home
        if (loggedIn && (path == '/' || path == '/login' || path == '/register')) {
          final user = auth.session!.user;
          return user.isAgent ? '/dashboard' : '/complaints';
        }
        return null;
      }

      // Protected routes — require login
      if (!loggedIn) {
        return '/';
      }

      // Role guard: usagers cannot access /dashboard/*
      final user = auth.session!.user;
      if (path.startsWith('/dashboard') && !user.isAgent) {
        return '/complaints';
      }

      return null;
    },
    routes: [
      // ── Public routes ──
      GoRoute(path: '/', builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(path: '/track', builder: (_, _) => const TrackScreen()),
      GoRoute(path: '/deposit-public', builder: (_, _) => const DepositScreen()),

      // ── User shell (USAGER role) ──
      ShellRoute(
        builder: (_, _, child) => UserShell(child: child),
        routes: [
          GoRoute(path: '/complaints', builder: (_, _) => const MyComplaintsScreen()),
          GoRoute(path: '/deposit', builder: (_, _) => const DepositScreen()),
          GoRoute(path: '/notifications', builder: (_, _) => const NotificationsScreen()),
          GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
        ],
      ),

      // User complaint detail (outside shell for full screen)
      GoRoute(
        path: '/complaints/:id',
        builder: (_, state) => UserComplaintDetailScreen(
          complaintId: state.pathParameters['id']!,
        ),
      ),

      // ── Dashboard shell (PFE, AGENT, DIRECTEUR, DDS, etc.) ──
      ShellRoute(
        builder: (_, _, child) => DashboardShell(child: child),
        routes: [
          GoRoute(path: '/dashboard', builder: (_, _) => const DashboardHomeScreen()),
          GoRoute(path: '/dashboard/complaints', builder: (_, _) => const AdminComplaintsListScreen()),
          GoRoute(path: '/dashboard/analytics', builder: (_, _) => const AnalyticsScreen()),
          GoRoute(path: '/dashboard/users', builder: (_, _) => const UsersScreen()),
        ],
      ),

      // Dashboard complaint detail (outside shell)
      GoRoute(
        path: '/dashboard/complaints/:id',
        builder: (_, state) => AdminComplaintDetailScreen(
          id: state.pathParameters['id']!,
        ),
      ),
    ],
  );
});
