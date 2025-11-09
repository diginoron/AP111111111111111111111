import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

let chatInstance: Chat | null = null;

/**
 * Initializes the Gemini chat session.
 * A new GoogleGenAI instance is created to ensure the latest API key from `process.env.API_KEY` is used.
 */
export const initializeChat = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is not set. Please set it as an environment variable.");
    throw new Error("Gemini API_KEY is missing.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  chatInstance = ai.chats.create({
    model: 'gemini-2.5-flash', // Using 'gemini-2.5-flash' for general text chat
    config: {
      temperature: 0.9,
      topK: 1,
      topP: 1,
    },
  });
};

/**
 * Sends a message to the Gemini model and streams the response.
 * @param message The user's message to send.
 * @returns An async iterator yielding chunks of the model's response.
 */
export async function* sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
  if (!chatInstance) {
    initializeChat(); // Re-initialize if chatInstance is somehow null (e.g., after an error)
  }

  try {
    const response = await chatInstance!.sendMessageStream({ message });
    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw new Error("Failed to get response from Gemini.");
  }
}