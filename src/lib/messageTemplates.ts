import { MessageTemplates } from '../types';
import { formatCurrency } from './storage';

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplates = {
  birthday: `🎉 *Parabéns, {primeiro_nome}! Feliz Aniversário!* 🎂✨

Que o seu novo ciclo venha repleto de saúde, realizações, paz e muitas alegrias!

Como cliente especial da *{revendedora}*, você tem um mimo exclusivo ou desconto especial no seu próximo pedido de cosméticos! 🎁💖

Um grande abraço e aproveite muito o seu dia! ✨`,

  debtReminder: `Olá, {primeiro_nome}! Tudo bem com você? 😊✨

Aqui é a {revendedora}. Estou passando com muito carinho para lembrarmos do acerto pendente de *{valor}* referente às suas comprinhas de cosméticos.

🔑 *Chave PIX para pagamento:*
{pix}

Se preferir outra forma de pagamento ou se já tiver realizado o acerto, por favor desconsidere ou me envie o comprovante. Muito obrigada pela sua parceria e confiança! 💖`,

  promotions: `Olá, {primeiro_nome}! Tudo bem? 💄✨

Passando para te avisar que chegaram novidades imperdíveis e ofertas exclusivas na *{revendedora}*! 🛍️

Temos lançamentos incríveis de perfumaria, maquiagem e cuidados corporais com estoque a pronta-entrega.

Quer que eu te envie o catálogo com as promoções da semana? Só me responder por aqui! 🌸`,

  orderReady: `Oi, {primeiro_nome}! Boas notícias! 🛍️✨

Seus cosméticos da *{revendedora}* já estão separadinhos e embalados com todo o carinho!

Podemos combinar a melhor data e horário para sua entrega ou retirada? Me avise aqui! Muito obrigada! 💖`,

  thankYou: `Olá, {primeiro_nome}! Passando para agradecer imensamente pela sua compra na *{revendedora}*! 🥰✨

Espero de coração que você ame seus cosméticos! Qualquer dúvida sobre o uso ou quando quiser novidades, estou sempre à disposição.

Tenha uma semana maravilhosa! 🌸💖`,
};

export type MessageTemplateType = 'birthday' | 'debtReminder' | 'promotions' | 'orderReady' | 'thankYou' | 'custom';

export interface TemplateOption {
  type: MessageTemplateType;
  title: string;
  icon: string;
  badge?: string;
  description: string;
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    type: 'debtReminder',
    title: 'Cobrança / Fiado',
    icon: '💸',
    badge: 'Financeiro',
    description: 'Lembrete educado com valor pendente e chave PIX',
  },
  {
    type: 'birthday',
    title: 'Aniversário',
    icon: '🎂',
    badge: 'Especial',
    description: 'Felicitações carinhosas com brinde/desconto exclusivo',
  },
  {
    type: 'promotions',
    title: 'Novidades & Promoções',
    icon: '💄',
    badge: 'Vendas',
    description: 'Aviso de lançamentos e catálogo virtual do ciclo',
  },
  {
    type: 'orderReady',
    title: 'Pedido Pronto / Chegou',
    icon: '🛍️',
    badge: 'Entrega',
    description: 'Aviso que os cosméticos estão separados para entrega',
  },
  {
    type: 'thankYou',
    title: 'Agradecimento Pós-Venda',
    icon: '💖',
    badge: 'Fidelização',
    description: 'Agradecimento pela preferência e feedback',
  },
  {
    type: 'custom',
    title: 'Mensagem Livre',
    icon: '✍️',
    badge: 'Avulso',
    description: 'Escreva um recado personalizado do zero',
  },
];

export interface MessageContext {
  customerName: string;
  phone?: string;
  debtAmount?: number;
  pixKey?: string;
  resellerName?: string;
  resellerPhone?: string;
}

export function renderMessageTemplate(templateText: string, context: MessageContext): string {
  const fullName = context.customerName || 'Cliente';
  const firstName = fullName.trim().split(' ')[0] || fullName;
  const debtFormatted = formatCurrency(context.debtAmount || 0);
  const pix = context.pixKey || '(chave PIX não cadastrada)';
  const reseller = context.resellerName || 'Talya Martins Revenda';
  const resellerPhone = context.resellerPhone || '';

  return templateText
    .replace(/\{nome\}/gi, fullName)
    .replace(/\{primeiro_nome\}/gi, firstName)
    .replace(/\{valor\}/gi, debtFormatted)
    .replace(/\{pix\}/gi, pix)
    .replace(/\{revendedora\}/gi, reseller)
    .replace(/\{telefone\}/gi, resellerPhone);
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  
  if (cleanPhone.length >= 10) {
    // Se não tem DDI (55), adiciona se tiver 10 ou 11 dígitos (padrão Brasil)
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${fullPhone}?text=${encodedText}`;
  }
  
  return `https://wa.me/?text=${encodedText}`;
}
