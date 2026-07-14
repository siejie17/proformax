import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
});

export const sendMessageToGemini = async (message) => {
    // List of models to try in sequence if a 503 occurs
    const modelQueue = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];

    for (const modelName of modelQueue) {
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: message,
            });

            return response.text; // Success! Return the response
        } catch (error) {
            // Check if the error is a server-side 503 Overloaded error
            const is503Error = error?.status === "UNAVAILABLE" || 
                               error?.toString().includes("503") || 
                               error?.toString().includes("high demand");

            if (is503Error && modelName !== modelQueue[modelQueue.length - 1]) {
                console.warn(`Model ${modelName} overloaded (503). Falling back to next model...`);
                continue; // Skip to the next model in the array
            }

            // If it's a different error or we ran out of models, throw it
            console.error(`Gemini API Error on ${modelName}:`, error);
            throw error;
        }
    }
};
