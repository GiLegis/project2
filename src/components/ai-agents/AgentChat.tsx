import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, ArrowLeft, Trash2, Settings, Wifi, WifiOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { sendToGemini, isGeminiConfigured, testGeminiConnection } from '../../services/geminiService';
import { 
  saveMessage, 
  loadAgentHistory, 
  clearAgentHistory, 
  getGeminiHistory,
  type ChatMessage 
} from '../../services/chatHistoryService';

interface AiAgent {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  isActive: boolean;
  triggerEvents: string[];
  createdAt: Date;
  lastUsed?: Date;
}

interface AgentChatProps {
  agent: AiAgent;
  onBack: () => void;
  onEditAgent: (agent: AiAgent) => void;
}

export const AgentChat: React.FC<AgentChatProps> = ({ agent, onBack, onEditAgent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar histórico e testar conexão ao montar o componente
  useEffect(() => {
    const loadHistory = () => {
      const history = loadAgentHistory(agent.id);
      setMessages(history);
    };

    const checkConnection = async () => {
      if (!isGeminiConfigured()) {
        setIsConnected(false);
        setConnectionTested(true);
        return;
      }

      try {
        const connected = await testGeminiConnection();
        setIsConnected(connected);
      } catch {
        setIsConnected(false);
      } finally {
        setConnectionTested(true);
      }
    };

    loadHistory();
    checkConnection();
  }, [agent.id]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Envia mensagem do usuário e processa resposta do agente
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Salvar mensagem do usuário
      saveMessage(agent.id, userMessage, 'user');
      
      // Atualizar estado local
      const newUserMessage: ChatMessage = {
        id: `${Date.now()}-user`,
        agentId: agent.id,
        content: userMessage,
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newUserMessage]);

      // Verificar se a API está configurada
      if (!isConnected) {
        const errorMessage = !isGeminiConfigured() 
          ? 'Desculpe, a API do Gemini não está configurada. Configure a variável VITE_GEMINI_API_KEY.'
          : 'Desculpe, não consigo me conectar com a API do Gemini no momento.';
        
        saveMessage(agent.id, errorMessage, 'agent');
        setMessages(prev => [...prev, {
          id: `${Date.now()}-agent`,
          agentId: agent.id,
          content: errorMessage,
          sender: 'agent',
          timestamp: new Date()
        }]);
        return;
      }

      // Obter histórico para contexto
      const conversationHistory = getGeminiHistory(agent.id);

      // Enviar para Gemini
      const response = await sendToGemini({
        message: userMessage,
        context: agent.description,
        personality: agent.systemPrompt,
        conversationHistory
      });

      // Salvar resposta do agente
      saveMessage(agent.id, response, 'agent');
      
      // Atualizar estado local
      const newAgentMessage: ChatMessage = {
        id: `${Date.now()}-agent`,
        agentId: agent.id,
        content: response,
        sender: 'agent',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newAgentMessage]);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage = 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.';
      saveMessage(agent.id, errorMessage, 'agent');
      
      setMessages(prev => [...prev, {
        id: `${Date.now()}-error`,
        agentId: agent.id,
        content: errorMessage,
        sender: 'agent',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Limpa o histórico de conversas
   */
  const handleClearHistory = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico desta conversa?')) {
      clearAgentHistory(agent.id);
      setMessages([]);
    }
  };

  /**
   * Manipula o envio por Enter
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header do Chat */}
      <Card className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                agent.isActive ? 'bg-primary-100 dark:bg-primary-900/20' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <Bot className={`w-5 h-5 ${
                  agent.isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                }`} />
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {agent.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {agent.model}
                  </span>
                  {connectionTested && (
                    <div className="flex items-center gap-1">
                      {isConnected ? (
                        <Wifi className="w-3 h-3 text-success-500" />
                      ) : (
                        <WifiOff className="w-3 h-3 text-danger-500" />
                      )}
                      <span className={`text-xs ${
                        isConnected ? 'text-success-500' : 'text-danger-500'
                      }`}>
                        {isConnected ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEditAgent(agent)}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearHistory}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Conversa com {agent.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              {agent.description}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Digite uma mensagem para começar a conversar
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-3 max-w-[80%] ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-primary-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    )}
                  </div>

                  {/* Mensagem */}
                  <div className={`px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' 
                        ? 'text-primary-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Indicador de digitação */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <Card className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Digite sua mensagem para ${agent.name}...`}
            disabled={isLoading}
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {!isConnected && connectionTested && (
          <p className="text-xs text-danger-500 mt-2">
            {!isGeminiConfigured() 
              ? 'Configure a API key do Gemini para usar o chat'
              : 'Sem conexão com a API do Gemini'
            }
          </p>
        )}
      </Card>
    </div>
  );
};