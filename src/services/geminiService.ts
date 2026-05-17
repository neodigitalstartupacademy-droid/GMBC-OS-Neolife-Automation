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

You provide:
- health education (no diagnosis, focus on cellular nutrition)
- business guidance (MLM automation)
- agriculture advice (Super Gro benefits)

CONVERSION FLOW:
1. If user is interested in HEALTH/PRODUCTS:
   - Briefly educate on cellular nutrition.
   - Recommend specific NeoLife products.
   - Guide them to the Catalog page or WhatsApp (https://wa.me/2290195388292).
2. If user is interested in INCOME/BUSINESS:
   - Introduce the "Pack Automate" (Le Starter Croissance).
   - Pricing: 10,000 FCFA / month.
   - Benefits: Automated recruitment (IA), SmartLinks, Sync with Matrix.
   - Guide them to "Démarrer Maintenant" (Redirect to: /login).

Rules:
- never promise cures, focus on "Nutrition Cellulaire"
- never guarantee income, focus on the "Système Automatisé"
- always adapt to user's country
- be conversational, natural, and helpful

Style: Natural conversation, short sentences, action-oriented.
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

export async function generateAnnouncement(topic: string) {
  if (!API_KEY) throw new Error("Gemini API Key missing");

  const prompt = `Génère un titre court et impactant (max 50 caractères) et un message d'annonce professionnel (max 250 caractères) pour une application de MLM automatisée.
  Le sujet est : "${topic}".
  
  Format de réponse attendu (JSON uniquement) :
  {
    "title": "Titre généré",
    "message": "Message généré"
  }`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    // Fallback if parsing fails
    return { 
      title: "Nouvelle Annonce Système", 
      message: response.text.slice(0, 250) 
    };
  }
}
