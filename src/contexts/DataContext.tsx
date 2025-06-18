import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Opportunity } from '../types'; // Importando de src/types.ts

// Tipagem do Contexto
interface DataContextType {
  clients: Client[];
  opportunities: Opportunity[];
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (updatedClient: Client) => void;
  deleteClient: (clientId: string) => void;
  addOpportunity: (opportunityData: Omit<Opportunity, 'id' | 'createdAt'>) => void;
  updateOpportunity: (updatedOpportunity: Opportunity) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Componente Provedor
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  // Carregar dados iniciais do localStorage
  useEffect(() => {
    try {
      const savedClients = localStorage.getItem('crm_clients');
      if (savedClients) setClients(JSON.parse(savedClients));

      const savedOpportunities = localStorage.getItem('crm_opportunities');
      if (savedOpportunities) {
        const parsedOpportunities = JSON.parse(savedOpportunities);
        // Garante que 'createdAt' seja um objeto Date
        setOpportunities(parsedOpportunities.map((o: any) => ({...o, createdAt: new Date(o.createdAt)})));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
  }, []);

  // Funções para manipular Clientes
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = { ...clientData, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setClients(prev => {
      const updated = [...prev, newClient];
      localStorage.setItem('crm_clients', JSON.stringify(updated));
      return updated;
    });
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => {
      const updated = prev.map(c => c.id === updatedClient.id ? updatedClient : c);
      localStorage.setItem('crm_clients', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteClient = (clientId: string) => {
    setClients(prev => {
      const updated = prev.filter(c => c.id !== clientId);
      localStorage.setItem('crm_clients', JSON.stringify(updated));
      return updated;
    });
  };

  // Funções para manipular Oportunidades
  const addOpportunity = (opportunityData: Omit<Opportunity, 'id' | 'createdAt'>) => {
    const newOpportunity: Opportunity = { ...opportunityData, id: Date.now().toString(), createdAt: new Date() };
    setOpportunities(prev => {
      const updated = [...prev, newOpportunity];
      localStorage.setItem('crm_opportunities', JSON.stringify(updated));
      return updated;
    });
  };

  const updateOpportunity = (updatedOpportunity: Opportunity) => {
    setOpportunities(prev => {
      const updated = prev.map(o => o.id === updatedOpportunity.id ? updatedOpportunity : o);
      localStorage.setItem('crm_opportunities', JSON.stringify(updated));
      return updated;
    });
  };

  const value = { clients, opportunities, addClient, updateClient, deleteClient, addOpportunity, updateOpportunity };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};