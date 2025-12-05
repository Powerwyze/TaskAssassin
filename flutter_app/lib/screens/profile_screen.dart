import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme.dart';
import '../providers/app_state.dart';
import '../models/models.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _codenameController = TextEditingController();
  final _lifeGoalController = TextEditingController();
  final _handlerNameController = TextEditingController(); // Custom handler name
  String _selectedHandlerId = '1';

  @override
  void initState() {
    super.initState();
    final profile = context.read<AppState>().userProfile;
    _codenameController.text = profile.codename;
    _lifeGoalController.text = profile.lifeGoal;
    _handlerNameController.text = profile.customHandlerName ?? '';
    _selectedHandlerId = profile.handlerId;
  }

  void _saveProfile() {
    final newProfile = UserProfile(
      codename: _codenameController.text,
      lifeGoal: _lifeGoalController.text,
      handlerId: _selectedHandlerId,
      customHandlerName: _handlerNameController.text.isNotEmpty ? _handlerNameController.text : null,
      hasSeenTutorial: true,
    );

    context.read<AppState>().setProfile(newProfile);
    Navigator.pop(context);
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('PROFILE UPDATED'), backgroundColor: AppTheme.primary),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('PROFILE SETTINGS', style: GoogleFonts.shareTechMono(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.check, color: AppTheme.primary),
            onPressed: _saveProfile,
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar Placeholder
            Center(
              child: CircleAvatar(
                radius: 50,
                backgroundColor: AppTheme.primary,
                child: Text(
                  _codenameController.text.isNotEmpty ? _codenameController.text[0].toUpperCase() : '?',
                  style: GoogleFonts.shareTechMono(color: Colors.black, fontSize: 40, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Codename
            _buildLabel('CODENAME'),
            TextField(
              controller: _codenameController,
              style: GoogleFonts.shareTechMono(color: Colors.white),
              decoration: _buildInputDecoration('e.g. AGENT 47'),
              onChanged: (val) => setState(() {}),
            ),
            const SizedBox(height: 16),

            // Life Goal
            _buildLabel('LIFE MISSION (GOAL)'),
            TextField(
              controller: _lifeGoalController,
              style: GoogleFonts.shareTechMono(color: Colors.white),
              decoration: _buildInputDecoration('e.g. BECOME A FLUTTER EXPERT'),
            ),
            const SizedBox(height: 16),

            // Handler Selection (Mock)
            _buildLabel('HANDLER PERSONA'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedHandlerId,
                  dropdownColor: AppTheme.surface,
                  style: GoogleFonts.shareTechMono(color: Colors.white),
                  isExpanded: true,
                  items: const [
                    DropdownMenuItem(value: '1', child: Text('SERGEANT DRILL')),
                    DropdownMenuItem(value: '2', child: Text('ZEN MASTER')),
                    DropdownMenuItem(value: '3', child: Text('CORPORATE OVERLORD')),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedHandlerId = val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            // Custom Handler Name
             _buildLabel('CUSTOM HANDLER NAME (OPTIONAL)'),
            TextField(
              controller: _handlerNameController,
              style: GoogleFonts.shareTechMono(color: Colors.white),
              decoration: _buildInputDecoration('e.g. MOM'),
            ),

            const SizedBox(height: 48),

            // Logout (Mock)
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton(
                onPressed: () {
                  // Logout logic
                  Navigator.pop(context);
                },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.danger),
                  foregroundColor: AppTheme.danger,
                ),
                child: Text('LOGOUT', style: GoogleFonts.shareTechMono(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(text, style: GoogleFonts.shareTechMono(color: AppTheme.primary, fontSize: 12)),
    );
  }

  InputDecoration _buildInputDecoration(String hint) {
    return InputDecoration(
      filled: true,
      fillColor: AppTheme.surface,
      hintText: hint,
      hintStyle: GoogleFonts.shareTechMono(color: Colors.grey),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
      focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AppTheme.primary)),
    );
  }
}
