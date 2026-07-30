import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ImportExcelModal({ open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/products/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      onImported();
    } catch (err) {
      setResult({ imported: 0, errors: [err.response?.data?.detail || 'Erro no upload'] });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) setFile(f);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-green-600" /> Importar Planilha
          </h2>
          <button onClick={() => { setFile(null); setResult(null); onClose(); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <button onClick={() => {
          api.get('/products/export-template', { responseType: 'blob' })
            .then(res => {
              const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
              const a = document.createElement('a'); a.href = url; a.download = 'modelo_importacao_produtos.xlsx';
              document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
            })
            .catch(() => alert('Erro ao baixar modelo. Tente novamente.'));
        }}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-4">
          <Download size={14} /> Baixar modelo da planilha
        </button>

        {!result && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
          >
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              {file ? file.name : 'Clique ou arraste o arquivo .xlsx aqui'}
            </p>
            {!file && <p className="text-xs text-gray-400">Colunas: Nome, SKU, Descrição, Código de Barras, Preço Venda, Preço Custo, Categoria, Subcategoria, Unidade</p>}
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => { const f = e.target.files[0]; if (f) setFile(f); }} />
          </div>
        )}

        {file && !result && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setFile(null); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 flex-1">Cancelar</button>
            <button onClick={handleUpload} disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex-1">
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            <div className={`flex items-center gap-2 text-sm ${result.imported > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {result.imported > 0 ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="font-medium">{result.imported} produto(s) importado(s)</span>
            </div>
            {result.errors?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-red-700 mb-1">Erros ({result.errors.length}):</p>
                {result.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
              </div>
            )}
            <button onClick={() => { setFile(null); setResult(null); onClose(); }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
