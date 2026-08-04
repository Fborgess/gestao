import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Printer, X } from 'lucide-react';

export default function SalePrint() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);

  useEffect(() => {
    api.get(`/sales/${id}`).then(res => setSale(res.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!sale) return;
    document.title = `Pedido #${sale.id}`;
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, [sale]);

  if (!sale) return <p className="p-8 text-center text-gray-500">Carregando...</p>;

  const curr = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',')}`;
  const dt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="no-print flex justify-between items-center mb-4 p-3 bg-gray-100 rounded-lg">
        <div>
          <span className="text-sm text-gray-600">PrÃ©-visualizaÃ§Ã£o de impressÃ£o</span>
          <p className="text-xs text-gray-400 mt-0.5">Gerado em {new Date().toLocaleString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm flex items-center gap-1 hover:bg-brand-700"><Printer size={14} /> Imprimir</button>
          <button onClick={() => window.close()} className="px-3 py-1.5 border rounded text-sm flex items-center gap-1 hover:bg-gray-50"><X size={14} /> Fechar</button>
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Pedido #{sale.id}</h1>
        <p className="text-sm text-gray-400">Sistema de GestÃ£o</p>
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="font-medium">Cliente:</span> {sale.contact_name || '-'}</div>
          <div className="text-right"><span className="font-medium">Data:</span> {dt(sale.created_at)}</div>
          <div><span className="font-medium">Tipo:</span> {sale.sale_type_name || '-'}</div>
          <div className="text-right"><span className="font-medium">Status:</span> {sale.status}</div>
        </div>
      </div>

      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-3 text-left">Produto</th>
            <th className="p-3 text-center w-16">Qtd</th>
            <th className="p-3 text-right w-24">Valor Unit.</th>
            <th className="p-3 text-right w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((it, i) => (
            <tr key={i} className="border-t">
              <td className="p-3">{it.product_name}</td>
              <td className="p-3 text-center">{it.quantity}</td>
              <td className="p-3 text-right">{curr(it.unit_price)}</td>
              <td className="p-3 text-right font-medium">{curr(it.total_price)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold text-base border-t">
            <td colSpan={3} className="p-3 text-right">Total:</td>
            <td className="p-3 text-right">{curr(sale.total_amount)}</td>
          </tr>
        </tfoot>
      </table>

      {sale.notes && (
        <div className="text-sm text-gray-600 border-t pt-4">
          <span className="font-medium">ObservaÃ§Ãµes:</span> {sale.notes}
        </div>
      )}
    </div>
  );
}
