import React, { useState } from 'react';
import { Search, CheckCircle2, Trash2, Mic, MicOff } from 'lucide-react';
import { Task } from '../types';

interface TarefasProps {
  tasks: Task[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const Tarefas: React.FC<TarefasProps> = ({ tasks, onSaveTask, onDeleteTask }) => {
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isListeningTask, setIsListeningTask] = useState(false);

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(taskSearchTerm.toLowerCase()));

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
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm max-w-3xl mx-auto w-full mt-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Minhas Tarefas</h2>
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
            className={`absolute right-28 top-1/2 -translate-y-1/2 p-2 rounded-full ${isListeningTask ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-purple-600'}`}
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
  );
};
