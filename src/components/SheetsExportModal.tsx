import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Copy, Check, MessageSquare, ExternalLink, Filter } from 'lucide-react';
import { Product } from '../types';
import { formatProductsForSheets, downloadCsv, formatWhatsAppMessage } from '../services/sheetsExport';

interface SheetsExportModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SheetsExportModal: React.FC<SheetsExportModalProps> = ({
  isOpen,
  products,
  onClose,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [onlyOutOfStock, setOnlyOutOfStock] = useState(false);
  const [sortAlphabetical, setSortAlphabetical] = useState(true);

  if (!isOpen) return null;

  // Filter and sort products for export
  let exportList = [...products];
  if (onlyOutOfStock) {
    exportList = exportList.filter((p) => p.quantity === 0 || p.status === 'em_falta');
  }
  if (sortAlphabetical) {
    exportList.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  const handleCopyForSheets = async () => {
    try {
      const text = formatProductsForSheets(exportList);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onToast('Tabela copiada com sucesso!', 'Cole direto no Google Planilhas com Ctrl+V');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast('Não foi possível copiar', 'Verifique as permissões de área de transferência', 'error');
    }
  };

  const handleDownloadCsv = () => {
    downloadCsv(exportList);
    onToast('Download iniciado', 'Arquivo CSV compatível com Google Sheets');
  };

  const handleOpenGoogleSheets = () => {
    handleCopyForSheets();
    window.open('https://docs.google.com/spreadsheets/create', '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = formatWhatsAppMessage(exportList);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div
      id="sheets-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="sheets-modal-card"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/90 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 id="modal-sheets-title" className="text-xl font-bold text-slate-900">
                Google Sheets & Fornecedores
              </h2>
              <p className="text-xs text-slate-500">
                Exporte os dados formatados com Nome, Estoque e Responsável
              </p>
            </div>
          </div>
          <button
            id="btn-close-sheets-modal"
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Options */}
        <div className="flex items-center justify-between gap-3 mt-4 py-2 px-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex-wrap">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyOutOfStock}
                onChange={(e) => setOnlyOutOfStock(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Apenas estoque zero (Em falta)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sortAlphabetical}
                onChange={(e) => setSortAlphabetical(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Ordem alfabética (A-Z)</span>
            </label>
          </div>

          <span className="text-xs font-bold text-slate-500">
            {exportList.length} itens selecionados
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {/* Open in Google Sheets */}
          <button
            id="btn-open-sheets-direct"
            type="button"
            onClick={handleOpenGoogleSheets}
            className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir no Google Sheets</span>
          </button>

          {/* Copy Table to Clipboard */}
          <button
            id="btn-copy-sheets-table"
            type="button"
            onClick={handleCopyForSheets}
            className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 active:scale-98 text-blue-700 border border-blue-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tabela Copiada!' : 'Copiar para Planilha'}</span>
          </button>

          {/* Download CSV */}
          <button
            id="btn-download-sheets-csv"
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivo CSV</span>
          </button>

          {/* Send via WhatsApp */}
          <button
            id="btn-whatsapp-supplier"
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-800 border border-emerald-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Enviar ao Fornecedor (WhatsApp)</span>
          </button>
        </div>

        {/* Data Preview Table */}
        <div className="mt-5">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pré-visualização da Lista para Fornecedores:
          </p>
          <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Qtd. em Estoque</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {exportList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-semibold">
                      {p.name} {p.brand && <span className="text-slate-400 font-normal">({p.brand})</span>}
                    </td>
                    <td className="py-2 px-3 font-bold">
                      <span className={p.quantity === 0 ? 'text-rose-600' : 'text-slate-700'}>
                        {p.quantity} {p.unit || 'un'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{p.responsibleName}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          p.quantity === 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.quantity === 0 ? 'Em falta' : 'Baixo estoque'}
                      </span>
                    </td>
                  </tr>
                ))}
                {exportList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Nenhum produto correspondente aos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <p>
            Dica: Ao clicar em "Abrir no Google Sheets", a planilha em branco é aberta e os dados já estarão copiados para colar com Ctrl+V!
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
