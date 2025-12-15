import 'package:flutter/foundation.dart';

/// Helper class to store and retrieve notification navigation data
class NotificationNavigationHelper {
  static final Map<String, dynamic> _pendingNavigation = {};
  
  /// Store navigation data from notification
  static void handleNotificationNavigation(Map<String, dynamic> data) {
    try {
      final type = data['type'] as String?;
      
      if (type == null) {
        debugPrint('[Navigation] No type found in notification data');
        return;
      }

      debugPrint('[Navigation] Storing navigation data for type: $type');
      _pendingNavigation.clear();
      _pendingNavigation.addAll({
        'type': type,
        'data': data,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });
    } catch (e) {
      debugPrint('[Navigation] Error storing notification data: $e');
    }
  }

  /// Check if there's pending navigation data
  static bool hasPendingNavigation() => _pendingNavigation.isNotEmpty;

  /// Get and consume pending navigation data
  static Map<String, dynamic>? consumePendingNavigation() {
    if (_pendingNavigation.isEmpty) return null;
    
    final data = Map<String, dynamic>.from(_pendingNavigation);
    _pendingNavigation.clear();
    return data;
  }

  /// Get navigation route and extra data for the given notification data
  static Map<String, dynamic>? getNavigationIntent(Map<String, dynamic>? navData) {
    if (navData == null) return null;
    
    try {
      final type = navData['type'] as String?;
      final data = navData['data'] as Map<String, dynamic>?;
      
      if (type == null || data == null) return null;

      debugPrint('[Navigation] Processing navigation intent for type: $type');

      switch (type) {
        case 'mission':
        case 'mission_assigned':
        case 'mission_completed':
        case 'mission_updated':
          return _getMissionNavigationIntent(data);

        case 'message':
        case 'direct_message':
          return _getMessageNavigationIntent(data);

        case 'friend_request':
        case 'friend_accepted':
          return {'route': '/home', 'extra': null};

        case 'achievement':
        case 'level_up':
          return {'route': '/progress', 'extra': null};

        case 'handler_message':
          return {'route': '/handler-chat', 'extra': null};

        case 'leaderboard':
          return {'route': '/leaderboard', 'extra': null};

        default:
          debugPrint('[Navigation] Unknown notification type: $type');
          return {'route': '/notifications', 'extra': null};
      }
    } catch (e) {
      debugPrint('[Navigation] Error getting navigation intent: $e');
      return {'route': '/home', 'extra': null};
    }
  }

  /// Get mission navigation intent
  static Map<String, dynamic>? _getMissionNavigationIntent(Map<String, dynamic> data) {
    try {
      final missionId = data['mission_id'] as String?;
      
      if (missionId != null && data.containsKey('mission')) {
        return {
          'route': '/mission-detail',
          'extra': data['mission'],
        };
      }
      return {'route': '/home', 'extra': null};
    } catch (e) {
      debugPrint('[Navigation] Error getting mission navigation: $e');
      return {'route': '/home', 'extra': null};
    }
  }

  /// Get message navigation intent
  static Map<String, dynamic>? _getMessageNavigationIntent(Map<String, dynamic> data) {
    try {
      final userId = data['user_id'] as String?;
      
      if (userId != null && data.containsKey('user')) {
        return {
          'route': '/direct-message',
          'extra': data['user'],
        };
      }
      return {'route': '/home', 'extra': null};
    } catch (e) {
      debugPrint('[Navigation] Error getting message navigation: $e');
      return {'route': '/home', 'extra': null};
    }
  }
}
