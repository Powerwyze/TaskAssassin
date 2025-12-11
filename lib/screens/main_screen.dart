import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:taskassassin/providers/app_provider.dart';
import 'package:taskassassin/screens/dashboard_screen.dart';
import 'package:taskassassin/screens/handler_chat_screen.dart';
import 'package:taskassassin/screens/social_screen.dart';
import 'package:taskassassin/screens/profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final _tabs = const [
    DashboardScreen(),
    HandlerChatScreen(),
    SocialScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, provider, _) => Scaffold(
        body: _tabs[provider.currentTab],
      ),
    );
  }
}
