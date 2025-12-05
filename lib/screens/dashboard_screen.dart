import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart'; // Assuming we have this
import '../providers/app_state.dart';
import '../models/models.dart';
import '../theme.dart';
import 'create_mission_screen.dart';
import 'execute_mission_screen.dart';
import 'profile_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final missions = state.missions;
    final userProfile = state.userProfile;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.gps_fixed, color: AppTheme.primary), // Crosshair proxy
            const SizedBox(width: 8),
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(text: 'TASK', style: GoogleFonts.shareTechMono(color: Colors.white, fontWeight: FontWeight.bold)),
                  TextSpan(text: 'ASSASSIN', style: GoogleFonts.shareTechMono(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.bug_report, color: Colors.grey),
            onPressed: () {},
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Chip(
              backgroundColor: AppTheme.surface,
              avatar: const CircleAvatar(backgroundColor: AppTheme.primary, radius: 4),
              label: Text(
                'HANDLER ONLINE',
                style: GoogleFonts.shareTechMono(color: AppTheme.primary, fontSize: 10),
              ),
              side: BorderSide.none,
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Header
            _buildUserHeader(context, userProfile, state.stats),
            const SizedBox(height: 24),
            
            // Filters (Mocked)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('ALL', true),
                  const SizedBox(width: 8),
                  _buildFilterChip('EXECUTE', false),
                  const SizedBox(width: 8),
                  _buildFilterChip('COMPLETED', false),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Mission List
            Expanded(
              child: missions.isEmpty
                  ? Center(child: Text('NO GOALS FOUND.', style: GoogleFonts.shareTechMono(color: Colors.grey)))
                  : ListView.builder(
                      itemCount: missions.length,
                      itemBuilder: (context, index) {
                        final mission = missions[index];
                        return _buildMissionCard(mission, context);
                      },
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CreateMissionScreen()),
          );
        },
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.add, color: Colors.black),
        label: Text('NEW GOAL', style: GoogleFonts.shareTechMono(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildUserHeader(BuildContext context, UserProfile profile, UserStats stats) {
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => const ProfileScreen()));
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppTheme.primary,
            child: Text(
              profile.codename.isNotEmpty ? profile.codename[0].toUpperCase() : '?',
              style: GoogleFonts.shareTechMono(color: Colors.black, fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile.codename.isNotEmpty ? profile.codename : 'AGENT UNKNOWN',
                  style: GoogleFonts.shareTechMono(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text(
                  profile.lifeGoal.isNotEmpty ? profile.lifeGoal : 'NO LIFE GOAL SET',
                  style: GoogleFonts.shareTechMono(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ),
          // Simple stats
           Column(
             crossAxisAlignment: CrossAxisAlignment.end,
             children: [
               Text('${stats.totalStars} STARS', style: GoogleFonts.shareTechMono(color: AppTheme.primary, fontWeight: FontWeight.bold)),
               Text('LEVEL ${stats.level}', style: GoogleFonts.shareTechMono(color: Colors.purpleAccent, fontSize: 12)),
             ],
           )
        ],
      ),
    ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected) {
    return ChoiceChip(
      label: Text(label, style: GoogleFonts.shareTechMono(
          color: isSelected ? Colors.black : Colors.grey, fontWeight: FontWeight.bold
      )),
      selected: isSelected,
      onSelected: (_) {},
      selectedColor: AppTheme.primary,
      backgroundColor: AppTheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide.none), // Customize border
    );
  }

  Widget _buildMissionCard(Mission mission, BuildContext context) {
    final isCompleted = mission.status == MissionStatus.COMPLETED;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isCompleted ? AppTheme.primary.withOpacity(0.3) : Colors.white10),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.black26,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: isCompleted ? AppTheme.primary : Colors.grey),
            ),
            child: Icon(
              isCompleted ? Icons.check : Icons.gps_fixed,
              color: isCompleted ? AppTheme.primary : Colors.grey,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  mission.codename,
                  style: GoogleFonts.shareTechMono(
                    color: isCompleted ? AppTheme.primary : Colors.white,
                    fontWeight: FontWeight.bold,
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      mission.status.toString().split('.').last,
                      style: GoogleFonts.shareTechMono(
                        color: _getStatusColor(mission.status),
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('•', style: TextStyle(color: Colors.grey)),
                    const SizedBox(width: 8),
                     Text(mission.deadline, style: GoogleFonts.shareTechMono(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          if (!isCompleted)
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => ExecuteMissionScreen(missionId: mission.id)),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.background,
                foregroundColor: AppTheme.primary,
                side: const BorderSide(color: AppTheme.primary),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: Text('START', style: GoogleFonts.shareTechMono(fontWeight: FontWeight.bold)),
            ),
        ],
      ),
    );
  }

  Color _getStatusColor(MissionStatus status) {
    switch (status) {
      case MissionStatus.PENDING: return AppTheme.warning;
      case MissionStatus.COMPLETED: return AppTheme.primary;
      case MissionStatus.FAILED: return AppTheme.danger;
      default: return Colors.grey;
    }
  }
}
