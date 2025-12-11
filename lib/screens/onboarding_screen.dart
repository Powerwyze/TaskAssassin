import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:taskassassin/providers/app_provider.dart';
import 'package:taskassassin/models/handler.dart';
import 'package:taskassassin/theme.dart';
import 'package:taskassassin/supabase/supabase_config.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pageController = PageController();
  final _codenameController = TextEditingController();
  final _lifeGoalsController = TextEditingController();
  Handler? _selectedHandler;
  int _currentPage = 0;
    bool _isSubmitting = false;

  @override
  void dispose() {
    _pageController.dispose();
    _codenameController.dispose();
    _lifeGoalsController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _complete() async {
    if (_codenameController.text.isEmpty ||
        _selectedHandler == null ||
        _lifeGoalsController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete all fields')),
      );
      return;
    }

    // Ensure user is authenticated before attempting to create profile
    final isAuthed = context.read<AppProvider>().isAuthenticated;
    final supaUser = SupabaseConfig.auth.currentUser;
    if (!isAuthed || supaUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please sign in first. Redirecting to the sign-in screen...'),
        ),
      );
      context.go('/auth');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final provider = context.read<AppProvider>();
      await provider.completeOnboarding(
        codename: _codenameController.text,
        handlerId: _selectedHandler!.id,
        lifeGoals: _lifeGoalsController.text,
      );

      if (mounted) context.go('/home');
    } catch (e) {
      // Show a helpful message instead of appearing stuck
      final error = e.toString();
      String msg;
      if (error.contains('row-level security') || error.contains('permission denied')) {
        msg = 'Saving your profile was blocked by database security (RLS). Please try again, or contact support.';
      } else if (error.contains('No authenticated user')) {
        msg = 'You are signed out. Please sign in and try again.';
      } else if (error.toLowerCase().contains('email not confirmed') ||
          error.toLowerCase().contains('verification')) {
        msg = 'Please verify your email first. We sent you a verification link.';
      } else {
        msg = 'Something went wrong while saving. Please try again.';
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg)),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (page) => setState(() => _currentPage = page),
                children: [
                  _buildWelcomePage(),
                  _buildHandlerSelectionPage(),
                  _buildLifeGoalsPage(),
                ],
              ),
            ),
            Padding(
              padding: AppSpacing.paddingLg,
              child: Row(
                children: [
                  if (_currentPage > 0)
                    TextButton(
                      onPressed: () => _pageController.previousPage(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      ),
                      child: const Text('Back'),
                    ),
                  const Spacer(),
                  FilledButton(
                    onPressed: _isSubmitting ? null : (_currentPage == 2 ? _complete : _nextPage),
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(_currentPage == 2 ? 'Start Mission' : 'Continue'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomePage() {
    return SingleChildScrollView(
      padding: AppSpacing.paddingXl,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 40),
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Image.asset(
                'assets/icons/taskassassin_logo.png',
                width: 120,
                height: 120,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  debugPrint('Logo failed to load: $error');
                  return const Icon(Icons.task_alt, size: 120, color: AppColors.checkGreen);
                },
              ),
            ),
          ),
          const SizedBox(height: 24),
          Center(
            child: RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: 'Welcome to\n',
                    style: context.textStyles.titleLarge!.copyWith(color: AppColors.textSecondary),
                  ),
                  TextSpan(
                    text: 'TASK',
                    style: context.textStyles.displaySmall!.bold.copyWith(color: AppColors.cream),
                  ),
                  TextSpan(
                    text: 'ASSASSIN',
                    style: context.textStyles.displaySmall!.bold.copyWith(color: AppColors.checkGreen),
                  ),
                ],
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Transform your tasks into thrilling missions. Complete them, earn stars, and level up your productivity game.',
            style: context.textStyles.bodyLarge!.withColor(
              Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 48),
          TextField(
            controller: _codenameController,
            decoration: InputDecoration(
              labelText: 'Choose Your Codename',
              hintText: 'e.g., Shadow Agent, Phoenix',
              prefixIcon: const Icon(Icons.badge),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
          ),
          const SizedBox(height: 16),
          _SignedInEmailHint(),
          const SizedBox(height: 24),
          Center(
            child: Text(
              'v1.0.7',
              style: context.textStyles.bodySmall?.withColor(AppColors.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHandlerSelectionPage() {
    return Consumer<AppProvider>(
      builder: (context, provider, _) {
        final handlers = provider.handlerService.getAllHandlers();
        final categories = provider.handlerService.getHandlerCategories();

        return SingleChildScrollView(
          padding: AppSpacing.paddingLg,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 24),
              Text(
                'Choose Your Handler',
                style: context.textStyles.headlineMedium!.bold,
              ),
              const SizedBox(height: 8),
              Text(
                'Your AI coach who will guide, motivate, and verify your missions.',
                style: context.textStyles.bodyMedium!.withColor(
                  Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 24),
              ...categories.map((category) {
                final categoryHandlers = handlers.where((h) => h.category == category).toList();
                if (categoryHandlers.isEmpty) return const SizedBox.shrink();

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: AppSpacing.verticalSm,
                      child: Text(
                        category,
                        style: context.textStyles.titleMedium!.semiBold,
                      ),
                    ),
                    ...categoryHandlers.map((handler) => _buildHandlerCard(handler)),
                    const SizedBox(height: 16),
                  ],
                );
              }),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHandlerCard(Handler handler) {
    final isSelected = _selectedHandler?.id == handler.id;
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () => setState(() => _selectedHandler = handler),
      child: Container(
        margin: AppSpacing.verticalXs,
        padding: AppSpacing.paddingMd,
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.primaryContainer : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(
            color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outline.withValues(alpha: 0.3),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Text(handler.avatar, style: const TextStyle(fontSize: 32)),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(handler.name, style: context.textStyles.titleMedium!.semiBold),
                  const SizedBox(height: 4),
                  Text(
                    handler.description,
                    style: context.textStyles.bodySmall!.withColor(theme.colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: theme.colorScheme.primary),
          ],
        ),
      ),
    );
  }

  Widget _buildLifeGoalsPage() {
    return SingleChildScrollView(
      padding: AppSpacing.paddingXl,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24),
          Text(
            'Set Your Life Goals',
            style: context.textStyles.headlineMedium!.bold,
          ),
          const SizedBox(height: 8),
          Text(
            'Your Handler will use these to suggest relevant missions and provide personalized motivation.',
            style: context.textStyles.bodyMedium!.withColor(
              Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _lifeGoalsController,
            decoration: InputDecoration(
              labelText: 'What do you want to achieve?',
              hintText: 'e.g., Start a business, get fit, learn coding',
              prefixIcon: const Icon(Icons.flag),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
            maxLines: 5,
          ),
          const SizedBox(height: 24),
          if (_selectedHandler != null) ...[
            Container(
              padding: AppSpacing.paddingMd,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Row(
                children: [
                  Text(_selectedHandler!.avatar, style: const TextStyle(fontSize: 40)),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      _selectedHandler!.greetingMessage,
                      style: context.textStyles.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SignedInEmailHint extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final email = context.read<AppProvider>().isAuthenticated
        ? (SupabaseConfig.auth.currentUser?.email ?? '')
        : '';
    if (email.isEmpty) return const SizedBox.shrink();
    final theme = Theme.of(context);
    return Container(
      padding: AppSpacing.paddingMd,
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Row(
        children: [
          Icon(Icons.email, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Signed in as $email',
              style: context.textStyles.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
