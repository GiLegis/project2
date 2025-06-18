import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface ClientFormData {
  nomeCompleto: string;
  email: string;
  telefone: string;
  origem: string;
  status: string;
  valorPotencial: number;
  observacoes: string;
}

interface ClientFormProps {
  client?: any;
  onClose: () => void;
  onSave: (data: ClientFormData) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, onClose, onSave }) => {
  const [formData, setFormData] = useState<ClientFormData>({
    nomeCompleto: client?.nomeCompleto || '',
    email: client?.email || '',
    telefone: client?.telefone || '',
    origem: client?.origem || '',
    status: client?.status || 'Novo',
    valorPotencial: client?.valorPotencial || 0,
    observacoes: client?.observacoes || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'valorPotencial' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const statusOptions = ['Novo', 'Em Contato', 'Qualificado', 'Proposta Enviada', 'Negociação', 'Fechado (Ganhou)', 'Fechado (Perdeu)', 'Inativo'];
  const originOptions = ['Indicação', 'Anúncio Online', 'Mídias Sociais', 'Evento', 'Site', 'Prospecção Ativa', 'Outros'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            name="nomeCompleto"
            id="nomeCompleto"
            value={formData.nomeCompleto}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telefone
          </label>
          <input
            type="text"
            name="telefone"
            id="telefone"
            value={formData.telefone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="origem" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Origem
          </label>
          <select
            name="origem"
            id="origem"
            value={formData.origem}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Selecione</option>
            {originOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            name="status"
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="valorPotencial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Valor Potencial (R$)
          </label>
          <input
            type="number"
            name="valorPotencial"
            id="valorPotencial"
            value={formData.valorPotencial}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observações
          </label>
          <textarea
            name="observacoes"
            id="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {client ? 'Atualizar' : 'Criar'} Cliente
        </Button>
      </div>
    </form>
  );
};