import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MissionResult, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  const parts: any[] = [
    {
      text: `ROLE: You are the user's Task Handler. 
    
    PERSONALITY PROTOCOL (CRITICAL): ${handlerPrompt}
    
    USER PROFILE (MOTIVATION): The user is trying to improve their life in this way: "${userLifeGoal}". Use this context to motivate, shame, or praise them according to your persona.
    
    MISSION CONTEXT: The Operative (user) has a mission: "${missionDescription}".
    
    INPUTS:
    ${isStartImageURL ? '1. BEFORE IMAGE: Not available (Assigned Task). Evaluate based on description only.' : '1. BEFORE IMAGE (Start): The initial messy state or environment.'}
    2. AFTER IMAGE (End): The submitted evidence of completion.

    PROTOCOL:
    1. **MISSION ANALYSIS**: 
       - Identify the "Target" of the mission from the description: "${missionDescription}". (e.g. "Remove bottles", "Clean desk").
       - Determine the Task Type: CLEANING or CREATIVE/ACTION.

    2. **VISUAL COMPARISON (CRITICAL)**:
       - **Locate the Target**: Find the specific mess/object in the BEFORE image (if available).
       - **Verify Removal**: Look for that *exact same object* in the AFTER image.
       - **FAIL CONDITION**: If the target object (e.g., the bottles, the trash, the laundry) is STILL VISIBLE in the AFTER image (even if moved slightly), the mission is a **FAIL (0 Stars)**. Do not be fooled by lighting changes.

    3. **ANTI-CHEAT / RELEVANCE CHECK**: 
       - **Cleaning**: ${isStartImageURL ? 'Skip location check.' : 'Compare background/layout. Must match.'}
       - **Action/Creative**: Ensure the image provides *proof* of the specific task described. If irrelevant, FAIL.

    4. **STRICT COMPLETION ANALYSIS**: Analyze the AFTER image with EXTREME SCRUTINY.
       - **For CLEANING**: Look for dust, clutter, or "hidden" messes. Zero tolerance.
       - **For ACTION/CREATIVE**: Assess the *quality* and *effort* visible. 
         - Did they just take a picture of a blank page? (FAIL)
         - Is the work finished? 
         - Does it look like they put in genuine effort?
       
    5. **SCORING (STRICT)**: Estimate completion percentage (0-100%) conservatively.
       - 95-100%: **PERFECT**. Target is GONE. Area is spotless. (3 Stars)
       - 85-94%: **GOOD**. Target is gone, but minor other clutter remains. (2 Stars)
       - 75-84%: **PASSABLE**. Bare minimum. (1 Star)
       - Under 75%: **FAIL**. Target still present or work incomplete. (0 Stars, missionComplete = false).

    6. **OUTPUT**: Your "debrief" must embody the personality described above completely. If they failed (especially if the target is still there), roast them mercilessly (if persona allows).` },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanEnd
      }
    }
  ];

  if (!isStartImageURL) {
    const cleanStart = startImageBase64.split(',')[1] || startImageBase64;
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanStart
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: parts
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: missionSchema,
      temperature: 0.7,
    }
  });

  if (response.text) {
    try {
      return JSON.parse(response.text) as MissionResult;
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