import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:taskassassin/auth/auth_manager.dart';
import 'package:taskassassin/supabase/supabase_config.dart';
import 'package:taskassassin/models/user.dart' as app_user;
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseAuthManager extends AuthManager with EmailSignInManager, GoogleSignInManager {
  @override
  Future<void> signOut() async {
    try {
      await SupabaseConfig.auth.signOut();
      debugPrint('[SupabaseAuth] Signed out successfully');
    } catch (e) {
      debugPrint('[SupabaseAuth] Sign out error: $e');
      rethrow;
    }
  }

  @override
  Future<void> deleteUser(BuildContext context) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) throw 'No user logged in';
      
      // Delete user from Supabase (will cascade delete all related data)
      await SupabaseService.delete('users', filters: {'id': userId});
      await SupabaseConfig.auth.admin.deleteUser(userId);
      
      debugPrint('[SupabaseAuth] User deleted successfully');
    } catch (e) {
      debugPrint('[SupabaseAuth] Delete user error: $e');
      rethrow;
    }
  }

  @override
  Future<void> updateEmail({required String email, required BuildContext context}) async {
    try {
      await SupabaseConfig.auth.updateUser(UserAttributes(email: email));
      debugPrint('[SupabaseAuth] Email updated to: $email');
    } catch (e) {
      debugPrint('[SupabaseAuth] Update email error: $e');
      rethrow;
    }
  }

  @override
  Future<void> resetPassword({required String email, required BuildContext context}) async {
    try {
      await SupabaseConfig.auth.resetPasswordForEmail(email);
      debugPrint('[SupabaseAuth] Password reset email sent to: $email');
    } catch (e) {
      debugPrint('[SupabaseAuth] Reset password error: $e');
      rethrow;
    }
  }

  @override
  Future<app_user.User?> signInWithEmail(BuildContext context, String email, String password) async {
    try {
      final response = await SupabaseConfig.auth.signInWithPassword(
        email: email,
        password: password,
      );
      
      if (response.user == null) {
        throw 'Sign in failed';
      }
      
      debugPrint('[SupabaseAuth] Signed in with email: $email');
      return await _getOrCreateUserProfile(response.user!);
    } catch (e) {
      debugPrint('[SupabaseAuth] Sign in error: $e');
      rethrow;
    }
  }

  @override
  Future<app_user.User?> createAccountWithEmail(BuildContext context, String email, String password) async {
    try {
      final response = await SupabaseConfig.auth.signUp(
        email: email,
        password: password,
      );

      if (response.user == null) {
        throw 'Sign up failed';
      }

      // If email confirmation is required, Supabase returns no session.
      // In that case, do NOT attempt profile creation (RLS will block it).
      if (response.session == null) {
        debugPrint('[SupabaseAuth] Created account, email confirmation required for: $email');
        throw 'Email not confirmed. We sent a verification link to $email. Please verify, then sign in.';
      }

      debugPrint('[SupabaseAuth] Created account with email: $email');
      return await _getOrCreateUserProfile(response.user!);
    } catch (e) {
      debugPrint('[SupabaseAuth] Create account error: $e');
      rethrow;
    }
  }

  @override
  Future<app_user.User?> signInWithGoogle(BuildContext context) async {
    try {
      // Use Supabase OAuth redirect on all platforms for simplicity.
      // On mobile, ensure URL schemes are configured to handle the callback.
      final redirectUrl = kIsWeb
          ? Uri.base.toString()
          : 'io.supabase.flutter://login-callback/';

      debugPrint('[SupabaseAuth] Starting Google OAuth (redirect: $redirectUrl)');
      await SupabaseConfig.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: redirectUrl,
        queryParams: const {
          'prompt': 'select_account',
        },
      );

      // The app will redirect; onAuthStateChange listener handles session/user creation.
      return null;
    } catch (e) {
      debugPrint('[SupabaseAuth] Google sign in error: $e');
      rethrow;
    }
  }

  /// Helper method to get or create user profile in users table
  Future<app_user.User?> _getOrCreateUserProfile(User supabaseUser) async {
    try {
      // Try to get existing user
      final existingUser = await SupabaseService.selectSingle(
        'users',
        filters: {'id': supabaseUser.id},
      );

      if (existingUser != null) {
        return app_user.User.fromJson(existingUser);
      }

      // Create new user profile
      final newUserData = {
        'id': supabaseUser.id,
        'email': supabaseUser.email ?? '',
        'codename': _generateCodename(),
        'selected_handler_id': 'handler_1', // Default handler
        'life_goals': '',
        'total_stars': 0,
        'level': 0,
        'current_streak': 0,
        'longest_streak': 0,
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };

      final created = await SupabaseService.insert('users', newUserData);
      if (created.isEmpty) throw 'Failed to create user profile';

      return app_user.User.fromJson(created.first);
    } catch (e) {
      debugPrint('[SupabaseAuth] Get/create user profile error: $e');
      return null;
    }
  }

  /// Generate a random codename for new users
  String _generateCodename() {
    final adjectives = ['Swift', 'Silent', 'Bold', 'Fierce', 'Quick', 'Brave', 'Wise', 'Noble'];
    final nouns = ['Tiger', 'Eagle', 'Wolf', 'Falcon', 'Lion', 'Bear', 'Fox', 'Hawk'];
    final random = DateTime.now().millisecondsSinceEpoch;
    return '${adjectives[random % adjectives.length]}${nouns[random % nouns.length]}${random % 100}';
  }
}
