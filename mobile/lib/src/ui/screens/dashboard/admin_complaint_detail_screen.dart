import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../api/auth_api.dart';
import '../../../api/complaints_api.dart';
import '../../../models/complaint.dart';
import '../../../models/user.dart';
import '../../../state/auth_controller.dart';
import '../../theme.dart';
import '../../widgets/badges.dart';
import '../../widgets/timeline_widget.dart';

class AdminComplaintDetailScreen extends ConsumerStatefulWidget {
  const AdminComplaintDetailScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<AdminComplaintDetailScreen> createState() => _S();
}

class _S extends ConsumerState<AdminComplaintDetailScreen> {
  ComplaintDetail? _c;
  bool _loading = true;
  List<AppUser> _agents = [];

  @override
  void initState() { super.initState(); _load(); _loadAgents(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final c = await ref.read(complaintsApiProvider).getDetail(widget.id);
      setState(() => _c = c);
    } catch (_) { if (mounted) Navigator.of(context).pop(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _loadAgents() async {
    try {
      _agents = await ref.read(authApiProvider).listUsers();
    } catch (_) {}
  }

  Future<void> _doAction(String action, [Map<String, dynamic>? data]) async {
    try {
      final api = ref.read(complaintsApiProvider);
      switch (action) {
        case 'acknowledge': await api.acknowledge(widget.id);
        case 'requestInfo': await api.requestInfo(widget.id, data ?? {});
        case 'qualify': await api.qualify(widget.id, data ?? {});
        case 'assign': await api.assign(widget.id, data ?? {});
        case 'acceptAssignment': await api.acceptAssignment(widget.id, data);
        case 'refuseAssignment': await api.refuseAssignment(widget.id, data ?? {});
        case 'start': await api.startInvestigation(widget.id);
        case 'investigationLog': await api.investigationLog(widget.id, data ?? {});
        case 'requestExtension': await api.requestExtension(widget.id, data ?? {});
        case 'resolve': await api.resolve(widget.id, data ?? {});
        case 'escalate': await api.escalate(widget.id, data ?? {});
        case 'validateResolution': await api.validateResolution(widget.id, data ?? {});
        case 'rejectResolution': await api.rejectResolution(widget.id, data ?? {});
        case 'ddsAssignInspector': await api.ddsAssignInspector(widget.id, data ?? {});
        case 'ddsInvestigation': await api.ddsInvestigation(widget.id, data ?? {});
        case 'notifyParties': await api.notifyParties(widget.id, data ?? {});
        case 'arbitrate': await api.arbitrate(widget.id, data ?? {});
        case 'close': await api.close(widget.id, data);
      }
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Action effectuée')));
      _load();
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Erreur')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator()));
    final c = _c;
    if (c == null) return const SizedBox.shrink();
    final role = ref.watch(authControllerProvider).session?.user.role ?? '';

    return Scaffold(
      appBar: AppBar(title: Text(c.ticketNumber), actions: [
        IconButton(icon: const Icon(Icons.refresh), onPressed: _load)]),
      body: RefreshIndicator(onRefresh: _load, child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Header
          Card(child: Padding(padding: const EdgeInsets.all(20), child: Column(
            crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text(c.ticketNumber, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primary)),
                Row(children: [StatusBadge(status: c.status), const SizedBox(width: 6), PriorityBadge(priority: c.priority)]),
              ]),
              const SizedBox(height: 12),
              Text(c.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              _infoGrid(c),
            ],
          ))),
          const SizedBox(height: 12),

          // Workflow actions
          _workflowActions(c, role),

          // Description
          Card(child: Padding(padding: const EdgeInsets.all(20), child: Column(
            crossAxisAlignment: CrossAxisAlignment.start, children: [
              _sectionTitle('Description'),
              const SizedBox(height: 8),
              Text(c.description, style: const TextStyle(fontSize: 14, height: 1.7)),
              if (c.voiceFileUrl != null) Padding(padding: const EdgeInsets.only(top: 12),
                child: OutlinedButton.icon(onPressed: () {}, icon: const Icon(Icons.mic), label: const Text('Message vocal'))),
            ],
          ))),

          // Resolution
          if (c.resolutionNotes != null && c.resolutionNotes!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Card(child: Container(
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(12),
                border: const Border(left: BorderSide(color: AppColors.primary, width: 4))),
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _sectionTitle('Résolution', color: AppColors.primary),
                const SizedBox(height: 8),
                Text(c.resolutionNotes!, style: const TextStyle(fontSize: 14, height: 1.7)),
              ]),
            )),
          ],

          // History
          if (c.history != null && c.history!.isNotEmpty) ...[
            const SizedBox(height: 20),
            _sectionTitle('Historique'),
            const SizedBox(height: 12),
            TimelineWidget(entries: c.history!.reversed.toList()),
          ],
        ]),
      )),
    );
  }

  Widget _sectionTitle(String t, {Color? color}) => Text(t.toUpperCase(),
    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color ?? Colors.grey[500], letterSpacing: 0.5));

  Widget _infoGrid(ComplaintDetail c) {
    final items = [
      ('Établissement', c.establishmentName ?? '—'), ('Service', c.serviceName ?? '—'),
      ('Catégorie', c.categoryName ?? '—'), ('Canal', c.channelDisplay ?? '—'),
      ('Plaignant', c.complainantDisplay ?? '—'), ('Affecté à', c.assignedToName ?? 'Non affecté'),
    ];
    return Wrap(spacing: 8, runSpacing: 8, children: items.map((i) => Container(
      width: (MediaQuery.of(context).size.width - 80) / 2,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey[200]!)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(i.$1.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.grey[500])),
        const SizedBox(height: 2),
        Text(i.$2, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500), maxLines: 2, overflow: TextOverflow.ellipsis),
      ]),
    )).toList());
  }

  Widget _workflowActions(ComplaintDetail c, String role) {
    final isPFE = role == 'PFE';
    final isAgent = role == 'AGENT_INTERNE';
    final isDirecteur = role == 'DIRECTEUR_EST';
    final isDDS = role == 'DDS';
    final isReg = ['DDS','DQSS','CABINET'].contains(role);
    final actions = <Widget>[];

    // PFE
    if (isPFE && c.status == 'SOUMISE') {
      actions.add(_actBtn('Accuser réception', Icons.check, () => _doAction('acknowledge')));
      actions.add(_actBtn('Demander complément', Icons.help_outline, () => _showText('requestInfo', 'notes', 'Précisions demandées...')));
    }
    if (isPFE && c.status == 'ACCUSEE') {
      actions.add(_actBtn('Qualifier', Icons.description, () => _showQualify()));
    }
    if (isPFE && c.status == 'INSTRUITE') {
      actions.add(_actBtn('Affecter', Icons.person_add, () => _showAssign()));
      actions.add(_actBtn('Traiter directement', Icons.play_arrow, () => _doAction('start')));
      actions.add(_actBtn('Escalader', Icons.arrow_upward, () => _showText('escalate', 'reason', 'Motif...'), color: AppColors.danger));
    }
    if (isPFE && c.status == 'RESOLUE') {
      actions.add(_actBtn('Clôturer', Icons.lock, () => _doAction('close')));
    }

    // Agent
    if (isAgent && c.status == 'AFFECTEE') {
      actions.add(_actBtn('Accepter', Icons.check_circle, () => _doAction('acceptAssignment')));
      actions.add(_actBtn('Refuser', Icons.cancel, () => _showText('refuseAssignment', 'reason', 'Justification...'), color: AppColors.danger));
      actions.add(_actBtn('Démarrer', Icons.play_arrow, () => _doAction('start')));
    }
    if (isAgent && c.status == 'EN_TRAITEMENT') {
      actions.add(_actBtn('Journal', Icons.book, () => _showText('investigationLog', 'entry', 'Entrée du journal...')));
      actions.add(_actBtn('Extension', Icons.timer, () => _showText('requestExtension', 'reason', 'Motif...')));
      actions.add(_actBtn('Rapport', Icons.assignment_turned_in, () => _showResolve()));
    }

    // Directeur
    if (isDirecteur && c.status == 'RESOLUE') {
      actions.add(_actBtn('Valider', Icons.check, () => _showText('validateResolution', 'notes', 'Notes...')));
      actions.add(_actBtn('Rejeter', Icons.close, () => _showText('rejectResolution', 'reason', 'Motif...'), color: AppColors.danger));
    }

    // DDS
    if (isDDS && c.status == 'ESCALADEE') {
      actions.add(_actBtn('Inspecteur', Icons.person_search, () => _showAssignInspector()));
      actions.add(_actBtn('Enquête DDS', Icons.search, () => _showText('ddsInvestigation', 'notes', 'Notes...')));
    }

    // Régulateur
    if (isReg && c.status == 'ESCALADEE') {
      actions.add(_actBtn('Arbitrer', Icons.gavel, () => _showText('arbitrate', 'notes', 'Décision...')));
    }

    if (isReg || isDirecteur || isPFE) {
      actions.add(_actBtn('Notifier', Icons.send, () => _showText('notifyParties', 'message', 'Message...')));
    }

    if (actions.isEmpty) return const SizedBox.shrink();
    return Padding(padding: const EdgeInsets.only(bottom: 12), child: Card(
      child: Padding(padding: const EdgeInsets.all(16), child: Column(
        crossAxisAlignment: CrossAxisAlignment.start, children: [
          _sectionTitle('Actions du workflow'),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: actions),
        ],
      )),
    ));
  }

  Widget _actBtn(String l, IconData ic, VoidCallback fn, {Color? color}) {
    final c = color ?? AppColors.primary;
    return OutlinedButton.icon(onPressed: fn, icon: Icon(ic, size: 16),
      label: Text(l, style: const TextStyle(fontSize: 12)),
      style: OutlinedButton.styleFrom(foregroundColor: c, side: BorderSide(color: c.withValues(alpha: 0.3)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)));
  }

  void _showText(String action, String field, String hint) {
    final ctrl = TextEditingController();
    showModalBottomSheet(context: context, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(action, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          TextField(controller: ctrl, maxLines: 4, decoration: InputDecoration(hintText: hint)),
          const SizedBox(height: 16),
          FilledButton(onPressed: () { Navigator.pop(ctx); _doAction(action, {field: ctrl.text}); },
            child: const Text('Confirmer')),
        ]),
      ));
  }

  void _showQualify() {
    String priority = 'P4';
    final notesCtrl = TextEditingController();
    showModalBottomSheet(context: context, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Text('Qualifier', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(initialValue: priority, decoration: const InputDecoration(labelText: 'Priorité'),
            items: ['P1','P2','P3','P4','P5'].map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
            onChanged: (v) => setSt(() => priority = v ?? 'P4')),
          const SizedBox(height: 12),
          TextField(controller: notesCtrl, maxLines: 3, decoration: const InputDecoration(hintText: 'Notes...')),
          const SizedBox(height: 16),
          FilledButton(onPressed: () { Navigator.pop(ctx); _doAction('qualify', {'priority': priority, 'notes': notesCtrl.text}); },
            child: const Text('Confirmer')),
        ]),
      )));
  }

  void _showAssign() {
    final internes = _agents.where((a) => a.role == 'AGENT_INTERNE').toList();
    String? selected;
    showModalBottomSheet(context: context, shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Text('Affecter un agent', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(isExpanded: true, initialValue: selected,
            decoration: const InputDecoration(labelText: 'Agent interne'),
            items: internes.map((a) => DropdownMenuItem(value: a.id, child: Text(a.fullName))).toList(),
            onChanged: (v) => setSt(() => selected = v)),
          const SizedBox(height: 16),
          FilledButton(onPressed: selected != null ? () { Navigator.pop(ctx); _doAction('assign', {'assigned_to': selected}); } : null,
            child: const Text('Confirmer')),
        ]),
      )));
  }

  void _showAssignInspector() {
    String? selected;
    showModalBottomSheet(context: context, shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Text('Affecter inspecteur', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(isExpanded: true, initialValue: selected,
            decoration: const InputDecoration(labelText: 'Inspecteur'),
            items: _agents.map((a) => DropdownMenuItem(value: a.id, child: Text('${a.fullName} — ${a.role}'))).toList(),
            onChanged: (v) => setSt(() => selected = v)),
          const SizedBox(height: 16),
          FilledButton(onPressed: selected != null ? () { Navigator.pop(ctx); _doAction('ddsAssignInspector', {'inspector_id': selected}); } : null,
            child: const Text('Confirmer')),
        ]),
      )));
  }

  void _showResolve() {
    final notesCtrl = TextEditingController();
    final correctiveCtrl = TextEditingController();
    showModalBottomSheet(context: context, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Text('Soumettre rapport', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          TextField(controller: notesCtrl, maxLines: 4, decoration: const InputDecoration(hintText: 'Résolution...')),
          const SizedBox(height: 12),
          TextField(controller: correctiveCtrl, maxLines: 2, decoration: const InputDecoration(hintText: 'Actions correctives (optionnel)...')),
          const SizedBox(height: 16),
          FilledButton(onPressed: () { Navigator.pop(ctx);
            _doAction('resolve', {'resolution_notes': notesCtrl.text, 'corrective_actions': correctiveCtrl.text}); },
            child: const Text('Confirmer')),
        ]),
      ));
  }
}
