// src/types.ts

export interface Client {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  origem: string;
  status: string;
  valorPotencial: number;
  observacoes: string;
  createdAt: string;
  createdBy?: string;
}

export interface Opportunity {
  id: string;
  name: string;
  clientName: string;
  value: number;
  status: string;
  nextAction: string;
  description: string;
  createdAt: Date;
  expectedCloseDate?: string;
}

export interface Task {
    id: string;
    name: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    status: 'Pendente' | 'Em Andamento' | 'Concluída';
    assignedTo: string;
    createdAt: string;
}