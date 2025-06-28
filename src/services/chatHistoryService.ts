/**
 * Serviço para gerenciar histórico de conversas dos agentes de IA
 * Responsável por salvar, carregar e gerenciar mensagens no localStorage
 */

export interface ChatMessage {
  id: string;
  agentId: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export interface ChatHistory {
  agentId: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

const STORAGE_KEY = 'crm_agent_chat_history';

/**
 * Salva uma nova mensagem no histórico do agente
 * @param agentId - ID do agente
 * @param content - Conteúdo da mensagem
 * @param sender - Remetente da mensagem (user ou agent)
 */
export const saveMessage = (agentId: string, content: string, sender: 'user' | 'agent'): void => {
  try {
    const histories = loadAllHistories();
    
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      content,
      sender,
      timestamp: new Date()
    };

    // Encontrar ou criar histórico para o agente
    let agentHistory = histories.find(h => h.agentId === agentId);
    
    if (!agentHistory) {
      agentHistory = {
        agentId,
        messages: [],
        lastUpdated: new Date()
      };
      histories.push(agentHistory);
    }

    // Adicionar mensagem e atualizar timestamp
    agentHistory.messages.push(message);
    agentHistory.lastUpdated = new Date();

    // Limitar histórico a 100 mensagens por agente para performance
    if (agentHistory.messages.length > 100) {
      agentHistory.messages = agentHistory.messages.slice(-100);
    }

    // Salvar no localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
  }
};

/**
 * Carrega o histórico de conversas de um agente específico
 * @param agentId - ID do agente
 * @returns Array de mensagens do agente
 */
export const loadAgentHistory = (agentId: string): ChatMessage[] => {
  try {
    const histories = loadAllHistories();
    const agentHistory = histories.find(h => h.agentId === agentId);
    
    return agentHistory?.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp) // Converter string de volta para Date
    })) || [];
  } catch (error) {
    console.error('Erro ao carregar histórico do agente:', error);
    return [];
  }
};

/**
 * Carrega todos os históricos de conversas
 * @returns Array com todos os históricos
 */
export const loadAllHistories = (): ChatHistory[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const histories = JSON.parse(stored);
    return histories.map((history: any) => ({
      ...history,
      lastUpdated: new Date(history.lastUpdated),
      messages: history.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Erro ao carregar históricos:', error);
    return [];
  }
};

/**
 * Limpa o histórico de um agente específico
 * @param agentId - ID do agente
 */
export const clearAgentHistory = (agentId: string): void => {
  try {
    const histories = loadAllHistories();
    const filteredHistories = histories.filter(h => h.agentId !== agentId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistories));
  } catch (error) {
    console.error('Erro ao limpar histórico do agente:', error);
  }
};

/**
 * Limpa todos os históricos de conversas
 */
export const clearAllHistories = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar todos os históricos:', error);
  }
};

/**
 * Obtém estatísticas do histórico de um agente
 * @param agentId - ID do agente
 * @returns Objeto com estatísticas
 */
export const getAgentStats = (agentId: string) => {
  const messages = loadAgentHistory(agentId);
  const userMessages = messages.filter(m => m.sender === 'user');
  const agentMessages = messages.filter(m => m.sender === 'agent');
  
  return {
    totalMessages: messages.length,
    userMessages: userMessages.length,
    agentMessages: agentMessages.length,
    firstMessage: messages[0]?.timestamp,
    lastMessage: messages[messages.length - 1]?.timestamp
  };
};

/**
 * Converte histórico para formato compatível com Gemini
 * @param agentId - ID do agente
 * @returns Array de mensagens no formato do Gemini
 */
export const getGeminiHistory = (agentId: string) => {
  const messages = loadAgentHistory(agentId);
  
  // Pegar apenas as últimas 10 mensagens para contexto (excluindo a última que será enviada)
  const recentMessages = messages.slice(-20, -1);
  
  return recentMessages.map(msg => ({
    role: msg.sender === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: msg.content }]
  }));
};