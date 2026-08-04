import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Check, Settings } from 'lucide-react';

const OPTIONS = [
  {
    value: 'upper',
    title: 'Tudo MaiÃºsculo',
    description: 'Todo texto Ã© convertido para CAIXA ALTA.',
    example: 'RMC COMERCIO DE ALIMENTOS LTDA',
  },
  {
    value: 'title',
    title: 'Primeira letra MaiÃºscula',
    description: 'Cada palavra comeÃ§a com maiÃºscula e as preposiÃ§Ãµes ficam em minÃºsculo.',
    example: 'Rmc Comercio de Alimentos Ltda',
  },
  {
    value: 'free',
    title: 'Entrada livre',
    description: 'O texto Ã© mantido exatamente como digitado.',
    example: 'Rmc COMERCIO de alimentos LTDA',
  },
];

export default function SettingsPage() {
  const { user, permissions } = useAuth();
  const { dataCase, saveDataCase, loading } = useSettings();
  const [savedValue, setSavedValue] = useState(null);

  const canManage = permissions?.['settings'] === 'edit';

  const handleSelect = async (value) => {
    if (!canManage || value === dataCase) return;
    const ok = await saveDataCase(value);
    if (ok) setSavedValue(value);
  };

  if (!canManage) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-500">VocÃª nÃ£o tem permissÃ£o para alterar as configuraÃ§Ãµes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings size={24} /> ConfiguraÃ§Ã£o de texto
      </h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-1">Caixa de texto dos dados</h2>
        <p className="text-sm text-gray-500 mb-4">
          Define como os textos digitados nos formulÃ¡rios e os dados automÃ¡ticos (busca de CNPJ e CEP) serÃ£o gravados.
        </p>

        <div className="space-y-3">
          {OPTIONS.map(opt => {
            const active = dataCase === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                disabled={loading}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  active ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{opt.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
                    <p className="text-sm text-gray-700 mt-1">{opt.example}</p>
                  </div>
                  {active && <Check size={20} className="text-brand-600 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {savedValue && (
          <p className="mt-4 text-sm text-green-600">ConfiguraÃ§Ã£o salva com sucesso.</p>
        )}
        {loading && <p className="mt-4 text-sm text-gray-500">Salvando...</p>}
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-1">Conectado como</p>
        <p>{user?.name} ({user?.email})</p>
      </div>
    </div>
  );
}
