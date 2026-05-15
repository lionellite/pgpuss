import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../api/complaints_api.dart';
import '../../../models/complaint.dart';
import '../../theme.dart';
import '../../widgets/badges.dart';
import '../../widgets/common.dart';

class AdminComplaintsListScreen extends ConsumerStatefulWidget {
  const AdminComplaintsListScreen({super.key});
  @override
  ConsumerState<AdminComplaintsListScreen> createState() => _State();
}

class _State extends ConsumerState<AdminComplaintsListScreen> {
  List<ComplaintListItem> _list = [];
  bool _loading = true;
  int _page = 1, _count = 0;
  String _search = '', _status = '', _priority = '', _channel = '';
  static const _pageSize = 20;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final r = await ref.read(complaintsApiProvider).list(
        page: _page, pageSize: _pageSize,
        search: _search.isNotEmpty ? _search : null,
        status: _status.isNotEmpty ? _status : null,
        priority: _priority.isNotEmpty ? _priority : null,
        channel: _channel.isNotEmpty ? _channel : null,
      );
      setState(() { _list = r.results; _count = r.count; });
    } catch (_) { setState(() => _list = []); }
    finally { setState(() => _loading = false); }
  }

  void _setFilter(String key, String val) {
    setState(() {
      if (key == 'search') _search = val;
      if (key == 'status') _status = val;
      if (key == 'priority') _priority = val;
      if (key == 'channel') _channel = val;
      _page = 1;
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Plaintes ($_count)'),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
      ),
      body: Column(children: [
        // Filters
        Container(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          color: Colors.white,
          child: Column(children: [
            TextField(
              decoration: const InputDecoration(hintText: 'Rechercher...', prefixIcon: Icon(Icons.search), isDense: true),
              onChanged: (v) => _setFilter('search', v),
            ),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: DropdownButtonFormField<String>(
                isExpanded: true, isDense: true, initialValue: _status.isEmpty ? null : _status,
                decoration: const InputDecoration(labelText: 'Statut', isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                items: [const DropdownMenuItem(value: '', child: Text('Tous')),
                  ...['SOUMISE','ACCUSEE','INSTRUITE','AFFECTEE','EN_TRAITEMENT','RESOLUE','ESCALADEE','CLOTUREE']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s.replaceAll('_', ' '), style: const TextStyle(fontSize: 12))))],
                onChanged: (v) => _setFilter('status', v ?? ''),
              )),
              const SizedBox(width: 8),
              Expanded(child: DropdownButtonFormField<String>(
                isExpanded: true, isDense: true, initialValue: _priority.isEmpty ? null : _priority,
                decoration: const InputDecoration(labelText: 'Priorité', isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                items: [const DropdownMenuItem(value: '', child: Text('Toutes')),
                  ...['P1','P2','P3','P4','P5'].map((p) => DropdownMenuItem(value: p, child: Text(p)))],
                onChanged: (v) => _setFilter('priority', v ?? ''),
              )),
            ]),
          ]),
        ),
        // List
        Expanded(child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _list.isEmpty
            ? const EmptyState(icon: Icons.folder_open, title: 'Aucun dossier trouvé')
            : RefreshIndicator(onRefresh: _load, child: ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _list.length,
                itemBuilder: (_, i) => _card(_list[i]),
              )),
        ),
        // Pagination
        if (_count > _pageSize) Container(
          padding: const EdgeInsets.all(12), color: Colors.white,
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            IconButton(icon: const Icon(Icons.chevron_left),
              onPressed: _page > 1 ? () { setState(() => _page--); _load(); } : null),
            Text('Page $_page / ${(_count / _pageSize).ceil()}', style: TextStyle(fontSize: 13, color: Colors.grey[600])),
            IconButton(icon: const Icon(Icons.chevron_right),
              onPressed: _page < (_count / _pageSize).ceil() ? () { setState(() => _page++); _load(); } : null),
          ]),
        ),
      ]),
    );
  }

  Widget _card(ComplaintListItem c) {
    return Card(margin: const EdgeInsets.only(bottom: 8), child: InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => context.push('/dashboard/complaints/${c.id}'),
      child: Padding(padding: const EdgeInsets.all(14), child: Column(
        crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Row(children: [
              Text(c.ticketNumber, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.primary)),
              if (c.isOverdue) Padding(padding: const EdgeInsets.only(left: 6),
                child: Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                  child: const Text('RETARD', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.danger)))),
            ]),
            if (c.createdAt != null) Text('${c.createdAt!.day}/${c.createdAt!.month}/${c.createdAt!.year}',
              style: TextStyle(fontSize: 11, color: Colors.grey[500])),
          ]),
          const SizedBox(height: 6),
          Text(c.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis),
          if (c.establishmentName != null) Text(c.establishmentName!, style: TextStyle(fontSize: 12, color: Colors.grey[600]), maxLines: 1),
          const SizedBox(height: 8),
          Row(children: [
            StatusBadge(status: c.status), const SizedBox(width: 6),
            PriorityBadge(priority: c.priority),
            if (c.channelDisplay != null) ...[const SizedBox(width: 6),
              Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(20)),
                child: Text(c.channelDisplay!, style: TextStyle(fontSize: 10, color: Colors.grey[600])))],
          ]),
        ],
      )),
    ));
  }
}
