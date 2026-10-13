import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  User, 
  Phone, 
  Key, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Store,
  CreditCard,
  Percent,
  Mail,
  MessageSquare,
  Sparkles,
  Plus,
  Trash2,
  Tag,
  Check
} from 'lucide-react';
import { AppSettings, BrandConfig, MessageTemplates } from '../types';
import { StorageService, formatCurrency } from '../lib/storage';
import { DEFAULT_MESSAGE_TEMPLATES } from '../lib/messageTemplates';

interface ConfigProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetData?: () => void;
  onImportData?: (jsonStr: string) => boolean;
  onReloadAllData?: () => void;
}

export const Config: React.FC<ConfigProps> = ({
  settings,
  onSaveSettings,
  onResetData,
  onImportData,
  onReloadAllData,
}) => {
  // Reseller info
  const [resellerName, setResellerName] = useState<string>(settings?.resellerName || 'Talya Martins Revenda');
  const [phone, setPhone] = useState<string>(settings?.phone || settings?.whatsapp || '');
  const [email, setEmail] = useState<string>(settings?.email || '');
  const [pixKey, setPixKey] = useState<string>(settings?.pixKey || '');

  // Goals & margins
  const [monthlySalesGoal, setMonthlySalesGoal] = useState<number>(
    settings?.monthlySalesGoal ?? settings?.monthlyRevenueGoal ?? 6500
  );
  const [defaultMarkup, setDefaultMarkup] = useState<number>(settings?.defaultMarkup ?? 30);
  const [receiptFooter, setReceiptFooter] = useState<string>(
    settings?.receiptFooter || 'Muito obrigada pela sua preferência e confiança! 💜✨'
  );

  // Dynamic Brands & Commissions
  const getInitialBrands = (): BrandConfig[] => {
    if (settings?.brands && settings.brands.length > 0) {
      return settings.brands;
    }
    return [
      { name: 'O Boticário', commission: settings?.defaultCommissions?.['O Boticário'] ?? 15, active: true },
      { name: 'Eudora', commission: settings?.defaultCommissions?.['Eudora'] ?? 30, active: true }, { name: 'Natura', commission: settings?.defaultCommissions?.['Natura'] ?? 30, active: true },
    ];
  };

  const [brandsList, setBrandsList] = useState<BrandConfig[]>(getInitialBrands());
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandComm, setNewBrandComm] = useState<number>(20);
  const [showAddBrand, setShowAddBrand] = useState(false);

  // Card Fees
  const [cardFeeDebit, setCardFeeDebit] = useState<number>(settings?.cardFeeDebit ?? 1.89);
  const [cardFeeCreditSight, setCardFeeCreditSight] = useState<number>(settings?.cardFeeCreditSight ?? 3.49);
  const [cardFeeCreditInstallment, setCardFeeCreditInstallment] = useState<number>(
    settings?.cardFeeCreditInstallment ?? 1.45
  );

  // Default WhatsApp message templates
  const [birthdayTemplate, setBirthdayTemplate] = useState<string>(
    settings?.messageTemplates?.birthday || DEFAULT_MESSAGE_TEMPLATES.birthday
  );
  const [debtReminderTemplate, setDebtReminderTemplate] = useState<string>(
    settings?.messageTemplates?.debtReminder || DEFAULT_MESSAGE_TEMPLATES.debtReminder
  );
  const [promotionsTemplate, setPromotionsTemplate] = useState<string>(
    settings?.messageTemplates?.promotions || DEFAULT_MESSAGE_TEMPLATES.promotions
  );
  const [orderReadyTemplate, setOrderReadyTemplate] = useState<string>(
    settings?.messageTemplates?.orderReady || DEFAULT_MESSAGE_TEMPLATES.orderReady
  );
  const [thankYouTemplate, setThankYouTemplate] = useState<string>(
    settings?.messageTemplates?.thankYou || DEFAULT_MESSAGE_TEMPLATES.thankYou
  );
  const [activeMsgTab, setActiveMsgTab] = useState<'debt' | 'birthday' | 'promo' | 'ready' | 'thanks' | 'receipt'>('debt');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if settings prop updates externally
  useEffect(() => {
    if (settings) {
      setResellerName(settings.resellerName || 'Talya Martins Revenda');
      setPhone(settings.phone || settings.whatsapp || '');
      setEmail(settings.email || '');
      setPixKey(settings.pixKey || '');
      setMonthlySalesGoal(settings.monthlySalesGoal ?? settings.monthlyRevenueGoal ?? 6500);
      setDefaultMarkup(settings.defaultMarkup ?? 30);
      if (settings.receiptFooter !== undefined) {
        setReceiptFooter(settings.receiptFooter);
      }
      setCardFeeDebit(settings.cardFeeDebit ?? 1.89);
      setCardFeeCreditSight(settings.cardFeeCreditSight ?? 3.49);
      setCardFeeCreditInstallment(settings.cardFeeCreditInstallment ?? 1.45);

      if (settings.messageTemplates) {
        setBirthdayTemplate(settings.messageTemplates.birthday || DEFAULT_MESSAGE_TEMPLATES.birthday);
        setDebtReminderTemplate(settings.messageTemplates.debtReminder || DEFAULT_MESSAGE_TEMPLATES.debtReminder);
        setPromotionsTemplate(settings.messageTemplates.promotions || DEFAULT_MESSAGE_TEMPLATES.promotions);
        setOrderReadyTemplate(settings.messageTemplates.orderReady || DEFAULT_MESSAGE_TEMPLATES.orderReady);
        setThankYouTemplate(settings.messageTemplates.thankYou || DEFAULT_MESSAGE_TEMPLATES.thankYou);
      }

      if (settings.brands && settings.brands.length > 0) {
        setBrandsList(settings.brands);
      } else {
        setBrandsList([
          { name: 'O Boticário', commission: settings.defaultCommissions?.['O Boticário'] ?? 15, active: true },
          { name: 'Eudora', commission: settings.defaultCommissions?.['Eudora'] ?? 30, active: true }, { name: 'Natura', commission: settings.defaultCommissions?.['Natura'] ?? 30, active: true },
        ]);
      }
    }
  }, [settings]);

  const handleAddBrand = () => {
    const trimmed = newBrandName.trim();
    if (!trimmed) return;

    if (brandsList.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Esta marca já está cadastrada na sua lista!');
      return;
    }

    const commission = Math.min(100, Math.max(0, Number(newBrandComm) || 20));
    const updated = [...brandsList, { name: trimmed, commission, active: true }];
    setBrandsList(updated);
    setNewBrandName('');
    setNewBrandComm(20);
    setShowAddBrand(false);
  };

  const handleUpdateBrandComm = (brandName: string, commission: number) => {
    setBrandsList(prev => prev.map(b => b.name === brandName ? { ...b, commission } : b));
  };

  const handleRemoveBrand = (brandName: string) => {
    if (brandsList.length <= 1) {
      alert('Você precisa manter pelo menos 1 marca cadastrada no sistema.');
      return;
    }
    if (confirm(`Deseja remover a marca "${brandName}"? Você poderá adicioná-la novamente quando desejar.`)) {
      setBrandsList(prev => prev.filter(b => b.name !== brandName));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanGoal = Number(monthlySalesGoal) || 6500;
    const cleanMarkup = Number(defaultMarkup) || 30;

    const defaultCommissions: Record<string, number> = {};
    brandsList.forEach(b => {
      defaultCommissions[b.name] = b.commission;
    });

    const updated: AppSettings = {
      ...settings,
      resellerName: (resellerName || '').trim() || 'Talya Martins Revenda',
      phone: (phone || '').trim(),
      whatsapp: (phone || '').trim(),
      email: (email || '').trim() || undefined,
      pixKey: (pixKey || '').trim(),
      monthlyRevenueGoal: cleanGoal,
      monthlySalesGoal: cleanGoal,
      monthlySalesTarget: cleanGoal,
      defaultMarkup: cleanMarkup,
      receiptFooter: (receiptFooter || '').trim() || undefined,
      messageTemplates: {
        birthday: birthdayTemplate,
        debtReminder: debtReminderTemplate,
        promotions: promotionsTemplate,
        orderReady: orderReadyTemplate,
        thankYou: thankYouTemplate,
      },
      cardFeeDebit: Number(cardFeeDebit) || 0,
      cardFeeCreditSight: Number(cardFeeCreditSight) || 0,
      cardFeeCreditInstallment: Number(cardFeeCreditInstallment) || 0,
      brands: brandsList,
      defaultCommissions,
    };

    onSaveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleExportBackup = () => {
    try {
      const backupJson = StorageService.exportBackupJSON();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_talya_revenda_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
      alert('Não foi possível gerar o arquivo de backup.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const ok = onImportData ? onImportData(content) : StorageService.importBackupJSON(content);
          if (ok) {
            if (onReloadAllData) onReloadAllData();
            alert('Backup restaurado com sucesso! Seus dados foram recarregados.');
            window.location.reload();
          } else {
            alert('Erro ao restaurar arquivo de backup. Verifique se o formato JSON é válido.');
          }
        } catch {
          alert('Erro ao processar o arquivo. Formato inválido.');
        }
      }
    };
    reader.onerror = () => {
      alert('Falha ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const dailyTarget = (monthlySalesGoal / 30).toFixed(2);

  return (
    <div id="config-view" className="space-y-6">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-950 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce border border-emerald-400/40">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Configurações e marcas salvas com sucesso!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-purple-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-950 font-serif">Configurações do Sistema</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie suas marcas parceiras, porcentagens de comissão, dados de recebimento e realize backups de segurança.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Cores: Verde & Roxo
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-purple-100/80 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-7">
            
            {/* Seção 1: Gestão de Marcas & Comissões (DESTAQUE) */}
            <div className="space-y-4 p-5 bg-gradient-to-br from-purple-50/50 via-white to-emerald-50/40 rounded-2xl border border-purple-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-900 text-white flex items-center justify-center font-bold text-xs">
                    %
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-purple-950 uppercase tracking-wider">
                      Marcas & Comissões da Revendedora
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      O app calcula o custo do produto subtraindo sua comissão do preço do site oficial da marca.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddBrand(!showAddBrand)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddBrand ? 'Fechar' : 'Adicionar Marca'}
                </button>
              </div>

              {/* Box Adicionar Nova Marca */}
              {showAddBrand && (
                <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      Cadastrar Nova Marca Parceira
                    </span>
                    <span className="text-[10px] text-slate-400">Ex: Avon, Natura, Mary Kay</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nome da Marca
                      </label>
                      <input
                        type="text"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="Ex: Natura, Avon, Mary Kay"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Sua Comissão (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          placeholder="20"
                          value={newBrandComm === 0 ? '' : newBrandComm}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setNewBrandComm(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                          className="w-full pr-7 pl-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-semibold"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddBrand}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Salvar Marca
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Marcas Ativas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {brandsList.map((brand) => {
                  const isBoti = brand.name.toLowerCase().includes('boticário') || brand.name.toLowerCase().includes('boticario');
                  const isEudora = brand.name.toLowerCase().includes('eudora');
const isNatura = brand.name.toLowerCase().includes('natura');
                  
                  return (
                    <div 
                      key={brand.name}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isBoti 
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : isEudora
                          ? 'bg-purple-50/70 border-purple-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isBoti ? 'bg-emerald-600' : isEudora ? 'bg-purple-600' : 'bg-slate-500'}`} />
                          <span className="text-xs font-bold text-slate-900">{brand.name}</span>
                        </div>

                        {/* Permite remover marca adicionada se houver mais de uma */}
                        {brandsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBrand(brand.name)}
                            title={`Remover marca ${brand.name}`}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-500">Sua comissão:</span>
                        <div className="relative w-24">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={brand.commission === 0 ? '' : brand.commission}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleUpdateBrandComm(brand.name, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            className="w-full pr-7 pl-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 text-right"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Preço site R$ 100,00</span>
                        <span className="font-semibold text-emerald-700">
                          Seu custo: R$ {(100 * (1 - brand.commission / 100)).toFixed(2)} (lucro R$ {brand.commission.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seção 2: Identificação da Loja / Revendedora */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Store className="w-4 h-4 text-purple-900" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Identificação da Loja & Contato
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Nome da Revendedora / Loja *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={resellerName}
                      onChange={(e) => setResellerName(e.target.value)}
                      placeholder="Ex: Talya Martins Revenda"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    WhatsApp para Pedidos & Recibos *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    E-mail do Negócio
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@talyamartins.com.br"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Chave PIX (Para Cobrança & Comprovantes) *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Metas Financeiras & Precificação */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Target className="w-4 h-4 text-purple-900" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Metas de Vendas & Margem
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Meta de Vendas Mensal (R$)
                  </label>
                  <div className="relative">
                    <Target className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="50"
                      min="0"
                      placeholder="0,00"
                      value={monthlySalesGoal === 0 ? '' : monthlySalesGoal}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setMonthlySalesGoal(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Meta diária sugerida: <strong className="text-purple-950">R$ {dailyTarget}</strong> por dia.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Margem / Markup Padrão (%)
                  </label>
                  <div className="relative">
                    <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={defaultMarkup === 0 ? '' : defaultMarkup}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setDefaultMarkup(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Referência para novos cadastros e produtos avulsos.
                  </span>
                </div>
              </div>
            </div>

            {/* Seção 4: Taxas da Maquininha de Cartão */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-900" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Taxas da sua Maquininha de Cartão
                  </h2>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Descontadas automaticamente nos cálculos de lucro
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-purple-50/40 rounded-2xl border border-purple-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Débito (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={cardFeeDebit === 0 ? '' : cardFeeDebit}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setCardFeeDebit(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full pr-7 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Ex: PagBank, Stone, InfinitePay</span>
                </div>

                <div className="p-3 bg-purple-50/40 rounded-2xl border border-purple-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Crédito à Vista (1x) (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={cardFeeCreditSight === 0 ? '' : cardFeeCreditSight}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setCardFeeCreditSight(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full pr-7 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Cartão 1x no ato</span>
                </div>

                <div className="p-3 bg-purple-50/40 rounded-2xl border border-purple-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Parcelado (+% por parcela)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={cardFeeCreditInstallment === 0 ? '' : cardFeeCreditInstallment}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setCardFeeCreditInstallment(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full pr-7 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Taxa adicional por parcela</span>
                </div>
              </div>
            </div>

            {/* Seção 5: Modelos de Mensagens Padrão para WhatsApp */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-900" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Modelos de Mensagens Padrão (WhatsApp)
                  </h2>
                </div>
                <span className="text-[11px] text-purple-800 font-semibold">
                  Personalize os textos automáticos para envio rápido
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Estes modelos são carregados automaticamente ao abrir o envio de mensagens para clientes na aba Clientes e Pedidos. Você pode editá-los aqui ou diretamente antes do envio.
              </p>

              {/* Sub-tabs selector for templates */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'debt', label: '💸 Cobrança / Fiado' },
                  { id: 'birthday', label: '🎂 Aniversário' },
                  { id: 'promo', label: '💄 Novidades & Promoções' },
                  { id: 'ready', label: '🛍️ Pedido Pronto / Chegou' },
                  { id: 'thanks', label: '💖 Agradecimento Pós-Venda' },
                  { id: 'receipt', label: '🧾 Rodapé do Comprovante' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveMsgTab(tab.id as any)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors shrink-0 ${
                      activeMsgTab === tab.id
                        ? 'bg-purple-900 text-white border-purple-900 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Quick Tags Guide */}
              <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-purple-950 uppercase tracking-wider">
                  Variáveis Automáticas:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-purple-900">
                  <span className="px-2 py-0.5 bg-white rounded-md border border-purple-200">{"{primeiro_nome}"}</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-purple-200">{"{nome}"}</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-purple-200">{"{valor}"}</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-purple-200">{"{pix}"}</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-purple-200">{"{revendedora}"}</span>
                </div>
              </div>

              {/* Active Tab Textarea */}
              <div className="space-y-2">
                {activeMsgTab === 'debt' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Mensagem Padrão de Cobrança / Lembrete de Fiado:
                      </label>
                      <button
                        type="button"
                        onClick={() => setDebtReminderTemplate(DEFAULT_MESSAGE_TEMPLATES.debtReminder)}
                        className="text-[11px] font-semibold text-purple-800 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Restaurar Padrão
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={debtReminderTemplate}
                      onChange={(e) => setDebtReminderTemplate(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Enviada com valor pendente da cliente e chave PIX cadastrada.
                    </span>
                  </div>
                )}

                {activeMsgTab === 'birthday' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Mensagem Padrão de Felicitações de Aniversário:
                      </label>
                      <button
                        type="button"
                        onClick={() => setBirthdayTemplate(DEFAULT_MESSAGE_TEMPLATES.birthday)}
                        className="text-[11px] font-semibold text-purple-800 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Restaurar Padrão
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={birthdayTemplate}
                      onChange={(e) => setBirthdayTemplate(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Ideal para parabenizar aniversariantes do mês e oferecer um brinde ou desconto exclusivo.
                    </span>
                  </div>
                )}

                {activeMsgTab === 'promo' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Mensagem Padrão de Novidades, Ciclo & Promoções:
                      </label>
                      <button
                        type="button"
                        onClick={() => setPromotionsTemplate(DEFAULT_MESSAGE_TEMPLATES.promotions)}
                        className="text-[11px] font-semibold text-purple-800 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Restaurar Padrão
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={promotionsTemplate}
                      onChange={(e) => setPromotionsTemplate(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Perfeito para divulgar novos ciclos de O Boticário, Eudora e produtos a pronta-entrega.
                    </span>
                  </div>
                )}

                {activeMsgTab === 'ready' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Mensagem de Pedido Pronto para Entrega / Retirada:
                      </label>
                      <button
                        type="button"
                        onClick={() => setOrderReadyTemplate(DEFAULT_MESSAGE_TEMPLATES.orderReady)}
                        className="text-[11px] font-semibold text-purple-800 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Restaurar Padrão
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={orderReadyTemplate}
                      onChange={(e) => setOrderReadyTemplate(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Avisa a cliente que os cosméticos solicitados já chegaram e estão prontos para entrega.
                    </span>
                  </div>
                )}

                {activeMsgTab === 'thanks' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Mensagem de Agradecimento & Pós-Venda:
                      </label>
                      <button
                        type="button"
                        onClick={() => setThankYouTemplate(DEFAULT_MESSAGE_TEMPLATES.thankYou)}
                        className="text-[11px] font-semibold text-purple-800 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Restaurar Padrão
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={thankYouTemplate}
                      onChange={(e) => setThankYouTemplate(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Enviada após a compra para fidelizar, agradecer e manter contato próximo.
                    </span>
                  </div>
                )}

                {activeMsgTab === 'receipt' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Frase de Rodapé no Comprovante de Pedido:
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      value={receiptFooter}
                      onChange={(e) => setReceiptFooter(e.target.value)}
                      placeholder="Ex: Muito obrigada pela sua preferência e carinho! 💜✨"
                      className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Esta frase encerra o comprovante de compra com a lista de itens, descontos e chave PIX.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Botão de Salvar */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-7 py-3 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                Salvar Todas as Configurações
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Backup & Data Management */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card Resumo do Negócio */}
          <div className="bg-gradient-to-br from-purple-900 to-violet-950 text-white p-6 rounded-3xl shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block">
              Status da Revenda
            </span>
            <h3 className="text-lg font-serif font-bold leading-tight">
              {resellerName}
            </h3>
            <p className="text-xs text-purple-200 leading-relaxed">
              Trabalhando com <strong>{brandsList.length} marca(s)</strong> cadastradas. Seus custos são recalculados automaticamente ao selecionar cada marca.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5">
              {brandsList.map(b => (
                <span key={b.name} className="px-2.5 py-1 bg-white/10 rounded-lg text-[11px] font-semibold text-white border border-white/15">
                  {b.name}: <strong className="text-emerald-400">{b.commission}%</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Backup Box */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-900" />
              <h2 className="text-base font-bold text-slate-900">
                Backup dos Dados
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Todos os seus clientes, produtos, pedidos e configurações ficam guardados com segurança no navegador. Faça um download periódico para não perder nada.
            </p>

            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-950 hover:bg-purple-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar Backup Completo (JSON)
            </button>

            <div className="pt-1">
              <label 
                htmlFor="restore-upload"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-purple-200 hover:bg-purple-50 text-purple-900 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 text-purple-700" />
                Restaurar Arquivo de Backup
              </label>
              <input
                id="restore-upload"
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Reset Box */}
          <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-200/70 space-y-3">
            <h3 className="text-xs font-bold uppercase text-emerald-950 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
              Dados de Exemplo
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja recarregar o catálogo demonstrativo atualizado de O Boticário (15%) e Eudora (30%) com preços oficiais de site?
            </p>
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja recarregar os dados de demonstração com os preços de site oficiais e comissões (15% O Boticário e 30% Eudora)?')) {
                  if (onResetData) {
                    onResetData();
                  } else {
                    StorageService.resetAllData();
                  }
                  if (onReloadAllData) onReloadAllData();
                  alert('Dados atualizados com sucesso!');
                  window.location.reload();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Dados com Preços Oficiais
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
