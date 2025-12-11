import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:http/http.dart' as http;
import 'package:taskassassin/models/handler.dart';

class AIService {
  // TODO: Add your Gemini API key here - Get it from https://aistudio.google.com/app/apikey
  // The previous API key was reported as leaked and has been removed for security
  static const String _apiKey = 'AIzaSyC_OOtm57etsJjf3H26BML3vvdMhzqSHtc';
  
  late final GenerativeModel _model;
  late final GenerativeModel _visionModel;
  
  static const List<String> _modelFallbacks = [
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest', 
    'gemini-pro',
    'gemini-1.0-pro',
  ];
  
  static const List<String> _visionModelFallbacks = [
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro-vision',
    'gemini-1.0-pro-vision',
  ];
  
  AIService() {
    _model = GenerativeModel(
      model: _modelFallbacks.first,
      apiKey: _apiKey,
    );
    _visionModel = GenerativeModel(
      model: _visionModelFallbacks.first,
      apiKey: _apiKey,
    );
  }
  
  Future<GenerateContentResponse> _generateWithFallback(
    GenerativeModel primaryModel,
    List<Content> content,
    List<String> fallbacks,
  ) async {
    for (int i = 0; i < fallbacks.length; i++) {
      try {
        final model = i == 0 
          ? primaryModel 
          : GenerativeModel(model: fallbacks[i], apiKey: _apiKey);
        return await model.generateContent(content);
      } catch (e) {
        debugPrint('[AIService] Model ${fallbacks[i]} failed: $e');
        if (i == fallbacks.length - 1) rethrow;
      }
    }
    throw Exception('All models failed');
  }

  Future<Map<String, dynamic>> verifyMission({
    required String missionTitle,
    required String missionDescription,
    required String completedState,
    required Handler handler,
    String? beforePhotoUrl,
    String? afterPhotoUrl,
    String? beforePhotoDescription,
    String? afterPhotoDescription,
  }) async {
    try {
      // Fetch images first to include them in the analysis
      Uint8List? beforeBytes;
      Uint8List? afterBytes;
      
      if (beforePhotoUrl != null) {
        beforeBytes = await _fetchImageBytes(beforePhotoUrl);
        debugPrint('[AIService] Fetched BEFORE image: ${beforeBytes?.length ?? 0} bytes');
      }
      
      if (afterPhotoUrl != null) {
        afterBytes = await _fetchImageBytes(afterPhotoUrl);
        debugPrint('[AIService] Fetched AFTER image: ${afterBytes?.length ?? 0} bytes');
      }
      
      final hasBeforeImage = beforeBytes != null && beforeBytes.isNotEmpty;
      final hasAfterImage = afterBytes != null && afterBytes.isNotEmpty;

      // Strict rule: require an AFTER image to verify completion
      if (!hasAfterImage) {
        debugPrint('[AIService] Strict verify: missing AFTER image -> cannot verify');
        return {
          'stars': 1,
          'feedback': 'I can\'t verify completion without an AFTER photo that clearly shows the result. Please upload an after photo matching the “done” criteria.'
        };
      }
      
      final prompt = '''
You are ${handler.name}, a ${handler.personalityStyle} mission handler.
Your job is to VISUALLY ANALYZE the photos provided and strictly verify if the user has completed their mission.

=== MISSION DETAILS ===
Title: $missionTitle
Description: $missionDescription
What "done" looks like: $completedState

=== IMAGES PROVIDED ===
${hasBeforeImage ? '- IMAGE 1: BEFORE photo (starting state)' : '- No before photo provided'}
${hasAfterImage ? '- IMAGE ${hasBeforeImage ? '2' : '1'}: AFTER photo (completion state)' : '- No after photo provided'}

=== STRICT VERIFICATION RULES ===
- If AFTER photo does not clearly show the required result, rate 1–2 stars and explain what is missing
- Be conservative: require visible evidence matching the "done" criteria
- If images are low-quality/unclear, ask for a clearer AFTER photo
- If BEFORE is missing, you may still verify, but require strong visual evidence in AFTER

=== YOUR TASK ===
1) Compare BEFORE vs AFTER (if both exist)
2) Decide if AFTER matches the acceptance criteria ("done")
3) Rate 1–5 stars; 5 only for clear, complete evidence

Respond ONLY with this JSON (no extra text):
{"stars": <1-5>, "feedback": "<2-3 sentences as ${handler.name} referencing SPECIFIC visual evidence>"}
''';

      List<Part> parts = [TextPart(prompt)];
      
      // Add images in order: before first, then after
      if (hasBeforeImage) {
        parts.add(DataPart('image/jpeg', beforeBytes));
      }
      
      if (hasAfterImage) {
        parts.add(DataPart('image/jpeg', afterBytes));
      }

      debugPrint('[AIService] Verifying mission with ${parts.length - 1} images');
      
      final response = await _generateWithFallback(
        _visionModel,
        [Content.multi(parts)],
        _visionModelFallbacks,
      );
      final text = response.text ?? '';
      
      debugPrint('[AIService] Verify mission response: $text');
      
      // Parse JSON from response
      final jsonMatch = RegExp(r'\{[\s\S]*?\}').firstMatch(text);
      if (jsonMatch != null) {
        final parsed = jsonDecode(jsonMatch.group(0)!) as Map<String, dynamic>;
        return {
          'stars': parsed['stars'] ?? 3,
          'feedback': parsed['feedback'] ?? 'Great job completing this mission!',
        };
      }
      
      return {'stars': 3, 'feedback': text.isNotEmpty ? text : 'Great job completing this mission!'};
    } catch (e) {
      debugPrint('[AIService] Verify mission error: $e');
      return _mockVerificationResponse();
    }
  }

  Future<String> getHandlerResponse({
    required Handler handler,
    required List<Map<String, String>> conversationHistory,
    required String userMessage,
    String? userProfileContext,
  }) async {
    try {
      final userProfileSection = userProfileContext != null && userProfileContext.isNotEmpty
          ? '''

=== USER PROFILE CONTEXT ===
$userProfileContext
Use this information to personalize your guidance and tailor mission suggestions to the user's background and goals.
'''
          : '';

      final systemPrompt = '''
You are ${handler.name}, ${handler.description}
Your personality: ${handler.personalityStyle}
Your greeting style: "${handler.greetingMessage}"$userProfileSection

=== YOUR ROLE ===
You are a mission handler who helps users achieve their goals through actionable missions.
Stay in character at all times. Be helpful, motivating, and match your personality.

=== CONVERSATION FLOW ===
1. FIRST EXCHANGE: Ask what they want to work on or improve (one question)
2. SECOND EXCHANGE: Ask ONE brief clarifying question to understand their specific challenge/constraints
3. THIRD EXCHANGE: Suggest 3 missions that directly address their needs (no more questions)
Never exceed 2 total questions before proposing missions. If you already asked a clarifier earlier, skip straight to missions.

=== WHEN TO SUGGEST MISSIONS ===
Only suggest missions after you:
1. Know what they want to work on (from their first response)
2. Understand their specific challenge/constraint (from 1-2 follow-up questions)
3. Have NOT just suggested missions (unless they explicitly ask for more)

=== HOW TO SUGGEST MISSIONS ===
Format your response as:
- Brief acknowledgment (1 short sentence)
- The missions as a JSON object

Use this EXACT format:
{"missions": [
  {"title": "Easy: [task name]", "description": "[1-2 sentences addressing their challenge]", "done": "[clear completion criteria]"},
  {"title": "Moderate: [task name]", "description": "[1-2 sentences]", "done": "[clear criteria]"},
  {"title": "Ambitious: [task name]", "description": "[1-2 sentences]", "done": "[clear criteria]"}
]}

IMPORTANT: Put ONLY the JSON on its own lines. Do NOT wrap it in code fences (no ``` markers).

=== SAFETY ===
- No medical, legal, or financial advice
- No risky or illegal activities
- Tasks should be completable within 1-2 days

=== STYLE ===
- Keep responses short (<= 2 sentences)
- One question max per turn; never stack multiple questions
- Be direct and friendly
''';

      // Build conversation context (limit to last 12 messages for context)
      final recentHistory = conversationHistory.length > 12 
        ? conversationHistory.sublist(conversationHistory.length - 12)
        : conversationHistory;
      
      final historyContext = recentHistory.map((msg) {
        final role = msg['role'] == 'user' ? 'User' : handler.name;
        return '$role: ${msg['content']}';
      }).join('\n');

      // Simplified gating: count user messages and check if missions were recently suggested
      final userMessageCount = conversationHistory.where((m) => m['role'] == 'user').length;
      final recentlySuggested = recentHistory.any((m) => m['role'] != 'user' && (m['content']?.contains('"missions"') ?? false));
      final userAskedForMore = RegExp(r"\b(more|other|different|another)\s+(mission|idea|option|suggestion)").hasMatch((userMessage).toLowerCase());

      // Force suggestions after 2 user messages unless missions were just provided and the user didn't ask for more
      final mustSuggest = userMessageCount >= 2 && (!recentlySuggested || userAskedForMore);

      debugPrint('[AIService] userMessageCount=$userMessageCount, recentlySuggested=$recentlySuggested, mustSuggest=$mustSuggest');
      
      final fullPrompt = '''
$systemPrompt

=== CONVERSATION HISTORY ===
$historyContext

=== CURRENT MESSAGE ===
User: $userMessage

=== CONVERSATION STAGE ===
User message count: $userMessageCount
${mustSuggest
          ? 'You MUST now suggest 3 missions. No more questions. Use the exact JSON format specified above (no code fences). Keep the preamble to one short sentence.'
          : 'Do NOT suggest missions yet. Ask ONLY ONE short clarifying question (<=15 words). Do not chain or stack multiple questions.'}

=== YOUR RESPONSE ===
Respond as ${handler.name}:
''';

      final response = await _generateWithFallback(
        _model,
        [Content.text(fullPrompt)],
        _modelFallbacks,
      );
      final text = response.text ?? '';
      
      debugPrint('[AIService] Handler response: $text');
      
      return text.isNotEmpty ? text : 'I am here to help!';
    } catch (e) {
      debugPrint('[AIService] Get handler response error: $e');
      return 'I am here to help! (AI temporarily unavailable)';
    }
  }

  Future<String> chatWithHandler({
    required Handler handler,
    required List<Map<String, String>> conversationHistory,
    required String userMessage,
    String? userProfileContext,
  }) => getHandlerResponse(
    handler: handler,
    conversationHistory: conversationHistory,
    userMessage: userMessage,
    userProfileContext: userProfileContext,
  );

  Future<List<String>> generateMissionSuggestions({
    required String userGoals,
    required Handler handler,
    int count = 3,
  }) async {
    try {
      final prompt = '''
You are ${handler.name}, a ${handler.personalityStyle} mission handler.

User's goals: $userGoals

Generate exactly $count mission suggestions that would help the user achieve their goals.
Each mission should be specific, actionable, and achievable within a day.

Respond with a JSON array of mission titles only:
["Mission 1", "Mission 2", "Mission 3"]
''';

      final response = await _generateWithFallback(
        _model,
        [Content.text(prompt)],
        _modelFallbacks,
      );
      final text = response.text ?? '';
      
      debugPrint('[AIService] Mission suggestions response: $text');
      
      // Parse JSON array from response
      final jsonMatch = RegExp(r'\[[\s\S]*\]').firstMatch(text);
      if (jsonMatch != null) {
        final parsed = jsonDecode(jsonMatch.group(0)!) as List;
        return parsed.map((e) => e.toString()).toList();
      }
      
      return ['Complete a daily task', 'Practice a new skill', 'Help someone today'];
    } catch (e) {
      debugPrint('[AIService] Generate mission suggestions error: $e');
      return ['Complete a daily task', 'Practice a new skill', 'Help someone today'];
    }
  }

  Future<Uint8List?> _fetchImageBytes(String url) async {
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        return response.bodyBytes;
      }
    } catch (e) {
      debugPrint('[AIService] Failed to fetch image: $e');
    }
    return null;
  }

  Map<String, dynamic> _mockVerificationResponse() {
    return {
      'stars': 3,
      'feedback': 'Great job completing this mission! (AI service temporarily unavailable)',
    };
  }
}
