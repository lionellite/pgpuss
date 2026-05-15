import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../api/auth_api.dart';
import '../../../models/user.dart';
import '../../../state/auth_controller.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

class UsersScreen extends ConsumerStatefulWidget {
  const UsersScreen({super.key});
  @override
  ConsumerState<UsersScreen> createState() => _S();
}

class _S extends ConsumerState<UsersScreen> {
  List<AppUser> _users = [];
  bool _loading = true;
  String _search = '', _roleFilter = '';
  String? _editingId;
  String _editRole = '';

  static const _roles = {
    'USAGER': 'Usager', 'PFE': 'PFE', 'AGENT_INTERNE': 'Agent interne',
    'DIRECTEUR_EST': 'Direction', 'DDS': 'DDS', 'DQSS': 'DQSS',
    'CABINET': 'Cabinet', 'ADMIN_PLATEFORME': 'Admin',
  };

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _users = await ref.read(authApiProvider).listUsers(
        search: _search.isNotEmpty ? _search : null,
        role: _roleFilter.isNotEmpty ? _roleFilter : null);
    } catch (_) { _users = []; }
    finally { setState(() => _loading = false); }
  }

  Future<void> _saveRole(String id) async {
    try {
      await ref.read(authApiProvider).updateUser(id, {'role': _editRole});
      setState(() => _editingId = null);
      _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Rôle mis à jour')));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Erreur')));
    }
  }

  Future<void> _toggleActive(AppUser u) async {
    try {
      await ref.read(authApiProvider).updateUser(u.id, {'is_active': !u.isActive});
      _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(authControllerProvider).session?.user;
    if (me?.role != 'ADMIN_PLATEFORME') {
      return Scaffold(appBar: AppBar(title: const Text('Utilisateurs')),
        body: const EmptyState(icon: Icons.lock, title: 'Accès réservé à l\'administrateur'));
    }

    return Scaffold(
      appBar: AppBar(title: Text('Utilisateurs (${_users.length})')),
      body: Column(children: [
        Padding(padding: const EdgeInsets.all(12), child: Column(children: [
          TextField(decoration: const InputDecoration(hintText: 'Nom, email...', prefixIcon: Icon(Icons.search), isDense: true),
            onChanged: (v) { _search = v; _load(); }),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(isExpanded: true, isDense: true,
            initialValue: _roleFilter.isEmpty ? null : _roleFilter,
            decoration: const InputDecoration(labelText: 'Rôle', isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
            items: [const DropdownMenuItem(value: '', child: Text('Tous les rôles')),
              ..._roles.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))],
            onChanged: (v) { _roleFilter = v ?? ''; _load(); }),
        ])),
        Expanded(child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _users.isEmpty
            ? const EmptyState(icon: Icons.people_outline, title: 'Aucun utilisateur')
            : RefreshIndicator(onRefresh: _load, child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _users.length,
                itemBuilder: (_, i) => _userCard(_users[i], me),
              )),
        ),
      ]),
    );
  }

  Widget _userCard(AppUser u, AppUser? me) {
    return Card(margin: const EdgeInsets.only(bottom: 6), child: Padding(
      padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(width: 38, height: 38, decoration: BoxDecoration(shape: BoxShape.circle,
            gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryLight])),
            child: Center(child: Text(
              '${u.firstName.isNotEmpty ? u.firstName[0] : ''}${u.lastName.isNotEmpty ? u.lastName[0] : ''}',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(u.fullName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            Text(u.email, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
          ])),
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(20),
              color: u.isActive ? AppColors.primary.withValues(alpha: 0.1) : AppColors.danger.withValues(alpha: 0.1)),
            child: Text(u.isActive ? 'Actif' : 'Inactif',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: u.isActive ? AppColors.primary : AppColors.danger))),
        ]),
        const SizedBox(height: 8),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          _editingId == u.id
            ? Expanded(child: Row(children: [
                Expanded(child: DropdownButtonFormField<String>(isDense: true, initialValue: _editRole,
                  decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 6)),
                  items: _roles.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value, style: const TextStyle(fontSize: 12)))).toList(),
                  onChanged: (v) => setState(() => _editRole = v ?? ''))),
                IconButton(icon: const Icon(Icons.check, size: 18), onPressed: () => _saveRole(u.id)),
                IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () => setState(() => _editingId = null)),
              ]))
            : Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: AppColors.secondary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                child: Text(_roles[u.role] ?? u.role, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondary))),
          if (u.id != me?.id && _editingId != u.id) Row(children: [
            IconButton(icon: const Icon(Icons.edit, size: 18), tooltip: 'Modifier le rôle',
              onPressed: () => setState(() { _editingId = u.id; _editRole = u.role; })),
            IconButton(icon: Icon(u.isActive ? Icons.block : Icons.check_circle, size: 18,
              color: u.isActive ? AppColors.danger : AppColors.primary), onPressed: () => _toggleActive(u)),
          ]),
        ]),
      ]),
    ));
  }
}
