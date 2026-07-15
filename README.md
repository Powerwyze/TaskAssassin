# Questime

Questime turns time into quests with AI verification, personalized Handler coaching, and social accountability.

This repository is pivoting from the TaskAssassin prototype. The Flutter package name is still `taskassassin` for now to avoid a risky mechanical import rewrite during the product pivot.

## What Changed In The Pivot

- Product-facing app name is Questime.
- Android and web metadata now use Questime branding.
- The Flutter app no longer packages `.env` as an asset.
- Gemini calls are routed through the Supabase `gemini-chat` Edge Function.
- Gemini API keys belong in Supabase Edge Function secrets, never in the Flutter client.

## Required Secrets

Configure these in Supabase Edge Function secrets:

```text
GEMINI_API_KEY=
ALLOWED_ORIGIN=*
MAX_REQUEST_BYTES=12000
MAX_IMAGE_BYTES=5242880
```

`ALLOWED_IMAGE_HOSTS` is optional and defaults to the Supabase project host.

## Local Checks

```sh
flutter pub get
flutter analyze
flutter test
flutter build web --release
```

The same checks run in GitHub Actions through `.github/workflows/flutter-ci.yml`.

## Security Notes

Revoke any Gemini key that was previously committed to repository history. Before production, add Supabase migrations for RLS and Storage policies so the backend security model is versioned with the app.
