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
      description: "1 for effort, 2 for good, 3 for perfect execution. 0 if failed.",
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
  
  const cleanStart = startImageBase64.split(',')[1] || startImageBase64;
  const cleanEnd = endImageBase64.split(',')[1] || endImageBase64;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: [
        { text: `ROLE: You are the user's Task Handler. 
        
        PERSONALITY PROTOCOL (CRITICAL): ${handlerPrompt}
        
        USER PROFILE (MOTIVATION): The user is trying to improve their life in this way: "${userLifeGoal}". Use this context to motivate, shame, or praise them according to your persona.
        
        MISSION CONTEXT: The Operative (user) has a mission: "${missionDescription}".
        
        INPUTS:
        1. BEFORE IMAGE (Start): The initial messy state or environment.
        2. AFTER IMAGE (End): The submitted evidence of completion.

        PROTOCOL:
        1. **ANTI-CHEAT / LOCATION CHECK**: Compare the background, furniture, and layout of the BEFORE and AFTER images. 
           - If they are NOT the same physical location, FAIL the mission immediately. 
           - Accuse the user of trying to cheat with a fake photo.
        
        2. **COMPLETION CHECK**: Analyze the AFTER image. 
           - Does it look clean, organized, and finished based on the mission description?
           - Compare it to the BEFORE image to ensure actual work was done (mess removed, bed made, etc.).
           - If the AFTER image is still messy or doesn't match the goal, fail the mission.

        3. **OUTPUT**: Your "debrief" must embody the personality described above completely.` },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanStart
          }
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanEnd
          }
        }
      ]
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
      parts: [{ text: `ROLE: You are the user's Task Handler.
      
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