import { GoogleGenAI, Chat } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Ensure API_KEY is set in Vercel environment variables during deployment
if (!process.env.API_KEY) {
  console.error("API_KEY is not set. Please set it as an environment variable in Vercel.");
  // For Vercel Serverless Functions, a missing API_KEY will typically cause a deployment failure
  // or a runtime error that will be caught below.
}

// Initialize GoogleGenAI once per serverless function instance to optimize cold starts.
// This instance will be null if API_KEY is missing, leading to an error response.
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

// This is the Vercel Serverless Function entry point
export default async function (req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests for sending messages
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Check if Gemini API client was successfully initialized
  if (!ai) {
    console.error("Gemini API client not initialized due to missing API_KEY.");
    return res.status(500).json({ error: "Server error: Gemini API key is missing or invalid. Please check Vercel environment variables." });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  try {
    // Create a new chat session for each request for simplicity in a stateless serverless function.
    // For stateful conversations, you would need to pass and manage chat history.
    const chat: Chat = ai.chats.create({
      model: 'gemini-2.5-flash', // Using 'gemini-2.5-flash' as per guidelines
      config: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
      },
    });

    // Configure response headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache'); // Prevent caching of streamed content

    const responseStream = await chat.sendMessageStream({ message });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text); // Write each chunk of text directly to the HTTP response stream
      }
    }
    res.end(); // End the response stream when all chunks are sent

  } catch (error) {
    console.error("Error sending message to Gemini from API route:", error);
    // If headers have already been sent (i.e., streaming started), `res.status` cannot be set.
    // In that case, append an error message to the stream.
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to get response from Gemini API. Please try again later." });
    } else {
      res.end(`\nERROR: Failed to get response from Gemini API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
