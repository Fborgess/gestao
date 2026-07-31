import { useState, useEffect, useRef } from 'react';
import { WifiOff } from 'lucide-react';

const CHECK_INTERVAL = 30000;
const CHECK_TIMEOUT = 40000;
const FAILURES_TO_SHOW = 2;

export default function ConnectionStatus() {
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const failuresRef = useRef(0);

  useEffect(() => {
    const check = () => {
      fetch('/api/health', { signal: AbortSignal.timeout(CHECK_TIMEOUT) })
        .then(r => r.ok ? Promise.resolve() : Promise.reject())
        .then(() => {
          failuresRef.current = 0;
          if (offline) setOffline(false);
        })
        .catch(() => {
          failuresRef.current += 1;
          if (failuresRef.current >= FAILURES_TO_SHOW && !offline) { setOffline(true); setDismissed(false); }
        });
    };
    check();
    const id = setInterval(check, CHECK_INTERVAL);
    window.addEventListener('online', check);
    window.addEventListener('offline', () => { setOffline(true); setDismissed(false); });
    return () => { clearInterval(id); window.removeEventListener('online', check); };
  }, [offline]);

  if (!offline || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white text-sm px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
      <WifiOff size={16} />
      <span>Conexão perdida com o servidor</span>
      <button onClick={() => setDismissed(true)} className="ml-auto text-white/80 hover:text-white underline text-xs">Fechar</button>
    </div>
  );
}
