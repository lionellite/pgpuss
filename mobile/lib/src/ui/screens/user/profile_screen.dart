import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../api/auth_api.dart';
import '../../../state/auth_controller.dart';
import '../../theme.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _State();
}

class _State extends ConsumerState<ProfileScreen> {
  String _tab = 'profile';
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _oldPwdCtrl = TextEditingController();
  final _newPwdCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final u = ref.read(authControllerProvider).session?.user;
    _firstCtrl.text = u?.firstName ?? '';
    _lastCtrl.text = u?.lastName ?? '';
    _phoneCtrl.text = u?.phone ?? '';
  }

  @override
  void dispose() {
    _firstCtrl.dispose(); _lastCtrl.dispose(); _phoneCtrl.dispose();
    _oldPwdCtrl.dispose(); _newPwdCtrl.dispose(); _confirmCtrl.dispose();
    super.dispose();
  }

  static const _roles = {
    'USAGER': 'Usager / Plaignant',
    'PFE': 'Point Focal Établissement',
    'DIRECTEUR_EST': "Direction de l'établissement",
    'DDS': 'Direction Départementale (DDS)',
    'DQSS': 'DQSS / Agence Qualité',
    'CABINET': 'Ministère (Cabinet)',
    'AGENT_INTERNE': 'Agent interne',
    'ADMIN_PLATEFORME': 'Admin plateforme',
  };

  Future<void> _saveProfile() async {
    setState(() => _saving = true);
    try {
      await ref.read(authApiProvider).updateProfile({
        'first_name': _firstCtrl.text.trim(),
        'last_name': _lastCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
      });
      await ref.read(authControllerProvider.notifier).refreshUser();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profil mis à jour')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erreur lors de la mise à jour')));
      }
    } finally { if (mounted) setState(() => _saving = false); }
  }

  Future<void> _changePassword() async {
    if (_newPwdCtrl.text != _confirmCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Les mots de passe ne correspondent pas')));
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(authApiProvider).changePassword(
        oldPassword: _oldPwdCtrl.text, newPassword: _newPwdCtrl.text);
      _oldPwdCtrl.clear(); _newPwdCtrl.clear(); _confirmCtrl.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mot de passe modifié')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erreur')));
      }
    } finally { if (mounted) setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) {
    final u = ref.watch(authControllerProvider).session?.user;
    if (u == null) return const SizedBox.shrink();

    return Scaffold(
      appBar: AppBar(title: const Text('Mon profil')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          // Avatar card
          Card(child: Padding(padding: const EdgeInsets.all(24), child: Column(children: [
            Container(
              width: 72, height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryLight]),
              ),
              child: Center(child: Text(
                '${u.firstName.isNotEmpty ? u.firstName[0] : ''}${u.lastName.isNotEmpty ? u.lastName[0] : ''}',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white),
              )),
            ),
            const SizedBox(height: 12),
            Text(u.fullName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(u.email, style: TextStyle(fontSize: 13, color: Colors.grey[500])),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.secondary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20)),
              child: Text(_roles[u.role] ?? u.role,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.secondary)),
            ),
          ]))),
          const SizedBox(height: 16),

          // Tabs
          Row(children: [
            _tabBtn('profile', '👤 Informations'),
            const SizedBox(width: 8),
            _tabBtn('password', '🔒 Mot de passe'),
          ]),
          const SizedBox(height: 16),

          // Tab content
          Card(child: Padding(padding: const EdgeInsets.all(20),
            child: _tab == 'profile' ? _profileForm(u) : _passwordForm())),
          const SizedBox(height: 24),

          // Logout
          SizedBox(width: double.infinity, child: OutlinedButton.icon(
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
            icon: const Icon(Icons.logout, color: AppColors.danger),
            label: const Text('Déconnexion', style: TextStyle(color: AppColors.danger)),
            style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.danger)),
          )),
        ]),
      ),
    );
  }

  Widget _tabBtn(String key, String label) {
    final active = _tab == key;
    return Expanded(child: active
      ? FilledButton(onPressed: () {}, child: Text(label, style: const TextStyle(fontSize: 13)))
      : OutlinedButton(onPressed: () => setState(() => _tab = key),
          child: Text(label, style: const TextStyle(fontSize: 13))));
  }

  Widget _profileForm(dynamic u) {
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Row(children: [
        Expanded(child: TextField(controller: _firstCtrl,
          decoration: const InputDecoration(labelText: 'Prénom', prefixIcon: Icon(Icons.person_outline)))),
        const SizedBox(width: 12),
        Expanded(child: TextField(controller: _lastCtrl,
          decoration: const InputDecoration(labelText: 'Nom'))),
      ]),
      const SizedBox(height: 16),
      TextField(enabled: false,
        decoration: InputDecoration(labelText: 'Email', prefixIcon: const Icon(Icons.email_outlined),
          hintText: u.email)),
      const SizedBox(height: 16),
      TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone,
        decoration: const InputDecoration(labelText: 'Téléphone', prefixIcon: Icon(Icons.phone_outlined))),
      const SizedBox(height: 20),
      FilledButton(onPressed: _saving ? null : _saveProfile,
        child: _saving ? const SizedBox(height: 18, width: 18,
          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('Enregistrer')),
    ]);
  }

  Widget _passwordForm() {
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      TextField(controller: _oldPwdCtrl, obscureText: true,
        decoration: const InputDecoration(labelText: 'Mot de passe actuel', prefixIcon: Icon(Icons.lock_outlined))),
      const SizedBox(height: 16),
      TextField(controller: _newPwdCtrl, obscureText: true,
        decoration: const InputDecoration(labelText: 'Nouveau mot de passe')),
      const SizedBox(height: 16),
      TextField(controller: _confirmCtrl, obscureText: true,
        decoration: const InputDecoration(labelText: 'Confirmer')),
      const SizedBox(height: 20),
      FilledButton(onPressed: _saving ? null : _changePassword,
        child: _saving ? const SizedBox(height: 18, width: 18,
          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('Changer le mot de passe')),
    ]);
  }
}
