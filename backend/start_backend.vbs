Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\fsbor\OneDrive\Borges\Backup 📁\Documentos\Default Project\backend"

' Inicia o backend
WshShell.Run "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000", 0, False

' Aguarda 3 segundos e inicia ngrok
WScript.Sleep 3000

ngrokPath = "C:\Users\fsbor\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
WshShell.Run """" & ngrokPath & """ http http://localhost:8000 --log=stdout --config=""C:\Users\fsbor\AppData\Local\ngrok\ngrok.yml""", 0, False
