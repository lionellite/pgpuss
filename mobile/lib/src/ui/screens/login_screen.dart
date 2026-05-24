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
    return PublicAuthLayout(
      title: 'Connexion',
      subtitle: 'Accédez à votre espace usager pour suivre vos plaintes.',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _usernameCtrl,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [
                    AutofillHints.username,
                    AutofillHints.email,
                  ],
                  decoration: const InputDecoration(
                    labelText: 'Email ou téléphone',
                    hintText: 'exemple@email.bj ou 60123456',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (v) {
                    if ((v ?? '').trim().isEmpty) {
                      return 'Identifiant requis';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordCtrl,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.password],
                  decoration: InputDecoration(
                    labelText: 'Mot de passe',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscure ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () => setState(() => _obscure = !_obscure),
                      tooltip: _obscure ? 'Afficher' : 'Masquer',
                    ),
                  ),
                  validator: (v) {
                    if ((v ?? '').isEmpty) return 'Mot de passe requis';
                    return null;
                  },
                  onFieldSubmitted: (_) => _submit(),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Se connecter'),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => context.go('/register'),
                  child: const Text('Créer un compte usager'),
                ),
                TextButton(
                  onPressed: () => context.go('/track'),
                  child: const Text('Suivre une plainte sans compte'),
                ),
                TextButton(
                  onPressed: () => context.go('/'),
                  child: Text(
                    'Retour à l\'accueil',
                    style: TextStyle(color: AppColors.textMuted),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
