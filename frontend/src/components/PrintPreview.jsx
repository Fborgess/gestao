import { useEffect } from 'react';
import { Printer, X } from 'lucide-react';

export default function PrintPreview({ title, subtitle, onClose, autoPrint, children }) {
  useEffect(() => {
    const origTitle = document.title;
    if (title) document.title = title;
    if (autoPrint) {
      const timer = setTimeout(() => window.print(), 500);
      return () => { clearTimeout(timer); document.title = origTitle; };
    }
    return () => { document.title = origTitle; };
  }, [autoPrint, title]);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto print-preview-overlay">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-gray-100 border-b">
        <span className="text-sm text-gray-600">PrÃ©-visualizaÃ§Ã£o de impressÃ£o</span>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-brand-700">
            <Printer size={14} /> Imprimir
          </button>
          <button onClick={onClose}
            className="px-3 py-1.5 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50">
            <X size={14} /> Fechar
          </button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {title && <h1 className="text-2xl font-bold mb-1">{title}</h1>}
        {subtitle && <p className="text-sm text-gray-600 mb-1">{subtitle}</p>}
        <p className="text-xs text-gray-400 mb-4">
          Gerado em {new Date().toLocaleDateString('pt-BR')} Ã s {new Date().toLocaleTimeString('pt-BR')}
        </p>
        {children}
      </div>
    </div>
  );
}
