import React from 'react';
import { ChatMessage as MessageType } from '../types';

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const messageClasses = isUser
    ? 'bg-blue-500 text-white self-end rounded-br-none'
    : 'bg-gray-200 text-gray-800 self-start rounded-bl-none';

  return (
    <div className={`flex flex-col max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow-md mb-2 ${messageClasses}`}>
      <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
    </div>
  );
};

export default ChatMessage;