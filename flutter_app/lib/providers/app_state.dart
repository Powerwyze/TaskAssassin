import 'package:flutter/material.dart';
import '../models/models.dart';

class AppState extends ChangeNotifier {
  List<Mission> _missions = [];
  UserProfile _userProfile = UserProfile(codename: 'AGENT', handlerId: '1', lifeGoal: '');
  UserStats _stats = UserStats();
  bool _isLoading = false;

  List<Mission> get missions => _missions;
  UserProfile get userProfile => _userProfile;
  UserStats get stats => _stats;
  bool get isLoading => _isLoading;

  AppState() {
    _loadInitialData();
  }

  void _loadInitialData() {
    // Mock Data Loading
    _missions = [
      Mission(
        id: '1',
        codename: 'GOAL: CLEAN SWEEP',
        briefing: 'Room must be spotless. Bed made, floor clear of assets, desk organized.',
        deadline: '2025-01-01',
        startImage: 'https://placehold.co/400x300/1e293b/ef4444?text=INITIAL+MESS',
        status: MissionStatus.PENDING,
        stars: 0,
      ),
    ];
    notifyListeners();
  }

  void addMission(Mission mission) {
    _missions.add(mission);
    notifyListeners();
  }

  void updateMissionStatus(String id, MissionStatus status) {
    final index = _missions.indexWhere((m) => m.id == id);
    if (index != -1) {
      // In a real app we would copyWith, but here just hack it or assuming immutable models need full replacement
      // Since Mission fields are final, we need to replace the object.
      // Ideally Mission would have a copyWith method.
    }
  }
  
  void setProfile(UserProfile profile) {
    _userProfile = profile;
    notifyListeners();
  }

  // Placeholder for executing logic
  Future<void> verifyMission(String missionId, String evidencePath) async {
    _isLoading = true;
    notifyListeners();
    
    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));
    
    // Success
    final index = _missions.indexWhere((m) => m.id == missionId);
    if (index != -1) {
      // Update mission to completed
       // _missions[index] = ... (need copyWith)
    }
    
    _isLoading = false;
    notifyListeners();
  }
}
