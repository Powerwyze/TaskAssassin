import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../theme.dart';
import '../providers/app_state.dart';
import '../models/models.dart';

class CreateMissionScreen extends StatefulWidget {
  const CreateMissionScreen({super.key});

  @override
  State<CreateMissionScreen> createState() => _CreateMissionScreenState();
}

class _CreateMissionScreenState extends State<CreateMissionScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  String? _recurrence; // 'WEEKLY', 'MONTHLY'
  File? _imageFile;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage() async {
    final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
    if (photo != null) {
      setState(() {
        _imageFile = File(photo.path);
      });
    }
  }

  void _createMission() {
    if (_titleController.text.isEmpty || _imageFile == null) return;

    // In a real app we'd upload the image and get a URL.
    // Here we'll just use the file path string for local emulation
    final newMission = Mission(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      codename: _titleController.text.toUpperCase(),
      briefing: _descController.text,
      deadline: DateFormat('yyyy-MM-dd').format(_selectedDate),
      startImage: _imageFile!.path, // Local path
      recurrence: _recurrence,
      status: MissionStatus.PENDING,
      stars: 0,
      issuer: 'SELF',
    );

    context.read<AppState>().addMission(newMission);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.grey),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('NEW GOAL', style: GoogleFonts.shareTechMono(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title Input
            _buildLabel('TITLE'),
            TextField(
              controller: _titleController,
              style: GoogleFonts.shareTechMono(color: Colors.white),
              decoration: InputDecoration(
                filled: true,
                fillColor: AppTheme.surface,
                hintText: 'e.g. CLEAN ROOM',
                hintStyle: GoogleFonts.shareTechMono(color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AppTheme.primary)),
              ),
            ),
            const SizedBox(height: 16),

            // Date & Recurrence
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLabel('DEADLINE'),
                      InkWell(
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: _selectedDate,
                            firstDate: DateTime.now(),
                            lastDate: DateTime(2030),
                            builder: (context, child) {
                              return Theme(
                                data: AppTheme.darkTheme.copyWith(
                                  colorScheme: const ColorScheme.dark(
                                    primary: AppTheme.primary,
                                    onPrimary: Colors.black,
                                    surface: AppTheme.surface,
                                    onSurface: Colors.white,
                                  ),
                                ),
                                child: child!,
                              );
                            },
                          );
                          if (picked != null) {
                            setState(() => _selectedDate = picked);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.surface,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            DateFormat('yyyy-MM-dd').format(_selectedDate),
                            style: GoogleFonts.shareTechMono(color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLabel('RECURRENCE'),
                      DropdownButtonFormField<String>(
                        value: _recurrence,
                        dropdownColor: AppTheme.surface,
                        style: GoogleFonts.shareTechMono(color: Colors.white),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: AppTheme.surface,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                        ),
                        items: const [
                          DropdownMenuItem(value: null, child: Text('ONE-TIME')),
                          DropdownMenuItem(value: 'WEEKLY', child: Text('WEEKLY')),
                          DropdownMenuItem(value: 'MONTHLY', child: Text('MONTHLY')),
                        ],
                        onChanged: (val) => setState(() => _recurrence = val),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Description
            _buildLabel('DESCRIPTION OF COMPLETED STATE'),
            TextField(
              controller: _descController,
              maxLines: 4,
              style: GoogleFonts.shareTechMono(color: Colors.white),
              decoration: InputDecoration(
                filled: true,
                fillColor: AppTheme.surface,
                hintText: 'e.g. Bed made, desk clear...',
                hintStyle: GoogleFonts.shareTechMono(color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AppTheme.primary)),
              ),
            ),
            const SizedBox(height: 16),

            // Image Picker
            _buildLabel('STARTING PHOTO'),
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.5)),
                  image: _imageFile != null
                      ? DecorationImage(image: FileImage(_imageFile!), fit: BoxFit.cover)
                      : null,
                ),
                child: _imageFile == null
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.camera_alt, color: AppTheme.primary, size: 48),
                          const SizedBox(height: 8),
                          Text('TAP TO CAPTURE', style: GoogleFonts.shareTechMono(color: AppTheme.primary)),
                        ],
                      )
                    : Stack(
                        children: [
                          Positioned(
                            right: 8,
                            top: 8,
                            child: IconButton(
                              icon: const Icon(Icons.refresh, color: Colors.white),
                              onPressed: _pickImage,
                              style: IconButton.styleFrom(backgroundColor: Colors.black54),
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: (_titleController.text.isNotEmpty && _imageFile != null)
                    ? _createMission
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  disabledBackgroundColor: AppTheme.surface,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  shadowColor: AppTheme.primary,
                  elevation: 8,
                ),
                child: Text('START GOAL', style: GoogleFonts.shareTechMono(fontSize: 18, fontWeight: FontWeight.bold)),
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
}
