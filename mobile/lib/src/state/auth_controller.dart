import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/auth_api.dart';
import '../api/token_storage.dart';
import '../models/user.dart';

class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final AppUser user;
}

class AuthState {
  const AuthState({
    required this.isBootstrapping,
    this.session,
  });

  /// Chargement initial des tokens stockés uniquement.
  final bool isBootstrapping;
  final AuthSession? session;

  bool get isLoggedIn => session != null;

  AuthState copyWith({
    bool? isBootstrapping,
    AuthSession? session,
    bool clearSession = false,
  }) {
    return AuthState(
      isBootstrapping: isBootstrapping ?? this.isBootstrapping,
      session: clearSession ? null : (session ?? this.session),
    );
  }
}

/// Compte agent/admin : application mobile réservée aux usagers.
class NotUsagerException implements Exception {
  const NotUsagerException();
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    unawaited(_bootstrap());
    return const AuthState(isBootstrapping: true, session: null);
  }

  Future<void> _bootstrap() async {
    final storage = ref.read(tokenStorageProvider);
    final pair = await storage.read();
    if (pair == null) {
      state = const AuthState(isBootstrapping: false, session: null);
      return;
    }

    try {
      final authApi = ref.read(authApiProvider);
      final user = await authApi.me(accessToken: pair.accessToken);
      if (user.role != 'USAGER') {
        await storage.clear();
        state = const AuthState(isBootstrapping: false, session: null);
        return;
      }
      state = AuthState(
        isBootstrapping: false,
        session: AuthSession(
          accessToken: pair.accessToken,
          refreshToken: pair.refreshToken,
          user: user,
        ),
      );
    } catch (_) {
      await storage.clear();
      state = const AuthState(isBootstrapping: false, session: null);
    }
  }

  Future<AppUser> login({
    required String username,
    required String password,
  }) async {
    final authApi = ref.read(authApiProvider);
    final result = await authApi.loginWithCredentials(
      username: username,
      password: password,
    );

    if (result.user.role != 'USAGER') {
      throw const NotUsagerException();
    }

    await ref.read(tokenStorageProvider).write(result.tokens);
    state = AuthState(
      isBootstrapping: false,
      session: AuthSession(
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        user: result.user,
      ),
    );
    return result.user;
  }

  Future<void> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
  }) async {
    final authApi = ref.read(authApiProvider);
    await authApi.register(
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      phone: phone,
    );
  }

  Future<void> logout() async {
    await ref.read(tokenStorageProvider).clear();
    state = const AuthState(isBootstrapping: false, session: null);
  }

  void forceLogout() {
    unawaited(ref.read(tokenStorageProvider).clear());
    state = const AuthState(isBootstrapping: false, session: null);
  }

  void updateAccessToken(String accessToken) {
    final session = state.session;
    if (session == null) return;
    state = AuthState(
      isBootstrapping: false,
      session: AuthSession(
        accessToken: accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
      ),
    );
  }

  Future<void> refreshUser() async {
    if (state.session == null) return;
    try {
      final authApi = ref.read(authApiProvider);
      final user =
          await authApi.me(accessToken: state.session!.accessToken);
      state = AuthState(
        isBootstrapping: false,
        session: AuthSession(
          accessToken: state.session!.accessToken,
          refreshToken: state.session!.refreshToken,
          user: user,
        ),
      );
    } catch (_) {}
  }
}
