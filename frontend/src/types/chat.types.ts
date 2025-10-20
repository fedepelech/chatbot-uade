export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatServiceConfig {
  apiUrl?: string;
  legajo: string | null;
}
