import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types';
import { Button } from '../ui/Button';
import citiesData from '../../utils/brazil-cities.json'; // Importamos nossa lista de cidades

interface ClientFormProps {
  client: Omit<Client, 'id' | 'createdAt' | 'createdBy'> | null;
  onClose: () => void;
  onSave: (data: Omit<Client, 'id' | 'createdAt' | 'createdBy'>) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nomeCompleto: client?.nomeCompleto || '',
    email: client?.email || '',
    telefone: client?.telefone || '',
    origem: client?.origem || '',
    status: client?.status || 'Novo',
    valorPotencial: client?.valorPotencial || 0,
    observacoes: client?.observacoes || '',
    cidade: client?.cidade || '',
    estado: client?.estado || '',
  });

  // Lógica para os menus de seleção de Estado e Cidade
  const states = useMemo(() => {
    const stateSet = new Set(citiesData.map(city => city.estado));
    return Array.from(stateSet).sort();
  }, []);

  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (formData.estado) {
      const citiesInState = citiesData
        .filter(city => city.estado === formData.estado)
        .map(city => city.cidade)
        .sort();
      setAvailableCities(citiesInState);
    } else {
      setAvailableCities([]);
    }
  }, [formData.estado]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setFormData(prev => ({
      ...prev,
      estado: newState,
      cidade: '' // Reseta a cidade ao trocar de estado
    }));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'valorPotencial' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const statusOptions = ['Novo', 'Em Contato', 'Qualificado', 'Proposta Enviada', 'Negociação', 'Fechado (Ganhou)', 'Fechado (Perdeu)', 'Inativo'];
  const originOptions = ['Indicação', 'Anúncio Online', 'Mídias Sociais', 'Evento', 'Site', 'Prospecção Ativa', 'Outros'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="md:col-span-2">
        <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nome Completo *
        </label>
        <input type="text" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
          <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
      </div>
      
      {/* CAMPOS DE ESTADO E CIDADE COM A NOVA LÓGICA DE SELEÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
          <select name="estado" value={formData.estado} onChange={handleStateChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">Selecione um estado</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cidade</label>
          <select name="cidade" value={formData.cidade} onChange={handleChange} disabled={!formData.estado} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-200 dark:disabled:bg-gray-800">
            <option value="">{formData.estado ? 'Selecione uma cidade' : 'Selecione um estado primeiro'}</option>
            {availableCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="origem" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Origem</label>
          <select name="origem" value={formData.origem} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">Selecione</option>
            {originOptions.map(option => (<option key={option} value={option}>{option}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="valorPotencial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor Potencial (R$)</label>
          <input type="number" name="valorPotencial" value={formData.valorPotencial} onChange={handleChange} min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
      </div>
      
      <div className="md:col-span-2">
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações</label>
        <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">{client ? 'Atualizar' : 'Criar'} Cliente</Button>
      </div>
    </form>
  );
};