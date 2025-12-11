# TaskAssassin Architecture

## Overview
TaskAssassin is a gamified productivity app that uses AI verification (Google Gemini), personalized Handler personalities, and social features to make task completion addictive.

## Backend: Supabase
The app uses **Supabase** for authentication, database, and storage:
- **Authentication**: Email/password sign-up with email verification
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: Supabase Storage for avatar and mission photos

## Design Approach
**Vibrant Cyberpunk Theme**
- Dark Mode Primary: Deep navy (#0f172a) with neon green accents (#10b981)
- Light Mode: White/light gray backgrounds with teal accents
- Typography: Modern sans-serif (Inter) with bold headlines
- Generous spacing, rounded corners, no heavy shadows
- Mobile-first responsive design

## Data Models (`lib/models/`)

### 1. User Model (Supabase: `users` table)
- `id` (UUID, primary key, references auth.users.id)
- `codename`, `email`, `avatar_url`
- `selected_handler_id`, `life_goals`
- `total_stars`, `level`, `current_streak`, `longest_streak`
- `created_at`, `updated_at`

### 2. Handler Model (In-memory only)
- `id`, `name`, `category`, `description`, `personality_style`
- `avatar`, `greeting_message`
- **Note**: 16 pre-defined handlers stored in-memory (no database needed)

### 3. Mission Model (Supabase: `missions` table)
- `id`, `user_id`, `title`, `description`, `completed_state`
- `type` (self_assigned, ai_suggested, friend_assigned, recurring)
- `status` (pending, in_progress, completed, verified, failed)
- `deadline`, `recurrence_pattern`
- `before_photo_url`, `after_photo_url`
- `stars_earned`, `ai_feedback`
- `assigned_by_user_id`, `assigned_to_user_id`
- `created_at`, `updated_at`, `completed_at`

### 4. Achievement Model (Supabase: `achievements` table)
- `id`, `name`, `description`, `icon`, `criteria`
- `stars_required`, `category`

### 5. UserAchievement Model (Supabase: `user_achievements` table)
- `id`, `user_id`, `achievement_id`, `unlocked_at`

### 6. Friend Model (Supabase: `friends` table)
- `id`, `user_id`, `friend_user_id`, `status` (pending, accepted)
- `created_at`

### 7. Message Model (Supabase: `messages` table)
- `id`, `sender_id`, `receiver_id`, `content`
- `is_read`, `created_at`

### 8. ChatMessage Model (Supabase: `chat_messages` table)
- `id`, `user_id`, `role` (user, handler)
- `content`, `created_at`

### 9. Notification Model (Supabase: `notifications` table)
- `id`, `user_id`, `type`, `title`, `message`
- `data`, `is_read`, `created_at`

### 10. BugReport Model (Supabase: `bug_reports` table)
- `id`, `user_id`, `user_email`, `title`, `description`
- `severity`, `status`, `device_info`, `app_version`
- `created_at`, `updated_at`

## Services (`lib/services/`)

### 1. UserService
- CRUD operations for User via Supabase
- Level calculation logic (100 stars = 1 level)
- Streak tracking and updates

### 2. HandlerService
- Returns 16 pre-defined handlers from in-memory list
- Synchronous access (no database calls needed)
- Get handler by ID with fallback to default

### 3. MissionService
- CRUD for missions via Supabase
- Filter by status, type, user
- Photo URL management

### 4. AchievementService
- Get achievements from Supabase
- Unlock user achievements
- Check achievement status

### 5. FriendService
- Send/accept/decline friend requests via Supabase
- Get friends list

### 6. MessageService
- Send messages between users via Supabase
- Mark as read
- Get conversations

### 7. ChatService (Handler chat)
- Store chat history in Supabase
- Get messages by user

### 8. AIService (Google Gemini Integration)
- Verify mission completion (compare before/after photos)
- Generate star rating (1-5)
- Generate personalized feedback from Handler
- Handler chat conversation
- Suggest AI-generated missions

### 9. NotificationService
- Create and manage notifications via Supabase
- Mark notifications as read

### 10. BugReportService
- Submit bug reports via Supabase

### 11. StorageService
- Local storage abstraction for shared_preferences
- Used for caching and preferences

## Screens & Navigation (`lib/screens/`)

### 1. AuthScreen
- Email/password sign-in and sign-up
- Supabase authentication

### 2. OnboardingScreen
- Welcome + choose codename
- Select Handler personality
- Set life goals

### 3. MainScreen (Bottom Navigation)
- Dashboard Tab
- Missions Tab
- Social Tab
- Profile Tab

### 4. DashboardScreen
- Stats overview (stars, level, streak)
- Quick mission creation
- Friends list
- Active missions

### 5. MissionsScreen
- Mission list with filters
- Create new mission button
- Mission cards with status

### 6. MissionDetailScreen
- View mission details
- Upload before/after photos
- AI verification trigger
- View feedback and stars

### 7. CreateMissionScreen
- Form: title, description, deadline, type
- Recurrence settings
- Friend assignment (if applicable)

### 8. HandlerChatScreen
- Chat interface with selected Handler
- AI-powered responses
- Mission suggestions

### 9. SocialScreen
- Friends list
- Friend requests
- Leaderboard (global/friends)
- Messages

### 10. ProfileScreen
- User stats
- Achievements gallery
- Settings (change Handler, edit profile)

### 11. HandlerSelectionScreen
- Grid of 16 Handlers with descriptions
- Preview Handler personality

### 12. NotificationsScreen
- View all notifications
- Mark as read

### 13. BugReportScreen
- Submit bug reports

## Widgets (`lib/widgets/`)
- `mission_card.dart` - Mission display card
- `stat_card.dart` - Dashboard stat widget

## Dependencies
- `supabase_flutter` - Supabase SDK
- `shared_preferences` - Local storage
- `image_picker` - Photo capture
- `file_picker` - File selection (cross-platform)
- `http` - Gemini API calls
- `provider` - State management
- `go_router` - Navigation
- `google_fonts` - Typography
- `intl` - Date formatting
- `uuid` - UUID generation

## Key Technical Decisions
- **Supabase Backend**: All user data stored in Supabase PostgreSQL
- **Handlers In-Memory**: Static handler data kept in-memory (no DB needed)
- **Gemini AI**: Google Gemini for AI verification and chat
- **Provider Pattern**: State management via AppProvider
- **Cyberpunk UI**: Dark navy + neon green theme with generous spacing

## Supabase Storage Buckets
- `avatars` - User profile pictures (path: `users/{userId}/avatar.jpg`)
- `missions` - Mission photos (path: `missions/{missionId}/before-{timestamp}.jpg`)
