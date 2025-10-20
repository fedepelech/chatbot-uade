import React from 'react';
import ReactMarkdown from 'react-markdown';
import './Message.css';
import { ChatMessage } from '../types/chat.types';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { text, sender, timestamp } = message;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`message message-${sender}`}>
      {sender === 'bot' && <div className="message-avatar">🤖</div>}
      <div className="message-content">
        <div className="message-bubble">
          {sender === 'bot' ? (
            <div className="message-text markdown-content">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          ) : (
            <p className="message-text">{text}</p>
          )}
        </div>
        <span className="message-timestamp">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
};

export default Message;
