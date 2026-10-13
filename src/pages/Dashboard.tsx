import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  ShoppingBag, 
  Users, 
  FileText, 
  PlusCircle, 
  Package, 
  Calendar, 
  ArrowUpRight,
  MessageCircle,
  Gift,
  CheckCircle2
} from 'lucide-react';
import { Product, Customer, Order, Boleto, AppSettings } from '../types';
import { formatCurrency, formatDate } from '../lib/storage';
import { SendMessageModal } from '../components/SendMessageModal';

interface DashboardProps {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  boletos: Boleto[];
  settings: AppSettings;
  onNavigate: (tab: string) => void;
  onNewOrder: () => void;
  onNewProduct: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  customers,
  orders,
  boletos,
  settings,
  onNavigate,
  onNewOrder,
  onNewProduct,
}) => {
  // Calculations
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.total, 0);
  const totalProfit = orders.reduce((acc, curr) => acc + curr.profit, 0);
  const totalOutstanding = customers.reduce((acc, curr) => acc + (curr.outstandingBalance || 0), 0);
  
  const pendingBoletos = boletos.filter(b => b.status === 'pendente');
  const totalPendingBoletos = pendingBoletos.reduce((acc, curr) => acc + curr.amount, 0);

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // Month progress
  const revenueGoal = settings.monthlyRevenueGoal || 6500;
  const goalPercentage = Math.min(Math.round((totalRevenue / revenueGoal) * 100), 100);

  // Send Birthday Message Modal
  const [selectedBirthdayCust, setSelectedBirthdayCust] = useState<Customer | null>(null);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState<boolean>(false);

  const handleOpenBirthdayMessage = (cust: Customer) => {
    setSelectedBirthdayCust(cust);
    setIsBirthdayModalOpen(true);
  };

  // Birthday customers this month
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const birthdayCustomers = customers.filter(c => {
    if (!c.birthDate) return false;
    const parts = c.birthDate.split('-');
    return parts.length >= 2 && parseInt(parts[1], 10) === currentMonth;
  });

  const recentOrders = [...orders].reverse().slice(0, 5);

  const brandNames = settings.brands && settings.brands.length > 0
    ? settings.brands.map(b => b.name).join(', ')
    : 'O Boticário, Eudora';

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-r from-purple-950 via-purple-900 to-emerald-950 text-white p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden border border-purple-800/40">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-emerald-300 backdrop-blur-xs mb-2 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Painel da Revendedora Oficial
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
            Olá, {settings.resellerName}!
          </h1>
          <p className="text-purple-200 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Acompanhe suas vendas de {brandNames}, organize pronta-entrega e receba fiados sem dor de cabeça.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            id="btn-quick-new-order"
            onClick={onNewOrder}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Nova Venda
          </button>
          <button
            id="btn-quick-new-product"
            onClick={onNewProduct}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs border border-white/20 backdrop-blur-xs transition-colors"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            Cadastrar Produto
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vendas */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vendas Realizadas</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 font-serif">{formatCurrency(totalRevenue)}</div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Meta: {formatCurrency(revenueGoal)}</span>
            <span className="font-bold text-emerald-700">{goalPercentage}% atingido</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${goalPercentage}%` }} 
            />
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lucro Estimado</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-serif">{formatCurrency(totalProfit)}</div>
          <p className="text-xs text-slate-500 mt-3">
            Margem média apurada de <strong className="text-purple-950">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</strong>
          </p>
        </div>

        {/* Contas a Receber (Fiado) */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">A Receber (Fiado)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 font-serif">{formatCurrency(totalOutstanding)}</div>
          <button
            onClick={() => onNavigate('clientes')}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
          >
            Ver clientes devedores <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Boletos a Pagar */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Boletos das Marcas</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 font-serif">{formatCurrency(totalPendingBoletos)}</div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{pendingBoletos.length} em aberto</span>
            <button 
              onClick={() => onNavigate('boletos')}
              className="font-semibold text-purple-900 hover:underline"
            >
              Ver vencimentos
            </button>
          </div>
        </div>
      </div>

      {/* Birthday Banner */}
      {birthdayCustomers.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 via-emerald-50/40 to-white border border-purple-200/80 p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-purple-950">
                🎉 Aniversariantes do Mês ({birthdayCustomers.length})
              </h2>
              <p className="text-xs text-slate-600">
                {birthdayCustomers.map(c => c.name).join(', ')} celebram neste mês! Envie um carinho especial no WhatsApp.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {birthdayCustomers.length === 1 ? (
              <button
                onClick={() => handleOpenBirthdayMessage(birthdayCustomers[0])}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Enviar Parabéns ({birthdayCustomers[0].name.split(' ')[0]})
              </button>
            ) : (
              <>
                {birthdayCustomers.slice(0, 3).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleOpenBirthdayMessage(c)}
                    className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
                    title={`Enviar parabéns para ${c.name}`}
                  >
                    <Gift className="w-3 h-3 text-emerald-300" /> {c.name.split(' ')[0]}
                  </button>
                ))}
                <button
                  onClick={() => onNavigate('clientes')}
                  className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-950 text-xs font-semibold rounded-xl border border-purple-200 transition-colors"
                >
                  Ver Todas
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout: Low Stock Warnings & Upcoming Boletos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerta de Estoque Baixo */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-purple-950 text-base font-serif">Alerta de Reposição ({lowStockProducts.length})</h2>
            </div>
            <button
              onClick={() => onNavigate('estoque')}
              className="text-xs font-semibold text-purple-900 hover:underline flex items-center gap-1"
            >
              Ir para Estoque <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Nenhum cosmético com estoque crítico no momento.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockProducts.map(p => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-slate-800 line-clamp-1 text-xs sm:text-sm">{p.name}</p>
                    <span className="text-[11px] text-slate-400 font-normal">{p.brand} • {p.category}</span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                      p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.stock === 0 ? 'Esgotado' : `${p.stock} em estoque`}
                    </span>
                    <p className="text-[10px] text-slate-400">mín. {p.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Boletos Próximos */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-900" />
              <h2 className="font-bold text-purple-950 text-base font-serif">Boletos Próximos de Vencimento</h2>
            </div>
            <button
              onClick={() => onNavigate('boletos')}
              className="text-xs font-semibold text-purple-900 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingBoletos.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Todos os seus boletos de fornecedores estão quitados!</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingBoletos.slice(0, 3).map(b => (
                <div key={b.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-950 text-xs sm:text-sm">{b.brand}</span>
                      <span className="text-[11px] px-2 py-0.5 bg-purple-50 text-purple-800 rounded-md font-semibold">
                        {b.cycle}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Vencimento: <strong className="text-slate-700">{formatDate(b.dueDate)}</strong></p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatCurrency(b.amount)}</span>
                    <p className="text-[11px] text-amber-600 font-semibold">Aguardando Pagamento</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-100/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-900" />
            <h2 className="font-bold text-purple-950 text-base font-serif">Últimos Pedidos & Vendas</h2>
          </div>
          <button
            onClick={() => onNavigate('pedidos')}
            className="text-xs font-semibold text-purple-900 hover:underline flex items-center gap-1"
          >
            Ver todos os pedidos <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50/70 border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Pedido / Data</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Itens</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Status Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{order.orderNumber}</span>
                    <p className="text-xs text-slate-400">{formatDate(order.date)}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{order.customerName}</p>
                    <p className="text-xs text-slate-400">{order.customerPhone}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                  </td>
                  <td className="py-3 px-4 font-bold text-purple-950">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      order.paymentStatus === 'pago'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.paymentStatus === 'parcial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.paymentStatus === 'pago' ? 'Pago' : order.paymentStatus === 'parcial' ? 'Parcial' : 'Pendente'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{order.paymentMethod}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      order.orderStatus === 'entregue'
                        ? 'bg-emerald-50 text-emerald-800'
                        : order.orderStatus === 'separado'
                        ? 'bg-purple-50 text-purple-800'
                        : 'bg-amber-50 text-amber-800'
                    }`}>
                      {order.orderStatus.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Message to Birthday Customer Modal */}
      <SendMessageModal
        isOpen={isBirthdayModalOpen}
        onClose={() => setIsBirthdayModalOpen(false)}
        customer={selectedBirthdayCust}
        initialTemplate="birthday"
        settings={settings}
      />
    </div>
  );
};
