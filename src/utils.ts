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
  } catch { }

  return template
    .replace('{nome}', data.name)
    .replace('{valor}', formatCurrency(data.amount))
    .replace('{dias}', days === 0 ? 'hoje' : days < 0 ? `vencido há ${Math.abs(days)} dias` : `${days} dias`)
    .replace('{vencimento}', formattedDate);
};
export const parseCurrency = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;

  const cleanVal = val.toString()
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace('.', '') // Remove thousands separator
    .replace(',', '.'); // Replace decimal separator

  const parsed = parseFloat(cleanVal);
  return isNaN(parsed) ? 0 : parsed;
};

export const parseExcelDate = (val: any): string => {
  if (!val) return new Date().toISOString();

  // If it's a number (Excel serial date)
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString();
  }

  const str = val.toString().trim();

  // Handle DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }

  // Fallback to native parsing
  const d = new Date(str);
  return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
};
