import { format, parseISO, isAfter, differenceInDays } from 'date-fns';

export const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const isCustomerActive = (dueDateStr: string) => {
  try {
    const dueDate = parseISO(dueDateStr);
    if (isNaN(dueDate.getTime())) return false;
    const today = new Date();
    return isAfter(dueDate, today) || differenceInDays(dueDate, today) === 0;
  } catch {
    return false;
  }
};

export const formatWhatsappMessage = (
  template: string, 
  data: { 
    name: string; 
    amount: number; 
    dueDate: string;
  }
) => {
  const today = new Date();
  const dueDate = parseISO(data.dueDate);
  const days = differenceInDays(dueDate, today);
  
  let formattedDate = 'Data Inválida';
  try {
    if (!isNaN(dueDate.getTime())) {
      formattedDate = format(dueDate, 'dd/MM/yyyy');
    }
  } catch {}

  return template
    .replace('{nome}', data.name)
    .replace('{valor}', formatCurrency(data.amount))
    .replace('{dias}', days === 0 ? 'hoje' : days < 0 ? `vencido há ${Math.abs(days)} dias` : `${days} dias`)
    .replace('{vencimento}', formattedDate);
};
