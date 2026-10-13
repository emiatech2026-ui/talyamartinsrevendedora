export type Brand = string;

export interface BrandConfig {
  name: string;
  commission: number; // % de comissão (ex: 15% para O Boticário, 30% para Eudora)
  active?: boolean;
}

export type Category = 
  | 'Perfumaria' 
  | 'Maquiagem' 
  | 'Corpo e Banho' 
  | 'Cabelos' 
  | 'Kits & Presentes' 
  | 'Skincare';

export interface Product {
  id: string;
  code: string;
  name: string;
  brand: Brand;
  category: Category;
  costPrice: number;       // Preço pago pela revendedora (com desconto)
  catalogPrice: number;    // Preço cheio da revista
  sellingPrice: number;    // Preço que está vendendo (pode ter desconto próprio)
  stock: number;
  minStock: number;
  validity?: string;       // YYYY-MM
  batch?: string;          // Lote
  imageUrl?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  brand: Brand;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  subtotal: number;
}

export type OrderStatus = 'pendente' | 'separado' | 'entregue' | 'cancelado';
export type PaymentStatus = 'pendente' | 'parcial' | 'pago';
export type PaymentMethod = 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Dinheiro' | 'Fiado / A Prazo';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  profit: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  birthDate?: string;      // YYYY-MM-DD
  totalPurchased: number;
  outstandingBalance: number; // Saldo devedor (fiado pendente)
  lastPurchaseDate?: string;
  notes?: string;
  favoriteBrands?: Brand[];
  crmColumn?: CRMColumn; // Coluna no Kanban do CRM
}

export type CRMColumn = 'novos' | 'pagos' | 'fiados' | 'pos_venda';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export type BoletoStatus = 'pendente' | 'pago' | 'vencido';

export interface Boleto {
  id: string;
  brand: Brand;
  cycle: string;            // Ex: "Ciclo 05/2025"
  amount: number;
  dueDate: string;          // YYYY-MM-DD
  status: BoletoStatus;
  paidDate?: string;
  barcode?: string;
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  referenceId?: string;     // Id do pedido ou boleto
}

export interface MessageTemplates {
  birthday: string;
  debtReminder: string;
  promotions: string;
  orderReady: string;
  thankYou: string;
}

export interface AppSettings {
  resellerName: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  pixKey: string;
  monthlyRevenueGoal: number;
  monthlySalesGoal?: number;
  monthlySalesTarget?: number;
  defaultMarkup?: number;
  receiptFooter?: string;
  messageTemplates?: MessageTemplates;
  brands?: BrandConfig[];
  defaultCommissions?: Record<string, number>; // em % (ex: 15% O Boticário, 30% Eudora)
  cardFeeDebit: number;       // % ex: 1.99
  cardFeeCreditSight: number; // % ex: 3.49
  cardFeeCreditInstallment: number; // % por parcela ex: 1.5
}
