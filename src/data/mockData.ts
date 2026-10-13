import { Product, Customer, Order, Boleto, FinancialTransaction, AppSettings, Task } from '../types';
import { DEFAULT_MESSAGE_TEMPLATES } from '../lib/messageTemplates';

export const initialSettings: AppSettings = {
  resellerName: 'Talya Martins Revenda',
  phone: '(11) 98765-4321',
  whatsapp: '(11) 98765-4321',
  pixKey: 'talyamartins.revenda@gmail.com',
  monthlyRevenueGoal: 6500,
  monthlySalesGoal: 6500,
  monthlySalesTarget: 6500,
  defaultMarkup: 30,
  receiptFooter: 'Muito obrigada pela sua preferência e confiança! 💜✨',
  messageTemplates: DEFAULT_MESSAGE_TEMPLATES,
  brands: [
    { name: 'O Boticário', commission: 15, active: true },
    { name: 'Eudora', commission: 30, active: true }, { name: 'Natura', commission: 30, active: true },
  ],
  defaultCommissions: {
    'O Boticário': 15,
    'Eudora': 30,
  },
  cardFeeDebit: 1.89,
  cardFeeCreditSight: 3.49,
  cardFeeCreditInstallment: 1.45,
};

// Produtos com preços exatamente iguais aos sites oficiais de O Boticário e Eudora
// Comissões aplicadas: 15% em O Boticário (custo = 85%), 30% em Eudora (custo = 70%)
export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    code: 'BOT-001',
    name: 'Malbec Desodorante Colônia 100ml',
    brand: 'O Boticário',
    category: 'Perfumaria',
    catalogPrice: 209.90, // Preço site oficial O Boticário
    costPrice: 209.90 * 0.85, // 15% comissão = R$ 178,41
    sellingPrice: 209.90,
    stock: 6,
    minStock: 2,
    validity: '2027-08',
    batch: 'L24098A',
    notes: 'Mais vendido masculino do Brasil. Amadeirado aromático marcante.',
  },
  {
    id: 'prod-2',
    code: 'BOT-002',
    name: 'Lily Eau de Parfum 75ml',
    brand: 'O Boticário',
    category: 'Perfumaria',
    catalogPrice: 324.90, // Preço site oficial O Boticário
    costPrice: 324.90 * 0.85, // 15% comissão = R$ 276,16
    sellingPrice: 324.90,
    stock: 4,
    minStock: 2,
    validity: '2028-02',
    batch: 'L24112B',
    notes: 'Fragrância floral icônica obtida através da técnica milenar do enfleurage.',
  },
  {
    id: 'prod-3',
    code: 'EUD-001',
    name: 'Combo Siàge Cauterização dos Fios (Shampoo + Máscara)',
    brand: 'Eudora',
    category: 'Cabelos',
    catalogPrice: 124.90, // Preço site oficial Eudora
    costPrice: 124.90 * 0.70, // 30% comissão = R$ 87,43
    sellingPrice: 124.90,
    stock: 8,
    minStock: 3,
    validity: '2026-11',
    batch: 'E24550',
    notes: 'Com colágeno vegetal e aminoácidos, cauteriza os fios sem enrijecer.',
  },
  {
    id: 'prod-4',
    code: 'EUD-002',
    name: 'Batom Líquido Niina Secrets Skinny Matte - Terracota',
    brand: 'Eudora',
    category: 'Maquiagem',
    catalogPrice: 49.99, // Preço site oficial Eudora
    costPrice: 49.99 * 0.70, // 30% comissão = R$ 34,99
    sellingPrice: 49.99,
    stock: 12,
    minStock: 4,
    validity: '2026-09',
    batch: 'N2401',
    notes: 'Textura ultrafina aveludada com óleo de rosas e ácido hialurônico.',
  },
  {
    id: 'prod-5',
    code: 'BOT-003',
    name: 'Loção Desodorante Hidratante Nativa SPA Ameixa 400ml',
    brand: 'O Boticário',
    category: 'Corpo e Banho',
    catalogPrice: 84.90, // Preço site oficial O Boticário
    costPrice: 84.90 * 0.85, // 15% comissão = R$ 72,16
    sellingPrice: 84.90,
    stock: 1, // Alerta de estoque baixo!
    minStock: 3,
    validity: '2027-01',
    batch: 'N2499',
    notes: 'Com gotas purificadas de quinoa, aumenta a produção de colágeno na pele.',
  },
  {
    id: 'prod-6',
    code: 'BOT-004',
    name: 'Elysée Succès Eau de Parfum 50ml',
    brand: 'O Boticário',
    category: 'Perfumaria',
    catalogPrice: 319.90, // Preço site oficial O Boticário
    costPrice: 319.90 * 0.85, // 15% comissão = R$ 271,91
    sellingPrice: 319.90,
    stock: 2,
    minStock: 2,
    validity: '2027-10',
    batch: 'E24810',
    notes: 'Rosa Negra de Grasse. Sofisticação e alta fixação em frasco joia.',
  },
  {
    id: 'prod-7',
    code: 'EUD-003',
    name: 'Impression Eau de Parfum 100ml',
    brand: 'Eudora',
    category: 'Perfumaria',
    catalogPrice: 229.90, // Preço site oficial Eudora
    costPrice: 229.90 * 0.70, // 30% comissão = R$ 160,93
    sellingPrice: 229.90,
    stock: 3,
    minStock: 2,
    validity: '2027-05',
    batch: 'IMP4102',
    notes: 'Amadeirado marcante e sofisticado para homens de atitude.',
  },
  {
    id: 'prod-8',
    code: 'BOT-005',
    name: 'Kit Presente Cuide-se Bem Nuvem (Loção 200ml + Sabonetes)',
    brand: 'O Boticário',
    category: 'Kits & Presentes',
    catalogPrice: 79.90, // Preço site oficial O Boticário
    costPrice: 79.90 * 0.85, // 15% comissão = R$ 67,91
    sellingPrice: 79.90,
    stock: 5,
    minStock: 2,
    validity: '2026-12',
    batch: 'KIT2408',
    notes: 'Fragrância suave e confortável para presentear com carinho.',
  },
  {
    id: 'prod-9',
    code: 'EUD-004',
    name: 'Máscara para Cílios Eudora Turbo Super Star',
    brand: 'Eudora',
    category: 'Maquiagem',
    catalogPrice: 54.99, // Preço site oficial Eudora
    costPrice: 54.99 * 0.70, // 30% comissão = R$ 38,49
    sellingPrice: 54.99,
    stock: 0, // Alerta: produto esgotado!
    minStock: 3,
    validity: '2026-08',
    batch: 'TB098',
    notes: 'Super volume e alongamento com efeito cílios postiços imediatos.',
  },
  {
    id: 'prod-10',
    code: 'BOT-006',
    name: 'Floratta Red Desodorante Colônia 75ml',
    brand: 'O Boticário',
    category: 'Perfumaria',
    catalogPrice: 159.90, // Preço site oficial O Boticário
    costPrice: 159.90 * 0.85, // 15% comissão = R$ 135,91
    sellingPrice: 159.90,
    stock: 3,
    minStock: 2,
    validity: '2027-09',
    batch: 'FR2409',
    notes: 'Inspirado na flor da Maçã de Vermont. Doce e marcante.',
  },
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Mariana Silveira',
    phone: '(11) 97123-4567',
    email: 'mariana.silveira@email.com',
    address: 'Rua das Flores, 142 - Apto 31, São Paulo/SP',
    birthDate: '1992-09-15',
    totalPurchased: 1450.00,
    outstandingBalance: 120.00, // Fiado pendente
    lastPurchaseDate: '2026-09-02',
    notes: 'Adora os lançamentos de Lily e maquiagens da Niina Secrets.',
    favoriteBrands: ['O Boticário', 'Eudora', 'Natura', 'Natura'],
    crmColumn: 'fiados',
  },
  {
    id: 'cust-2',
    name: 'Camila Rodrigues',
    phone: '(11) 98456-7890',
    email: 'camila.rodrigues@email.com',
    address: 'Av. Paulista, 800 - Conj 402, São Paulo/SP',
    birthDate: '1988-11-20',
    totalPurchased: 890.00,
    outstandingBalance: 0,
    lastPurchaseDate: '2026-09-05',
    notes: 'Paga sempre via PIX à vista na entrega.',
    favoriteBrands: ['Eudora'],
    crmColumn: 'fiados',
  },
  {
    id: 'cust-3',
    name: 'Rodrigo Albuquerque',
    phone: '(11) 99345-6781',
    address: 'Rua Bela Cintra, 450, São Paulo/SP',
    birthDate: '1985-04-10',
    totalPurchased: 1240.00,
    outstandingBalance: 0,
    lastPurchaseDate: '2026-08-28',
    notes: 'Compra Malbec regularmente para ele e kits para presentear.',
    favoriteBrands: ['O Boticário'],
    crmColumn: 'fiados',
  },
  {
    id: 'cust-4',
    name: 'Fernanda Diniz',
    phone: '(11) 96234-5678',
    address: 'Rua Vergueiro, 1200, São Paulo/SP',
    birthDate: '1995-09-12', // Aniversariante do mês!
    totalPurchased: 540.00,
    outstandingBalance: 80.00,
    lastPurchaseDate: '2026-08-15',
    notes: 'Fã incondicional da linha Cuide-se Bem e Nativa SPA Ameixa.',
    favoriteBrands: ['O Boticário'],
    crmColumn: 'fiados',
  },
  {
    id: 'cust-5',
    name: 'Juliana Castro',
    phone: '(11) 97788-9900',
    address: 'Rua Augusta, 920, São Paulo/SP',
    birthDate: '1990-12-05',
    totalPurchased: 380.00,
    outstandingBalance: 0,
    lastPurchaseDate: '2026-07-20',
    notes: 'Prefere linha capilar Siàge Cauterização.',
    favoriteBrands: ['Eudora'],
    crmColumn: 'fiados',
  },
];

export const initialOrders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'PED-2026-101',
    customerId: 'cust-1',
    customerName: 'Mariana Silveira',
    customerPhone: '(11) 97123-4567',
    date: '2026-09-02',
    items: [
      {
        productId: 'prod-2',
        productName: 'Lily Eau de Parfum 75ml',
        brand: 'O Boticário',
        quantity: 1,
        unitCost: 276.16, // 15% comissão
        unitPrice: 324.90,
        subtotal: 324.90,
      },
      {
        productId: 'prod-4',
        productName: 'Batom Líquido Niina Secrets Skinny Matte - Terracota',
        brand: 'Eudora',
        quantity: 1,
        unitCost: 34.99, // 30% comissão
        unitPrice: 49.99,
        subtotal: 49.99,
      }
    ],
    subtotal: 374.89,
    discount: 10.00,
    total: 364.89,
    totalCost: 311.15,
    profit: 53.74,
    orderStatus: 'entregue',
    paymentStatus: 'parcial',
    paymentMethod: 'Fiado / A Prazo',
    amountPaid: 244.89, // Resta 120.00
    notes: 'Entregue no trabalho. Prometeu quitar os R$ 120 no dia 15.',
  },
  {
    id: 'ord-102',
    orderNumber: 'PED-2026-102',
    customerId: 'cust-2',
    customerName: 'Camila Rodrigues',
    customerPhone: '(11) 98456-7890',
    date: '2026-09-05',
    items: [
      {
        productId: 'prod-3',
        productName: 'Combo Siàge Cauterização dos Fios',
        brand: 'Eudora',
        quantity: 1,
        unitCost: 87.43, // 30% comissão
        unitPrice: 124.90,
        subtotal: 124.90,
      }
    ],
    subtotal: 124.90,
    discount: 0,
    total: 124.90,
    totalCost: 87.43,
    profit: 37.47,
    orderStatus: 'entregue',
    paymentStatus: 'pago',
    paymentMethod: 'PIX',
    amountPaid: 124.90,
    notes: 'PIX conferido na conta bancária.',
  },
  {
    id: 'ord-103',
    orderNumber: 'PED-2026-103',
    customerId: 'cust-3',
    customerName: 'Rodrigo Albuquerque',
    customerPhone: '(11) 99345-6781',
    date: '2026-09-07',
    items: [
      {
        productId: 'prod-1',
        productName: 'Malbec Desodorante Colônia 100ml',
        brand: 'O Boticário',
        quantity: 1,
        unitCost: 178.41, // 15% comissão
        unitPrice: 209.90,
        subtotal: 209.90,
      }
    ],
    subtotal: 209.90,
    discount: 0,
    total: 209.90,
    totalCost: 178.41,
    profit: 31.49,
    orderStatus: 'separado',
    paymentStatus: 'pago',
    paymentMethod: 'Cartão de Crédito',
    amountPaid: 209.90,
    notes: 'Combinado de entregar no final da tarde.',
  },
  {
    id: 'ord-104',
    orderNumber: 'PED-2026-104',
    customerId: 'cust-4',
    customerName: 'Fernanda Diniz',
    customerPhone: '(11) 96234-5678',
    date: '2026-09-08',
    items: [
      {
        productId: 'prod-8',
        productName: 'Kit Presente Cuide-se Bem Nuvem',
        brand: 'O Boticário',
        quantity: 1,
        unitCost: 67.91, // 15% comissão
        unitPrice: 79.90,
        subtotal: 79.90,
      }
    ],
    subtotal: 79.90,
    discount: 0,
    total: 79.90,
    totalCost: 67.91,
    profit: 11.99,
    orderStatus: 'pendente',
    paymentStatus: 'pendente',
    paymentMethod: 'PIX',
    amountPaid: 0,
    notes: 'Cliente pediu para reservar para o aniversário da prima.',
  },
];

export const initialBoletos: Boleto[] = [
  {
    id: 'bol-1',
    brand: 'O Boticário',
    cycle: 'Ciclo 09/2026 - Pedido 88412',
    amount: 684.50,
    dueDate: '2026-09-12',
    status: 'pendente',
    barcode: '34191.79001 01043.510047 91020.150008 5 91120000068450',
    notes: 'Boleto do pedido de reposição de Lily e Malbec.',
  },
  {
    id: 'bol-2',
    brand: 'Eudora',
    cycle: 'Ciclo 09/2026 - Pedido 55198',
    amount: 432.20,
    dueDate: '2026-09-20',
    status: 'pendente',
    barcode: '23793.38128 60000.120042 15000.655001 1 91200000043220',
    notes: 'Campanha Siàge Cauterização e Batons Niina Secrets.',
  },
  {
    id: 'bol-3',
    brand: 'O Boticário',
    cycle: 'Ciclo 08/2026 - Pedido 87990',
    amount: 540.00,
    dueDate: '2026-08-25',
    status: 'pago',
    paidDate: '2026-08-23',
    barcode: '34191.79001 01043.510047 91020.150008 1 90850000054000',
    notes: 'Pago com desconto de pontualidade.',
  },
];

export const initialTransactions: FinancialTransaction[] = [
  {
    id: 'tx-1',
    type: 'receita',
    category: 'Venda de Produtos',
    description: 'Venda Pedido PED-2026-101 (Entrada Mariana)',
    amount: 244.89,
    date: '2026-09-02',
    paymentMethod: 'PIX',
    referenceId: 'ord-101',
  },
  {
    id: 'tx-2',
    type: 'receita',
    category: 'Venda de Produtos',
    description: 'Venda Pedido PED-2026-102 (Camila Rodrigues)',
    amount: 124.90,
    date: '2026-09-05',
    paymentMethod: 'PIX',
    referenceId: 'ord-102',
  },
  {
    id: 'tx-3',
    type: 'despesa',
    category: 'Pagamento de Boleto',
    description: 'Boleto O Boticário Ciclo 08/2026',
    amount: 540.00,
    date: '2026-08-23',
    paymentMethod: 'PIX / Boleto',
    referenceId: 'bol-3',
  },
  {
    id: 'tx-4',
    type: 'despesa',
    category: 'Embalagens e Sacolas',
    description: 'Sacolas presenteáveis e laços de cetim (50 un)',
    amount: 65.00,
    date: '2026-08-28',
    paymentMethod: 'PIX',
  },
];

export const initialTasks: Task[] = [
  { id: 'task-1', title: 'Entrar em contato com Maria Silva sobre kit Nativa SPA', completed: false, createdAt: '2026-10-01T10:00:00Z' },
  { id: 'task-2', title: 'Cobrar fiado pendente de R$ 120,00', completed: false, dueDate: '2026-10-10', createdAt: '2026-10-02T10:00:00Z' }
];
