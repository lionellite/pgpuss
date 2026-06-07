import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../state/auth_controller.dart';
import '../../utils/api_errors.dart';
import '../theme.dart';
import '../widgets/app_chrome.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);

    try {
      await ref.read(authControllerProvider.notifier).login(
            username: _usernameCtrl.text.trim(),
            password: _passwordCtrl.text,
          );
      if (!mounted) return;
      context.go('/complaints');
    } on NotUsagerException {
      if (!mounted) return;
      showErrorSnackBar(
        ScaffoldMessenger.of(context),
        'Cette application est réservée aux usagers. Les comptes agents utilisent le site web.',
      );
    } on DioException catch (e) {
      if (!mounted) return;
      showErrorSnackBar(
        ScaffoldMessenger.of(context),
        messageFromDio(
          e,
          fallback: 'Identifiants incorrects. Vérifiez votre email ou téléphone et le mot de passe.',
        ),
      );
    } catch (_) {
      if (!mounted) return;
      showErrorSnackBar(
        ScaffoldMessenger.of(context),
        'Connexion impossible. Vérifiez votre connexion internet.',
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return StitchAuthLayout(
      icon: Icons.health_and_safety,
      title: 'Bienvenue sur PGP-USS',
      subtitle: 'Veuillez vous connecter pour accéder à votre espace.',
      footer: Column(
        children: [
          const Text(
            'Vous n\'avez pas encore de compte ?',
            style: TextStyle(fontSize: 15, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.go('/register'),
            icon: const Icon(Icons.person_add_outlined),
            label: const Text('Créer un compte'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primaryContainer,
              side: const BorderSide(color: AppColors.primaryContainer),
              minimumSize: const Size.fromHeight(48),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => context.go('/track'),
            child: const Text('Suivre une plainte sans compte'),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AuthTextField(
              controller: _usernameCtrl,
              label: 'Email ou Numéro de téléphone',
              icon: Icons.person_outline,
              hint: 'Ex: jean.dupont@email.com ou +229...',
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.username, AutofillHints.email],
              validator: (v) => (v ?? '').trim().isEmpty ? 'Identifiant requis' : null,
            ),
            const SizedBox(height: 16),
            AuthTextField(
              controller: _passwordCtrl,
              label: 'Mot de passe',
              icon: Icons.lock_outline,
              hint: '••••••••',
              obscureText: _obscure,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.password],
              suffix: IconButton(
                icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
              validator: (v) => (v ?? '').isEmpty ? 'Mot de passe requis' : null,
              onFieldSubmitted: (_) => _submit(),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _loading ? null : _submit,
              icon: _loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.login),
              label: Text(_loading ? 'Connexion…' : 'Se connecter'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primaryContainer,
                minimumSize: const Size.fromHeight(48),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
