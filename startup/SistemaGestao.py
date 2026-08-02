import subprocess, time, os, socket, threading, ctypes, sys

def _already_running():
    try:
        kernel32 = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel32.CreateMutexW.restype = ctypes.c_void_p
        kernel32.CreateMutexW(None, False, 'SistemaGestaoStartup')
        return ctypes.get_last_error() == 183
    except Exception:
        return False

EMOJI = '\U0001f4c1'
PROJ = os.path.join('C:\\Users\\fsbor\\OneDrive\\Borges', 'Backup ' + EMOJI, 'Documentos', 'Default Project')
BACKEND = os.path.join(PROJ, 'backend')
FRONTEND = os.path.join(PROJ, 'frontend')
PYTHON = 'C:\\Python314\\python.exe'
NODE = 'C:\\Program Files\\nodejs\\node.exe'
VITE = os.path.join(FRONTEND, 'node_modules', 'vite', 'bin', 'vite.js')
LOG = os.path.join(PROJ, 'startup.log')

def log(msg):
    with open(LOG, 'a', encoding='utf-8') as f:
        f.write(f'[{time.strftime("%H:%M:%S")}] {msg}\n')

def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return '?'

def show_notification(title, msg):
    try:
        ctypes.windll.user32.MessageBoxW(0, msg, title, 0x40)
    except:
        pass

def run_proc(cmd, cwd, name):
    while True:
        log(f'Starting {name}: {" ".join(cmd)}')
        proc = subprocess.Popen(cmd, cwd=cwd, creationflags=0x08000000)
        proc.wait()
        log(f'{name} exited (code {proc.returncode}). Restarting in 3s...')
        time.sleep(3)

if __name__ == '__main__':
    if _already_running():
        sys.exit(0)
    hostname = socket.gethostname()
    ip = get_ip()
    log(f'Starting Sistema Gestao on {hostname} ({ip})')

    show_notification('Sistema Gestão',
        f'Sistema de Gestão iniciado.\n\n'
        f'Celular (qualquer rede/internet):\nhttps://gestao-iscb.onrender.com\n\n'
        f'Computador:\nhttp://localhost:5173')

    threading.Thread(target=run_proc, args=(
        [PYTHON, '-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000'],
        BACKEND, 'Backend'
    ), daemon=True).start()

    time.sleep(4)

    threading.Thread(target=run_proc, args=(
        [NODE, VITE, '--port', '5173', '--host'],
        FRONTEND, 'Frontend'
    ), daemon=True).start()

    log('Both services launched. Keeping alive...')
    while True:
        time.sleep(3600)
