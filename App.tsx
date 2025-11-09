import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeChat, sendMessageStream } from './services/geminiService';
import { ChatMessage } from './types';
import ChatMessageComponent from './components/ChatMessage';
import ChatInput from './components/ChatInput';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInitialized = useRef(false);

  useEffect(() => {
    // Client-side chat initialization is no longer necessary for direct API key handling.
    // The Gemini API calls are now securely proxied through a Vercel API Route.
    // The `initializeChat` function in `services/geminiService.ts` is now a no-op.
    if (!chatInitialized.current) {
      initializeChat(); // This call will now just log a message to console.
      chatInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string) => {
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      let fullModelResponse = '';
      let modelMessageId = '';

      for await (const chunk of sendMessageStream(text)) {
        if (!modelMessageId) {
          modelMessageId = Date.now().toString();
          setMessages((prevMessages) => [
            ...prevMessages,
            { id: modelMessageId, role: 'model', content: chunk },
          ]);
        } else {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === modelMessageId ? { ...msg, content: msg.content + chunk } : msg
            )
          );
        }
        fullModelResponse += chunk;
      }
    } catch (error) {
      console.error('Error in chat stream:', error);
      // Display a user-friendly error message indicating a server-side issue
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          role: 'model',
          content: `An error occurred while communicating with the AI. ${error instanceof Error ? error.message : String(error)}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom(); // Ensure scroll to bottom after loading is done
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-blue-600 text-white p-4 shadow-md z-10">
        <h1 className="text-xl font-bold text-center">Gemini Chat App</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        <div className="w-full max-w-3xl flex flex-col">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center py-10">
              <p className="text-lg mb-2">Welcome to Gemini Chat!</p>
              <p className="text-sm">Type a message below to start a conversation.</p>
              {/* Using a static placeholder image for now, consider a better icon or a small animation */}
              <img src="https://picsum.photos/seed/gemini/200/200" alt="Chat Bot" className="mt-6 rounded-full w-24 h-24 object-cover"/>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="sticky bottom-0 w-full z-10">
        <ChatInput isLoading={isLoading} onSendMessage={handleSendMessage} />
      </footer>
    </div>
  );
};

export default App;
