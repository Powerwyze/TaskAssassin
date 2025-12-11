import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:taskassassin/providers/app_provider.dart';
import 'package:taskassassin/models/mission.dart';
import 'package:taskassassin/models/user.dart';
import 'package:taskassassin/theme.dart';

class CreateMissionScreen extends StatefulWidget {
  const CreateMissionScreen({super.key, this.assignee});

  /// Optional friend to assign this mission to.
  final User? assignee;

  @override
  State<CreateMissionScreen> createState() => _CreateMissionScreenState();
}

class _CreateMissionScreenState extends State<CreateMissionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _completedStateController = TextEditingController();
  DateTime? _deadline;
  MissionType _type = MissionType.selfAssigned;
  User? _assignee;

  @override
  void initState() {
    super.initState();
    _assignee = widget.assignee;
    if (_assignee != null) {
      _type = MissionType.friendAssigned;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _completedStateController.dispose();
    super.dispose();
  }

  Future<void> _selectDeadline() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() => _deadline = date);
    }
  }

  Future<void> _createMission() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<AppProvider>();
    final user = provider.currentUser;
    if (user == null) return;

    final targetUserId = _assignee?.id ?? user.id;
    final isFriendAssignment = _assignee != null;
    final missionType = isFriendAssignment ? MissionType.friendAssigned : _type;

    try {
      final mission = await provider.missionService.createMission(
        userId: targetUserId,
        title: _titleController.text,
        description: _descriptionController.text,
        completedState: _completedStateController.text,
        type: missionType,
        deadline: _deadline,
        assignedByUserId: isFriendAssignment ? user.id : null,
        assignedToUserId: isFriendAssignment ? _assignee?.id : null,
      );

      if (mission.userId == user.id) {
        await provider.addMission(mission);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isFriendAssignment
                  ? 'Mission assigned to ${_assignee?.codename ?? 'friend'}'
                  : 'Mission created successfully',
            ),
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error creating mission: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Mission'),
      ),
      body: SingleChildScrollView(
        padding: AppSpacing.paddingLg,
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(
                  labelText: 'Mission Title',
                  hintText: 'e.g., Clean the garage',
                  prefixIcon: const Icon(Icons.title),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                ),
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: InputDecoration(
                  labelText: 'Description',
                  hintText: 'What needs to be done?',
                  prefixIcon: const Icon(Icons.description),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                ),
                maxLines: 3,
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _completedStateController,
                decoration: InputDecoration(
                  labelText: 'Completed State',
                  hintText: 'How will you know it\'s done?',
                  prefixIcon: const Icon(Icons.check_circle),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                ),
                maxLines: 2,
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<MissionType>(
                value: _type,
                decoration: InputDecoration(
                  labelText: 'Mission Type',
                  prefixIcon: const Icon(Icons.category),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                ),
                items: [
                  DropdownMenuItem(
                    value: MissionType.selfAssigned,
                    child: const Text('Self-Assigned'),
                  ),
                  DropdownMenuItem(
                    value: MissionType.recurring,
                    child: const Text('Recurring'),
                  ),
                  if (_assignee != null)
                    DropdownMenuItem(
                      value: MissionType.friendAssigned,
                      child: const Text('Assign to Friend'),
                    ),
                ],
                onChanged: _assignee != null
                    ? null
                    : (value) => setState(() => _type = value ?? MissionType.selfAssigned),
              ),
              const SizedBox(height: 16),
              if (_assignee != null) ...[
                ListTile(
                  tileColor: CyberpunkColors.surfaceVariant,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                  leading: const Icon(Icons.person_add_alt),
                  title: Text('Assigning to ${_assignee!.codename}'),
                  subtitle: Text('They will receive this mission'),
                ),
                const SizedBox(height: 16),
              ],
              InkWell(
                onTap: _selectDeadline,
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: 'Deadline (Optional)',
                    prefixIcon: const Icon(Icons.calendar_today),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                  ),
                  child: Text(
                    _deadline == null
                        ? 'Select deadline'
                        : '${_deadline!.month}/${_deadline!.day}/${_deadline!.year}',
                  ),
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _createMission,
                child: const Padding(
                  padding: AppSpacing.paddingMd,
                  child: Text('Create Mission'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
