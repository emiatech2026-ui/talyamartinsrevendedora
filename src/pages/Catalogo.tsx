import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Package, 
  Tag, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  X,
  Calculator,
  ExternalLink
} from 'lucide-react';
import { Product, Brand, Category, AppSettings } from '../types';
import { formatCurrency } from '../lib/storage';

interface CatalogoProps {
  products: Product[];
  settings?: AppSettings;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onQuickOrder?: (product: Product) => void;
}

export const Catalogo: React.FC<CatalogoProps> = ({
  products,
  settings,
  onSaveProduct,
  onDeleteProduct,
  onQuickOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formBrand, setFormBrand] = useState<Brand>('O Boticário');
  const [formCategory, setFormCategory] = useState<Category>('Perfumaria');
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formCatalogPrice, setFormCatalogPrice] = useState<number>(0);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(1);
  const [formMinStock, setFormMinStock] = useState<number>(2);
  const [formValidity, setFormValidity] = useState<string>('');
  const [formBatch, setFormBatch] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Dynamic configured brands
  const configuredBrandList = settings?.brands?.map(b => b.name) || ['O Boticário', 'Eudora', 'Natura', 'Natura'];
  const brandsInProducts = Array.from(new Set(products.map(p => p.brand)));
  const uniqueBrands = Array.from(new Set([...configuredBrandList, ...brandsInProducts]));
  const filterBrands = ['Todas', ...uniqueBrands];

  const categories: (string | Category)[] = [
    'Todas',
    'Perfumaria',
    'Maquiagem',
    'Corpo e Banho',
    'Cabelos',
    'Kits & Presentes',
    'Skincare'
  ];

  // Helper to obtain commission for selected brand
  const getCommissionForBrand = (brandName: string): number => {
    const found = settings?.brands?.find(b => b.name.toLowerCase() === brandName.toLowerCase());
    if (found) return found.commission;
    if (settings?.defaultCommissions?.[brandName] !== undefined) {
      return settings.defaultCommissions[brandName];
    }
    if (brandName.toLowerCase().includes('boticário') || brandName.toLowerCase().includes('boticario')) return 15;
    if (brandName.toLowerCase().includes('eudora')) return 30;
    return 20;
  };

  const handleOpenModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setFormName(prod.name);
      setFormCode(prod.code);
      setFormBrand(prod.brand);
      setFormCategory(prod.category);
      setFormCostPrice(prod.costPrice);
      setFormCatalogPrice(prod.catalogPrice);
      setFormSellingPrice(prod.sellingPrice);
      setFormStock(prod.stock);
      setFormMinStock(prod.minStock);
      setFormValidity(prod.validity || '');
      setFormBatch(prod.batch || '');
      setFormNotes(prod.notes || '');
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormCode(`PRD-${Math.floor(100 + Math.random() * 900)}`);
      
      const initialB = uniqueBrands[0] || 'O Boticário';
      setFormBrand(initialB);
      setFormCategory('Perfumaria');
      
      const comm = getCommissionForBrand(initialB);
      const sampleCatalog = 129.90;
      setFormCatalogPrice(sampleCatalog);
      setFormCostPrice(Number((sampleCatalog * (1 - comm / 100)).toFixed(2)));
      setFormSellingPrice(sampleCatalog);

      setFormStock(3);
      setFormMinStock(2);
      setFormValidity('');
      setFormBatch('');
      setFormNotes('');
    }
    setIsModalOpen(true);
  };

  // When brand changes in form, recalculate cost based on brand commission
  const handleBrandChange = (newBrand: string) => {
    setFormBrand(newBrand);
    const comm = getCommissionForBrand(newBrand);
    if (formCatalogPrice > 0) {
      const calculatedCost = Number((formCatalogPrice * (1 - comm / 100)).toFixed(2));
      setFormCostPrice(calculatedCost);
    }
  };

  // When catalog price changes, calculate cost and suggest selling price
  const handleCatalogPriceChange = (catalogVal: number) => {
    setFormCatalogPrice(catalogVal);
    const comm = getCommissionForBrand(formBrand);
    const calculatedCost = Number((catalogVal * (1 - comm / 100)).toFixed(2));
    setFormCostPrice(calculatedCost);

    // If new product or matching, keep selling price equal to catalog price (official site price)
    if (!editingProduct || formSellingPrice === formCatalogPrice) {
      setFormSellingPrice(catalogVal);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      code: formCode.trim() || `PRD-${Date.now().toString().slice(-4)}`,
      name: formName.trim(),
      brand: formBrand,
      category: formCategory,
      costPrice: Number(formCostPrice) || 0,
      catalogPrice: Number(formCatalogPrice) || 0,
      sellingPrice: Number(formSellingPrice) || 0,
      stock: Number(formStock) || 0,
      minStock: Number(formMinStock) || 0,
      validity: formValidity || undefined,
      batch: formBatch.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    onSaveProduct(newProduct);
    setIsModalOpen(false);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBrand = selectedBrand === 'Todas' || p.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  const activeCommission = getCommissionForBrand(formBrand);

  return (
    <div id="catalogo-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-950 font-serif">Catálogo de Cosméticos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Preços oficiais de site, cálculo automático de custos e controle de estoque de pronta-entrega.
          </p>
        </div>
        <button
          id="btn-add-product"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Produto
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-purple-100/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome do produto, código ou linha (ex: Malbec, Siàge, Lily, Niina)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Category Select */}
          <div className="w-full md:w-56 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'Todas' ? 'Todas as Categorias' : c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-purple-800" /> Marcas:
          </span>
          {filterBrands.map(b => {
            const isSelected = selectedBrand === b;
            return (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-950'
                }`}
              >
                {b}
              </button>
            );
          })}
          <span className="text-xs text-slate-400 ml-auto shrink-0 font-medium">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-purple-100 shadow-xs">
          <Package className="w-12 h-12 text-purple-200 mx-auto mb-3" />
          <h2 className="text-base font-bold text-purple-950">Nenhum produto encontrado</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Tente buscar com outros termos ou cadastre um novo item clicando no botão acima.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map(product => {
            const profit = product.sellingPrice - product.costPrice;
            const marginPct = product.sellingPrice > 0 ? ((profit / product.sellingPrice) * 100).toFixed(0) : '0';
            const isLow = product.stock <= product.minStock;

            const isBoti = product.brand.toLowerCase().includes('boticário') || product.brand.toLowerCase().includes('boticario');
            const isEudora = product.brand.toLowerCase().includes('eudora');
const isNatura = product.brand.toLowerCase().includes('natura');

            return (
              <div 
                key={product.id}
                className="bg-white rounded-3xl border border-purple-100/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                      isBoti
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isEudora
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {product.brand}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {product.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 font-serif">
                    {product.name}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-purple-700" /> {product.category}
                  </p>

                  {product.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mt-2.5 italic">
                      "{product.notes}"
                    </p>
                  )}

                  {/* Pricing Breakdown */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Preço do Site Oficial:</span>
                      <span className="font-semibold text-slate-700">{formatCurrency(product.catalogPrice)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Seu Custo c/ Comissão:</span>
                      <span className="font-mono text-purple-900 font-semibold">{formatCurrency(product.costPrice)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-slate-800 uppercase">Preço de Venda:</span>
                      <span className="text-lg font-bold text-purple-950 font-serif">{formatCurrency(product.sellingPrice)}</span>
                    </div>
                  </div>

                  {/* Margin Badge */}
                  <div className="mt-2.5 p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-emerald-950 font-medium">Margem: <strong>{marginPct}%</strong></span>
                    <span className="text-emerald-700 font-bold">Lucro: +{formatCurrency(profit)}</span>
                  </div>
                </div>

                {/* Bottom Bar: Stock & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                      product.stock === 0 ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-xs font-semibold text-slate-700">
                      {product.stock} un. pronta-entrega
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="p-1.5 text-slate-500 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Editar Produto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir o produto "${product.name}"?`)) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir Produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl my-8 relative border border-purple-100">
            <div className="flex items-center justify-between border-b border-purple-100 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-purple-950 font-serif">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Cosmético'}
                </h3>
                <p className="text-xs text-slate-500">Defina os dados, preços de site e controle de estoque</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Malbec Black Desodorante Colônia 100ml"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Marca Parceira *
                  </label>
                  <select
                    value={formBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    {uniqueBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                    Comissão configurada: {activeCommission}%
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Category)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Perfumaria">Perfumaria</option>
                    <option value="Maquiagem">Maquiagem</option>
                    <option value="Corpo e Banho">Corpo e Banho</option>
                    <option value="Cabelos">Cabelos</option>
                    <option value="Kits & Presentes">Kits & Presentes</option>
                    <option value="Skincare">Skincare</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Código do Produto / Referência
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ex: BOT-091"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Lote / Validade
                  </label>
                  <input
                    type="text"
                    value={formValidity}
                    onChange={(e) => setFormValidity(e.target.value)}
                    placeholder="Ex: Val: 08/2027"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Price Fields */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-purple-950">Preços & Cálculo de Custo</span>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Calculator className="w-3 h-3" /> Custo calculado com {activeCommission}% de comissão
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preço no Site (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formCatalogPrice === 0 ? '' : formCatalogPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleCatalogPriceChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Custo Pago (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formCostPrice === 0 ? '' : formCostPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setFormCostPrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-purple-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">Preço Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formSellingPrice === 0 ? '' : formSellingPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setFormSellingPrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-purple-400 rounded-xl text-sm font-bold text-purple-950 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600">
                    Lucro Previsto: <strong className="text-emerald-700">+{formatCurrency(formSellingPrice - formCostPrice)}</strong>
                  </span>
                  <span className="text-purple-950 font-bold">
                    Margem: {formSellingPrice > 0 ? (((formSellingPrice - formCostPrice) / formSellingPrice) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Stock Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Estoque Atual (Unidades)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formStock === 0 ? '' : formStock}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFormStock(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formMinStock === 0 ? '' : formMinStock}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFormMinStock(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Observações / Dicas de Aplicação
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Fragrância clássica, campeão de vendas para presentes..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
