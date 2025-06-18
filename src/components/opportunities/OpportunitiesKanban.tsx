import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DollarSign, Calendar, User, Edit, BarChart2, Flag } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { OpportunityForm } from './OpportunityForm';
import { useData } from '../../contexts/DataContext';
import { Opportunity } from '../../types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Adiciona a função autoTable ao tipo do jsPDF para o TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ReportData {
  totalOpportunities: number;
  won: number;
  lost: number;
  open: number;
  totalValueWon: number;
}

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

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
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
  
  const handleGeneratePdf = () => {
    const opportunitiesInPeriod = opportunities.filter(opp => {
      const oppDate = new Date(opp.createdAt);
      return oppDate.getMonth() === selectedMonth && oppDate.getFullYear() === selectedYear;
    });

    if (opportunitiesInPeriod.length === 0) {
      alert(`Nenhuma oportunidade encontrada para ${months[selectedMonth]} de ${selectedYear}.`);
      return;
    }

    const doc = new jsPDF();
    const wonCount = opportunitiesInPeriod.filter(o => o.status === 'fechado-ganhou').length;
    const lostCount = opportunitiesInPeriod.filter(o => o.status === 'fechado-perdeu').length;
    const totalValueWon = opportunitiesInPeriod.filter(o => o.status === 'fechado-ganhou').reduce((sum, o) => sum + o.value, 0);

    doc.setFontSize(18);
    doc.text(`Relatório de Oportunidades - ${months[selectedMonth]}/${selectedYear}`, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Total de Oportunidades no período: ${opportunitiesInPeriod.length}`, 14, 32);
    doc.text(`Negócios Ganhos: ${wonCount}`, 14, 38);
    doc.text(`Negócios Perdidos: ${lostCount}`, 14, 44);
    doc.text(`Valor Total Ganho: R$ ${totalValueWon.toLocaleString()}`, 14, 50);

    const tableColumn = ["Nome da Oportunidade", "Cliente", "Valor (R$)", "Status"];
    const tableRows: (string | number)[][] = [];

    opportunitiesInPeriod.forEach(opp => {
      const opportunityData = [ opp.name, opp.clientName, opp.value.toLocaleString(), stages.find(s => s.id === opp.status)?.name || opp.status ];
      tableRows.push(opportunityData);
    });

    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 60 });
    doc.save(`relatorio_oportunidades_${months[selectedMonth]}_${selectedYear}.pdf`);
    setIsReportModalOpen(false);
  };

  const months = [ "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro" ];
  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    const opportunity = opportunities.find(opp => opp.id === draggableId);

    if (opportunity) {
        const updatedOpportunity = { ...opportunity, status: destination.droppableId };
        updateOpportunity(updatedOpportunity);

        if (destination.droppableId === 'fechado-ganhou') {
            const clientToUpdate = clients.find(c => c.nomeCompleto === updatedOpportunity.clientName);
            if (clientToUpdate) {
                updateClient({ ...clientToUpdate, status: 'Fechado (Ganhou)' });
            }
        }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pipeline de Oportunidades</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Arraste os cards para gerenciar suas vendas</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setIsReportModalOpen(true)} variant='outline' className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Gerar Relatório
            </Button>
            <Button onClick={handleAddOpportunity} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nova Oportunidade
            </Button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageOpportunities = opportunities.filter(op => op.status === stage.id);
            const totalValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);
            return (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div className="flex-shrink-0 w-80">
                    <Card className={`h-full flex flex-col transition-colors ${snapshot.isDraggingOver ? 'bg-primary-100/50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                      <div className="p-4 border-b-4" style={{ borderColor: stage.color.replace('bg-', '') }}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h3>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{stageOpportunities.length}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">R$ {totalValue.toLocaleString()}</div>
                      </div>
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[400px]"
                      >
                        {stageOpportunities.map((opportunity, index) => (
                          <Draggable key={opportunity.id} draggableId={opportunity.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{ ...provided.draggableProps.style }}
                                className={`p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow ${snapshot.isDragging ? 'ring-2 ring-primary-500 shadow-xl' : 'shadow-sm'}`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm" onClick={() => handleEditOpportunity(opportunity)}>{opportunity.name}</h4>
                                  <button onClick={(e) => { e.stopPropagation(); handleEditOpportunity(opportunity);}} className="p-1 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><Edit className="w-3 h-3" /></button>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><User className="w-3 h-3" /><span>{opportunity.clientName}</span></div>
                                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400"><DollarSign className="w-3 h-3" /><span className="font-medium">R$ {opportunity.value.toLocaleString()}</span></div>
                                  {opportunity.expectedCloseDate && <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><Flag className="w-3 h-3" /><span>Fechar em: {new Date(opportunity.expectedCloseDate).toLocaleDateString()}</span></div>}
                                  {opportunity.nextAction && (<div className="mt-2 p-2 bg-gray-50 dark:bg-gray-600 rounded text-xs text-gray-700 dark:text-gray-300"><strong>Próxima ação:</strong> {opportunity.nextAction}</div>)}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </Card>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
      
      <Modal isOpen={isOpportunityModalOpen} onClose={() => setIsOpportunityModalOpen(false)} title={selectedOpportunity ? "Editar Oportunidade" : "Nova Oportunidade"}>
        <OpportunityForm opportunity={selectedOpportunity} onClose={() => setIsOpportunityModalOpen(false)} onSave={handleSaveOpportunity} />
      </Modal>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Gerar Relatório de Oportunidades">
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Selecione o período para gerar o relatório em PDF.</p>
            <div className="flex gap-4 items-center">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
                    {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </div>
             <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setIsReportModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleGeneratePdf}>Gerar PDF</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};