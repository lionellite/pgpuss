import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../api/notifications_api.dart';
import '../../../models/notification_item.dart';
import '../../../state/extra_providers.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});
  @override
  ConsumerState<NotificationsScreen> createState() => _State();
}

class _State extends ConsumerState<NotificationsScreen> {
  List<NotificationItem> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final r = await ref.read(notificationsApiProvider).list();
      setState(() => _items = r.results);
    } catch (_) { setState(() => _items = []); }
    finally { setState(() => _loading = false); }
  }

  Future<void> _markAllRead() async {
    await ref.read(notificationsApiProvider).markAllRead();
    ref.invalidate(unreadCountProvider);
    _load();
  }

  Future<void> _markRead(NotificationItem n) async {
    if (n.isRead) return;
    await ref.read(notificationsApiProvider).markRead(n.id);
    ref.invalidate(unreadCountProvider);
    setState(() {
      _items = _items.map((x) => x.id == n.id
        ? NotificationItem(id: x.id, title: x.title, message: x.message,
            isRead: true, createdAt: x.createdAt,
            complaintId: x.complaintId, complaintTicket: x.complaintTicket)
        : x).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final unread = _items.where((n) => !n.isRead).length;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unread > 0) TextButton(onPressed: _markAllRead, child: const Text('Tout lire')),
        ],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _items.isEmpty
          ? const EmptyState(icon: Icons.notifications_none, title: 'Aucune notification')
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _items.length,
                itemBuilder: (_, i) => _tile(_items[i]),
              ),
            ),
    );
  }

  Widget _tile(NotificationItem n) {
    return Card(
      color: n.isRead ? null : AppColors.secondary.withValues(alpha: 0.04),
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: n.isRead ? AppColors.surfaceGray : AppColors.secondary.withValues(alpha: 0.12),
          child: Icon(Icons.description_outlined, size: 18,
            color: n.isRead ? AppColors.textMuted : AppColors.secondary),
        ),
        title: Text(n.title, style: TextStyle(
          fontSize: 14, fontWeight: n.isRead ? FontWeight.w400 : FontWeight.w600)),
        subtitle: Text(n.message, maxLines: 2, overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
        trailing: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          if (n.createdAt != null) Text('${n.createdAt!.day}/${n.createdAt!.month}',
            style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          if (!n.isRead) Container(width: 8, height: 8, margin: const EdgeInsets.only(top: 4),
            decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.secondary)),
        ]),
        onTap: () {
          _markRead(n);
          if (n.complaintId != null) context.push('/complaints/${n.complaintId}');
        },
      ),
    );
  }
}
