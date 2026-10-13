import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, X, FileText, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { Boleto, AppSettings } from '../types';
import { scanBoletoPhoto, ParsedBoletoResult } from '../lib/geminiPhotoService';
import { formatCurrency } from '../lib/storage';

interface ScanBoletoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBoleto: (boleto: Boleto) => void;
  settings: AppSettings;
}

export const ScanBoletoModal: React.FC<ScanBoletoModalProps> = ({
  isOpen,
  onClose,
  onSaveBoleto,
  settings,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ParsedBoletoResult | null>(null);

  // Editable fields after extraction
  const [brand, setBrand] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [cycle, setCycle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const configuredBrands = settings?.brands?.map(b => b.name) || ['O Boticário', 'Eudora', 'Natura', 'Natura'];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setErrorMsg(null);
    setExtractedData(null);

    // Automatically trigger AI extraction
    await processImage(file);
  };

  const processImage = async (fileToProcess: File) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const data = await scanBoletoPhoto(fileToProcess, configuredBrands);
      setExtractedData(data);

      // Match closest brand
      const matchedBrand = configuredBrands.find(
        b => b.toLowerCase().includes(data.brand.toLowerCase()) || data.brand.toLowerCase().includes(b.toLowerCase())
      ) || data.brand || configuredBrands[0] || 'O Boticário';

      setBrand(matchedBrand);
      setAmount(data.amount || 0);
      setDueDate(data.dueDate || '');
      setBarcode(data.barcode || '');
      setCycle(data.cycle || `Ciclo ${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
      setNotes(data.notes || 'Identificado automaticamente via foto');
    } catch (err: any) {
      console.error('Erro ao ler boleto:', err);
      setErrorMsg(
        err.message || 'Não conseguimos ler os dados do boleto automaticamente. Você pode preencher manualmente.'
      );
      // Pre-fill default values so user can still save
      setBrand(configuredBrands[0] || 'O Boticário');
      setCycle(`Ciclo ${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate || amount <= 0) {
      setErrorMsg('Por favor, informe um valor válido e a data de vencimento.');
      return;
    }

    const newBoleto: Boleto = {
      id: `bol-${Date.now()}`,
      brand: brand.trim() || 'O Boticário',
      cycle: cycle.trim() || 'Ciclo Regular',
      amount: Number(amount),
      dueDate,
      status: 'pendente',
      barcode: barcode.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSaveBoleto(newBoleto);
    handleClose();
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setErrorMsg(null);
    setIsProcessing(false);
    setAmount(0);
    setDueDate('');
    setBarcode('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-purple-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-purple-950 font-serif flex items-center gap-1.5">
                Tirar Foto do Boleto
                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  <Sparkles className="w-3 h-3 text-purple-700" /> Leitor com IA
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                A foto é lida automaticamente e sobe direto para os Boletos Pendentes.
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

        {/* Capture / Upload Zone */}
        {!selectedFile ? (
          <div className="mt-5 space-y-3">
            <div className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center bg-purple-50/30">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white shadow-xs flex items-center justify-center text-purple-900 mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-purple-950 mb-1">
                Tire a foto do boleto impresso ou na tela
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                Aponte a câmera para a data de vencimento, valor e código de barras ou linha digitável.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
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
                  Escolher da Galeria / Arquivo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Photo preview pill */}
            <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-3">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Boleto capturado"
                    className="w-12 h-12 object-cover rounded-xl border border-purple-200 shadow-2xs"
                  />
                )}
                <div>
                  <span className="text-xs font-bold text-purple-950 block">Foto do Boleto Capturada</span>
                  <span className="text-[11px] text-slate-500">{selectedFile.name || 'foto-boleto.jpg'}</span>
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
              <div className="p-6 bg-white border border-purple-200 rounded-2xl text-center space-y-2.5 shadow-xs">
                <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-purple-950">Lendo dados do boleto com IA...</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Extraindo marca parceira, valor, vencimento e linha digitável para cadastrar nos boletos pendentes.
                </p>
              </div>
            )}

            {/* Error Message if any */}
            {errorMsg && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Aviso:</strong> {errorMsg}
                </div>
              </div>
            )}

            {/* Extracted Form Fields (always editable so user can verify before saving) */}
            {!isProcessing && (
              <form onSubmit={handleSave} className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-purple-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Dados Identificados do Boleto
                  </span>
                  <span className="text-[11px] text-slate-400">Verifique e ajuste se necessário</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Marca Parceira *</label>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500"
                    >
                      {configuredBrands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      {!configuredBrands.includes(brand) && brand && (
                        <option value={brand}>{brand}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ciclo / Referência</label>
                    <input
                      type="text"
                      value={cycle}
                      onChange={(e) => setCycle(e.target.value)}
                      placeholder="Ex: Ciclo 09/2026"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-purple-950 mb-1">Valor do Boleto (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={amount === 0 ? '' : amount}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setAmount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border-2 border-emerald-500 rounded-xl text-sm font-black text-purple-950 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-950 mb-1">Data de Vencimento *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-purple-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Linha Digitável / Código de Barras</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Ex: 34191.79001 01043.510047..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observações</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Pagamento do pedido com lançamentos"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Subir para Boletos Pendentes
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
