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
    required this.isLoading,
    this.session,
  });

  final bool isLoading;
  final AuthSession? session;

  /// Préserve la session existante si non explicitement fournie.
  /// Utiliser `clearSession: true` pour effacer la session.
  AuthState copyWith({
    bool? isLoading,
    AuthSession? session,
    bool clearSession = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      session: clearSession ? null : (session ?? this.session),
    );
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    unawaited(_bootstrap());
    return const AuthState(isLoading: true, session: null);
  }

  Future<void> _bootstrap() async {
    final storage = ref.read(tokenStorageProvider);
    final pair = await storage.read();
    if (pair == null) {
      state = state.copyWith(isLoading: false, clearSession: true);
      return;
    }

    try {
      final authApi = ref.read(authApiProvider);
      final user = await authApi.me(accessToken: pair.accessToken);
      state = AuthState(
        isLoading: false,
        session: AuthSession(
          accessToken: pair.accessToken,
          refreshToken: pair.refreshToken,
          user: user,
        ),
      );
    } catch (_) {
      await storage.clear();
      state = state.copyWith(isLoading: false, clearSession: true);
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true);
    try {
      final authApi = ref.read(authApiProvider);
      final tokens = await authApi.login(email: email, password: password);
      final user = await authApi.me(accessToken: tokens.accessToken);
      await ref.read(tokenStorageProvider).write(tokens);
      state = AuthState(
        isLoading: false,
        session: AuthSession(
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: user,
        ),
      );
    } catch (_) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true);
    try {
      final authApi = ref.read(authApiProvider);
      await authApi.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        phone: phone,
      );
      state = state.copyWith(isLoading: false);
    } catch (_) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> logout() async {
    await ref.read(tokenStorageProvider).clear();
    state = const AuthState(isLoading: false, session: null);
  }

  void forceLogout() {
    state = const AuthState(isLoading: false, session: null);
  }

  Future<void> refreshUser() async {
    if (state.session == null) return;
    try {
      final authApi = ref.read(authApiProvider);
      final user =
          await authApi.me(accessToken: state.session!.accessToken);
      state = AuthState(
        isLoading: false,
        session: AuthSession(
          accessToken: state.session!.accessToken,
          refreshToken: state.session!.refreshToken,
          user: user,
        ),
      );
    } catch (_) {}
  }
}
