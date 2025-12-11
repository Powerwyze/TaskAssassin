import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:taskassassin/theme.dart';
import 'package:taskassassin/providers/app_provider.dart';
import 'package:taskassassin/screens/onboarding_screen.dart';
import 'package:taskassassin/screens/main_screen.dart';
import 'package:taskassassin/screens/create_mission_screen.dart';
import 'package:taskassassin/screens/mission_detail_screen.dart';
import 'package:taskassassin/screens/handler_chat_screen.dart';
import 'package:taskassassin/screens/handler_selection_screen.dart';
import 'package:taskassassin/screens/auth_screen.dart';
import 'package:taskassassin/screens/notifications_screen.dart';
import 'package:taskassassin/screens/bug_report_screen.dart';
import 'package:taskassassin/models/mission.dart';
import 'package:taskassassin/models/user.dart';
import 'package:taskassassin/supabase/supabase_config.dart';
import 'package:taskassassin/screens/progress_screen.dart';
import 'package:taskassassin/screens/leaderboard_screen.dart';
import 'package:taskassassin/screens/direct_message_screen.dart';
import 'package:taskassassin/services/push_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await SupabaseConfig.initialize();
    debugPrint('[Supabase] Initialized successfully');
  } catch (e) {
    debugPrint('[Supabase] Initialization error: $e');
  }

  try {
    await PushNotificationService().initialize();
    debugPrint('[Push Notifications] Initialized successfully');
  } catch (e) {
    debugPrint('[Push Notifications] Initialization error: $e');
  }
  
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppProvider()..initialize(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final GoRouter _router;
  
  @override
  void initState() {
    super.initState();
    
    // Access the provider properly since MyApp is now a child of ChangeNotifierProvider
    final appProvider = Provider.of<AppProvider>(context, listen: false);

    _router = GoRouter(
      initialLocation: '/auth',
      refreshListenable: appProvider,
      redirect: (context, state) {
        final isInitialized = appProvider.isInitialized;
        final isLoggedIn = appProvider.isAuthenticated;
        final profileResolved = appProvider.profileResolved;
        final hasCompletedOnboarding = appProvider.hasCompletedOnboarding;
        final isLoggingIn = state.uri.toString() == '/auth';
        final isOnboarding = state.uri.toString() == '/onboarding';

        // 1. If app is not initialized yet, don't redirect (let the loading screen handle it)
        if (!isInitialized) return null;

        // 2. If not logged in, force to auth
        if (!isLoggedIn) {
          return isLoggingIn ? null : '/auth';
        }

        // 3. If logged in but profile load is pending, wait (don't redirect yet)
        if (!profileResolved) return null;

        // 4. If logged in & profile loaded, check onboarding status
        if (!hasCompletedOnboarding) {
          return isOnboarding ? null : '/onboarding';
        }

        // 5. If logged in & onboarding complete, prevent access to auth/onboarding
        if (isLoggingIn || isOnboarding) {
          return '/home';
        }

        // 6. Otherwise allow access
        return null;
      },
      routes: [
        GoRoute(
          path: '/auth',
          builder: (context, state) => const AuthScreen(),
        ),
        GoRoute(
          path: '/onboarding',
          builder: (context, state) => const OnboardingScreen(),
        ),
        // ShellRoute for persistent bottom navigation
        ShellRoute(
          builder: (context, state, child) => AppShell(child: child),
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const MainScreen(),
            ),
            GoRoute(
              path: '/create-mission',
              builder: (context, state) {
                final friend = state.extra as User?;
                return CreateMissionScreen(assignee: friend);
              },
            ),
            GoRoute(
              path: '/mission-detail',
              builder: (context, state) {
                final extra = state.extra;
                Mission? mission;

                if (extra is Mission) {
                  mission = extra;
                } else if (extra is Map<String, dynamic>) {
                  mission = Mission.fromJson(extra);
                } else if (extra is Map) {
                  // Gracefully handle loosely typed maps from deep links or reloads
                  mission = Mission.fromJson(extra.map((key, value) => MapEntry(key.toString(), value)));
                }

                if (mission == null) {
                  debugPrint('[Router] Missing or invalid mission payload for /mission-detail');
                  return const Scaffold(
                    body: Center(child: Text('Mission details unavailable. Please reopen from Missions.')),
                  );
                }

                return MissionDetailScreen(mission: mission);
              },
            ),
            GoRoute(
              path: '/handler-chat',
              builder: (context, state) => const HandlerChatScreen(),
            ),
            GoRoute(
              path: '/handler-selection',
              builder: (context, state) => const HandlerSelectionScreen(),
            ),
            GoRoute(
              path: '/notifications',
              builder: (context, state) => const NotificationsScreen(),
            ),
            GoRoute(
              path: '/bug-report',
              builder: (context, state) => const BugReportScreen(),
            ),
            GoRoute(
              path: '/progress',
              builder: (context, state) => const ProgressScreen(),
            ),
            GoRoute(
              path: '/leaderboard',
              builder: (context, state) => const LeaderboardScreen(),
            ),
            GoRoute(
              path: '/direct-message',
              builder: (context, state) {
                final extra = state.extra;
                if (extra is User) {
                  return DirectMessageScreen(peer: extra);
                }

                debugPrint('[Router] Missing or invalid user for /direct-message');
                return const Scaffold(
                  body: Center(child: Text('Chat unavailable. Please reopen from your friends list.')),
                );
              },
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    // Listen to provider changes to trigger rebuilds if needed (though GoRouter listens too)
    // We mostly need this to show the loading screen if not initialized.
    final provider = Provider.of<AppProvider>(context);

    if (!provider.isInitialized) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: lightTheme,
        darkTheme: darkTheme,
        themeMode: ThemeMode.dark,
        home: const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    return MaterialApp.router(
      title: 'TaskAssassin',
      debugShowCheckedModeBanner: false,
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: ThemeMode.dark,
      routerConfig: _router,
    );
  }
}

/// App shell - just passes through the child (MainScreen handles its own navigation)
class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: const GlobalBottomNavBar(),
    );
  }
}

class GlobalBottomNavBar extends StatelessWidget {
  const GlobalBottomNavBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, provider, _) {
        return Container(
          decoration: BoxDecoration(
            color: CyberpunkColors.surface,
            border: Border(
              top: BorderSide(
                color: CyberpunkColors.border,
                width: 1,
              ),
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _BottomNavItem(
                    icon: Icons.grid_view_rounded,
                    label: 'HOME',
                    isSelected: provider.currentTab == 0,
                    onTap: () {
                      provider.setCurrentTab(0);
                      context.go('/home');
                    },
                  ),
                  _BottomNavItem(
                    icon: Icons.chat_bubble_outline,
                    label: 'COACH',
                    isSelected: provider.currentTab == 1,
                    onTap: () {
                      provider.setCurrentTab(1);
                      context.go('/home');
                    },
                  ),
                  _BottomNavItem(
                    icon: Icons.public,
                    label: 'SOCIAL',
                    isSelected: provider.currentTab == 2,
                    onTap: () {
                      provider.setCurrentTab(2);
                      context.go('/home');
                    },
                  ),
                  _BottomNavItem(
                    icon: Icons.person_outline,
                    label: 'ME',
                    isSelected: provider.currentTab == 3,
                    onTap: () {
                      provider.setCurrentTab(3);
                      context.go('/home');
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _BottomNavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _BottomNavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = isSelected ? CyberpunkColors.neonGreen : CyberpunkColors.textMuted;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 70,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: context.textStyles.labelSmall!.copyWith(
                color: color,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                letterSpacing: 1.0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AppBottomNavigation extends StatelessWidget {
  const AppBottomNavigation({super.key});

  int _getSelectedIndex(String location) {
    if (location.startsWith('/home')) return 0;
    if (location.startsWith('/handler-chat')) return 1;
    if (location.startsWith('/create-mission')) return 2;
    if (location.startsWith('/notifications')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final selectedIndex = _getSelectedIndex(location);

    return NavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) {
        switch (index) {
          case 0:
            context.go('/home');
            break;
          case 1:
            context.go('/handler-chat');
            break;
          case 2:
            context.go('/create-mission');
            break;
          case 3:
            context.go('/notifications');
            break;
        }
      },
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.dashboard_outlined),
          selectedIcon: Icon(Icons.dashboard),
          label: 'Dashboard',
        ),
        NavigationDestination(
          icon: Icon(Icons.chat_outlined),
          selectedIcon: Icon(Icons.chat),
          label: 'Handler',
        ),
        NavigationDestination(
          icon: Icon(Icons.add_circle_outline),
          selectedIcon: Icon(Icons.add_circle),
          label: 'New Mission',
        ),
        NavigationDestination(
          icon: Icon(Icons.notifications_outlined),
          selectedIcon: Icon(Icons.notifications),
          label: 'Alerts',
        ),
      ],
    );
  }
}
