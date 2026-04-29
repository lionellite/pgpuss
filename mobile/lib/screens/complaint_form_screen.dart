import 'package:flutter/material.dart';

class ComplaintFormScreen extends StatefulWidget {
  const ComplaintFormScreen({super.key});

  @override
  State<ComplaintFormScreen> createState() => _ComplaintFormScreenState();
}

class _ComplaintFormScreenState extends State<ComplaintFormScreen> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Déposer une plainte')),
      body: Stepper(
        type: StepperType.vertical,
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep < 4) {
            setState(() => _currentStep++);
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep--);
          }
        },
        steps: [
          Step(
            title: const Text('Établissement'),
            content: DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Établissement'),
              items: const [
                DropdownMenuItem(value: '1', child: Text('CNHU-HKM')),
                DropdownMenuItem(value: '2', child: Text('CHD Borgou')),
              ],
              onChanged: (v) {},
            ),
            isActive: _currentStep >= 0,
          ),
          Step(
            title: const Text('Description'),
            content: Column(
              children: [
                TextFormField(decoration: const InputDecoration(labelText: 'Titre')),
                const SizedBox(height: 10),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Détails'),
                  maxLines: 4,
                ),
              ],
            ),
            isActive: _currentStep >= 1,
          ),
          Step(
            title: const Text('Identité'),
            content: TextFormField(decoration: const InputDecoration(labelText: 'Nom complet')),
            isActive: _currentStep >= 2,
          ),
        ],
      ),
    );
  }
}
