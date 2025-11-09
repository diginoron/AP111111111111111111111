// No direct @google/genai import on the client side anymore as API calls are proxied.

/**
 * Client-side chat initialization is no longer necessary as API key handling
 * and Gemini API calls are now securely managed by a Vercel API Route.
 * This function is now a no-op, but kept for compatibility if other parts
 * of the application still call it.
 */
export const initializeChat = () => {
  console.log("Client-side chat initialization skipped. Using serverless API route for Gemini interactions.");
};

/**
 * Sends a message to the Gemini model via a Vercel API Route and streams the response.
 * The client makes a fetch request to the local `/api/chat` endpoint, which
 * then handles the secure communication with the Gemini API.
 * @param message The user's message to send.
 * @returns An async iterator yielding chunks of the model's response.
 */
export async function* sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
  try {
    const response = await fetch('/api/chat', { // Call the Vercel API Route
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    // If the API Route returns an error status, parse the error message.
    if (!response.ok) {
      let errorMessage = `Server responded with status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If the response is not JSON, get the raw text.
        errorMessage = await response.text() || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Ensure there is a readable body for streaming
    if (!response.body) {
      throw new Error('Response body is null, no stream received from server.');
    }

    // Read the streamed response from the API Route
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        // Decode the Uint8Array to a string and yield it
        yield decoder.decode(value, { stream: true });
      }
    }
  } catch (error) {
    console.error("Error communicating with the Vercel API Route:", error);
    // Re-throw the error so App.tsx can catch and display it to the user.
    throw new Error(`Failed to communicate with the chat server: ${error instanceof Error ? error.message : String(error)}`);
  }
}
