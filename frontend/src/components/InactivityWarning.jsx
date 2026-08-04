import { Clock } from 'lucide-react';

export default function InactivityWarning({ show, countdown, onStayLoggedIn, onLogout }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock size={32} className="text-yellow-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sessão expirando</h2>
        <p className="text-gray-500 mb-2">
          Por inatividade, sua sessão será encerrada em
        </p>
        <div className="text-4xl font-bold text-yellow-600 mb-6 font-mono">
          {countdown}s
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onStayLoggedIn}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Permanecer logado
          </button>
          <button
            onClick={onLogout}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
