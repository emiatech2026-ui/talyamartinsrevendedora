import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  FileText, 
  Calculator, 
  BarChart3, 
  Settings, 
  Plus, 
  Sparkles,
  Menu,
  X,
  Send,
  AlertCircle,
  ListTodo
} from 'lucide-react';

import { Product, Customer, Order, Boleto, FinancialTransaction, AppSettings, OrderStatus, PaymentStatus, Task } from './types';
import { StorageService } from './lib/storage';
import { api } from './lib/api';

// 10 Pages
import { Dashboard } from './pages/Dashboard';
import { Catalogo } from './pages/Catalogo';
import { Estoque } from './pages/Estoque';
import { Pedidos } from './pages/Pedidos';
import { Clientes } from './pages/Clientes';
import { Tarefas } from './pages/Tarefas';
import { Financeiro } from './pages/Financeiro';
import { Boletos } from './pages/Boletos';
import { Calculadora } from './pages/Calculadora';
import { Relatorios } from './pages/Relatorios';
import { Config } from './pages/Config';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Core Data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());

  // Load all data on mount
  const loadAll = () => {
    setProducts(StorageService.getProducts());
    setCustomers(StorageService.getCustomers());
      setTasks(StorageService.getTasks());
    setOrders(StorageService.getOrders());
    setBoletos(StorageService.getBoletos());
    setTransactions(StorageService.getTransactions());
    setSettings(StorageService.getSettings());
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Handlers - Products
  const handleSaveProduct = async (product: Product) => {
    await api.saveProduct(product);
    loadAll();
  };

  const handleDeleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    loadAll();
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    const list = StorageService.getProducts();
    const idx = list.findIndex(p => p.id === productId);
    if (idx >= 0) {
      list[idx].stock = newStock;
      StorageService.saveProducts(list);
      setProducts([...list]);
    }
  };

  const handleBatchSaveProducts = async (productsToSave: Product[]) => {
    const list = StorageService.getProducts();
    for (const p of productsToSave) {
      const idx = list.findIndex(item => item.id === p.id || item.name.toLowerCase().trim() === p.name.toLowerCase().trim());
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...p };
      } else {
        list.unshift(p);
      }
    }
    StorageService.saveProducts(list);
    loadAll();
  };

  // Handlers - Customers
  
  const handleSaveTask = (task: Task) => {
    const isNew = !tasks.find((t) => t.id === task.id);
    let updated;
    if (isNew) {
      updated = [...tasks, task];
    } else {
      updated = tasks.map((t) => (t.id === task.id ? task : t));
    }
    setTasks(updated);
    StorageService.saveTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    StorageService.saveTasks(updated);
  };

  const handleSaveCustomer = async (customer: Customer) => {
    await api.saveCustomer(customer);
    loadAll();
  };

  const handleDeleteCustomer = async (id: string) => {
    await api.deleteCustomer(id);
    loadAll();
  };

  const handleSettleDebt = (customerId: string, amountPaid: number) => {
    const custs = StorageService.getCustomers();
    const idx = custs.findIndex(c => c.id === customerId);
    if (idx >= 0) {
      const remaining = Math.max(0, (custs[idx].outstandingBalance || 0) - amountPaid);
      custs[idx].outstandingBalance = remaining;
      StorageService.saveCustomers(custs);

      // Record transaction
      const txs = StorageService.getTransactions();
      txs.unshift({
        id: `tx-settle-${Date.now()}`,
        type: 'receita',
        category: 'Recebimento de Fiado',
        description: `Recebimento fiado - ${custs[idx].name}`,
        amount: amountPaid,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'PIX / Dinheiro',
        referenceId: customerId,
      });
      StorageService.saveTransactions(txs);

      loadAll();
    }
  };

  // Handlers - Orders
  const handleSaveOrder = async (order: Order) => {
    await api.saveOrder(order);
    loadAll();
  };

  const handleDeleteOrder = async (id: string) => {
    await api.deleteOrder(id);
    loadAll();
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const ords = StorageService.getOrders();
    const idx = ords.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      ords[idx].orderStatus = status;
      StorageService.saveOrders(ords);
      setOrders([...ords]);
    }
  };

  const handleUpdatePaymentStatus = (orderId: string, status: PaymentStatus, amountPaid: number) => {
    const ords = StorageService.getOrders();
    const idx = ords.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      ords[idx].paymentStatus = status;
      ords[idx].amountPaid = amountPaid;
      StorageService.saveOrders(ords);

      // Record transaction if paid
      const txs = StorageService.getTransactions();
      txs.unshift({
        id: `tx-ord-pay-${Date.now()}`,
        type: 'receita',
        category: 'Recebimento de Pedido',
        description: `Quitação Pedido ${ords[idx].orderNumber} - ${ords[idx].customerName}`,
        amount: amountPaid,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: ords[idx].paymentMethod,
        referenceId: orderId,
      });
      StorageService.saveTransactions(txs);

      loadAll();
    }
  };

  // Handlers - Boletos
  const handleSaveBoleto = async (boleto: Boleto) => {
    await api.saveBoleto(boleto);
    loadAll();
  };

  const handleDeleteBoleto = async (id: string) => {
    await api.deleteBoleto(id);
    loadAll();
  };

  const handleMarkBoletoPaid = (boletoId: string) => {
    const bols = StorageService.getBoletos();
    const idx = bols.findIndex(b => b.id === boletoId);
    if (idx >= 0) {
      bols[idx].status = 'pago';
      bols[idx].paidDate = new Date().toISOString().split('T')[0];
      StorageService.saveBoletos(bols);

      // Register financial expense
      const txs = StorageService.getTransactions();
      txs.unshift({
        id: `tx-boleto-${Date.now()}`,
        type: 'despesa',
        category: 'Pagamento de Boleto',
        description: `Boleto ${bols[idx].brand} - ${bols[idx].cycle}`,
        amount: bols[idx].amount,
        date: bols[idx].paidDate,
        paymentMethod: 'Boleto Bancário',
        referenceId: boletoId,
      });
      StorageService.saveTransactions(txs);

      loadAll();
    }
  };

  // Handlers - Financial
  const handleAddTransaction = (tx: FinancialTransaction) => {
    const list = StorageService.getTransactions();
    list.unshift(tx);
    StorageService.saveTransactions(list);
    setTransactions([...list]);
  };

  const handleDeleteTransaction = (id: string) => {
    const list = StorageService.getTransactions().filter(t => t.id !== id);
    StorageService.saveTransactions(list);
    setTransactions(list);
  };

  // Navigation tabs definition
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalogo', label: 'Catálogo', icon: BookOpen },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'pedidos', label: 'Pedidos & Vendas', icon: ShoppingBag },
    { id: 'clientes', label: 'Clientes & Fiado', icon: Users },
    { id: 'tarefas', label: 'Tarefas', icon: ListTodo },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'boletos', label: 'Boletos', icon: FileText },
    { id: 'calculadora', label: 'Calculadora', icon: Calculator },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

  // Active brand list for subtitle
  const activeBrandNames = settings.brands && settings.brands.length > 0 
    ? settings.brands.map(b => b.name).join(' • ') 
    : 'O Boticário • Eudora';

  return (
    <div id="app-root" className="min-h-screen bg-[#FAF8FD] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 px-4 lg:px-8 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-purple-50"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-purple-900" /> : <Menu className="w-5 h-5 text-purple-900" />}
          </button>

          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="cursor-pointer flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-900 to-violet-950 text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
              T
            </div>
            <div>
              <span className="font-serif font-bold text-purple-950 text-lg leading-tight block">
                {settings.resellerName || 'Talya Martins Revenda'}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                {activeBrandNames}
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pedidos')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Nova Venda
          </button>

          <button
            onClick={() => setActiveTab('catalogo')}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-purple-200 text-purple-950 hover:bg-purple-50 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-purple-800" />
            Novo Cosmético
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className="p-2 rounded-xl text-slate-500 hover:text-purple-950 hover:bg-purple-50 transition-colors"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 bg-white border-r border-purple-100/80 flex-col p-4 space-y-1 shrink-0 select-none">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu de Gestão
          </div>

          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-purple-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-purple-50/80 hover:text-purple-950'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-800/60'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-6 mt-auto">
            <div className="p-3.5 bg-gradient-to-br from-purple-50 via-white to-emerald-50/60 rounded-2xl border border-purple-100 text-xs text-purple-950">
              <span className="font-bold block text-[11px] uppercase tracking-wider text-purple-900 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Pronta-Entrega
              </span>
              <p className="text-[11px] text-slate-600">
                {products.filter(p => p.stock > 0).length} cosméticos cadastrados para venda imediata.
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            <div className="relative w-64 max-w-[80vw] bg-white h-full p-4 flex flex-col space-y-1.5 z-10 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <span className="font-serif font-bold text-purple-950 text-base">Navegação</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-2 space-y-1 overflow-y-auto flex-1">
                {navigationItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive 
                          ? 'bg-purple-900 text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:bg-purple-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Active Page Viewport */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              products={products}
              customers={customers}
              orders={orders}
              boletos={boletos}
              settings={settings}
              onNavigate={(tab) => setActiveTab(tab)}
              onNewOrder={() => setActiveTab('pedidos')}
              onNewProduct={() => setActiveTab('catalogo')}
            />
          )}

          {activeTab === 'catalogo' && (
            <Catalogo
              products={products}
              settings={settings}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onQuickOrder={() => setActiveTab('pedidos')}
            />
          )}

          {activeTab === 'estoque' && (
            <Estoque
              products={products}
              settings={settings}
              onUpdateStock={handleUpdateStock}
              onAddProducts={handleBatchSaveProducts}
              onNavigateToCatalog={() => setActiveTab('catalogo')}
              onNavigateToNewOrder={() => setActiveTab('pedidos')}
            />
          )}

          {activeTab === 'pedidos' && (
            <Pedidos
              orders={orders}
              products={products}
              customers={customers}
              settings={settings}
              onSaveOrder={handleSaveOrder}
              onDeleteOrder={handleDeleteOrder}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />
          )}

          {activeTab === 'clientes' && (
            <Clientes
              customers={customers}
              settings={settings}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onSettleDebt={handleSettleDebt}
            />
          )}

          {activeTab === 'tarefas' && (
            <Tarefas
              tasks={tasks}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'financeiro' && (
            <Financeiro
              transactions={transactions}
              settings={settings}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'boletos' && (
            <Boletos
              boletos={boletos}
              settings={settings}
              onSaveBoleto={handleSaveBoleto}
              onDeleteBoleto={handleDeleteBoleto}
              onMarkAsPaid={handleMarkBoletoPaid}
            />
          )}

          {activeTab === 'calculadora' && (
            <Calculadora
              settings={settings}
            />
          )}

          {activeTab === 'relatorios' && (
            <Relatorios
              orders={orders}
              products={products}
              customers={customers}
              settings={settings}
            />
          )}

          {activeTab === 'config' && (
            <Config
              settings={settings}
              onSaveSettings={async (updated) => {
                await api.saveSettings(updated);
                loadAll();
              }}
              onReloadAllData={loadAll}
            />
          )}
        </main>
      </div>
    </div>
  );
}
