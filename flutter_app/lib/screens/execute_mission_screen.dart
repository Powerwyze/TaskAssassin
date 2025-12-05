import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../theme.dart';
import '../providers/app_state.dart';
import '../models/models.dart';

class ExecuteMissionScreen extends StatefulWidget {
  final String missionId;

  const ExecuteMissionScreen({super.key, required this.missionId});

  @override
  State<ExecuteMissionScreen> createState() => _ExecuteMissionScreenState();
}

class _ExecuteMissionScreenState extends State<ExecuteMissionScreen> {
  final ImagePicker _picker = ImagePicker();
  bool _isProcessing = false;

  Future<void> _captureEvidence() async {
    final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
    if (photo != null) {
      setState(() => _isProcessing = true);
      
      // Simulate analysis delay
      await Future.delayed(const Duration(seconds: 3));
      
      if (!mounted) return;

      // Finish mission
      // In a real app we would send the image to Gemini here.
      // For now we assume success.
      
      // Update state
      // (This logic should be in the provider, but keeping it simple)
      context.read<AppState>().updateMissionStatus(widget.missionId, MissionStatus.COMPLETED);
      
      setState(() => _isProcessing = false);
      
      // Show Debrief / Completion dialog
      _showDebriefDialog(photo.path);
    }
  }

  void _showDebriefDialog(String imagePath) {
    showDialog(
      context: context,
      barrierDismissible: false, // Force them to read it
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: Text('MISSION ACCOMPLISHED', style: GoogleFonts.shareTechMono(color: AppTheme.primary, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              height: 150,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                image: DecorationImage(image: FileImage(File(imagePath)), fit: BoxFit.cover),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'INTEL ANALYZED. EXCELLENT WORK, AGENT.',
              style: GoogleFonts.shareTechMono(color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              '+100 STARS',
              style: GoogleFonts.shareTechMono(color: AppTheme.warning, fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Back to dashboard
            },
            child: Text('DISMISS', style: GoogleFonts.shareTechMono(color: AppTheme.primary)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final mission = state.missions.firstWhere(
      (m) => m.id == widget.missionId, 
      orElse: () => Mission(id: '0', codename: 'ERROR', briefing: '', deadline: '', startImage: '', status: MissionStatus.FAILED)
    );

    if (mission.id == '0') return const Scaffold(body: Center(child: Text("Mission not found")));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.grey),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(mission.codename, style: GoogleFonts.shareTechMono(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            Text('STATUS: ${mission.status.name}', style: GoogleFonts.shareTechMono(color: AppTheme.warning, fontSize: 10)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Target Intel
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TARGET INTEL', style: GoogleFonts.shareTechMono(color: AppTheme.primary, fontSize: 12)),
                  const SizedBox(height: 8),
                  // Handle network vs local images roughly
                  mission.startImage.startsWith('http') 
                    ? Image.network(mission.startImage, height: 200, width: double.infinity, fit: BoxFit.cover)
                    : Image.file(File(mission.startImage), height: 200, width: double.infinity, fit: BoxFit.cover),
                  const SizedBox(height: 16),
                  Text(
                    '"${mission.briefing}"',
                    style: GoogleFonts.shareTechMono(color: Colors.white, fontStyle: FontStyle.italic),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            if (_isProcessing)
              Center(
                child: Column(
                  children: [
                    const CircularProgressIndicator(color: AppTheme.primary),
                    const SizedBox(height: 16),
                    Text('ANALYZING INTEL...', style: GoogleFonts.shareTechMono(color: AppTheme.primary, fontSize: 18)),
                  ],
                ),
              )
            else
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('SUBMIT EVIDENCE', style: GoogleFonts.shareTechMono(color: AppTheme.danger, fontSize: 12)),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _captureEvidence,
                    child: Container(
                      height: 120,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.danger.withOpacity(0.5)),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.camera, color: AppTheme.danger, size: 40),
                            Text('TAKE PHOTO', style: GoogleFonts.shareTechMono(color: AppTheme.danger)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
