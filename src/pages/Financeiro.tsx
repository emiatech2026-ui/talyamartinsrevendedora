import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight, 
  Filter,
  CreditCard,
  PieChart as PieIcon,
  X
} from 'lucide-react';
import { FinancialTransaction, AppSettings } from '../types';
import { formatCurrency, formatDate } from '../lib/storage';

interface FinanceiroProps {
  transactions: FinancialTransaction[];
  settings: AppSettings;
  onAddTransaction: (tx: FinancialTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const Financeiro: React.FC<FinanceiroProps> = ({
  transactions,
  settings,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [filterType, setFilterType] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [category, setCategory] = useState<string>('Embalagens e Sacolas');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');

  const expenseCategories = [
    'Pagamento de Boleto',
    'Embalagens e Sacolas',
    'Frete e Entregas',
    'Amostras e Revistas',
    'Taxas de Maquininha',
    'Combustível / Deslocamento',
    'Outras Despesas'
  ];

  const incomeCategories = [
    'Venda de Produtos',
    'Recebimento de Fiado',
    'Entrada Especial / Outros'
  ];

  // Stats
  const totalIncome = transactions
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const handleOpenModal = () => {
    setType('despesa');
    setCategory('Embalagens e Sacolas');
    setDescription('');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('PIX');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      type,
      category,
      description: description.trim(),
      amount: Number(amount),
      date,
      paymentMethod,
    };

    onAddTransaction(newTx);
    setIsModalOpen(false);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'todos') return true;
    return t.type === filterType;
  });

  return (
    <div id="financeiro-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-950 font-serif">Fluxo Financeiro</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de entradas, saídas com fornecedores e despesas operacionais da revenda.
          </p>
        </div>
        <button
          id="btn-add-transaction"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Receitas</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-serif">{formatCurrency(totalIncome)}</div>
          <p className="text-xs text-slate-400 mt-1">vendas à vista e fiados recebidos</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Despesas</span>
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-700 font-serif">{formatCurrency(totalExpense)}</div>
          <p className="text-xs text-slate-400 mt-1">boletos pagos, sacolas e custos</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Saldo Líquido</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-serif ${netBalance >= 0 ? 'text-purple-950' : 'text-red-600'}`}>
            {formatCurrency(netBalance)}
          </div>
          <p className="text-xs text-slate-400 mt-1">resultado financeiro apurado</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-3xl border border-purple-100/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
              filterType === 'todos' ? 'bg-purple-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            Todos os Lançamentos ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('receita')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
              filterType === 'receita' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Apenas Entradas
          </button>
          <button
            onClick={() => setFilterType('despesa')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
              filterType === 'despesa' ? 'bg-red-700 text-white shadow-2xs' : 'text-red-700 hover:bg-red-50'
            }`}
          >
            Apenas Saídas
          </button>
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          Mostrando {filteredTransactions.length} registros
        </span>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-purple-100/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-500 uppercase bg-purple-50/40 border-b border-purple-100 font-semibold">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Forma</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum lançamento encontrado nesta categoria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isIncome = tx.type === 'receita';

                  return (
                    <tr key={tx.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isIncome ? (
                            <>
                              <ArrowUpRight className="w-3 h-3" /> Entrada
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3 h-3" /> Saída
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-purple-950">
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {tx.category}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {tx.paymentMethod}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold text-xs ${
                        isIncome ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {isIncome ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Excluir este lançamento "${tx.description}"?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-6 border border-purple-100">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-4">
              <h3 className="text-xl font-bold text-purple-950 font-serif">Novo Lançamento Financeiro</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                <button
                  type="button"
                  onClick={() => {
                    setType('despesa');
                    setCategory(expenseCategories[0]);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    type === 'despesa' ? 'bg-red-700 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Saída / Despesa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('receita');
                    setCategory(incomeCategories[0]);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    type === 'receita' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Entrada / Receita
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Descrição do Lançamento *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={type === 'despesa' ? 'Ex: 100 Sacolas com laço para presentes' : 'Ex: Venda de kits pronta-entrega'}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                  >
                    {(type === 'despesa' ? expenseCategories : incomeCategories).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Forma</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
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
                  Registrar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
