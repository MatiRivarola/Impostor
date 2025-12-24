import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSecretWord = async (themeContext: string): Promise<string> => {
  try {
    const ai = getClient();
    
    // We request a specific schema to ensure we get a clean single word
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un experto en cultura popular de Córdoba, Argentina. 
      Genera una única palabra secreta (sustantivo o nombre propio) para un juego de adivinanzas.
      La temática es: ${themeContext}.
      La palabra debe ser muy reconocible para alguien que vive en Córdoba.
      Evita explicaciones, solo devuelve la palabra.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: {
              type: Type.STRING,
              description: "La palabra secreta generada",
            },
          },
        },
      },
    });

    const json = JSON.parse(response.text || '{}');
    if (json.word) {
      return json.word;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error generating word:", error);
    // Fallback if API fails to prevent game crash
    const fallbacks = ["Fernet con Coca", "Choripán", "La Cañada", "La Mona Jiménez", "Sargento Cabral"];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};