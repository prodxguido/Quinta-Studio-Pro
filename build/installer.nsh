!macro customInstall
  DetailPrint "Instalando integracion de QUINTA con Ableton Live..."
  ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\ableton\Install-Integration.ps1" -DocumentsPath "$DOCUMENTS"' $0
  ${If} $0 != 0
    MessageBox MB_ICONSTOP "No se pudo instalar la integracion con Ableton (codigo $0). Revisá $DOCUMENTS\Ableton\QUINTA-install.log."
    Abort
  ${EndIf}
!macroend
