import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MissionResult, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- AGENT 1: THE DETECTIVE (Anti-Cheat & Facts) ---
const detectiveSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isCleaningTask: { type: Type.BOOLEAN, description: "True if the user is supposed to clean or remove something." },
    targetIdentified: { type: Type.STRING, description: "The specific object/mess to be removed (e.g. 'bottles', 'laundry')." },
    locationMatch: { type: Type.BOOLEAN, description: "True if Before/After images are the same physical room." },
    targetRemoved: { type: Type.BOOLEAN, description: "True if the target object is GONE from the After image." },
    suspiciousActivity: { type: Type.STRING, description: "Any signs of cheating (e.g. different lighting, cropped photo). Null if clean." }
  },
  required: ["isCleaningTask", "targetIdentified", "locationMatch", "targetRemoved"]
};

// --- AGENT 2: THE INSPECTOR (Quality Control) ---
const inspectorSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    cleanlinessScore: { type: Type.INTEGER, description: "0-100 score based on visual order and cleanliness." },
    remainingClutter: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific items or dust still visible." },
    effortRating: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "IMPRESSIVE"], description: "Visual assessment of effort." },
    visualDefects: { type: Type.STRING, description: "Description of any imperfections (wrinkles, stains, bad framing)." }
  },
  required: ["cleanlinessScore", "remainingClutter", "effortRating", "visualDefects"]
};

// --- AGENT 3: THE HANDLER (Synthesis) ---
const missionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    missionComplete: {
      type: Type.BOOLEAN,
      description: "TRUE only if the After Image is clean AND matches the Before Image location.",
    },
    starsAwarded: {
      type: Type.INTEGER,
      description: "Stars based on task completion: 3 stars = 95-100% (perfect), 2 stars = 85-94% (good effort), 1 star = 75-84% (minimal pass), 0 stars = under 75% (FAIL).",
    },
    debrief: {
      type: Type.STRING,
      description: "Tactical summary of the mission outcome. STRICTLY ADHERE to the Persona requested.",
    },
    tacticalAdvice: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of specific discrepancies or tasks remaining.",
    },
  },
  required: ["missionComplete", "starsAwarded", "debrief", "tacticalAdvice"],
};

export const verifyIntel = async (
  missionDescription: string,
  startImageBase64: string,
  endImageBase64: string,
  handlerPrompt: string,
  userLifeGoal: string
): Promise<MissionResult> => {

  const isStartImageURL = startImageBase64.startsWith('http');
  const cleanEnd = endImageBase64.split(',')[1] || endImageBase64;
  const cleanStart = !isStartImageURL ? (startImageBase64.split(',')[1] || startImageBase64) : null;

  // --- STEP 1: THE DETECTIVE AGENT ---
  console.log("🕵️ Detective Agent analyzing...");
  const detectiveParts: any[] = [
    {
      text: `ROLE: You are 'The Detective'. Your ONLY job is to verify facts and catch cheaters. You have no personality.
      
      MISSION: "${missionDescription}"
      
      INSTRUCTIONS:
      1. Identify the "Target" of the mission (what needs to be done/removed).
      2. Compare the BEFORE and AFTER images (if Before exists).
      3. Check if they are the same room (Location Match).
      4. Check if the Target object is GONE. Be extremely strict. If it's still there, targetRemoved = false.
      `
    },
    { inlineData: { mimeType: 'image/jpeg', data: cleanEnd } }
  ];
  if (cleanStart) detectiveParts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanStart } });

  const detectiveResult = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: { parts: detectiveParts },
    config: { responseMimeType: "application/json", responseSchema: detectiveSchema, temperature: 0.2 }
  });
  const detectiveData = JSON.parse(detectiveResult.text || "{}");
  console.log("🕵️ Detective Report:", detectiveData);


  // --- STEP 2: THE INSPECTOR AGENT ---
  console.log("🧐 Inspector Agent analyzing...");
  const inspectorParts: any[] = [
    {
      text: `ROLE: You are 'The Inspector'. Your ONLY job is to grade the visual quality of the AFTER image.
      
      MISSION: "${missionDescription}"
      
      INSTRUCTIONS:
      1. Ignore the "story". Look at the image.
      2. Rate the Cleanliness/Order (0-100).
      3. List any visible clutter, dust, or mess.
      4. Rate the Effort visible.
      `
    },
    { inlineData: { mimeType: 'image/jpeg', data: cleanEnd } }
  ];

  const inspectorResult = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: { parts: inspectorParts },
    config: { responseMimeType: "application/json", responseSchema: inspectorSchema, temperature: 0.2 }
  });
  const inspectorData = JSON.parse(inspectorResult.text || "{}");
  console.log("🧐 Inspector Report:", inspectorData);


  // --- STEP 3: THE HANDLER AGENT ---
  console.log("🗣️ Handler Agent synthesizing...");

  // Construct the "Truth" for the handler
  const truthData = `
    DETECTIVE REPORT (FACTS):
    - Task Type: ${detectiveData.isCleaningTask ? "Cleaning/Removal" : "Action/Creative"}
    - Target: ${detectiveData.targetIdentified}
    - Location Match: ${detectiveData.locationMatch} (If false, FAIL immediately)
    - Target Removed: ${detectiveData.targetRemoved} (If false, FAIL immediately)
    - Suspicious: ${detectiveData.suspiciousActivity}

    INSPECTOR REPORT (QUALITY):
    - Score: ${inspectorData.cleanlinessScore}/100
    - Effort: ${inspectorData.effortRating}
    - Clutter Left: ${inspectorData.remainingClutter.join(", ")}
    - Defects: ${inspectorData.visualDefects}
  `;

  const handlerParts: any[] = [
    {
      text: `ROLE: You are the user's Task Handler.
      
      PERSONALITY PROTOCOL: ${handlerPrompt}
      USER GOAL: "${userLifeGoal}"
      MISSION: "${missionDescription}"

      INPUT DATA (THE TRUTH):
      ${truthData}

      INSTRUCTIONS:
      1. Review the "Truth" data above.
      2. DECIDE THE OUTCOME:
         - FAIL (0 Stars) if: Location mismatch, Target NOT removed, or Score < 75.
         - 1 Star: Target removed but low score (75-84) or Low Effort.
         - 2 Stars: Target removed, Good score (85-94).
         - 3 Stars: Target removed, Perfect score (95+), High Effort.
      3. Generate the "debrief" based on your Persona.
         - If they failed (especially if Detective said Target NOT removed), roast them.
         - If they passed, praise them accordingly.
      `
    }
  ];

  const handlerResult = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: { parts: handlerParts },
    config: { responseMimeType: "application/json", responseSchema: missionSchema, temperature: 0.7 }
  });

  if (handlerResult.text) {
    try {
      return JSON.parse(handlerResult.text) as MissionResult;
    } catch (e) {
      console.error("Failed to parse Intel", e);
      throw new Error("Intel corrupted. Transmission failed.");
    }
  }

  throw new Error("Handler silent. No response.");
};

// Schema for Chat Suggestions
const chatSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    response: {
      type: Type.STRING,
      description: "The conversational response to the user.",
    },
    suggestedMissions: {
      type: Type.ARRAY,
      nullable: true,
      description: "A list of up to 3 specific missions if the user has provided enough info. Null if still interviewing.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          briefing: { type: Type.STRING }
        }
      }
    }
  },
  required: ["response"]
};

export const consultTacticalComputer = async (
  history: ChatMessage[],
  handlerPrompt: string,
  userLifeGoal: string
): Promise<{ response: string, suggestedMissions?: { title: string, briefing: string }[] }> => {

  // Convert history objects to a transcript string
  const transcript = history.map(msg =>
    `${msg.sender === 'USER' ? 'OPERATIVE' : 'HANDLER'}: ${msg.text}`
  ).join('\n');

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [{
        text: `ROLE: You are the user's Task Handler.
      
      PERSONALITY PROTOCOL: ${handlerPrompt}

      USER PROFILE (MOTIVATION): The user's long term goal is: "${userLifeGoal}".
      
      OBJECTIVE: Help the Operative (user) define clear, actionable missions/tasks to improve their life/environment.
      
      INSTRUCTIONS:
      1. Analyze the CONVERSATION LOG below to understand context.
      2. The goal is to get the user to set up a specific task.
      3. If the Operative's goal is vague (e.g. "clean room"), ask 1-2 clarifying questions (Interview Mode) to define the scope or standards.
      4. **CRITICAL**: Maintain your strong Persona (voice/tone) at all times, BUT your primary function is UTILITY. Do not be obstructionist. Use your persona to *motivate* or *command* the user to define the task, rather than just roleplaying.
      5. Align your advice with the user's "Life Goal" specified above.
      6. Once you have enough information (or if the user explicitly asks), generate exactly 3 distinct 'suggestedMissions' in the JSON output.
      
      CONVERSATION LOG:
      ${transcript}
      ` }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: chatSchema,
    }
  });

  if (result.text) {
    try {
      return JSON.parse(result.text);
    } catch (e) {
      console.error("Failed to parse chat response", e);
      return { response: "Encryption error. Packet malformed." };
    }
  }
  return { response: "Comm link unstable." };
};