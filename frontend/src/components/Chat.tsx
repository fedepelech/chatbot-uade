import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import Message from './Message';
import ChatInput from './ChatInput';
import { ChatMessage } from '../types/chat.types';
import { sendMessage } from '../services/chatService';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    // Crear mensaje del usuario
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    // Agregar mensaje del usuario al estado
    setMessages((prev) => [...prev, userMessage]);

    // Mostrar indicador de "escribiendo..."
    setIsTyping(true);

    try {
      // Llamar al service para obtener respuesta del bot
      const botResponse = await sendMessage(text);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);

      // Mensaje de error para el usuario
      const errorMessage: ChatMessage = {
        id: `bot-error-${Date.now()}`,
        text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-avatar">🤖</div>
        <h1 className="chat-title">UadeBot</h1>
      </div>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="chat-placeholder">
            ¡Hola! Soy UadeBot, tu asistente virtual. ¿En qué puedo ayudarte?
          </p>
        ) : (
          messages.map((message) => <Message key={message.id} message={message} />)
        )}
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-avatar">🤖</div>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default Chat;
