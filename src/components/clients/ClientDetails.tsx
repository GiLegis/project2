import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, Briefcase, Calendar, DollarSign } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

// Definindo interfaces para os dados para maior segurança de tipo
interface Client {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  origem: string;
  status: string;
  valorPotencial: number;
  observacoes: string;
  createdAt: string;
}

interface Opportunity {
  id: string;
  name: string;
  clientName: string;
  value: number;
  status: string;
}

interface Task {
  id: string;
  name: string;
  dueDate: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluída';
}

interface ClientDetailsProps {
  client: Client;
  onBack: () => void;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onBack }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Carrega oportunidades e tarefas do localStorage para encontrar itens relacionados
  useEffect(() => {
    const allOpportunities = JSON.parse(localStorage.getItem('crm_opportunities') || '[]');
    const allTasks = JSON.parse(localStorage.getItem('crm_tasks') || '[]');
    
    // Filtra para encontrar apenas os que pertencem a este cliente
    setOpportunities(allOpportunities.filter((o: Opportunity) => o.clientName === client.nomeCompleto));
    // Simplificação: assume que tarefas com o nome do cliente na descrição são dele
    setTasks(allTasks.filter((t: Task) => t.name.includes(client.nomeCompleto) || t.description.includes(client.nomeCompleto)));
  }, [client.nomeCompleto]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fechado (Ganhou)': return 'text-success-600';
      case 'Fechado (Perdeu)': return 'text-danger-600';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="p-4 lg:p-6 space-y-6"
    >
      {/* Header da Página */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="sm" className="!p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {client.nomeCompleto}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Cliente desde {new Date(client.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna de Informações */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Informações de Contato</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">{client.email || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">{client.telefone || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${client.status === 'Fechado (Ganhou)' ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'} dark:bg-opacity-20`}>
                  {client.status}
                </span>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Observações</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {client.observacoes || 'Nenhuma observação.'}
            </p>
          </Card>
        </div>

        {/* Coluna de Atividades */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Oportunidades ({opportunities.length})</h3>
            <div className="space-y-3">
              {opportunities.length > 0 ? opportunities.map(op => (
                <div key={op.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{op.name}</p>
                    <p className={`text-sm ${getStatusColor(op.status)}`}>{op.status}</p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-800 dark:text-gray-200 font-semibold">
                    <DollarSign className="w-4 h-4 text-success-500" />
                    {op.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma oportunidade encontrada.</p>}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Tarefas ({tasks.length})</h3>
            <div className="space-y-3">
                {tasks.length > 0 ? tasks.map(task => (
                    <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                        <div>
                            <p className={`font-medium ${task.status === 'Concluída' ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                {task.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Vencimento: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                        </div>
                        <span className={`text-sm font-medium ${task.status === 'Concluída' ? 'text-success-600' : 'text-warning-600'}`}>
                            {task.status}
                        </span>
                    </div>
                )) : <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma tarefa encontrada.</p>}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};