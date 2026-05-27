import React from 'react';
import chatbotIcon from '../../assets/chatbot-icon.png'; // Ensure you have a chatbot icon in this path

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14
        bg-gradient-to-r from-green-500 to-blue-500
        rounded-full
        shadow-lg
        flex items-center justify-center
        hover:scale-110
        transition-all duration-300 ease-in-out
        sm:w-14 sm:h-14
        max-sm:w-12 max-sm:h-12 max-sm:bottom-4 max-sm:right-4
        ${isOpen ? 'scale-110 shadow-xl' : 'hover:shadow-xl'}
      `}
      aria-label="Open AI Chat Assistant"
    >
      <img
        src={chatbotIcon}
        alt="Chatbot"
        className="w-13 h-13 object-contain animate-pulse"
      />
    </button>
  );
};

export default ChatButton;