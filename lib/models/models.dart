enum MissionStatus { PENDING, COMPLETED, FAILED, PROPOSED }

class Mission {
  final String id;
  final String codename; // Title
  final String briefing; // Description
  final String deadline;
  final String? recurrence; // 'WEEKLY', 'MONTHLY'
  final String startImage;
  final String? endImage;
  final MissionStatus status;
  final int stars;
  final String? lastFeedback;
  final String? issuer;
  final String? fromUid;
  final String? toUid;

  Mission({
    required this.id,
    required this.codename,
    required this.briefing,
    required this.deadline,
    required this.startImage,
    this.recurrence,
    this.endImage,
    this.status = MissionStatus.PENDING,
    this.stars = 0,
    this.lastFeedback,
    this.issuer,
    this.fromUid,
    this.toUid,
  });

  Mission copyWith({
    String? id,
    String? codename,
    String? briefing,
    String? deadline,
    String? startImage,
    String? recurrence,
    String? endImage,
    MissionStatus? status,
    int? stars,
    String? lastFeedback,
    String? issuer,
    String? fromUid,
    String? toUid,
  }) {
    return Mission(
      id: id ?? this.id,
      codename: codename ?? this.codename,
      briefing: briefing ?? this.briefing,
      deadline: deadline ?? this.deadline,
      startImage: startImage ?? this.startImage,
      recurrence: recurrence ?? this.recurrence,
      endImage: endImage ?? this.endImage,
      status: status ?? this.status,
      stars: stars ?? this.stars,
      lastFeedback: lastFeedback ?? this.lastFeedback,
      issuer: issuer ?? this.issuer,
      fromUid: fromUid ?? this.fromUid,
      toUid: toUid ?? this.toUid,
    );
  }

  factory Mission.fromJson(Map<String, dynamic> json) {
    return Mission(
      id: json['id'],
      codename: json['codename'],
      briefing: json['briefing'],
      deadline: json['deadline'],
      startImage: json['startImage'],
      recurrence: json['recurrence'],
      endImage: json['endImage'],
      status: MissionStatus.values.firstWhere(
            (e) => e.toString().split('.').last == json['status'],
        orElse: () => MissionStatus.PENDING,
      ),
      stars: json['stars'] ?? 0,
      lastFeedback: json['lastFeedback'],
      issuer: json['issuer'],
      fromUid: json['fromUid'],
      toUid: json['toUid'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'codename': codename,
      'briefing': briefing,
      'deadline': deadline,
      'startImage': startImage,
      'recurrence': recurrence,
      'endImage': endImage,
      'status': status.toString().split('.').last,
      'stars': stars,
      'lastFeedback': lastFeedback,
      'issuer': issuer,
      'fromUid': fromUid,
      'toUid': toUid,
    };
  }
}

class UserProfile {
  final String codename;
  final String handlerId;
  final String lifeGoal;
  final String? avatar;
  final bool hasSeenTutorial;
  final String? customHandlerName;

  UserProfile({
    required this.codename,
    required this.handlerId,
    required this.lifeGoal,
    this.avatar,
    this.hasSeenTutorial = false,
    this.customHandlerName,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      codename: json['codename'] ?? '',
      handlerId: json['handlerId'] ?? '1',
      lifeGoal: json['lifeGoal'] ?? '',
      avatar: json['avatar'],
      hasSeenTutorial: json['hasSeenTutorial'] ?? false,
      customHandlerName: json['customHandlerName'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'codename': codename,
      'handlerId': handlerId,
      'lifeGoal': lifeGoal,
      'avatar': avatar,
      'hasSeenTutorial': hasSeenTutorial,
      'customHandlerName': customHandlerName,
    };
  }
}

class UserStats {
  final int currentStreak;
  final int longestStreak;
  final int totalTasksCompleted;
  final int totalStars;
  final int level;
  final int xp;

  UserStats({
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.totalTasksCompleted = 0,
    this.totalStars = 0,
    this.level = 1,
    this.xp = 0,
  });
}
