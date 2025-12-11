// Follows the Supabase Edge Function pattern for Gemini
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Direct REST API call to Gemini - more reliable than SDK for model compatibility
async function callGeminiAPI(apiKey: string, model: string, contents: any[]): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw { status: response.status, details: errorData }
  }
  
  return response.json()
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Parse request body
    const { action, ...payload } = await req.json()
    
    // 2. Get API Key securely from env
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set in Edge Function secrets')
    }

    // Model priority list - Gemini 2.0 Flash is currently the most reliable
    // gemini-2.0-flash-001 is stable, gemini-1.5-flash-latest as fallback
    const MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-001", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest"]

    // Helper to safely call generateContent with fallback models
    const generateWithFallback = async (contents: any[]) => {
      let lastError: any
      for (const model of MODELS) {
        try {
          console.log(`Trying model: ${model}`)
          const result = await callGeminiAPI(apiKey, model, contents)
          console.log(`Success with model: ${model}`)
          return result
        } catch (err: any) {
          lastError = err
          console.log(`Model ${model} failed:`, err?.details?.error?.message || err?.message || 'unknown error')
          // Continue to next model on 404/not found errors
          if (err?.status === 404 || err?.details?.error?.status === 'NOT_FOUND') {
            continue
          }
          // Also retry on 400 errors (might be model-specific)
          if (err?.status === 400) {
            continue
          }
          // For other errors, still try next model
          continue
        }
      }
      throw lastError
    }

    let resultData = {}

    // Helper to extract text from Gemini REST API response
    const extractText = (result: any): string => {
      return result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    // 4. Handle Actions
    if (action === 'verifyMission') {
        const { missionTitle, missionDescription, completedState, handler, beforePhotoUrl, afterPhotoUrl } = payload
        
        let prompt = `You are ${handler.name}, a task verification AI with this personality: ${handler.personalityStyle}\n\n`
        prompt += `Mission: "${missionTitle}"\n`
        prompt += `Description: ${missionDescription}\n`
        prompt += `Expected Completed State: ${completedState}\n\n`
        prompt += `Analyze the mission completion based on the images provided (if any) and the description.\n`
        prompt += `Provide:\n1. A star rating from 1-5 (where 5 is excellent, 1 is poor). Be strict but fair.\n`
        prompt += `2. Personalized feedback in ${handler.name}'s voice and style (max 4 short sentences).\n`
        prompt += `Format your response as a valid JSON object:\n{\n  "stars": <number 1-5>,\n  "feedback": "<your personalized feedback message>"\n}`

        const parts: any[] = [{ text: prompt }]

        // Helper to fetch image from URL and convert to inline data
        const addImage = async (url: string | null) => {
            if (!url) return
            try {
                const resp = await fetch(url)
                if (!resp.ok) {
                    console.error(`Failed to fetch image: ${url} - ${resp.statusText}`)
                    return
                }
                const arrayBuffer = await resp.arrayBuffer()
                const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
                parts.push({
                    inlineData: {
                        data: base64,
                        mimeType: "image/jpeg" 
                    }
                })
            } catch (e) {
                console.error("Error fetching image for AI analysis", e)
            }
        }

        await addImage(beforePhotoUrl)
        await addImage(afterPhotoUrl)

        const contents = [{ role: 'user', parts }]
        const result = await generateWithFallback(contents)
        const responseText = extractText(result)
        
        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            resultData = JSON.parse(jsonMatch[0])
        } else {
             resultData = { stars: 3, feedback: responseText.substring(0, 100) + "..." }
        }

    } else if (action === 'chatWithHandler') {
        const { handler, history, userMessage } = payload
        
        const systemPrompt = `You are ${handler.name}, ${handler.description}\nPersonality: ${handler.personalityStyle}\n\nRespond as ${handler.name} would, in character. Keep your response concise (2-3 sentences max) and helpful.`
        
        // Build contents array with history
        const contents: any[] = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: "Understood. I am ready to chat." }] }
        ]
        
        // Add chat history
        for (const msg of (history || [])) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          })
        }
        
        // Add current message
        contents.push({ role: 'user', parts: [{ text: userMessage }] })

        const result = await generateWithFallback(contents)
        resultData = { text: extractText(result) }

    } else if (action === 'generateMissionSuggestions') {
        const { userGoals, handler, count } = payload
        
        const prompt = `You are ${handler.name}, ${handler.description}\nUser's life goals: ${userGoals}\n\nSuggest ${count || 3} realistic, actionable missions to help the user achieve their goals.\nFormat: Return ONLY a JSON array of mission titles (strings), nothing else.\nExample: ["Mission 1", "Mission 2", "Mission 3"]`
        
        const contents = [{ role: 'user', parts: [{ text: prompt }] }]
        const result = await generateWithFallback(contents)
        const text = extractText(result)
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            resultData = { missions: JSON.parse(jsonMatch[0]) }
        } else {
            resultData = { missions: ['Complete a daily task', 'Practice a new skill', 'Help someone today'] }
        }
    } else {
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(resultData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("Edge Function Error:", error)
    const errorMessage = error?.details?.error?.message || error?.message || 'Unknown error'
    return new Response(JSON.stringify({ error: 'Gemini API error', details: error?.details || errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error?.status || 500,
    })
  }
})
