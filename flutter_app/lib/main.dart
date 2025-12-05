import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
import 'providers/app_state.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(const TaskAssassinApp());
}

class TaskAssassinApp extends StatelessWidget {
  const TaskAssassinApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()),
      ],
      child: MaterialApp(
        title: 'Task Assassin',
        theme: AppTheme.darkTheme,
        debugShowCheckedModeBanner: false,
        home: const DashboardScreen(),
      ),
    );
  }
}
