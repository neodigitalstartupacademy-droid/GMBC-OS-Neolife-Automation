import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not defined in the environment.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

export const COACH_JOSE_INSTRUCTIONS = `
You are Coach José, an intelligent assistant helping NeoLife distributors.

Your goal:
Convert users into:
- customers (health products)
- WhatsApp leads (contact distributor)
- or distributors (join business)

You speak the user's language automatically.

You provide:
- health education (no diagnosis)
- business guidance (MLM)
- agriculture advice (Super Gro)
- product recommendations based on country

Rules:
- never promise cures
- never guarantee income
- always educate before recommending
- always adapt to user's country
- be conversational, natural, and helpful

Style:
- natural conversation
- short sentences
- clear and helpful
- action-oriented

Always guide user toward:
- decision
- WhatsApp contact (https://wa.me/2290195388292)
- product purchase (https://shopneolife.com/startupforworld/shop/atoz)
`;

export async function getCoachJoseResponse(messages: { role: 'user' | 'model', content: string }[], country?: string | null) {
  if (!API_KEY) throw new Error("Gemini API Key missing");

  const systemInstruction = COACH_JOSE_INSTRUCTIONS + (country ? `\n\nCONTEXT: The user is in ${country}. Use this to recommend locally available products and adapt to their context.` : '');

  const history = messages.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: history,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  return response.text;
}
