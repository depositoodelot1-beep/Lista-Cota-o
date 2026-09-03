import { Product } from '../types';

export function formatProductsForSheets(products: Product[]): string {
  // TSV format allows 1-click paste directly into Google Sheets with perfect column division
  const headers = ['Produto', 'Quantidade em Estoque', 'Responsável', 'Status', 'Data/Hora'];
  const rows = products.map((p) => [
    p.name + (p.brand ? ` (${p.brand})` : ''),
    `${p.quantity} ${p.unit || 'un'}`,
    p.responsibleName,
    p.status === 'em_falta' ? 'EM FALTA' : p.status === 'baixo_estoque' ? 'BAIXO ESTOQUE' : 'COMPRADO',
    new Date(p.createdAt).toLocaleString('pt-BR'),
  ]);

  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}

export function generateCsvContent(products: Product[]): string {
  const headers = ['Produto', 'Quantidade em Estoque', 'Responsável', 'Status', 'Data e Hora', 'Observações'];
  
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = products.map((p) => [
    escapeCsv(p.name + (p.brand ? ` - ${p.brand}` : '')),
    escapeCsv(`${p.quantity} ${p.unit || 'un'}`),
    escapeCsv(p.responsibleName),
    escapeCsv(p.status === 'em_falta' ? 'Em Falta' : p.status === 'baixo_estoque' ? 'Baixo Estoque' : 'Comprado'),
    escapeCsv(new Date(p.createdAt).toLocaleString('pt-BR')),
    escapeCsv(p.notes || ''),
  ]);

  // \uFEFF ensures UTF-8 encoding in Excel and Google Sheets
  return '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
}

export function downloadCsv(products: Product[]): void {
  const csv = generateCsvContent(products);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `lista_compras_fornecedor_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatWhatsAppMessage(products: Product[]): string {
  const dateStr = new Date().toLocaleDateString('pt-BR');
  let msg = `🛒 *LISTA DE REPOSIÇÃO - ${dateStr}*\n`;
  msg += `_Total de itens em baixa/falta: ${products.length}_\n\n`;

  products.forEach((p, idx) => {
    const statusIcon = p.quantity === 0 ? '🔴 [FALTA]' : '🟡 [BAIXO]';
    msg += `${idx + 1}. *${p.name}* ${p.brand ? `(${p.brand})` : ''}\n`;
    msg += `   └ Estoque: *${p.quantity} ${p.unit || 'un'}* ${statusIcon} | Resp: ${p.responsibleName}\n`;
  });

  msg += `\n📦 *Favor cotar e confirmar disponibilidade.*`;
  return msg;
}
