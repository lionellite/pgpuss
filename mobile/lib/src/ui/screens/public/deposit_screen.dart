import 'dart:io';
import 'package:dio/dio.dart' as dio;
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import 'package:go_router/go_router.dart';

import '../../../api/complaints_api.dart';
import '../../../api/establishments_api.dart';
import '../../../models/category.dart';
import '../../../models/establishment.dart';
import '../../../models/region.dart';
import '../../../models/service_item.dart';
import '../../../state/auth_controller.dart';
import '../../../state/complaints_providers.dart';
import '../../../state/extra_providers.dart';
import '../../theme.dart';
import '../../widgets/app_chrome.dart';

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
  String _descriptionMode = 'text';
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
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _prefillIdentity());
  }

  void _prefillIdentity() {
    final user = ref.read(authControllerProvider).session?.user;
    if (user == null || user.role != 'USAGER') return;
    if (_nameCtrl.text.isEmpty) _nameCtrl.text = user.fullName;
    if (_emailCtrl.text.isEmpty) _emailCtrl.text = user.email;
    if (_phoneCtrl.text.isEmpty && user.phone != null && user.phone!.isNotEmpty) {
      _phoneCtrl.text = user.phone!;
    }
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _titleCtrl.dispose(); _descCtrl.dispose();
    _nameCtrl.dispose(); _emailCtrl.dispose(); _phoneCtrl.dispose();
    _manualNameCtrl.dispose(); _manualAddressCtrl.dispose();
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _loadEstablishments(String regionId) async {
    final all = await ref.read(establishmentsApiProvider).list(regionId: regionId);
    setState(() {
      _establishments = all.results;
      _selectedEstablishment = null;
      _services = [];
      _selectedService = null;
    });
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

  void _setDescriptionMode(String mode) {
    setState(() {
      _descriptionMode = mode;
      if (mode == 'voice') {
        _descCtrl.clear();
      } else {
        _removeVoice();
      }
    });
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final isVoice = _descriptionMode == 'voice';
      final body = <String, dynamic>{
        'title': _titleCtrl.text.trim(),
        'description_mode': isVoice ? 'voice' : 'text',
        if (!isVoice) 'description': _descCtrl.text.trim(),
        if (!_manualEstablishment && _selectedEstablishment != null)
          'establishment': _selectedEstablishment!.id,
        if (_manualEstablishment) 'establishment_name_manual': _manualNameCtrl.text.trim(),
        if (_manualEstablishment && _manualAddressCtrl.text.isNotEmpty)
          'establishment_address_manual': _manualAddressCtrl.text.trim(),
        if (_selectedService != null) 'service': _selectedService!.id,
        if (_selectedCategory != null) 'category': _selectedCategory!.id,
        'channel': 'MOBILE',
        'is_anonymous': _anonymous,
        if (_anonymous) 'complainant_phone': _phoneCtrl.text.trim(),
        if (!_anonymous && _nameCtrl.text.isNotEmpty) 'complainant_name': _nameCtrl.text.trim(),
        if (!_anonymous && _emailCtrl.text.isNotEmpty) 'complainant_email': _emailCtrl.text.trim(),
        if (!_anonymous && _phoneCtrl.text.isNotEmpty) 'complainant_phone': _phoneCtrl.text.trim(),
      };

      final api = ref.read(complaintsApiProvider);
      final result = await api.createJson(body);
      final complaintId = result['complaint_id'] as String?;
      final uploadToken = result['upload_token'] as String?;
      var mediaWarning = false;

      if (complaintId != null && uploadToken != null) {
        if (isVoice && _voicePath != null) {
          try {
            final vfd = dio.FormData.fromMap({
              'voice_file': await dio.MultipartFile.fromFile(_voicePath!, filename: 'voice.m4a'),
            });
            await api.uploadDepositMedia(
              complaintId: complaintId,
              uploadToken: uploadToken,
              formData: vfd,
            );
          } catch (_) {
            mediaWarning = true;
          }
        }
        for (final f in _files) {
          if (f.path == null) continue;
          try {
            final afd = dio.FormData.fromMap({
              'attachment': await dio.MultipartFile.fromFile(f.path!, filename: f.name),
            });
            await api.uploadDepositMedia(
              complaintId: complaintId,
              uploadToken: uploadToken,
              formData: afd,
            );
          } catch (_) {
            mediaWarning = true;
          }
        }
      }

      if (!mounted) return;
      setState(() {
        _success = true;
        _ticketNumber = (result['ticket_number'] as String?) ?? 'N/A';
      });
      if (mediaWarning) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Plainte enregistrée, mais un fichier n\'a pas pu être envoyé.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (!mounted) { return; }
      String msg = 'Erreur lors du dépôt. Veuillez réessayer.';
      if (e is dio.DioException) {
        final data = e.response?.data;
        if (data is Map) {
          final errors = data.entries
              .map((entry) {
                final val = entry.value;
                if (val is List) return val.join(', ');
                return val.toString();
              })
              .join('\n');
          if (errors.isNotEmpty) msg = errors;
        }
      }
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(
          content: Text(msg),
          backgroundColor: const Color(0xFFE8112D),
          duration: const Duration(seconds: 6),
          behavior: SnackBarBehavior.floating,
        ));
    } finally {
      if (mounted) { setState(() => _submitting = false); }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_success) { return _buildSuccess(); }
    final regions = ref.watch(regionsProvider);
    final categories = ref.watch(categoriesProvider);
    final inShell = GoRouterState.of(context).uri.path == '/deposit';
    final fallback = inShell ? '/complaints' : '/';

    return AppBackScope(
      fallbackLocation: fallback,
      child: Scaffold(
      appBar: AppBar(
        title: const Text('Déposer une plainte'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Retour',
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go(fallback);
            }
          },
        ),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(4),
          child: GovFlagBar(),
        ),
      ),
      body: Column(children: [
        _buildStepIndicator(),
        Expanded(child: SingleChildScrollView(padding: const EdgeInsets.all(20), child: _buildStep(regions, categories))),
        _buildBottomNav(),
      ]),
    ),
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
          return ChoiceChip(label: Text(c.displayName), selected: selected,
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
      Text(
        'Choisissez une seule option : texte au clavier ou message vocal.',
        style: TextStyle(fontSize: 13, color: AppColors.textMuted),
      ),
      const SizedBox(height: 16),
      SegmentedButton<String>(
        segments: const [
          ButtonSegment(value: 'text', label: Text('Texte'), icon: Icon(Icons.keyboard_outlined)),
          ButtonSegment(value: 'voice', label: Text('Vocal'), icon: Icon(Icons.mic_outlined)),
        ],
        selected: {_descriptionMode},
        onSelectionChanged: (s) => _setDescriptionMode(s.first),
      ),
      const SizedBox(height: 20),
      TextField(controller: _titleCtrl,
        decoration: const InputDecoration(labelText: 'Titre de la plainte', prefixIcon: Icon(Icons.title))),
      const SizedBox(height: 14),
      if (_descriptionMode == 'text') ...[
        TextField(controller: _descCtrl, maxLines: 5,
          decoration: const InputDecoration(labelText: 'Description détaillée *', alignLabelWithHint: true)),
        const SizedBox(height: 20),
      ] else ...[
        Text('Enregistrez votre message vocal (obligatoire dans ce mode).',
          style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
        const SizedBox(height: 12),
      ],

      if (_descriptionMode == 'voice')
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
      if (_descriptionMode == 'voice') const SizedBox(height: 20),

      OutlinedButton.icon(onPressed: _pickFiles, icon: const Icon(Icons.attach_file), label: const Text('Joindre des fichiers (optionnel)')),
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
      if (_anonymous) ...[
        Text(
          'Votre identité reste confidentielle. Indiquez un numéro pour vous recontacter si nécessaire.',
          style: TextStyle(fontSize: 13, color: AppColors.textMuted),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Téléphone *',
            prefixIcon: Icon(Icons.phone_outlined),
            hintText: '+229 XX XX XX XX',
          ),
        ),
      ] else ...[
        if (ref.watch(authControllerProvider).session?.user?.role == 'USAGER') ...[
          Text(
            'Vos coordonnées sont préremplies depuis votre compte. Vous pouvez les modifier.',
            style: TextStyle(fontSize: 13, color: AppColors.textMuted),
          ),
          const SizedBox(height: 14),
        ],
        TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Nom complet *', prefixIcon: Icon(Icons.person_outline))),
        const SizedBox(height: 14),
        TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'Email (optionnel)', prefixIcon: Icon(Icons.email_outlined))),
        const SizedBox(height: 14),
        TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'Téléphone (optionnel)', prefixIcon: Icon(Icons.phone_outlined), hintText: '+229 XX XX XX XX')),
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
      _confirmItem('Catégorie', _selectedCategory?.displayName ?? '—'),
      _confirmItem('Titre', _titleCtrl.text),
      _confirmItem('Mode', _descriptionMode == 'voice' ? 'Message vocal' : 'Texte'),
      _confirmItem(
        'Description',
        _descriptionMode == 'voice'
            ? (_voicePath != null ? 'Message vocal enregistré' : '—')
            : (_descCtrl.text.length > 80 ? '${_descCtrl.text.substring(0, 80)}...' : _descCtrl.text),
      ),
      _confirmItem('Fichiers joints', '${_files.length} fichier(s)'),
      _confirmItem('Identité', _anonymous ? 'Anonyme' : _nameCtrl.text),
      if (_anonymous && _phoneCtrl.text.isNotEmpty) _confirmItem('Téléphone', _phoneCtrl.text),
      if (!_anonymous && _emailCtrl.text.isNotEmpty) _confirmItem('Email', _emailCtrl.text),
      if (!_anonymous && _phoneCtrl.text.isNotEmpty) _confirmItem('Téléphone', _phoneCtrl.text),
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
      2 => _titleCtrl.text.trim().isNotEmpty &&
          (_descriptionMode == 'voice'
              ? _voicePath != null
              : _descCtrl.text.trim().isNotEmpty),
      3 => _anonymous
          ? _phoneCtrl.text.trim().isNotEmpty
          : _nameCtrl.text.trim().isNotEmpty,
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
