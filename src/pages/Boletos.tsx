import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Trash2, 
  ExternalLink,
  X,
  Camera,
  Sparkles
} from 'lucide-react';
import { Boleto, Brand, BoletoStatus, AppSettings } from '../types';
import { formatCurrency, formatDate } from '../lib/storage';
import { ScanBoletoModal } from '../components/ScanBoletoModal';

interface BoletosProps {
  boletos: Boleto[];
  settings?: AppSettings;
  onSaveBoleto: (boleto: Boleto) => void;
  onDeleteBoleto: (id: string) => void;
  onMarkAsPaid: (boletoId: string) => void;
}

export const Boletos: React.FC<BoletosProps> = ({
  boletos,
  settings,
  onSaveBoleto,
  onDeleteBoleto,
  onMarkAsPaid,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Dynamic configured brands
  const configuredBrands = settings?.brands?.map(b => b.name) || ['O Boticário', 'Eudora', 'Natura', 'Natura'];
  const uniqueBrands = Array.from(new Set([...configuredBrands, ...boletos.map(b => b.brand)]));

  // Form states
  const [brand, setBrand] = useState<string>(uniqueBrands[0] || 'O Boticário');
  const [cycle, setCycle] = useState<string>('Ciclo 09/2026');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  // Stats
  const pendingBoletos = boletos.filter(b => b.status === 'pendente');
  const totalPending = pendingBoletos.reduce((acc, b) => acc + b.amount, 0);
  const overdueCount = pendingBoletos.filter(b => b.dueDate < today).length;
  const totalPaid = boletos.filter(b => b.status === 'pago').reduce((acc, b) => acc + b.amount, 0);

  const handleCopyBarcode = (b: Boleto) => {
    if (!b.barcode) return;
    navigator.clipboard.writeText(b.barcode);
    setCopiedId(b.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenModal = () => {
    setBrand(uniqueBrands[0] || 'O Boticário');
    setCycle(`Ciclo ${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
    setAmount(0);
    setDueDate('');
    setBarcode('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate || amount <= 0) return;

    const newBoleto: Boleto = {
      id: `bol-${Date.now()}`,
      brand,
      cycle: cycle.trim() || 'Ciclo Regular',
      amount: Number(amount),
      dueDate,
      status: 'pendente',
      barcode: barcode.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSaveBoleto(newBoleto);
    setIsModalOpen(false);
  };

  const filteredBoletos = boletos.filter(b => {
    if (statusFilter === 'todos') return true;
    if (statusFilter === 'vencido') return b.status === 'pendente' && b.dueDate < today;
    return b.status === statusFilter;
  });

  return (
    <div id="boletos-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-950 font-serif">Boletos das Marcas Parceiras</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de vencimentos e faturas de O Boticário, Eudora e novas marcas cadastradas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-scan-boleto"
            onClick={() => setIsScanModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Camera className="w-4 h-4" />
            Tirar Foto do Boleto (IA)
          </button>
          <button
            id="btn-add-boleto"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Manualmente
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total a Pagar (Abertos)</span>
          <div className="text-2xl font-black text-purple-950 mt-1 font-serif">{formatCurrency(totalPending)}</div>
          <p className="text-xs text-slate-400 mt-1">{pendingBoletos.length} boleto(s) em aberto</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Boletos Vencidos</span>
          <div className={`text-2xl font-black mt-1 font-serif ${overdueCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {overdueCount} boleto{overdueCount !== 1 ? 's' : ''}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {overdueCount > 0 ? 'Atenção aos juros de atraso!' : 'Nenhum boleto em atraso'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Já Quitado</span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-serif">{formatCurrency(totalPaid)}</div>
          <p className="text-xs text-slate-400 mt-1">comprovantes arquivados com sucesso</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-purple-100/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'todos' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            Todos ({boletos.length})
          </button>
          <button
            onClick={() => setStatusFilter('pendente')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'pendente' ? 'bg-purple-900 text-white shadow-xs' : 'text-purple-900 hover:bg-purple-50'
            }`}
          >
            Pendentes ({pendingBoletos.length})
          </button>
          <button
            onClick={() => setStatusFilter('pago')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'pago' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Pagos
          </button>
          <button
            onClick={() => setStatusFilter('vencido')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'vencido' ? 'bg-red-600 text-white shadow-xs' : 'text-red-700 hover:bg-red-50'
            }`}
          >
            Vencidos ({overdueCount})
          </button>
        </div>
      </div>

      {/* Boletos List */}
      <div className="space-y-3">
        {filteredBoletos.map(boleto => {
          const isPaid = boleto.status === 'pago';
          const isOverdue = !isPaid && boleto.dueDate < today;
          const isBoti = boleto.brand.toLowerCase().includes('boticário') || boleto.brand.toLowerCase().includes('boticario');
          const isEudora = boleto.brand.toLowerCase().includes('eudora');
const isNatura = boleto.brand.toLowerCase().includes('natura');

          return (
            <div 
              key={boleto.id}
              className={`bg-white p-5 rounded-3xl border shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isOverdue ? 'border-red-300 bg-red-50/10' : 'border-purple-100/80'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                    isBoti ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    isEudora ? 'bg-purple-50 text-purple-800 border-purple-200' :
                    'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    {boleto.brand}
                  </span>
                  <span className="font-bold text-purple-950 text-sm">{boleto.cycle}</span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' :
                    isOverdue ? 'bg-red-100 text-red-800 animate-pulse' :
                    'bg-purple-100 text-purple-900'
                  }`}>
                    {isPaid ? 'PAGO' : isOverdue ? 'VENCIDO' : 'A VENCER'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-700" /> Vencimento: <strong className="text-slate-800">{formatDate(boleto.dueDate)}</strong>
                  </span>
                  {boleto.paidDate && (
                    <span className="text-emerald-700 font-semibold">Pago em: {formatDate(boleto.paidDate)}</span>
                  )}
                </div>

                {boleto.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-xl inline-block">Obs: {boleto.notes}</p>
                )}

                {/* Barcode line */}
                {boleto.barcode && (
                  <div className="mt-2 flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 max-w-xl">
                    <code className="text-[11px] font-mono text-slate-700 truncate flex-1">
                      {boleto.barcode}
                    </code>
                    <button
                      onClick={() => handleCopyBarcode(boleto)}
                      className="shrink-0 px-3 py-1 bg-white hover:bg-purple-50 border border-purple-100 text-purple-950 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedId === boleto.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copiar Código
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Amount & Actions */}
              <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs text-slate-400">Valor do Boleto</span>
                  <div className="text-xl font-bold text-purple-950 font-serif">{formatCurrency(boleto.amount)}</div>
                </div>

                <div className="flex items-center gap-2">
                  {!isPaid && (
                    <button
                      onClick={() => onMarkAsPaid(boleto.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Pago
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Excluir boleto de ${boleto.brand}?`)) {
                        onDeleteBoleto(boleto.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Boleto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-6 border border-purple-100">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-4">
              <h3 className="text-xl font-bold text-purple-950 font-serif">Cadastrar Boleto</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Marca Parceira *</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                >
                  {uniqueBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Ciclo / Referência</label>
                <input
                  type="text"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  placeholder="Ex: Ciclo 09/2026 - Pedido 9981"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={amount === 0 ? '' : amount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setAmount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border-2 border-purple-300 rounded-xl text-sm font-bold text-purple-950 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Linha Digitável / Código de Barras</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Ex: 34191.79001 01043.510047..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Anotações</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Pedido com brinde da marca"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-purple-800 transition-colors"
                >
                  Salvar Boleto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Tirar Foto do Boleto (IA) */}
      <ScanBoletoModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSaveBoleto={onSaveBoleto}
        settings={settings || ({} as AppSettings)}
      />
    </div>
  );
};
