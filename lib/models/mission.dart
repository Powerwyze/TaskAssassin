enum MissionType { selfAssigned, aiSuggested, friendAssigned, recurring }
enum MissionStatus { pending, inProgress, completed, verified, failed }

class Mission {
  static const Object _unset = Object();

  final String id;
  final String userId;
  final String title;
  final String description;
  final String completedState;
  final MissionType type;
  final MissionStatus status;
  final DateTime? deadline;
  final String? recurrencePattern;
  final String? beforePhotoUrl;
  final String? afterPhotoUrl;
  final int starsEarned;
  final String? aiFeedback;
  final String? assignedByUserId;
  final String? assignedToUserId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? completedAt;

  Mission({
    required this.id,
    required this.userId,
    required this.title,
    required this.description,
    required this.completedState,
    required this.type,
    required this.status,
    this.deadline,
    this.recurrencePattern,
    this.beforePhotoUrl,
    this.afterPhotoUrl,
    this.starsEarned = 0,
    this.aiFeedback,
    this.assignedByUserId,
    this.assignedToUserId,
    required this.createdAt,
    required this.updatedAt,
    this.completedAt,
  });

  bool get isOverdue =>
      deadline != null &&
      DateTime.now().isAfter(deadline!) &&
      status != MissionStatus.completed &&
      status != MissionStatus.verified;

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_id': userId,
        'title': title,
        'description': description,
        'completed_state': completedState,
        'type': type.name,
        'status': status.name,
        'deadline': deadline?.toIso8601String(),
        'recurrence_pattern': recurrencePattern,
        'before_photo_url': beforePhotoUrl,
        'after_photo_url': afterPhotoUrl,
        'stars_earned': starsEarned,
        'ai_feedback': aiFeedback,
        'assigned_by_user_id': assignedByUserId,
        'assigned_to_user_id': assignedToUserId,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
        'completed_at': completedAt?.toIso8601String(),
      };

  factory Mission.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      if (value is String) return DateTime.parse(value);
      return null;
    }

    return Mission(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      completedState: json['completed_state'] as String,
      type: MissionType.values.firstWhere((e) => e.name == json['type']),
      status: MissionStatus.values.firstWhere((e) => e.name == json['status']),
      deadline: parseDate(json['deadline']),
      recurrencePattern: json['recurrence_pattern'] as String?,
      beforePhotoUrl: json['before_photo_url'] as String?,
      afterPhotoUrl: json['after_photo_url'] as String?,
      starsEarned: json['stars_earned'] as int? ?? 0,
      aiFeedback: json['ai_feedback'] as String?,
      assignedByUserId: json['assigned_by_user_id'] as String?,
      assignedToUserId: json['assigned_to_user_id'] as String?,
      createdAt: parseDate(json['created_at']) ?? DateTime.now(),
      updatedAt: parseDate(json['updated_at']) ?? DateTime.now(),
      completedAt: parseDate(json['completed_at']),
    );
  }

  Mission copyWith({
    String? id,
    String? userId,
    String? title,
    String? description,
    String? completedState,
    MissionType? type,
    MissionStatus? status,
    Object? deadline = _unset,
    Object? recurrencePattern = _unset,
    Object? beforePhotoUrl = _unset,
    Object? afterPhotoUrl = _unset,
    int? starsEarned,
    Object? aiFeedback = _unset,
    Object? assignedByUserId = _unset,
    Object? assignedToUserId = _unset,
    DateTime? createdAt,
    DateTime? updatedAt,
    Object? completedAt = _unset,
  }) =>
      Mission(
        id: id ?? this.id,
        userId: userId ?? this.userId,
        title: title ?? this.title,
        description: description ?? this.description,
        completedState: completedState ?? this.completedState,
        type: type ?? this.type,
        status: status ?? this.status,
        deadline: identical(deadline, _unset) ? this.deadline : deadline as DateTime?,
        recurrencePattern: identical(recurrencePattern, _unset)
            ? this.recurrencePattern
            : recurrencePattern as String?,
        beforePhotoUrl: identical(beforePhotoUrl, _unset) ? this.beforePhotoUrl : beforePhotoUrl as String?,
        afterPhotoUrl: identical(afterPhotoUrl, _unset) ? this.afterPhotoUrl : afterPhotoUrl as String?,
        starsEarned: starsEarned ?? this.starsEarned,
        aiFeedback: identical(aiFeedback, _unset) ? this.aiFeedback : aiFeedback as String?,
        assignedByUserId: identical(assignedByUserId, _unset)
            ? this.assignedByUserId
            : assignedByUserId as String?,
        assignedToUserId: identical(assignedToUserId, _unset)
            ? this.assignedToUserId
            : assignedToUserId as String?,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        completedAt: identical(completedAt, _unset) ? this.completedAt : completedAt as DateTime?,
      );
}
