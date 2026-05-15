import 'dart:io';
import 'package:dio/dio.dart' as dio;
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import '../../../api/complaints_api.dart';
import '../../../api/establishments_api.dart';
import '../../../models/category.dart';
import '../../../models/establishment.dart';
import '../../../models/region.dart';
import '../../../models/service_item.dart';
import '../../../state/complaints_providers.dart';
import '../../../state/extra_providers.dart';
import '../../theme.dart';

class DepositScreen extends ConsumerStatefulWidget {
  const DepositScreen({super.key});
  @override
  ConsumerState<DepositScreen> createState() => _DepositScreenState();
}

class _DepositScreenState extends ConsumerState<DepositScreen> {
  int _step = 0;
  bool _submitting = false, _success = false;
  String? _ticketNumber;

  // Step 1
  Region? _selectedRegion;
  EstablishmentItem? _selectedEstablishment;
  ServiceItem? _selectedService;
  List<EstablishmentItem> _establishments = [];
  List<ServiceItem> _services = [];
  bool _manualEstablishment = false;
  final _manualNameCtrl = TextEditingController();
  final _manualAddressCtrl = TextEditingController();

  // Step 2
  Category? _selectedCategory;

  // Step 3
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  List<PlatformFile> _files = [];
  // Voice
  String? _voicePath;
  bool _isRecording = false;
  final _recorder = AudioRecorder();

  // Step 4
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _anonymous = false;

  @override
  void dispose() {
    _titleCtrl.dispose(); _descCtrl.dispose();
    _nameCtrl.dispose(); _emailCtrl.dispose(); _phoneCtrl.dispose();
    _manualNameCtrl.dispose(); _manualAddressCtrl.dispose();
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _loadEstablishments(String regionId) async {
    final all = await ref.read(establishmentsApiProvider).list();
    setState(() { _establishments = all.results; _selectedEstablishment = null; _services = []; _selectedService = null; });
  }

  Future<void> _loadServices(String estId) async {
    try { final s = await ref.read(establishmentsApiProvider).services(estId); setState(() => _services = s); }
    catch (_) { setState(() => _services = []); }
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: true, type: FileType.any);
    if (result != null) { setState(() => _files = [..._files, ...result.files]); }
  }

  Future<void> _toggleRecording() async {
    if (_isRecording) {
      final path = await _recorder.stop();
      setState(() { _isRecording = false; _voicePath = path; });
    } else {
      if (!await _recorder.hasPermission()) { return; }
      final dir = await getApplicationDocumentsDirectory();
      final path = '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _recorder.start(const RecordConfig(encoder: AudioEncoder.aacLc), path: path);
      setState(() => _isRecording = true);
    }
  }

  void _removeVoice() {
    if (_voicePath != null) { File(_voicePath!).deleteSync(); }
    setState(() => _voicePath = null);
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final formData = dio.FormData.fromMap({
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        if (!_manualEstablishment && _selectedEstablishment != null) 'establishment': _selectedEstablishment!.id,
        if (_manualEstablishment) 'establishment_name_manual': _manualNameCtrl.text.trim(),
        if (_manualEstablishment && _manualAddressCtrl.text.isNotEmpty) 'establishment_address_manual': _manualAddressCtrl.text.trim(),
        if (_selectedService != null) 'service': _selectedService!.id,
        if (_selectedCategory != null) 'category': _selectedCategory!.id,
        'channel': 'MOBILE',
        'is_anonymous': _anonymous,
        if (!_anonymous && _nameCtrl.text.isNotEmpty) 'complainant_name': _nameCtrl.text.trim(),
        if (!_anonymous && _emailCtrl.text.isNotEmpty) 'complainant_email': _emailCtrl.text.trim(),
        if (!_anonymous && _phoneCtrl.text.isNotEmpty) 'complainant_phone': _phoneCtrl.text.trim(),
      });
      for (final f in _files) {
        if (f.path != null) {
          formData.files.add(MapEntry('attachments', await dio.MultipartFile.fromFile(f.path!, filename: f.name)));
        }
      }
      if (_voicePath != null) {
        formData.files.add(MapEntry('voice_file', await dio.MultipartFile.fromFile(_voicePath!, filename: 'voice.m4a')));
      }
      final result = await ref.read(complaintsApiProvider).create(formData);
      setState(() { _success = true; _ticketNumber = (result['ticket_number'] as String?) ?? 'N/A'; });
    } catch (_) {
      if (!mounted) { return; }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Erreur lors du dépôt.')));
    } finally {
      if (mounted) { setState(() => _submitting = false); }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_success) { return _buildSuccess(); }
    final regions = ref.watch(regionsProvider);
    final categories = ref.watch(categoriesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Déposer une plainte')),
      body: Column(children: [
        _buildStepIndicator(),
        Expanded(child: SingleChildScrollView(padding: const EdgeInsets.all(20), child: _buildStep(regions, categories))),
        _buildBottomNav(),
      ]),
    );
  }

  Widget _buildStepIndicator() {
    const labels = ['Lieu', 'Catégorie', 'Description', 'Identité', 'Confirmation'];
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(color: Colors.white, border: Border(bottom: BorderSide(color: AppColors.divider))),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: List.generate(5, (i) {
        final active = i == _step; final done = i < _step;
        return Expanded(child: Column(children: [
          Container(width: 28, height: 28, decoration: BoxDecoration(shape: BoxShape.circle,
            color: done ? AppColors.primary : active ? AppColors.primary : Colors.grey[300]),
            child: Center(child: done ? const Icon(Icons.check, size: 14, color: Colors.white)
              : Text('${i + 1}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                  color: active ? Colors.white : AppColors.textMuted)))),
          const SizedBox(height: 4),
          Text(labels[i], style: TextStyle(fontSize: 9, fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            color: active ? AppColors.primary : AppColors.textMuted), textAlign: TextAlign.center),
        ]));
      })),
    );
  }

  Widget _buildStep(AsyncValue<List<Region>> regions, AsyncValue<List<Category>> categories) {
    return switch (_step) { 0 => _stepEstablishment(regions), 1 => _stepCategory(categories),
      2 => _stepDescription(), 3 => _stepIdentity(), 4 => _stepConfirmation(), _ => const SizedBox.shrink() };
  }

  // ── STEP 1: Establishment ──
  Widget _stepEstablishment(AsyncValue<List<Region>> regionsAsync) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle('Sélectionnez l\'établissement concerné'),
      const SizedBox(height: 20),

      // Toggle manual
      SwitchListTile(
        value: _manualEstablishment,
        onChanged: (v) => setState(() => _manualEstablishment = v),
        title: const Text('Établissement non listé ?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        subtitle: const Text('Saisissez manuellement les informations', style: TextStyle(fontSize: 12)),
        contentPadding: EdgeInsets.zero,
        activeThumbColor: AppColors.primary,
      ),
      const SizedBox(height: 12),

      if (_manualEstablishment) ...[
        TextField(controller: _manualNameCtrl,
          decoration: const InputDecoration(labelText: 'Nom de l\'établissement', prefixIcon: Icon(Icons.local_hospital_outlined))),
        const SizedBox(height: 14),
        TextField(controller: _manualAddressCtrl,
          decoration: const InputDecoration(labelText: 'Adresse / Localisation (optionnel)', prefixIcon: Icon(Icons.location_on_outlined))),
      ] else ...[
        regionsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, _) => const Text('Erreur de chargement des régions'),
          data: (regions) => DropdownButtonFormField<Region>(isExpanded: true,
            decoration: const InputDecoration(labelText: 'Département / Région', prefixIcon: Icon(Icons.location_on_outlined)),
            initialValue: _selectedRegion,
            items: regions.map((r) => DropdownMenuItem(value: r, child: Text(r.name))).toList(),
            onChanged: (r) { setState(() => _selectedRegion = r); if (r != null) { _loadEstablishments(r.id); } }),
        ),
        const SizedBox(height: 14),
        DropdownButtonFormField<EstablishmentItem>(isExpanded: true,
          decoration: const InputDecoration(labelText: 'Établissement de santé', prefixIcon: Icon(Icons.local_hospital_outlined)),
          initialValue: _selectedEstablishment,
          items: _establishments.map((e) => DropdownMenuItem(value: e, child: Text(e.name))).toList(),
          onChanged: (e) { setState(() { _selectedEstablishment = e; _selectedService = null; }); if (e != null) { _loadServices(e.id); } }),
        const SizedBox(height: 14),
        if (_services.isNotEmpty)
          DropdownButtonFormField<ServiceItem>(isExpanded: true,
            decoration: const InputDecoration(labelText: 'Service (optionnel)', prefixIcon: Icon(Icons.medical_services_outlined)),
            initialValue: _selectedService,
            items: _services.map((s) => DropdownMenuItem(value: s, child: Text(s.name))).toList(),
            onChanged: (s) => setState(() => _selectedService = s)),
      ],
    ]);
  }

  // ── STEP 2: Category ──
  Widget _stepCategory(AsyncValue<List<Category>> categoriesAsync) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle('Type de problème rencontré'),
      const SizedBox(height: 20),
      categoriesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const Text('Erreur de chargement'),
        data: (cats) => Wrap(spacing: 10, runSpacing: 10, children: cats.map((c) {
          final selected = _selectedCategory?.id == c.id;
          return ChoiceChip(label: Text('${c.icon} ${c.name}'), selected: selected,
            selectedColor: AppColors.primary.withValues(alpha: 0.12),
            side: BorderSide(color: selected ? AppColors.primary : AppColors.divider),
            onSelected: (_) => setState(() => _selectedCategory = c));
        }).toList()),
      ),
    ]);
  }

  // ── STEP 3: Description + Voice ──
  Widget _stepDescription() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle('Décrivez votre problème'),
      const SizedBox(height: 8),
      Text('Tapez votre description ou enregistrez un message vocal.',
        style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
      const SizedBox(height: 20),
      TextField(controller: _titleCtrl,
        decoration: const InputDecoration(labelText: 'Titre de la plainte', prefixIcon: Icon(Icons.title))),
      const SizedBox(height: 14),
      TextField(controller: _descCtrl, maxLines: 5,
        decoration: const InputDecoration(labelText: 'Description détaillée (optionnel si note vocale)', alignLabelWithHint: true)),
      const SizedBox(height: 20),

      // Voice recorder
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _isRecording ? AppColors.danger.withValues(alpha: 0.05) : AppColors.primary.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _isRecording ? AppColors.danger.withValues(alpha: 0.3) : AppColors.divider),
        ),
        child: Column(children: [
          Row(children: [
            Icon(_isRecording ? Icons.stop_circle : Icons.mic, size: 28,
              color: _isRecording ? AppColors.danger : AppColors.primary),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_isRecording ? 'Enregistrement en cours...'
                : _voicePath != null ? 'Note vocale enregistrée ✓' : 'Note vocale',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                  color: _isRecording ? AppColors.danger : AppColors.textPrimary)),
              Text(_isRecording ? 'Appuyez sur Stop pour terminer'
                : _voicePath != null ? 'La note sera jointe à votre plainte' : 'Décrivez le problème oralement',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
            ])),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _isRecording
              ? FilledButton.icon(onPressed: _toggleRecording,
                  icon: const Icon(Icons.stop, size: 18),
                  label: const Text('Arrêter'),
                  style: FilledButton.styleFrom(backgroundColor: AppColors.danger))
              : OutlinedButton.icon(onPressed: _toggleRecording,
                  icon: const Icon(Icons.mic, size: 18),
                  label: Text(_voicePath != null ? 'Ré-enregistrer' : 'Enregistrer'))),
            if (_voicePath != null && !_isRecording) ...[
              const SizedBox(width: 8),
              IconButton(onPressed: _removeVoice, icon: const Icon(Icons.delete_outline, color: AppColors.danger),
                tooltip: 'Supprimer la note vocale'),
            ],
          ]),
        ]),
      ),
      const SizedBox(height: 20),

      // File attachments
      OutlinedButton.icon(onPressed: _pickFiles, icon: const Icon(Icons.attach_file), label: const Text('Joindre des fichiers')),
      if (_files.isNotEmpty) ...[
        const SizedBox(height: 8),
        ..._files.map((f) => Padding(padding: const EdgeInsets.only(bottom: 4), child: Row(children: [
          const Icon(Icons.insert_drive_file, size: 16, color: AppColors.secondary),
          const SizedBox(width: 6),
          Expanded(child: Text(f.name, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
          IconButton(icon: const Icon(Icons.close, size: 16), onPressed: () => setState(() => _files.remove(f))),
        ]))),
      ],
    ]);
  }

  // ── STEP 4: Identity ──
  Widget _stepIdentity() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle('Vos coordonnées'),
      const SizedBox(height: 20),
      SwitchListTile(value: _anonymous, onChanged: (v) => setState(() => _anonymous = v),
        title: const Text('Déposer anonymement', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        subtitle: const Text('Votre identité ne sera pas enregistrée', style: TextStyle(fontSize: 12)),
        contentPadding: EdgeInsets.zero, activeThumbColor: AppColors.primary),
      const SizedBox(height: 16),
      if (!_anonymous) ...[
        TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Nom complet', prefixIcon: Icon(Icons.person_outline))),
        const SizedBox(height: 14),
        TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
        const SizedBox(height: 14),
        TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'Téléphone', prefixIcon: Icon(Icons.phone_outlined), hintText: '+229 XX XX XX XX')),
      ],
    ]);
  }

  // ── STEP 5: Confirmation ──
  Widget _stepConfirmation() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle('Vérifiez vos informations'),
      const SizedBox(height: 20),
      _confirmItem('Établissement', _manualEstablishment ? _manualNameCtrl.text : (_selectedEstablishment?.name ?? '—')),
      if (_manualEstablishment && _manualAddressCtrl.text.isNotEmpty) _confirmItem('Adresse', _manualAddressCtrl.text),
      if (!_manualEstablishment && _selectedService != null) _confirmItem('Service', _selectedService!.name),
      _confirmItem('Catégorie', _selectedCategory?.name ?? '—'),
      _confirmItem('Titre', _titleCtrl.text),
      _confirmItem('Description', _descCtrl.text.length > 80 ? '${_descCtrl.text.substring(0, 80)}...' : _descCtrl.text),
      _confirmItem('Note vocale', _voicePath != null ? '✓ Enregistrée' : 'Aucune'),
      _confirmItem('Fichiers joints', '${_files.length} fichier(s)'),
      _confirmItem('Identité', _anonymous ? 'Anonyme' : _nameCtrl.text),
      if (!_anonymous && _emailCtrl.text.isNotEmpty) _confirmItem('Email', _emailCtrl.text),
    ]);
  }

  Widget _confirmItem(String label, String value) {
    return Padding(padding: const EdgeInsets.only(bottom: 12), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(width: 120, child: Text(label, style: TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w700))),
      Expanded(child: Text(value.isEmpty ? '—' : value, style: const TextStyle(fontSize: 14))),
    ]));
  }

  Widget _buildBottomNav() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.divider))),
      child: Row(children: [
        if (_step > 0) OutlinedButton(onPressed: () => setState(() => _step--), child: const Text('Précédent')),
        const Spacer(),
        if (_step < 4)
          FilledButton(onPressed: _canAdvance() ? () => setState(() => _step++) : null, child: const Text('Suivant')),
        if (_step == 4)
          FilledButton(onPressed: _submitting ? null : _submit,
            child: _submitting ? const SizedBox(height: 18, width: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Soumettre')),
      ]),
    );
  }

  bool _canAdvance() {
    return switch (_step) {
      0 => _manualEstablishment ? _manualNameCtrl.text.trim().isNotEmpty : _selectedEstablishment != null,
      1 => _selectedCategory != null,
      2 => _titleCtrl.text.trim().isNotEmpty && (_descCtrl.text.trim().isNotEmpty || _voicePath != null),
      3 => _anonymous || (_nameCtrl.text.trim().isNotEmpty && _emailCtrl.text.trim().isNotEmpty),
      _ => true,
    };
  }

  Widget _buildSuccess() {
    return Scaffold(appBar: AppBar(title: const Text('Plainte déposée')),
      body: Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(padding: const EdgeInsets.all(20), decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFFE6F7EF)),
          child: const Icon(Icons.check_circle, size: 64, color: AppColors.primary)),
        const SizedBox(height: 24),
        const Text('Plainte déposée avec succès !', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
        const SizedBox(height: 12),
        Text('Votre numéro de suivi :', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        Container(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3))),
          child: Text(_ticketNumber ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primary, letterSpacing: 1))),
        const SizedBox(height: 16),
        Text('Conservez ce numéro pour suivre l\'avancement de votre dossier.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary), textAlign: TextAlign.center),
      ]))));
  }

  Widget _sectionTitle(String t) => Text(t, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary));
}
