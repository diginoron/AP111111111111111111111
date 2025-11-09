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
    // Initialize chat only once when the component mounts
    if (!chatInitialized.current) {
      try {
        initializeChat();
        chatInitialized.current = true;
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        // Display an error message to the user
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now().toString(),
            role: 'model',
            content: 'Error: Failed to initialize chat. Please check your API key.',
          },
        ]);
      }
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
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          role: 'model',
          content: 'An error occurred while fetching the response. Please try again.',
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
              <img src="https://picsum.photos/200/200" alt="Placeholder" className="mt-6 rounded-full w-24 h-24 object-cover"/>
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