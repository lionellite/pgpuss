import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../state/auth_controller.dart';
import '../../../utils/api_errors.dart';
import '../../theme.dart';
import '../../widgets/app_chrome.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);

    try {
      await ref.read(authControllerProvider.notifier).register(
            firstName: _firstNameCtrl.text.trim(),
            lastName: _lastNameCtrl.text.trim(),
            email: _emailCtrl.text.trim(),
            password: _passwordCtrl.text,
            phone: _phoneCtrl.text.trim(),
          );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: AppColors.primaryContainer),
              SizedBox(width: 8),
              Text('Compte créé'),
            ],
          ),
          content: Text(
            'Votre compte usager a été créé.\n'
            'Connectez-vous avec ${_emailCtrl.text.trim()}',
          ),
          actions: [
            FilledButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                context.go('/login');
              },
              style: FilledButton.styleFrom(backgroundColor: AppColors.primaryContainer),
              child: const Text('Se connecter'),
            ),
          ],
        ),
      );
    } on DioException catch (e) {
      if (!mounted) return;
      showErrorSnackBar(
        ScaffoldMessenger.of(context),
        messageFromDio(e, fallback: "Erreur lors de l'inscription."),
      );
    } catch (_) {
      if (!mounted) return;
      showErrorSnackBar(
        ScaffoldMessenger.of(context),
        "Erreur lors de l'inscription. Vérifiez votre connexion.",
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return StitchAuthLayout(
      icon: Icons.person_add_alt_1,
      title: 'Créer votre compte',
      subtitle: 'Rejoignez la plateforme pour déposer et suivre vos plaintes en toute sécurité.',
      footer: Column(
        children: [
          const Text(
            'Déjà un compte ?',
            style: TextStyle(fontSize: 15, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.go('/login'),
            icon: const Icon(Icons.login),
            label: const Text('Se connecter'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primaryContainer,
              side: const BorderSide(color: AppColors.primaryContainer),
              minimumSize: const Size.fromHeight(48),
            ),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: AuthTextField(
                    controller: _firstNameCtrl,
                    label: 'Prénom',
                    icon: Icons.badge_outlined,
                    textInputAction: TextInputAction.next,
                    validator: (v) => (v ?? '').trim().isEmpty ? 'Requis' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: AuthTextField(
                    controller: _lastNameCtrl,
                    label: 'Nom',
                    icon: Icons.badge_outlined,
                    textInputAction: TextInputAction.next,
                    validator: (v) => (v ?? '').trim().isEmpty ? 'Requis' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            AuthTextField(
              controller: _emailCtrl,
              label: 'Adresse email',
              icon: Icons.mail_outline,
              hint: 'exemple@email.bj',
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              validator: (v) {
                final s = (v ?? '').trim();
                if (s.isEmpty) return 'Email requis';
                if (!s.contains('@')) return 'Email invalide';
                return null;
              },
            ),
            const SizedBox(height: 16),
            AuthTextField(
              controller: _phoneCtrl,
              label: 'Téléphone (optionnel)',
              icon: Icons.phone_outlined,
              hint: '+229 XX XX XX XX',
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            AuthTextField(
              controller: _passwordCtrl,
              label: 'Mot de passe',
              icon: Icons.lock_outline,
              hint: 'Minimum 8 caractères',
              obscureText: _obscure,
              textInputAction: TextInputAction.next,
              suffix: IconButton(
                icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
              validator: (v) => (v ?? '').length < 8 ? 'Minimum 8 caractères' : null,
            ),
            const SizedBox(height: 16),
            AuthTextField(
              controller: _confirmCtrl,
              label: 'Confirmer le mot de passe',
              icon: Icons.lock_reset,
              obscureText: true,
              textInputAction: TextInputAction.done,
              validator: (v) {
                if (v != _passwordCtrl.text) return 'Les mots de passe ne correspondent pas';
                return null;
              },
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
                  : const Icon(Icons.how_to_reg),
              label: Text(_loading ? 'Création…' : 'Créer mon compte'),
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
