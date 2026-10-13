import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  ShoppingBag, 
  Trash2, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Filter, 
  Eye, 
  FileText, 
  DollarSign, 
  X,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { Order, OrderItem, Product, Customer, OrderStatus, PaymentStatus, PaymentMethod, AppSettings } from '../types';
import { formatCurrency, formatDate, StorageService } from '../lib/storage';
import { SendMessageModal } from '../components/SendMessageModal';
import { MessageTemplateType } from '../lib/messageTemplates';

interface PedidosProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  settings: AppSettings;
  onSaveOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus, amountPaid: number) => void;
}

export const Pedidos: React.FC<PedidosProps> = ({
  orders,
  products,
  customers,
  settings,
  onSaveOrder,
  onDeleteOrder,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');

  // Modal New Order
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');

  // Cart
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pago');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // View Receipt Modal
  const [viewOrderReceipt, setViewOrderReceipt] = useState<Order | null>(null);

  // Send Message Modal State
  const [messagingCustomer, setMessagingCustomer] = useState<Customer | null>(null);
  const [messageInitialTemplate, setMessageInitialTemplate] = useState<MessageTemplateType | undefined>(undefined);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);

  const handleOpenOrderMessage = (order: Order, templateType?: MessageTemplateType) => {
    const existing = customers.find(c => c.id === order.customerId || c.name.toLowerCase() === order.customerName.toLowerCase());
    const remainingBalance = Math.max(0, order.total - (order.amountPaid || 0));
    const cust: Customer = existing ? {
      ...existing,
      outstandingBalance: remainingBalance > 0 ? remainingBalance : existing.outstandingBalance
    } : {
      id: order.customerId || `temp-${order.id}`,
      name: order.customerName,
      phone: order.customerPhone,
      outstandingBalance: remainingBalance,
      totalPurchased: order.total,
    };

    setMessagingCustomer(cust);
    setMessageInitialTemplate(templateType || (remainingBalance > 0 ? 'debtReminder' : 'orderReady'));
    setIsSendMessageModalOpen(true);
  };

  // Cart Calculations
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const cartCost = cartItems.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
  const cartTotal = Math.max(0, cartSubtotal - (Number(discountAmount) || 0));
  const cartProfit = cartTotal - cartCost;

  const handleOpenNewOrder = () => {
    setSelectedCustomerId(customers[0]?.id || '');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setCartItems([]);
    setDiscountAmount(0);
    setPaymentMethod('PIX');
    setPaymentStatus('pago');
    setAmountPaid(0);
    setOrderNotes('');
    setIsModalOpen(true);
  };

  const handleAddItemToCart = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const existingIdx = cartItems.findIndex(i => i.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...cartItems];
      updated[existingIdx].quantity += quantityToAdd;
      updated[existingIdx].subtotal = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: prod.id,
          productName: prod.name,
          brand: prod.brand,
          quantity: quantityToAdd,
          unitCost: prod.costPrice,
          unitPrice: prod.sellingPrice,
          subtotal: prod.sellingPrice * quantityToAdd,
        }
      ]);
    }
    setQuantityToAdd(1);
  };

  const handleRemoveCartItem = (idx: number) => {
    setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  const handleSaveNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Adicione ao menos um produto no pedido.');
      return;
    }

    let customerName = '';
    let customerPhone = '';
    let customerId = selectedCustomerId;

    if (selectedCustomerId === 'novo') {
      if (!newCustomerName.trim()) {
        alert('Por favor, informe o nome da nova cliente.');
        return;
      }
      customerName = newCustomerName.trim();
      customerPhone = newCustomerPhone.trim() || '(não informado)';
      customerId = `cust-${Date.now()}`;
    } else {
      const found = customers.find(c => c.id === selectedCustomerId);
      customerName = found ? found.name : 'Cliente Avulso';
      customerPhone = found ? found.phone : '';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const orderNum = `PED-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      customerId,
      customerName,
      customerPhone,
      date: todayStr,
      items: cartItems,
      subtotal: cartSubtotal,
      discount: Number(discountAmount) || 0,
      total: cartTotal,
      totalCost: cartCost,
      profit: cartProfit,
      orderStatus: 'separado',
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      amountPaid: paymentStatus === 'pago' ? cartTotal : (Number(amountPaid) || 0),
      notes: orderNotes.trim() || undefined,
    };

    onSaveOrder(newOrder);
    setIsModalOpen(false);
    setViewOrderReceipt(newOrder);
  };

  // WhatsApp share
  const handleShareWhatsApp = (order: Order) => {
    const text = StorageService.generateWhatsAppReceipt(order, settings);
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const url = cleanPhone.length >= 10 
      ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filter Orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || o.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === 'todos' || o.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div id="pedidos-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-950 font-serif">Vendas & Pedidos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registre vendas, envie comprovante pelo WhatsApp e acompanhe recebimentos de fiado.
          </p>
        </div>
        <button
          id="btn-new-order"
          onClick={handleOpenNewOrder}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Pedido de Venda
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-100/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por número do pedido ou nome da cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-purple-50/30 border border-purple-100 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="todos">Status: Todos</option>
              <option value="pendente">Pendente</option>
              <option value="separado">Separado</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="todos">Pagamento: Todos</option>
              <option value="pago">Pago</option>
              <option value="parcial">Parcial (Fiado)</option>
              <option value="pendente">Pendente (Fiado)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-purple-100">
            <ShoppingBag className="w-12 h-12 text-purple-200 mx-auto mb-3" />
            <h3 className="font-bold text-purple-950 font-serif">Nenhum pedido encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">Crie um novo pedido para começar a registrar suas vendas de cosméticos.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isFullyPaid = order.paymentStatus === 'pago';
            const pendingAmount = Math.max(0, order.total - order.amountPaid);

            return (
              <div 
                key={order.id}
                className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs hover:border-purple-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Order Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-950">{order.orderNumber}</span>
                    <span className="text-xs text-slate-400">• {formatDate(order.date)}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      order.orderStatus === 'entregue' ? 'bg-emerald-100 text-emerald-800' :
                      order.orderStatus === 'separado' ? 'bg-purple-100 text-purple-800' :
                      order.orderStatus === 'cancelado' ? 'bg-slate-200 text-slate-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {order.orderStatus.toUpperCase()}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isFullyPaid ? 'bg-emerald-100 text-emerald-800' :
                      order.paymentStatus === 'parcial' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {isFullyPaid ? 'PAGO' : `FIADO (Pendente ${formatCurrency(pendingAmount)})`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-purple-950 text-sm">{order.customerName}</h3>
                    {order.customerPhone && (
                      <span className="text-xs text-slate-400">({order.customerPhone})</span>
                    )}
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-slate-600 bg-purple-50/40 p-2.5 rounded-2xl border border-purple-100/60">
                    <strong className="text-purple-950">Itens: </strong>
                    {order.items.map((i, idx) => (
                      <span key={idx} className="mr-2">
                        {i.quantity}x {i.productName} ({formatCurrency(i.subtotal)})
                      </span>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-xs text-slate-500 italic">Obs: {order.notes}</p>
                  )}
                </div>

                {/* Financial Summary & Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Total Venda</div>
                    <div className="text-xl font-black text-purple-950 font-serif">{formatCurrency(order.total)}</div>
                    <div className="text-xs text-emerald-700 font-bold">Lucro: +{formatCurrency(order.profit)}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp receipt */}
                    <button
                      onClick={() => handleShareWhatsApp(order)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                      title="Enviar recibo pelo WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>

                    {/* Mensagem Padrão (Cobrança, Pedido Pronto, Agradecimento) */}
                    <button
                      onClick={() => handleOpenOrderMessage(order)}
                      className="p-1.5 text-purple-900 hover:bg-purple-100/60 rounded-xl transition-colors border border-purple-200/60"
                      title="Enviar Mensagem Personalizada (Pedido Pronto, Cobrança, Agradecimento)"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* View Receipt */}
                    <button
                      onClick={() => setViewOrderReceipt(order)}
                      className="p-1.5 text-slate-500 hover:text-purple-950 hover:bg-purple-50 rounded-xl transition-colors"
                      title="Ver Comprovante"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Status Toggle */}
                    {order.orderStatus !== 'entregue' && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'entregue')}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-semibold flex items-center gap-1"
                        title="Marcar como Entregue"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quitar Fiado */}
                    {!isFullyPaid && (
                      <button
                        onClick={() => onUpdatePaymentStatus(order.id, 'pago', order.total)}
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl"
                        title="Quitar Fiado"
                      >
                        Quitar
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Excluir pedido ${order.orderNumber}?`)) {
                          onDeleteOrder(order.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New Order Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto border border-purple-100">
            <div className="flex items-center justify-between border-b border-purple-100 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-purple-950 font-serif">Novo Pedido de Venda</h3>
                <p className="text-xs text-slate-500">Selecione a cliente e adicione os cosméticos vendidos</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewOrder} className="space-y-4">
              {/* Customer Select */}
              <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-700">Cliente *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                >
                  <option value="novo">➕ Cadastrar Nova Cliente Agora</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} {c.outstandingBalance > 0 ? `[Deve ${formatCurrency(c.outstandingBalance)}]` : ''}
                    </option>
                  ))}
                </select>

                {selectedCustomerId === 'novo' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Nome da nova cliente *"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="WhatsApp (ex: 11988887777)"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Add Product Line */}
              <div className="bg-white p-4 rounded-2xl border border-purple-200 space-y-3">
                <span className="text-xs font-bold uppercase text-purple-900">Adicionar Produtos ao Pedido</span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-8">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Selecione o cosmético do estoque...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.brand} - {p.name} ({formatCurrency(p.sellingPrice)}) [{p.stock} un. em estoque]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={quantityToAdd}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-center font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToCart}
                      disabled={!selectedProductId}
                      className="w-full py-2 bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Items in cart table */}
                {cartItems.length > 0 && (
                  <div className="mt-3 border border-purple-100 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-purple-50/70 text-purple-950 uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5 text-center">Qtd</th>
                          <th className="p-2.5 text-right">Unitário</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                          <th className="p-2.5 text-center">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50">
                        {cartItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-medium text-slate-800">{item.productName}</td>
                            <td className="p-2.5 text-center font-bold text-slate-900">{item.quantity}</td>
                            <td className="p-2.5 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2.5 text-right font-bold text-purple-950">{formatCurrency(item.subtotal)}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveCartItem(idx)}
                                className="text-slate-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payment and Discount Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Fiado / A Prazo">Fiado / A Prazo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Status do Pagamento
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="pago">Pago Integralmente</option>
                    <option value="parcial">Pagamento Parcial (Entrada)</option>
                    <option value="pendente">Pendente (Total no Fiado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Desconto Especial (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={discountAmount === 0 ? '' : discountAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setDiscountAmount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {paymentStatus === 'parcial' && (
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                  <label className="block text-xs font-bold uppercase text-amber-900 mb-1">
                    Valor Pago na Entrada (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amountPaid === 0 ? '' : amountPaid}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setAmountPaid(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-sm font-bold"
                  />
                  <p className="text-[11px] text-amber-800 mt-1">
                    O restante de {formatCurrency(Math.max(0, cartTotal - amountPaid))} será somado ao saldo devedor (fiado) da cliente.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Observações da Venda
                </label>
                <input
                  type="text"
                  placeholder="Ex: Entregar na terça-feira à tarde no salão"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Total Calculation Display */}
              <div className="p-4 bg-gradient-to-r from-purple-950 via-purple-900 to-emerald-950 text-white rounded-2xl flex items-center justify-between border border-purple-800">
                <div>
                  <span className="text-[11px] text-purple-200">Total a Cobrar:</span>
                  <div className="text-2xl font-black text-white font-serif">{formatCurrency(cartTotal)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-300 font-medium">Lucro Líquido:</span>
                  <div className="text-lg font-bold text-emerald-300">+{formatCurrency(cartProfit)}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  Confirmar e Gerar Recibo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Receipt / WhatsApp */}
      {viewOrderReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative border border-purple-100">
            <div className="text-center mb-4">
              <span className="text-3xl">🛍️</span>
              <h3 className="text-xl font-bold text-purple-950 mt-1 font-serif">Comprovante de Venda</h3>
              <p className="text-xs text-slate-500">{settings.resellerName}</p>
            </div>

            <div className="bg-purple-50/40 p-4 rounded-2xl text-xs space-y-2 font-mono border border-purple-100">
              <div className="flex justify-between">
                <span>Pedido:</span>
                <strong className="text-purple-950">{viewOrderReceipt.orderNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Data:</span>
                <span>{formatDate(viewOrderReceipt.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <strong>{viewOrderReceipt.customerName}</strong>
              </div>
              <hr className="border-dashed border-purple-200" />
              {viewOrderReceipt.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{i.quantity}x {i.productName}</span>
                  <span>{formatCurrency(i.subtotal)}</span>
                </div>
              ))}
              {viewOrderReceipt.discount > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(viewOrderReceipt.discount)}</span>
                </div>
              )}
              <hr className="border-dashed border-purple-200" />
              <div className="flex justify-between text-sm font-bold text-purple-950">
                <span>TOTAL:</span>
                <span>{formatCurrency(viewOrderReceipt.total)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Forma de Pagto:</span>
                <span>{viewOrderReceipt.paymentMethod}</span>
              </div>
              {viewOrderReceipt.amountPaid < viewOrderReceipt.total && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Saldo a Pagar (Fiado):</span>
                  <span>{formatCurrency(viewOrderReceipt.total - viewOrderReceipt.amountPaid)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => handleShareWhatsApp(viewOrderReceipt)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                Enviar Comprovante via WhatsApp
              </button>
              <button
                onClick={() => {
                  const o = viewOrderReceipt;
                  setViewOrderReceipt(null);
                  handleOpenOrderMessage(o, o.orderStatus === 'entregue' ? 'thankYou' : 'orderReady');
                }}
                className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-purple-200 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-purple-700" />
                Avisar Cliente no WhatsApp (Texto Padrão)
              </button>
              <button
                onClick={() => setViewOrderReceipt(null)}
                className="w-full py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message to Customer Modal */}
      <SendMessageModal
        isOpen={isSendMessageModalOpen}
        onClose={() => setIsSendMessageModalOpen(false)}
        customer={messagingCustomer}
        initialTemplate={messageInitialTemplate}
        settings={settings}
      />
    </div>
  );
};
