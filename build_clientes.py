import os

clientes_code = """import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Gift,
  CheckCircle2, 
  X,
  Mic,
  MicOff,
  KanbanSquare,
  ListTodo,
  Edit3,
  Trash2,
  DollarSign
} from 'lucide-react';
import { Customer, AppSettings, CRMColumn, Task } from '../types';
import { formatCurrency, formatDate } from '../lib/storage';
import { SendMessageModal } from '../components/SendMessageModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ClientesProps {
  customers: Customer[];
  settings: AppSettings;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onSettleDebt: (customerId: string, amountToPay: number) => void;
  tasks: Task[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const CRM_COLUMNS: { id: CRMColumn; label: string; color: string }[] = [
  { id: 'novos', label: 'Novos', color: 'bg-blue-50 border-blue-200 text-blue-900' },
  { id: 'contatados', label: 'Contatados', color: 'bg-purple-50 border-purple-200 text-purple-900' },
  { id: 'negociacao', label: 'Em Negociação', color: 'bg-amber-50 border-amber-200 text-amber-900' },
  { id: 'venda', label: 'Compraram', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { id: 'fiado', label: 'Fiado Pendente', color: 'bg-red-50 border-red-200 text-red-900' },
];

function SortableCustomerCard({ customer, onClickEdit, onClickSettle, onClickMessage }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: customer.id, data: { type: 'Customer', customer } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasDebt = (customer.outstandingBalance || 0) > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative mb-3 group"
    >
      <div {...attributes} {...listeners} className="absolute inset-0 z-0"></div>
      
      <div className="relative z-10 pointer-events-none">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h4 className="font-bold text-slate-800 text-sm truncate">{customer.name}</h4>
          {hasDebt && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[9px] font-bold rounded-full shrink-0">
              {formatCurrency(customer.outstandingBalance)}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
          <Phone className="w-3 h-3 text-slate-400" /> {customer.phone || 'S/N'}
        </p>
        
        {customer.notes && (
          <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded line-clamp-2 italic border border-slate-100">
            {customer.notes}
          </p>
        )}
      </div>

      <div className="relative z-20 flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
        <button onClick={() => onClickEdit(customer)} className="text-[10px] text-purple-600 hover:text-purple-800 font-medium">Editar</button>
        {hasDebt ? (
           <button onClick={() => onClickSettle(customer)} className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-100">Quitar</button>
        ) : (
           <button onClick={() => onClickMessage(customer)} className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium">WhatsApp</button>
        )}
      </div>
    </div>
  );
}


export const Clientes: React.FC<ClientesProps> = ({
  customers,
  settings,
  onSaveCustomer,
  onDeleteCustomer,
  onSettleDebt,
  tasks,
  onSaveTask,
  onDeleteTask
}) => {
  const [activeTab, setActiveTab] = useState<'crm' | 'tarefas'>('crm');
  const [searchTerm, setSearchTerm] = useState('');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  
  // CRM Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Tasks
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isListeningCustomer, setIsListeningCustomer] = useState(false);
  const [isListeningTask, setIsListeningTask] = useState(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Voice Input Handlers
  const handleVoiceInput = (setter: (val: string) => void, setIsListening: (val: boolean) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setter(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const customerId = active.id as string;
    const newColumnId = over.id as CRMColumn;

    const customer = customers.find(c => c.id === customerId);
    if (customer && customer.crmColumn !== newColumnId) {
      onSaveCustomer({ ...customer, crmColumn: newColumnId });
    }
  };

  // Derived state
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(taskSearchTerm.toLowerCase()));

  // Customer handlers
  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setName(customer.name);
      setPhone(customer.phone);
      setNotes(customer.notes || '');
    } else {
      setEditingCustomer(null);
      setName('');
      setPhone('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const c: Customer = editingCustomer ? { ...editingCustomer, name, phone, notes } : {
      id: `cust-${Date.now()}`,
      name,
      phone,
      notes,
      totalPurchased: 0,
      outstandingBalance: 0,
      crmColumn: 'novos',
    };
    onSaveCustomer(c);
    setIsModalOpen(false);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onSaveTask({
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      completed: false,
      createdAt: new Date().toISOString()
    });
    setNewTaskTitle('');
  };

  return (
    <div className="space-y-6 flex flex-col h-full min-h-[80vh]">
      
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-colors ${activeTab === 'crm' ? 'bg-purple-900 text-white' : 'text-slate-600 hover:bg-purple-50'}`}
          >
            <KanbanSquare className="w-4 h-4" /> CRM & Clientes
          </button>
          <button 
            onClick={() => setActiveTab('tarefas')}
            className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-colors ${activeTab === 'tarefas' ? 'bg-purple-900 text-white' : 'text-slate-600 hover:bg-purple-50'}`}
          >
            <ListTodo className="w-4 h-4" /> Tarefas
          </button>
        </div>

        {activeTab === 'crm' && (
          <button onClick={() => handleOpenModal()} className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex justify-center items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Contato
          </button>
        )}
      </div>

      {/* CRM Tab */}
      {activeTab === 'crm' && (
        <div className="flex flex-col h-full space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar no CRM..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start min-h-[500px]">
              {CRM_COLUMNS.map(col => {
                const colCustomers = filteredCustomers.filter(c => (c.crmColumn || 'novos') === col.id);
                const colTotal = colCustomers.reduce((acc, c) => acc + (c.outstandingBalance || c.totalPurchased || 0), 0);
                
                return (
                  <div key={col.id} className={`flex-shrink-0 w-72 rounded-2xl flex flex-col max-h-full ${col.color} border p-3`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-sm">{col.label} <span className="text-[10px] ml-1 opacity-70">({colCustomers.length})</span></h3>
                      <span className="text-xs font-black">{formatCurrency(colTotal)}</span>
                    </div>
                    
                    {/* DROP ZONE */}
                    <SortableContext id={col.id} items={colCustomers.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <div className="flex-1 overflow-y-auto pr-1 pb-4 min-h-[100px]">
                        {colCustomers.map(c => (
                          <SortableCustomerCard 
                            key={c.id} 
                            customer={c} 
                            onClickEdit={() => handleOpenModal(c)}
                            onClickSettle={() => { const val = prompt(`Quanto de ${formatCurrency(c.outstandingBalance)} foi pago?`); if(val) onSettleDebt(c.id, parseFloat(val.replace(',','.'))); }}
                            onClickMessage={() => window.open(`https://wa.me/55${c.phone.replace(/\D/g, '')}`, '_blank')}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </DndContext>
        </div>
      )}

      {/* TAREFAS Tab */}
      {activeTab === 'tarefas' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm max-w-3xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <form onSubmit={handleTaskSubmit} className="flex-1 flex gap-2 relative">
              <input 
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Ex: Entregar pedido da Carla amanhã..."
                className="flex-1 py-3 pl-4 pr-12 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button 
                type="button"
                onClick={() => handleVoiceInput(setNewTaskTitle, setIsListeningTask)}
                className={`absolute right-14 top-1/2 -translate-y-1/2 p-2 rounded-full ${isListeningTask ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-purple-600'}`}
              >
                {isListeningTask ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
              <button type="submit" className="bg-purple-900 text-white px-5 rounded-xl font-bold text-sm shadow-sm hover:bg-purple-800">
                Adicionar
              </button>
            </form>
          </div>

          <div className="relative mb-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar tarefas..." 
               value={taskSearchTerm}
               onChange={e => setTaskSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2 border border-slate-100 bg-slate-50 rounded-lg text-xs outline-none"
             />
          </div>

          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">Nenhuma tarefa encontrada.</p>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                  <button 
                    onClick={() => onSaveTask({ ...task, completed: !task.completed })}
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                    {task.title}
                  </span>
                  <button onClick={() => onDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal CRM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-purple-950 font-serif">
                {editingCustomer ? 'Editar Contato' : 'Novo Contato CRM'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => handleVoiceInput(setName, setIsListeningCustomer)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full ${isListeningCustomer ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}
                  >
                    {isListeningCustomer ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Anotações (Preferências, etc)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>
              
              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-purple-900 text-white rounded-xl font-bold shadow-md hover:bg-purple-800 transition-colors">
                  Salvar no CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
"""

with open("src/pages/Clientes.tsx", "w", encoding="utf-8") as f:
    f.write(clientes_code)
