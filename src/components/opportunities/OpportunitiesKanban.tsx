import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DollarSign, Calendar, User, Edit } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { OpportunityForm } from './OpportunityForm';
import { useData } from '../../contexts/DataContext';
import { Opportunity } from '../../types';

const stages = [
  { id: 'novo-lead', name: 'Novo Lead', color: 'bg-blue-500' },
  { id: 'contato-inicial', name: 'Contato Inicial', color: 'bg-indigo-500' },
  { id: 'qualificacao', name: 'Qualificação', color: 'bg-purple-500' },
  { id: 'proposta', name: 'Proposta', color: 'bg-yellow-500' },
  { id: 'negociacao', name: 'Negociação', color: 'bg-orange-500' },
  { id: 'fechado-ganhou', name: 'Fechado (Ganhou)', color: 'bg-green-500' },
  { id: 'fechado-perdeu', name: 'Fechado (Perdeu)', color: 'bg-red-500' }
];

export const OpportunitiesKanban: React.FC = () => {
  const { clients, opportunities, addOpportunity, updateOpportunity, updateClient } = useData();
  
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  
  const handleAddOpportunity = () => {
    setSelectedOpportunity(null);
    setIsOpportunityModalOpen(true);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsOpportunityModalOpen(true);
  };

  const handleSaveOpportunity = (formData: Omit<Opportunity, 'id' | 'createdAt'>) => {
    if (selectedOpportunity) {
      updateOpportunity({ ...selectedOpportunity, ...formData });
    } else {
      addOpportunity(formData);
    }
    setIsOpportunityModalOpen(false);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedItem) {
      const opportunityToUpdate = opportunities.find(opp => opp.id === draggedItem);
      if (opportunityToUpdate) {
        updateOpportunity({ ...opportunityToUpdate, status: newStatus });
        if (newStatus === 'fechado-ganhou') {
          const clientToUpdate = clients.find(c => c.nomeCompleto === opportunityToUpdate.clientName);
          if (clientToUpdate) {
            updateClient({ ...clientToUpdate, status: 'Fechado (Ganhou)' });
          }
        }
      }
      setDraggedItem(null);
    }
  };
  
  const handleDragStart = (e: React.DragEvent, opportunityId: string) => {
    setDraggedItem(opportunityId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const getOpportunitiesByStatus = (status: string) => opportunities.filter(opp => opp.status === status);
  const getTotalValueByStatus = (status: string) => getOpportunitiesByStatus(status).reduce((sum, opp) => sum + opp.value, 0);

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pipeline de Oportunidades</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie suas oportunidades de vendas</p>
        </div>
        <Button onClick={handleAddOpportunity} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Oportunidade</Button>
      </motion.div>

      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageOpportunities = getOpportunitiesByStatus(stage.id);
          const totalValue = getTotalValueByStatus(stage.id);
          return (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <Card className="h-full bg-gray-50 dark:bg-gray-800/50">
                <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage.id)} className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({stageOpportunities.length})</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total: R$ {totalValue.toLocaleString()}</div>
                </div>
                <div className="p-4 space-y-3 min-h-[400px]">
                  <AnimatePresence>
                    {stageOpportunities.map((opportunity) => (
                      // AQUI ESTÁ A MUDANÇA PRINCIPAL: trocamos motion.div por div
                      <div
                        key={opportunity.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opportunity.id)}
                        className={`p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggedItem === opportunity.id ? 'opacity-50' : ''}`}
                      >
                         <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{opportunity.name}</h4>
                          <button onClick={() => handleEditOpportunity(opportunity)} className="p-1 text-gray-400 hover:text-primary-600"><Edit className="w-3 h-3" /></button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"><User className="w-3 h-3" /><span>{opportunity.clientName}</span></div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"><DollarSign className="w-3 h-3" /><span className="font-medium">R$ {opportunity.value.toLocaleString()}</span></div>
                          {opportunity.expectedCloseDate && <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"><Calendar className="w-3 h-3" /><span>{new Date(opportunity.expectedCloseDate).toLocaleDateString()}</span></div>}
                          {opportunity.nextAction && (<div className="mt-2 p-2 bg-gray-50 dark:bg-gray-600 rounded text-xs text-gray-700 dark:text-gray-300"><strong>Próxima ação:</strong> {opportunity.nextAction}</div>)}
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
      <Modal isOpen={isOpportunityModalOpen} onClose={() => setIsOpportunityModalOpen(false)} title={selectedOpportunity ? "Editar Oportunidade" : "Nova Oportunidade"}>
        <OpportunityForm opportunity={selectedOpportunity} onClose={() => setIsOpportunityModalOpen(false)} onSave={handleSaveOpportunity} />
      </Modal>
    </div>
  );
};