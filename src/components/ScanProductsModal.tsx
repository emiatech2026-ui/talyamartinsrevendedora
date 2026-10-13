import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, X, PackagePlus, Sparkles, RefreshCw, Trash2, Plus, Minus } from 'lucide-react';
import { Product, AppSettings, Category } from '../types';
import { scanProductsPhoto, ParsedProductItem } from '../lib/geminiPhotoService';
import { formatCurrency } from '../lib/storage';

interface ScanProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProducts: (newProducts: Product[]) => void;
  existingProducts: Product[];
  settings: AppSettings;
}

export const ScanProductsModal: React.FC<ScanProductsModalProps> = ({
  isOpen,
  onClose,
  onAddProducts,
  existingProducts,
  settings,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [items, setItems] = useState<ParsedProductItem[]>([]);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const configuredBrands = settings?.brands?.map(b => b.name) || ['O Boticário', 'Eudora', 'Natura', 'Natura'];

  // Helper to obtain commission for brand
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setErrorMsg(null);
    setItems([]);

    await processImage(file);
  };

  const processImage = async (fileToProcess: File) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const result = await scanProductsPhoto(fileToProcess, configuredBrands);
      if (!result.products || result.products.length === 0) {
        throw new Error('Nenhum produto foi identificado na foto. Verifique a iluminação ou tente tirar mais de perto.');
      }
      setItems(result.products);
    } catch (err: any) {
      console.error('Erro ao ler foto dos produtos:', err);
      setErrorMsg(
        err.message || 'Não conseguimos identificar os produtos na foto. Tente tirar uma foto mais nítida das embalagens ou do romaneio.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateItem = (index: number, field: keyof ParsedProductItem, value: any) => {
    setItems(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmAndAddStock = () => {
    if (items.length === 0) return;

    const productsToPersist: Product[] = [];

    items.forEach((item, index) => {
      const comm = getCommissionForBrand(item.brand);
      const catalogPrice = Number(item.catalogPrice) || 0;
      const costPrice = Number((catalogPrice * (1 - comm / 100)).toFixed(2));
      const sellingPrice = catalogPrice;
      const quantity = Math.max(1, Number(item.quantity) || 1);

      // Check if product with exact or very similar name already exists
      const existing = existingProducts.find(
        p => p.name.toLowerCase().trim() === item.name.toLowerCase().trim() ||
        (item.code && p.code && p.code.toLowerCase() === item.code.toLowerCase())
      );

      if (existing) {
        // Increment stock on existing product
        productsToPersist.push({
          ...existing,
          stock: existing.stock + quantity,
          costPrice: costPrice > 0 ? costPrice : existing.costPrice,
          catalogPrice: catalogPrice > 0 ? catalogPrice : existing.catalogPrice,
          sellingPrice: sellingPrice > 0 ? sellingPrice : existing.sellingPrice,
          validity: item.validity || existing.validity,
          batch: item.batch || existing.batch,
        });
      } else {
        // Create brand new product
        const newProd: Product = {
          id: `prod-${Date.now()}-${index}`,
          code: item.code || `PRD-${Math.floor(100 + Math.random() * 900)}`,
          name: item.name.trim(),
          brand: item.brand.trim() || configuredBrands[0] || 'O Boticário',
          category: (item.category as Category) || 'Perfumaria',
          catalogPrice,
          costPrice,
          sellingPrice,
          stock: quantity,
          minStock: 2,
          validity: item.validity || undefined,
          batch: item.batch || undefined,
          notes: item.notes || 'Cadastrado automaticamente via foto',
        };
        productsToPersist.push(newProd);
      }
    });

    onAddProducts(productsToPersist);
    handleClose();
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setItems([]);
    setErrorMsg(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border border-purple-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-purple-950 font-serif flex items-center gap-1.5">
                Tirar Foto dos Novos Produtos
                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-3 h-3 text-emerald-700" /> Entrada no Estoque com IA
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Tire foto dos produtos, caixas ou nota da marca para cadastrar no estoque automaticamente.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden inputs for camera capture and gallery selection */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Initial Prompt / Photo Capture Zone */}
        {!selectedFile ? (
          <div className="mt-5 space-y-3">
            <div className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center bg-purple-50/30">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white shadow-xs flex items-center justify-center text-purple-900 mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-purple-950 mb-1">
                Tire a foto dos cosméticos que acabaram de chegar
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Você pode fotografar um produto individual, vários frascos juntos ou a nota fiscal do pedido. A IA detecta os nomes, marcas e preços.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Abrir Câmera do Celular
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 text-purple-950 border border-purple-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-purple-700" />
                  Escolher Foto da Galeria
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Captured preview header */}
            <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-3">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Produtos capturados"
                    className="w-12 h-12 object-cover rounded-xl border border-purple-200 shadow-2xs"
                  />
                )}
                <div>
                  <span className="text-xs font-bold text-purple-950 block">Foto dos Produtos Capturada</span>
                  <span className="text-[11px] text-slate-500">{selectedFile.name || 'foto-produtos.jpg'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold text-purple-900 bg-white border border-purple-200 rounded-xl hover:bg-purple-50 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Tirar Outra Foto
              </button>
            </div>

            {/* Loading Indicator */}
            {isProcessing && (
              <div className="p-7 bg-white border border-purple-200 rounded-2xl text-center space-y-2.5 shadow-xs">
                <Loader2 className="w-8 h-8 text-purple-900 animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-purple-950">Identificando cosméticos na foto com IA...</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Reconhecendo nomes de perfumes, marcas parceiras, preços de catálogo e calculando seu custo com base na comissão.
                </p>
              </div>
            )}

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Aviso:</strong> {errorMsg}
                </div>
              </div>
            )}

            {/* Recognized Items List */}
            {!isProcessing && items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-purple-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Produtos Reconhecidos ({items.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Ajuste quantidades ou preços antes de salvar no estoque
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                  {items.map((item, idx) => {
                    const comm = getCommissionForBrand(item.brand);
                    const cost = (Number(item.catalogPrice || 0) * (1 - comm / 100)).toFixed(2);
                    const isAlreadyInCatalog = existingProducts.some(
                      p => p.name.toLowerCase().trim() === item.name.toLowerCase().trim()
                    );

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50/70 border border-purple-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-purple-50/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                              className="font-bold text-xs sm:text-sm text-purple-950 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:bg-white px-1 rounded-sm w-full"
                            />
                            {isAlreadyInCatalog && (
                              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Já no catálogo (+ estoque)
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-600 px-1">
                            <select
                              value={item.brand}
                              onChange={(e) => handleUpdateItem(idx, 'brand', e.target.value)}
                              className="text-[11px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-md text-purple-950"
                            >
                              {configuredBrands.map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                              {!configuredBrands.includes(item.brand) && item.brand && (
                                <option value={item.brand}>{item.brand}</option>
                              )}
                            </select>

                            <span>{item.category}</span>
                            <span className="text-slate-300">•</span>
                            <span>Custo ({comm}%): <strong className="text-purple-950">R$ {cost}</strong></span>
                          </div>
                        </div>

                        {/* Price and Quantity Controls */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Preço Venda (R$)</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              value={item.catalogPrice === 0 ? '' : item.catalogPrice}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateItem(idx, 'catalogPrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-purple-950 text-right"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Qtd</span>
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                                className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-purple-950 min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(idx, 'quantity', item.quantity + 1)}
                                className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors mt-3 sm:mt-0"
                            title="Remover produto da lista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Confirm Button */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAndAddStock}
                    className="px-6 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <PackagePlus className="w-4 h-4" />
                    Subir {items.reduce((acc, i) => acc + i.quantity, 0)} Produtos para o Estoque
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
