import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Plus, 
  Minus, 
  TrendingDown, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  ArrowUpDown,
  ShoppingBag,
  Camera,
  Sparkles
} from 'lucide-react';
import { Product, AppSettings } from '../types';
import { formatCurrency } from '../lib/storage';
import { ScanProductsModal } from '../components/ScanProductsModal';

interface EstoqueProps {
  products: Product[];
  settings?: AppSettings;
  onUpdateStock: (productId: string, newStock: number) => void;
  onAddProducts?: (products: Product[]) => void;
  onNavigateToCatalog: () => void;
  onNavigateToNewOrder: () => void;
}

export const Estoque: React.FC<EstoqueProps> = ({
  products,
  settings,
  onUpdateStock,
  onNavigateToCatalog,
  onNavigateToNewOrder,
  onAddProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('Todas');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stockAsc' | 'stockDesc' | 'val'>('stockAsc');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Stats
  const totalItemsCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalStockCost = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  const totalStockPotentialRevenue = products.reduce((acc, p) => acc + (p.stock * p.sellingPrice), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const configuredBrands = settings?.brands?.map(b => b.name) || ['O Boticário', 'Eudora', 'Natura', 'Natura'];
  const uniqueBrands = ['Todas', ...Array.from(new Set([...configuredBrands, ...products.map(p => p.brand)]))];

  // Filtering & Sorting
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = brandFilter === 'Todas' || p.brand === brandFilter;

    let matchesStatus = true;
    if (filterStockStatus === 'low') {
      matchesStatus = p.stock > 0 && p.stock <= p.minStock;
    } else if (filterStockStatus === 'out') {
      matchesStatus = p.stock === 0;
    }

    return matchesSearch && matchesBrand && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'stockAsc') return a.stock - b.stock;
    if (sortBy === 'stockDesc') return b.stock - a.stock;
    if (sortBy === 'val') return (a.validity || '9999').localeCompare(b.validity || '9999');
    return 0;
  });

  return (
    <div id="estoque-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-950 font-serif">Controle de Estoque & Pronta-Entrega</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a pronta-entrega, produtos esgotados e capital investido em estoque.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-scan-products"
            onClick={() => setIsScanModalOpen(true)}
            className="px-4 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            Tirar Foto dos Produtos (IA)
          </button>
          <button
            onClick={onNavigateToNewOrder}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            Vender Pronta-Entrega
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unidades Físicas</span>
          <div className="text-2xl font-black text-purple-950 mt-1 font-serif">{totalItemsCount} un.</div>
          <p className="text-xs text-slate-400 mt-1">{products.length} cosméticos cadastrados</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Capital Investido (Custo)</span>
          <div className="text-2xl font-black text-purple-950 mt-1 font-serif">{formatCurrency(totalStockCost)}</div>
          <p className="text-xs text-slate-400 mt-1">pago aos fornecedores</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Potencial de Venda</span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-serif">{formatCurrency(totalStockPotentialRevenue)}</div>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">
            Lucro projetado: +{formatCurrency(totalStockPotentialRevenue - totalStockCost)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Atenção Necessária</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600 font-serif">{lowStockCount} baixos</span>
            <span className="text-slate-200">|</span>
            <span className="text-2xl font-black text-red-600 font-serif">{outOfStockCount} zero</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">necessitam reposição no próximo ciclo</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-100/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por produto, marca ou lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-purple-50/30 border border-purple-100 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterStockStatus('all')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors shrink-0 ${
                filterStockStatus === 'all'
                  ? 'bg-purple-900 text-white border-purple-900 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setFilterStockStatus('low')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors shrink-0 ${
                filterStockStatus === 'low'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
              }`}
            >
              Estoque Baixo ({lowStockCount})
            </button>
            <button
              onClick={() => setFilterStockStatus('out')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors shrink-0 ${
                filterStockStatus === 'out'
                  ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                  : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
              }`}
            >
              Esgotados ({outOfStockCount})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-purple-100/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400">Marca:</span>
            {uniqueBrands.map(b => (
              <button
                key={b}
                onClick={() => setBrandFilter(b)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  brandFilter === b ? 'bg-purple-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-950'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-purple-500"
            >
              <option value="stockAsc">Menor estoque primeiro</option>
              <option value="stockDesc">Maior estoque primeiro</option>
              <option value="name">Nome (A-Z)</option>
              <option value="val">Validade mais próxima</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-3xl border border-purple-100/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50/70 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Cosmético & Marca</th>
                <th className="py-3 px-4">Categoria / Código</th>
                <th className="py-3 px-4">Validade / Lote</th>
                <th className="py-3 px-4">Preço Custo</th>
                <th className="py-3 px-4">Preço Venda</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4 text-right">Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const isOut = product.stock === 0;
                const isLow = !isOut && product.stock <= product.minStock;
                const isBoti = product.brand.toLowerCase().includes('boticário') || product.brand.toLowerCase().includes('boticario');
                const isEudora = product.brand.toLowerCase().includes('eudora');
const isNatura = product.brand.toLowerCase().includes('natura');

                return (
                  <tr key={product.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-purple-950 text-xs sm:text-sm">{product.name}</div>
                      <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isBoti ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        isEudora ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {product.brand}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-700 text-xs">{product.category}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{product.code}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {product.validity ? (
                        <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-purple-700" /> {product.validity}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                      {product.batch && (
                        <p className="text-[10px] text-slate-400">Lote: {product.batch}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">
                      {formatCurrency(product.costPrice)}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-purple-950">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isOut ? 'bg-red-100 text-red-700' :
                          isLow ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {product.stock} un.
                        </span>
                        {isLow && <span className="text-[10px] text-amber-600 font-semibold">baixo</span>}
                        {isOut && <span className="text-[10px] text-red-600 font-semibold">zerado</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onUpdateStock(product.id, Math.max(0, product.stock - 1))}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                          title="Dar baixa em 1 unidade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onUpdateStock(product.id, product.stock + 1)}
                          className="w-8 h-8 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 flex items-center justify-center transition-colors font-bold"
                          title="Adicionar 1 unidade"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal: Tirar Foto dos Produtos (Entrada com IA) */}
      <ScanProductsModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onAddProducts={(newItems) => {
          if (onAddProducts) {
            onAddProducts(newItems);
          }
        }}
        existingProducts={products}
        settings={settings || ({} as AppSettings)}
      />
    </div>
  );
};
