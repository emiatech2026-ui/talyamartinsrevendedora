import { Product, Customer, Order, Boleto, FinancialTransaction, AppSettings } from '../types';
import { StorageService } from './storage';

// Unified API client that persists to LocalStorage with fallback/sync
// and integrates with Cloudflare Worker API when available.
const API_BASE = (typeof window !== 'undefined' && (window as unknown as { __API_URL__?: string }).__API_URL__) || '';

export const api = {
  // Produtos
  async getProducts(): Promise<Product[]> {
    try {
      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/products`);
        if (res.ok) return await res.json();
      }
    } catch (e) {
      console.warn('Backend indisponível, usando armazenamento local', e);
    }
    return StorageService.getProducts();
  },

  async saveProduct(product: Product): Promise<Product> {
    const products = StorageService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    StorageService.saveProducts(products);

    try {
      if (API_BASE) {
        await fetch(`${API_BASE}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
      }
    } catch (e) {
      console.warn('Erro ao sincronizar com backend remoto', e);
    }
    return product;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const products = StorageService.getProducts().filter(p => p.id !== id);
    StorageService.saveProducts(products);

    try {
      if (API_BASE) {
        await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Erro ao deletar no backend remoto', e);
    }
    return true;
  },

  // Clientes
  async getCustomers(): Promise<Customer[]> {
    return StorageService.getCustomers();
  },

  async saveCustomer(customer: Customer): Promise<Customer> {
    const list = StorageService.getCustomers();
    const idx = list.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      list[idx] = customer;
    } else {
      list.unshift(customer);
    }
    StorageService.saveCustomers(list);
    return customer;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const list = StorageService.getCustomers().filter(c => c.id !== id);
    StorageService.saveCustomers(list);
    return true;
  },

  // Pedidos
  async getOrders(): Promise<Order[]> {
    return StorageService.getOrders();
  },

  async saveOrder(order: Order): Promise<Order> {
    const list = StorageService.getOrders();
    const idx = list.findIndex(o => o.id === order.id);
    if (idx >= 0) {
      list[idx] = order;
    } else {
      list.unshift(order);
    }
    StorageService.saveOrders(list);

    // Update customer total & balance
    const customers = StorageService.getCustomers();
    const custIdx = customers.findIndex(c => c.id === order.customerId);
    if (custIdx >= 0) {
      const customer = customers[custIdx];
      customer.totalPurchased = (customer.totalPurchased || 0) + order.total;
      customer.lastPurchaseDate = order.date;
      if (order.paymentStatus === 'parcial' || order.paymentMethod === 'Fiado / A Prazo') {
        const remaining = order.total - (order.amountPaid || 0);
        if (remaining > 0) {
          customer.outstandingBalance = (customer.outstandingBalance || 0) + remaining;
        }
      }
      StorageService.saveCustomers(customers);
    }

    // Auto record transaction
    if (order.amountPaid > 0) {
      const txs = StorageService.getTransactions();
      txs.unshift({
        id: `tx-ord-${order.id}-${Date.now()}`,
        type: 'receita',
        category: 'Venda de Produtos',
        description: `Pedido ${order.orderNumber} - ${order.customerName}`,
        amount: order.amountPaid,
        date: order.date,
        paymentMethod: order.paymentMethod,
        referenceId: order.id,
      });
      StorageService.saveTransactions(txs);
    }

    // Update product stock
    const products = StorageService.getProducts();
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    });
    StorageService.saveProducts(products);

    return order;
  },

  async deleteOrder(id: string): Promise<boolean> {
    const list = StorageService.getOrders().filter(o => o.id !== id);
    StorageService.saveOrders(list);
    return true;
  },

  // Boletos
  async getBoletos(): Promise<Boleto[]> {
    return StorageService.getBoletos();
  },

  async saveBoleto(boleto: Boleto): Promise<Boleto> {
    const list = StorageService.getBoletos();
    const idx = list.findIndex(b => b.id === boleto.id);
    if (idx >= 0) {
      list[idx] = boleto;
    } else {
      list.unshift(boleto);
    }
    StorageService.saveBoletos(list);
    return boleto;
  },

  async deleteBoleto(id: string): Promise<boolean> {
    const list = StorageService.getBoletos().filter(b => b.id !== id);
    StorageService.saveBoletos(list);
    return true;
  },

  // Configurações
  async getSettings(): Promise<AppSettings> {
    return StorageService.getSettings();
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    StorageService.saveSettings(settings);
    return settings;
  },
};
