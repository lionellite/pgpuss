import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/complaint_form_screen.dart';

void main() {
  runApp(const PGPUSSMobile());
}

class PGPUSSMobile extends StatelessWidget {
  const PGPUSSMobile({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PGP-USS Bénin',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF008751),
          primary: const Color(0xFF008751),
          secondary: const Color(0xFFFCD116),
          error: const Color(0xFFE8112D),
        ),
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PGP-USS BÉNIN', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Top Flag Decoration
          Row(
            children: [
              Expanded(child: Container(height: 4, color: const Color(0xFF008751))),
              Expanded(child: Container(height: 4, color: const Color(0xFFFCD116))),
              Expanded(child: Container(height: 4, color: const Color(0xFFE8112D))),
            ],
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),
                  Text(
                    'Votre voix compte pour une santé meilleure.',
                    style: GoogleFonts.outfit(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF1A1A1A),
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'La plateforme officielle du Ministère de la Santé pour recueillir et traiter vos plaintes au Bénin.',
                    style: TextStyle(fontSize: 16, color: Color(0xFF666666), height: 1.5),
                  ),
                  const SizedBox(height: 40),

                  _buildActionCard(
                    context,
                    title: 'Déposer une plainte',
                    subtitle: 'Signalez un problème ou une suggestion en quelques minutes.',
                    icon: Icons.edit_document,
                    color: const Color(0xFF008751),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const ComplaintFormScreen()),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildActionCard(
                    context,
                    title: 'Suivre mon ticket',
                    subtitle: 'Consultez l\'état d\'avancement de votre dossier.',
                    icon: Icons.search,
                    color: const Color(0xFFFCD116),
                    textColor: Colors.black87,
                    onTap: () {
                      // Logic for tracking
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildActionCard(
                    context,
                    title: 'Mon Espace',
                    subtitle: 'Connectez-vous pour voir l\'historique de vos plaintes.',
                    icon: Icons.person_outline,
                    color: Colors.white,
                    textColor: Colors.black87,
                    isBordered: true,
                    onTap: () {
                      // Logic for login
                    },
                  ),
                  const SizedBox(height: 40),
                  const Center(
                    child: Text(
                      'Numéro Vert National : 136',
                      style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF008751)),
                    ),
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard(BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    Color textColor = Colors.white,
    bool isBordered = false,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
          border: isBordered ? Border.all(color: Colors.grey[300]!) : null,
          boxShadow: [
            if (!isBordered)
              BoxShadow(
                color: color.withOpacity(0.2),
                blurRadius: 12,
                offset: const Offset(0, 6),
              )
          ],
        ),
        child: Row(
          children: [
            Icon(icon, size: 32, color: textColor),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: textColor),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 13, color: textColor.withOpacity(0.7), height: 1.3),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward, size: 18, color: textColor.withOpacity(0.5)),
          ],
        ),
      ),
    );
  }
}
