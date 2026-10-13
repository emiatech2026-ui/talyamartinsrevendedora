import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Users, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  PieChart as PieChartIcon, 
  Calendar,
  Layers
} from 'lucide-react';
import { Order, Product, Customer, AppSettings } from '../types';
import { formatCurrency } from '../lib/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface RelatoriosProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  settings?: AppSettings;
}

const COLORS = ['#059669', '#7e22ce', '#db2777', '#ca8a04', '#0284c7', '#dc2626'];

export const Relatorios: React.FC<RelatoriosProps> = ({
  orders,
  products,
  customers,
  settings,
}) => {
  const [period, setPeriod] = useState<'30' | '90' | 'all'>('all');

  // Filter orders by period if desired
  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    const now = new Date();
    const days = parseInt(period);
    const cutoff = new Date(now.setDate(now.getDate() - days)).getTime();
    return orders.filter(o => new Date(o.date).getTime() >= cutoff);
  }, [orders, period]);

  // Overall metrics
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + o.total, 0);
  const totalProfit = filteredOrders.reduce((acc, o) => acc + o.profit, 0);
  const totalOrdersCount = filteredOrders.length;
  const averageTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Chart Data preparation
  const brandSales: Record<string, { total: number; count: number; profit: number }> = {};
  const productSalesCount: Record<string, { name: string; brand: string; qty: number; total: number }> = {};
  const monthlySales: Record<string, number> = {};

  filteredOrders.forEach(o => {
    // Monthly data
    const month = o.date.substring(0, 7); // YYYY-MM
    monthlySales[month] = (monthlySales[month] || 0) + o.total;

    o.items.forEach(i => {
      const b = i.brand || 'Outros';
      if (!brandSales[b]) {
        brandSales[b] = { total: 0, count: 0, profit: 0 };
      }
      brandSales[b].total += i.subtotal;
      brandSales[b].count += i.quantity;
      brandSales[b].profit += (i.subtotal - (i.unitCost * i.quantity));

      // Product
      if (!productSalesCount[i.productId]) {
        productSalesCount[i.productId] = {
          name: i.productName,
          brand: i.brand,
          qty: 0,
          total: 0,
        };
      }
      productSalesCount[i.productId].qty += i.quantity;
      productSalesCount[i.productId].total += i.subtotal;
    });
  });

  const chartDataMonthly = Object.keys(monthlySales).sort().map(k => ({
    name: k.split('-').reverse().join('/'), // MM/YYYY
    Faturamento: monthlySales[k]
  }));

  const chartDataBrands = Object.entries(brandSales).map(([name, data]) => ({
    name,
    Faturamento: data.total,
    Lucro: data.profit
  })).sort((a, b) => b.Faturamento - a.Faturamento);

  const topProducts = Object.values(productSalesCount)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const topCustomers = [...customers]
    .sort((a, b) => (b.totalPurchased || 0) - (a.totalPurchased || 0))
    .slice(0, 5);

  // Payment breakdown
  const paymentMethodsStats: Record<string, number> = {};
  filteredOrders.forEach(o => {
    paymentMethodsStats[o.paymentMethod] = (paymentMethodsStats[o.paymentMethod] || 0) + o.total;
  });
  const chartDataPayment = Object.entries(paymentMethodsStats).map(([name, value]) => ({ name, value }));

  return (
    <div id="relatorios-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-950 font-serif">Relatórios & Desempenho</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de faturamento, gráficos de vendas mensais e lucros.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3.5 py-2 bg-white border border-purple-100 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todo o Histórico</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Faturado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-purple-950 font-serif">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-slate-400 mt-1">{totalOrdersCount} pedidos concluídos</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lucro Líquido</span>
            <TrendingUp className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-serif">+{formatCurrency(totalProfit)}</div>
          <p className="text-xs text-slate-400 mt-1">
            Margem média: {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ticket Médio</span>
            <ShoppingBag className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-2xl font-black text-purple-950 font-serif">{formatCurrency(averageTicket)}</div>
          <p className="text-xs text-slate-400 mt-1">gasto médio por compra</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Carteira Ativa</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-purple-950 font-serif">{customers.length} clientes</div>
          <p className="text-xs text-slate-400 mt-1">base total cadastrada</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-3xl border border-purple-100/80 shadow-xs">
          <h2 className="font-bold text-purple-950 text-base font-serif mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-800" />
            Evolução Mensal de Faturamento
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataMonthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 11}} tickFormatter={(v) => `R$${v}`} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  cursor={{fill: '#f3e8ff'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="Faturamento" fill="#7e22ce" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Brand */}
        <div className="bg-white p-6 rounded-3xl border border-purple-100/80 shadow-xs">
          <h2 className="font-bold text-purple-950 text-base font-serif mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-800" />
            Faturamento e Lucro por Marca
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataBrands} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{fontSize: 11}} axisLine={false} tickLine={false} hide />
                <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#1e293b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  cursor={{fill: '#f3e8ff'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                <Bar dataKey="Faturamento" fill="#10b981" radius={[0, 6, 6, 0]} barSize={16} />
                <Bar dataKey="Lucro" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-purple-100/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-purple-950 text-base font-serif flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top 5 Produtos Mais Vendidos
            </h3>
            <span className="text-xs text-slate-400">Curva ABC</span>
          </div>

          <div className="space-y-2.5">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma venda registrada ainda.</p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/30 border border-purple-100/60 transition-colors hover:bg-purple-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-950 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-purple-950">{p.name}</h4>
                      <span className="text-[11px] text-slate-400">{p.brand}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-purple-950">{p.qty} un. vendidas</div>
                    <div className="text-[11px] text-slate-500">{formatCurrency(p.total)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Formats & Customers */}
        <div className="space-y-6 flex flex-col h-full">
          <div className="bg-white p-6 rounded-3xl border border-purple-100/80 shadow-xs flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-purple-950 text-base font-serif flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-800" />
                Melhores Clientes
              </h3>
            </div>
            <div className="space-y-2.5">
              {topCustomers.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Nenhum cliente cadastrado.</p>
              ) : (
                topCustomers.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/30 border border-emerald-100/60 transition-colors hover:bg-emerald-50">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-purple-950">{c.name}</h4>
                        <span className="text-[11px] text-slate-400">{c.phone || 'Sem fone'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-purple-950">{formatCurrency(c.totalPurchased)}</div>
                      {c.outstandingBalance > 0 && (
                        <div className="text-[10px] text-amber-700 font-semibold">Fiado: {formatCurrency(c.outstandingBalance)}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-purple-100/80 shadow-xs">
            <h3 className="font-bold text-purple-950 text-base font-serif flex items-center gap-2 mb-4">
               <PieChartIcon className="w-5 h-5 text-purple-800" /> Formas de Pagamento
            </h3>
            <div className="h-28 flex items-center justify-center">
              {chartDataPayment.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartDataPayment} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} fill="#8884d8">
                      {chartDataPayment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{fontSize: '12px'}} />
                    <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <p className="text-xs text-slate-400">Nenhum pagamento registrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
