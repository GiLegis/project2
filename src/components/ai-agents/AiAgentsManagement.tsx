import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bot, Settings, Play, Pause, Trash2, Edit, Sparkles, MessageCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AiAgentForm } from './AiAgentForm';
import { AgentChat } from './AgentChat';
import { getAgentStats } from '../../services/chatHistoryService';

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

export const AiAgentsManagement: React.FC = () => {
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AiAgent | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<AiAgent | null>(null);
  const [chatAgent, setChatAgent] = useState<AiAgent | null>(null);
  const [agentStats, setAgentStats] = useState<{ [key: string]: any }>({});

  // Carregar agentes do localStorage
  useEffect(() => {
    const savedAgents = localStorage.getItem('crm_ai_agents');
    if (savedAgents) {
      try {
        const parsedAgents = JSON.parse(savedAgents).map((agent: any) => ({
          ...agent,
          createdAt: new Date(agent.createdAt),
          lastUsed: agent.lastUsed ? new Date(agent.lastUsed) : undefined
        }));
        setAgents(parsedAgents);
      } catch (error) {
        console.error('Erro ao carregar agentes:', error);
      }
    }
  }, []);

  // Carregar estatísticas dos agentes
  useEffect(() => {
    const stats: { [key: string]: any } = {};
    agents.forEach(agent => {
      stats[agent.id] = getAgentStats(agent.id);
    });
    setAgentStats(stats);
  }, [agents]);

  // Salvar agentes no localStorage
  const saveAgents = (updatedAgents: AiAgent[]) => {
    localStorage.setItem('crm_ai_agents', JSON.stringify(updatedAgents));
    setAgents(updatedAgents);
  };

  const handleAddAgent = () => {
    setSelectedAgent(null);
    setIsAgentModalOpen(true);
  };

  const handleEditAgent = (agent: AiAgent) => {
    setSelectedAgent(agent);
    setIsAgentModalOpen(true);
  };

  const handleDeleteAgent = (agent: AiAgent) => {
    setAgentToDelete(agent);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (agentToDelete) {
      const updatedAgents = agents.filter(a => a.id !== agentToDelete.id);
      saveAgents(updatedAgents);
      setAgentToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleSaveAgent = (formData: Omit<AiAgent, 'id' | 'createdAt'>) => {
    if (selectedAgent) {
      // Editar agente existente
      const updatedAgents = agents.map(a => 
        a.id === selectedAgent.id 
          ? { ...selectedAgent, ...formData }
          : a
      );
      saveAgents(updatedAgents);
    } else {
      // Criar novo agente
      const newAgent: AiAgent = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      saveAgents([...agents, newAgent]);
    }
    setIsAgentModalOpen(false);
  };

  const handleToggleAgent = (agentId: string) => {
    const updatedAgents = agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, isActive: !agent.isActive }
        : agent
    );
    saveAgents(updatedAgents);
  };

  const handleOpenChat = (agent: AiAgent) => {
    // Atualizar lastUsed
    const updatedAgents = agents.map(a => 
      a.id === agent.id 
        ? { ...a, lastUsed: new Date() }
        : a
    );
    saveAgents(updatedAgents);
    setChatAgent(agent);
  };

  const getModelColor = (model: string) => {
    switch (model) {
      case 'gpt-4': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'gpt-3.5-turbo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'claude-3': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'gemini-pro': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Se um agente está selecionado para chat, mostrar a interface de chat
  if (chatAgent) {
    return (
      <div className="h-full">
        <AgentChat
          agent={chatAgent}
          onBack={() => setChatAgent(null)}
          onEditAgent={handleEditAgent}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Agentes de IA
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure e converse com seus assistentes de IA
          </p>
        </div>
        <Button onClick={handleAddAgent} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Agente
        </Button>
      </motion.div>

      {/* Agents Grid */}
      <AnimatePresence>
        {agents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhum agente configurado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Crie seu primeiro agente de IA para automatizar tarefas e conversas
              </p>
              <Button onClick={handleAddAgent}>
                Criar Primeiro Agente
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="p-6">
                  <div className="flex justify-between items-start mb-4">
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
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          agent.isActive 
                            ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {agent.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenChat(agent)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="Conversar"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleAgent(agent.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          agent.isActive
                            ? 'text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20'
                            : 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'
                        }`}
                        title={agent.isActive ? 'Pausar' : 'Ativar'}
                      >
                        {agent.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent)}
                        className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Modelo</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModelColor(agent.model)}`}>
                        {agent.model}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Temperatura</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {agent.temperature}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Max Tokens</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {agent.maxTokens}
                      </span>
                    </div>

                    {/* Estatísticas do Chat */}
                    {agentStats[agent.id] && agentStats[agent.id].totalMessages > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Mensagens</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {agentStats[agent.id].totalMessages}
                          </span>
                        </div>
                      </div>
                    )}

                    {agent.triggerEvents.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Eventos:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {agent.triggerEvents.slice(0, 2).map((event, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              {event}
                            </span>
                          ))}
                          {agent.triggerEvents.length > 2 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              +{agent.triggerEvents.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {agent.lastUsed && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Último uso: {agent.lastUsed.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Modais */}
      <Modal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        title={selectedAgent ? "Editar Agente" : "Novo Agente de IA"}
        size="lg"
      >
        <AiAgentForm
          agent={selectedAgent}
          onClose={() => setIsAgentModalOpen(false)}
          onSave={handleSaveAgent}
        />
      </Modal>

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 dark:bg-danger-900/20 mb-4">
            <Trash2 className="h-6 w-6 text-danger-600 dark:text-danger-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Excluir Agente
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Tem certeza que deseja excluir o agente "{agentToDelete?.name}"? 
            Esta ação não pode ser desfeita e todo o histórico de conversas será perdido.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};