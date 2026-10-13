import React, { useState } from 'react';
import { 
  Calculator, 
  Percent, 
  DollarSign, 
  CreditCard, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { formatCurrency } from '../lib/storage';
import { AppSettings } from '../types';

interface CalculadoraProps {
  settings?: AppSettings;
}

export const Calculadora: React.FC<CalculadoraProps> = ({ settings }) => {
  // Configured brands list
  const activeBrands = settings?.brands && settings.brands.length > 0
    ? settings.brands
    : [
        { name: 'O Boticário', commission: settings?.defaultCommissions?.['O Boticário'] ?? 15, active: true },
        { name: 'Eudora', commission: settings?.defaultCommissions?.['Eudora'] ?? 30, active: true }, { name: 'Natura', commission: settings?.defaultCommissions?.['Natura'] ?? 30, active: true },
      ];

  const initialComm = activeBrands[0]?.commission ?? 15;

  // Preço de Catálogo (Site oficial)
  const [catalogPrice, setCatalogPrice] = useState<number>(189.90);
  // Comissão da Marca (desconto que a revendedora tem na compra)
  const [brandDiscount, setBrandDiscount] = useState<number>(initialComm);
  // Desconto que ela dará para a cliente
  const [customerDiscount, setCustomerDiscount] = useState<number>(0); // 0%
  // Tipo de recebimento
  const [paymentType, setPaymentType] = useState<'pix' | 'debit' | 'credit1x' | 'creditInstallment'>('pix');
  const [installments, setInstallments] = useState<number>(3);

  // Taxas da maquininha das configurações
  const rateDebit = settings?.cardFeeDebit ?? 1.89; // %
  const rateCredit1x = settings?.cardFeeCreditSight ?? 3.49; // %
  const rateCreditPerInstallment = settings?.cardFeeCreditInstallment ?? 1.45; // % por parcela além da 1ª

  // Cálculos
  // Custo pago pela revendedora:
  const costPrice = catalogPrice * (1 - brandDiscount / 100);

  // Preço cobrado do cliente:
  const sellingPrice = catalogPrice * (1 - customerDiscount / 100);

  // Taxa da maquininha
  let cardRatePercent = 0;
  if (paymentType === 'pix') cardRatePercent = 0;
  else if (paymentType === 'debit') cardRatePercent = rateDebit;
  else if (paymentType === 'credit1x') cardRatePercent = rateCredit1x;
  else if (paymentType === 'creditInstallment') {
    cardRatePercent = rateCredit1x + (installments - 1) * rateCreditPerInstallment;
  }

  const cardFeeAmount = sellingPrice * (cardRatePercent / 100);
  const netReceived = sellingPrice - cardFeeAmount;
  const netProfit = netReceived - costPrice;
  const marginPercent = netReceived > 0 ? (netProfit / netReceived) * 100 : 0;
  const markupPercent = costPrice > 0 ? (netProfit / costPrice) * 100 : 0;

  return (
    <div id="calculadora-view" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-purple-950 font-serif">Calculadora de Preço & Lucro Real</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Simule descontos para clientes, taxas de cartão e descubra exatamente o dinheiro líquido que sobra no seu bolso.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-purple-100/80 shadow-xs space-y-5">
          {/* Brand Commission Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase text-purple-950">
                Sua Marca & Comissão de Revendedora
              </label>
              <span className="text-[11px] text-slate-400">
                Selecione para preencher sua margem
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {activeBrands.map(b => {
                const isSelected = brandDiscount === b.commission;
                const isBoti = b.name.toLowerCase().includes('boticário') || b.name.toLowerCase().includes('boticario');
                const isEudora = b.name.toLowerCase().includes('eudora');
const isNatura = b.name.toLowerCase().includes('natura');

                return (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => setBrandDiscount(b.commission)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected 
                        ? 'bg-purple-900 text-white border-purple-900 shadow-xs ring-2 ring-purple-300/50' 
                        : isBoti
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : isEudora
                        ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {b.name} ({b.commission}%)
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Preço Oficial do Site da Marca (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={catalogPrice === 0 ? '' : catalogPrice}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCatalogPrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Preço cheio do site</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Sua Margem de Compra (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={brandDiscount === 0 ? '' : brandDiscount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setBrandDiscount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-purple-950 focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">%</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                Custo de compra: <strong>{formatCurrency(costPrice)}</strong>
              </span>
            </div>
          </div>

          {/* Customer Promotion Discount */}
          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase text-purple-950">
                Desconto para a Cliente (%)
              </label>
              <span className="text-xs font-bold text-purple-800">{customerDiscount}% de desconto</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={customerDiscount}
              onChange={(e) => setCustomerDiscount(parseInt(e.target.value) || 0)}
              className="w-full accent-purple-900 cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>0% (Preço do Site Oficial)</span>
              <span>10% (Promoção padrão)</span>
              <span>20% (Queima de estoque)</span>
            </div>
          </div>

          {/* Payment Method & Machine Fees */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-700">
              Forma de Recebimento (Taxas da Maquininha)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('pix')}
                className={`p-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                  paymentType === 'pix'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300/40'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                PIX / Dinheiro
                <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">0% taxa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('debit')}
                className={`p-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                  paymentType === 'debit'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-300/40'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Débito
                <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{rateDebit}% taxa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('credit1x')}
                className={`p-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                  paymentType === 'credit1x'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-300/40'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Crédito 1x
                <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{rateCredit1x}% taxa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('creditInstallment')}
                className={`p-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                  paymentType === 'creditInstallment'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-300/40'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Parcelado
                <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Escalonada</span>
              </button>
            </div>

            {paymentType === 'creditInstallment' && (
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-600 font-medium">Parcelar em:</span>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value) || 2)}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  {[2, 3, 4, 5, 6, 10, 12].map(n => (
                    <option key={n} value={n}>{n}x vezes</option>
                  ))}
                </select>
                <span className="text-xs text-purple-900 font-semibold ml-auto">
                  Taxa total: {cardRatePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Result & Profit Breakdown */}
        <div className="lg:col-span-5 bg-gradient-to-br from-purple-950 via-purple-900 to-violet-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl flex flex-col justify-between space-y-6 border border-purple-900">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h2 className="font-serif text-lg font-bold text-white">Resultado da Simulação</h2>
            </div>

            <div className="space-y-3 divide-y divide-white/10 text-sm">
              <div className="flex items-center justify-between pt-2">
                <span className="text-purple-200">Preço do Site Oficial:</span>
                <span className="font-semibold text-white">{formatCurrency(catalogPrice)}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-purple-200">Preço Cobrado da Cliente:</span>
                <span className="text-xl font-bold text-emerald-300 font-serif">{formatCurrency(sellingPrice)}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-purple-200">Seu Custo de Compra:</span>
                <span className="font-mono text-purple-200">-{formatCurrency(costPrice)}</span>
              </div>

              {cardFeeAmount > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-purple-200">Taxa Maquininha ({cardRatePercent.toFixed(2)}%):</span>
                  <span className="font-mono text-rose-300">-{formatCurrency(cardFeeAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-purple-200">Líquido Creditado na Conta:</span>
                <span className="font-bold text-white">{formatCurrency(netReceived)}</span>
              </div>
            </div>

            {/* Big Net Profit Card */}
            <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-xs">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-300 block">
                Seu Lucro Líquido Real
              </span>
              <p className="text-3xl font-black text-emerald-300 mt-1 font-serif">
                +{formatCurrency(netProfit)}
              </p>
              <div className="flex items-center justify-between mt-3 text-xs text-purple-100">
                <span>Margem Líquida: <strong>{marginPercent.toFixed(1)}%</strong></span>
                <span>Markup sobre Custo: <strong>{markupPercent.toFixed(1)}%</strong></span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-purple-200/90 bg-black/20 p-3.5 rounded-2xl flex items-start gap-2 border border-white/10">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Dica: Ao vender à vista pelo PIX ou dinheiro, você não paga taxa de maquininha e aproveita 100% da sua comissão líquida de {brandDiscount}%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
