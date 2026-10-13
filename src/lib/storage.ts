import { Product, Customer, Order, Boleto, FinancialTransaction, AppSettings, Task } from '../types';
import { initialProducts, initialCustomers, initialOrders, initialBoletos, initialTransactions, initialSettings, initialTasks } from '../data/mockData';
import { DEFAULT_MESSAGE_TEMPLATES } from './messageTemplates';

const STORAGE_KEYS = {
  PRODUCTS: 'talya_revenda_products_v1',
  CUSTOMERS: 'talya_revenda_customers_v1',
  ORDERS: 'talya_revenda_orders_v1',
  BOLETOS: 'talya_revenda_boletos_v1',
  TRANSACTIONS: 'talya_revenda_transactions_v1',
  SETTINGS: 'talya_revenda_settings_v1',
  TASKS: 'talya_revenda_tasks_v1',
};

// Helper for currency formatting in Brazilian Real
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

// Helper for dates in pt-BR
export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  // If YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export const StorageService = {
  getTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : initialTasks;
    } catch {
      return initialTasks;
    }
  },

  saveTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
        return initialProducts;
      }
      return JSON.parse(data);
    } catch {
      return initialProducts;
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new Event('talya_storage_update'));
  },

  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
        return initialCustomers;
      }
      return JSON.parse(data);
    } catch {
      return initialCustomers;
    }
  },

  saveCustomers(customers: Customer[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    window.dispatchEvent(new Event('talya_storage_update'));
  },

  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(initialOrders));
        return initialOrders;
      }
      return JSON.parse(data);
    } catch {
      return initialOrders;
    }
  },

  saveOrders(orders: Order[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new Event('talya_storage_update'));
  },

  getBoletos(): Boleto[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOLETOS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BOLETOS, JSON.stringify(initialBoletos));
        return initialBoletos;
      }
      return JSON.parse(data);
    } catch {
      return initialBoletos;
    }
  },

  saveBoletos(boletos: Boleto[]): void {
    localStorage.setItem(STORAGE_KEYS.BOLETOS, JSON.stringify(boletos));
    window.dispatchEvent(new Event('talya_storage_update'));
  },

  getTransactions(): FinancialTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
        return initialTransactions;
      }
      return JSON.parse(data);
    } catch {
      return initialTransactions;
    }
  },

  saveTransactions(transactions: FinancialTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    window.dispatchEvent(new Event('talya_storage_update'));
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
        return initialSettings;
      }
      const parsed = JSON.parse(data);
      // Normalização e migração para suporte a marcas dinâmicas:
      const brands = (parsed.brands && parsed.brands.length > 0)
        ? parsed.brands
        : [
            { name: 'O Boticário', commission: parsed.defaultCommissions?.['O Boticário'] ?? 15, active: true },
            { name: 'Eudora', commission: parsed.defaultCommissions?.['Eudora'] ?? 30, active: true }, { name: 'Natura', commission: parsed.defaultCommissions?.['Natura'] ?? 30, active: true },
          ];

      const defaultCommissions = {
        'O Boticário': 15,
        'Eudora': 30,
        ...(parsed.defaultCommissions || {}),
      };

      const messageTemplates = {
        ...DEFAULT_MESSAGE_TEMPLATES,
        ...(parsed.messageTemplates || {}),
      };

      return {
        ...initialSettings,
        ...parsed,
        brands,
        defaultCommissions,
        messageTemplates,
      };
    } catch {
      return initialSettings;
    }
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event('talya_storage_update'));
  },

  resetAllData(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(initialOrders));
    localStorage.setItem(STORAGE_KEYS.BOLETOS, JSON.stringify(initialBoletos));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
    window.dispatchEvent(new Event('talya_storage_update'));
  },

  exportBackupJSON(): string {
    const backup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      orders: this.getOrders(),
      boletos: this.getBoletos(),
      transactions: this.getTransactions(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.products && Array.isArray(data.products)) {
        this.saveProducts(data.products);
      }
      if (data.customers && Array.isArray(data.customers)) {
        this.saveCustomers(data.customers);
      }
      if (data.orders && Array.isArray(data.orders)) {
        this.saveOrders(data.orders);
      }
      if (data.boletos && Array.isArray(data.boletos)) {
        this.saveBoletos(data.boletos);
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        this.saveTransactions(data.transactions);
      }
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings(data.settings);
      }
      return true;
    } catch (e) {
      console.error('Falha ao importar JSON', e);
      return false;
    }
  },

  // Generates formatted WhatsApp message for order receipt
  generateWhatsAppReceipt(order: Order, settings: AppSettings): string {
    let msg = `✨ *COMPROVANTE DE PEDIDO* ✨\n`;
    msg += `🛍️ *${settings.resellerName}*\n`;
    msg += `---------------------------------\n`;
    msg += `📋 *Pedido:* ${order.orderNumber}\n`;
    msg += `👤 *Cliente:* ${order.customerName}\n`;
    msg += `📅 *Data:* ${formatDate(order.date)}\n\n`;
    msg += `*ITENS DO PEDIDO:*\n`;

    order.items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.productName}\n`;
      msg += `   ${item.quantity}x ${formatCurrency(item.unitPrice)} = *${formatCurrency(item.subtotal)}*\n`;
    });

    msg += `---------------------------------\n`;
    if (order.discount > 0) {
      msg += `🏷️ Desconto: -${formatCurrency(order.discount)}\n`;
    }
    msg += `💰 *TOTAL:* ${formatCurrency(order.total)}\n`;
    msg += `💳 *Forma de Pagamento:* ${order.paymentMethod}\n`;
    msg += `Status do Pagamento: *${order.paymentStatus.toUpperCase()}*\n`;

    if (order.paymentStatus === 'parcial' || order.paymentMethod === 'Fiado / A Prazo') {
      const pending = order.total - order.amountPaid;
      msg += `💵 Valor Pago: ${formatCurrency(order.amountPaid)}\n`;
      msg += `⚠️ *Saldo Pendente:* ${formatCurrency(pending)}\n`;
    }

    if (settings.pixKey) {
      msg += `\n🔑 *Chave PIX para pagamento:*\n${settings.pixKey}\n`;
    }

    msg += `\nMuito obrigada pela preferência! Qualquer dúvida estou à disposição! 💖`;
    return msg;
  }
};
