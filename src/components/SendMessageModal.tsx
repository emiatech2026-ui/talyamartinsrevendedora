import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  MessageSquare, 
  Phone, 
  User, 
  AlertCircle, 
  DollarSign, 
  Gift, 
  ShoppingBag, 
  Heart, 
  Edit3
} from 'lucide-react';
import { Customer, AppSettings, MessageTemplates } from '../types';
import { 
  TEMPLATE_OPTIONS, 
  MessageTemplateType, 
  renderMessageTemplate, 
  buildWhatsAppUrl, 
  DEFAULT_MESSAGE_TEMPLATES 
} from '../lib/messageTemplates';
import { formatCurrency } from '../lib/storage';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  initialTemplate?: MessageTemplateType;
  settings: AppSettings;
  onUpdateCustomerPhone?: (customerId: string, newPhone: string) => void;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  customer,
  initialTemplate,
  settings,
  onUpdateCustomerPhone,
}) => {
  const [selectedType, setSelectedType] = useState<MessageTemplateType>('debtReminder');
  const [messageText, setMessageText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [customPhone, setCustomPhone] = useState<string>('');

  // Determine initial template when modal opens or customer changes
  useEffect(() => {
    if (!customer) return;

    setCustomPhone(customer.phone || '');

    // Choose the most logical template if not explicitly provided
    let startingType: MessageTemplateType = initialTemplate || 'debtReminder';

    if (!initialTemplate) {
      const currentMonth = new Date().getMonth() + 1;
      const isBirthday = customer.birthDate && parseInt(customer.birthDate.split('-')[1], 10) === currentMonth;
      
      if (isBirthday) {
        startingType = 'birthday';
      } else if ((customer.outstandingBalance || 0) > 0) {
        startingType = 'debtReminder';
      } else {
        startingType = 'promotions';
      }
    }

    setSelectedType(startingType);
    generateTextForType(startingType, customer.phone || '');
  }, [isOpen, customer, initialTemplate]);

  if (!isOpen || !customer) return null;

  const getTemplateContent = (type: MessageTemplateType): string => {
    if (type === 'custom') {
      return `Olá, ${customer.name.trim().split(' ')[0]}! Tudo bem? `;
    }

    const templates: MessageTemplates = {
      ...DEFAULT_MESSAGE_TEMPLATES,
      ...(settings.messageTemplates || {}),
    };

    return templates[type] || DEFAULT_MESSAGE_TEMPLATES[type] || '';
  };

  const generateTextForType = (type: MessageTemplateType, phoneToUse?: string) => {
    const rawTemplate = getTemplateContent(type);
    const rendered = renderMessageTemplate(rawTemplate, {
      customerName: customer.name,
      phone: phoneToUse ?? customPhone,
      debtAmount: customer.outstandingBalance || 0,
      pixKey: settings.pixKey,
      resellerName: settings.resellerName,
      resellerPhone: settings.phone || settings.whatsapp,
    });
    setMessageText(rendered);
  };

  const handleSelectType = (type: MessageTemplateType) => {
    setSelectedType(type);
    generateTextForType(type);
  };

  const handleResetToDefault = () => {
    generateTextForType(selectedType);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = messageText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const targetPhone = customPhone || customer.phone || '';
    if (targetPhone && onUpdateCustomerPhone && targetPhone !== customer.phone) {
      onUpdateCustomerPhone(customer.id, targetPhone);
    }

    const url = buildWhatsAppUrl(targetPhone, messageText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const insertVariable = (tag: string) => {
    setMessageText(prev => prev + tag);
  };

  const currentMonth = new Date().getMonth() + 1;
  const isBirthdayMonth = customer.birthDate && parseInt(customer.birthDate.split('-')[1], 10) === currentMonth;
  const hasDebt = (customer.outstandingBalance || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="send-message-modal"
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-purple-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-emerald-950 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                <MessageSquare className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
                Enviar Mensagem para Cliente
              </h2>
            </div>
            
            {/* Client preview badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-xs">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                {customer.name}
              </span>

              {hasDebt && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  <DollarSign className="w-3.5 h-3.5" />
                  Fiado: {formatCurrency(customer.outstandingBalance)}
                </span>
              )}

              {isBirthdayMonth && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-400/20 text-pink-200 border border-pink-400/30">
                  <Gift className="w-3.5 h-3.5" />
                  Aniversariante! 🎉
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-purple-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors relative z-10"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Decorative subtle background glow */}
          <div className="absolute right-0 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Phone Field Verification */}
          <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-purple-800 shrink-0" />
              <div>
                <span className="text-xs font-bold text-purple-950 block">Número de WhatsApp do Cliente</span>
                <span className="text-[11px] text-slate-500">O link abrirá a conversa diretamente com este número.</span>
              </div>
            </div>
            <div className="w-full sm:w-52">
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="(DDD) 99999-9999"
                className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-purple-950"
              />
            </div>
          </div>

          {/* Template Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Escolha o Tipo de Mensagem:
              </label>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] font-semibold text-purple-800 hover:text-purple-950 flex items-center gap-1 hover:underline"
                title="Recarregar modelo padrão pré-definido"
              >
                <RotateCcw className="w-3 h-3" />
                Restaurar texto padrão
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATE_OPTIONS.map((opt) => {
                const isSelected = selectedType === opt.type;
                const isSpecial = (opt.type === 'debtReminder' && hasDebt) || (opt.type === 'birthday' && isBirthdayMonth);

                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleSelectType(opt.type)}
                    className={`p-3 rounded-2xl text-left border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                        : 'bg-white hover:bg-purple-50/60 border-purple-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-lg">{opt.icon}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : isSpecial
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100/60 text-purple-900'
                      }`}>
                        {opt.badge}
                      </span>
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {opt.title}
                      </span>
                      <span className={`text-[10px] line-clamp-1 block mt-0.5 ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                        {opt.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Placeholder Insertion Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Variáveis Dinâmicas (Clique para adicionar):
              </span>
              <span className="text-[11px] text-slate-400">
                Substituídas pelos dados reais
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { tag: '{primeiro_nome}', label: 'Primeiro Nome' },
                { tag: '{nome}', label: 'Nome Completo' },
                { tag: '{valor}', label: 'Saldo Devedor' },
                { tag: '{pix}', label: 'Chave PIX' },
                { tag: '{revendedora}', label: 'Nome Revenda' },
              ].map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(` ${v.tag} `)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/60 transition-colors"
                >
                  +{v.tag} <span className="text-[9px] text-slate-400 font-sans">({v.label})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editable Textarea Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-purple-700" />
                Texto da Mensagem (Você pode editar livremente antes de enviar):
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {messageText.length} caracteres
              </span>
            </div>

            <textarea
              rows={8}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Digite sua mensagem para a cliente..."
              className="w-full p-4 rounded-2xl bg-purple-50/20 border border-purple-200 text-xs sm:text-sm text-slate-800 font-sans leading-relaxed focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all resize-y"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-50/80 border-t border-purple-100/80 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors text-center"
          >
            Fechar
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-950 text-xs font-bold shadow-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Texto Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-purple-700" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>

            {/* Send WhatsApp Button */}
            <button
              type="button"
              id="btn-confirm-send-whatsapp"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Enviar pelo WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
