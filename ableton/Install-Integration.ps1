# Invoked by the QUINTA NSIS installer, including electron-updater installations.
param([Parameter(Mandatory)][string]$DocumentsPath)
$ErrorActionPreference = 'Stop'
$source = $PSScriptRoot
$ableton = Join-Path $DocumentsPath 'Ableton'
$library = Join-Path $ableton 'User Library'
$log = Join-Path $ableton 'QUINTA-install.log'
$entries = @(
    @('QUINTA Receiver.amxd', 'QUINTA Receiver\QUINTA Receiver.amxd'),
    @('quinta_receiver.js', 'QUINTA Receiver\quinta_receiver.js'),
    @('Remote Scripts\QUINTA\__init__.py', 'Remote Scripts\QUINTA\__init__.py'),
    @('Remote Scripts\QUINTA\control_surface.py', 'Remote Scripts\QUINTA\control_surface.py')
)
try {
    foreach ($entry in $entries) {
        if (-not (Test-Path -LiteralPath (Join-Path $source $entry[0]) -PathType Leaf)) { throw "Falta $($entry[0]) en el paquete." }
    }
    $rackSource = Join-Path $source 'Quinta MIDI Reciever.adg'
    if (-not (Test-Path -LiteralPath $rackSource -PathType Leaf)) { throw 'Falta el preset Rack en el paquete.' }
    New-Item -ItemType Directory -Force -Path $library | Out-Null
    $backup = Join-Path $ableton ('QUINTA-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,8))
    $rackTarget = Join-Path $library 'Presets\MIDI Effects\MIDI Effect Rack\Quinta MIDI Reciever.adg'
    foreach ($entry in $entries) {
        $target = Join-Path $library $entry[1]
        if (Test-Path -LiteralPath $target -PathType Leaf) {
            $saved = Join-Path $backup $entry[1]
            New-Item -ItemType Directory -Force -Path (Split-Path $saved) | Out-Null
            Copy-Item -LiteralPath $target -Destination $saved
        }
    }
    if (Test-Path -LiteralPath $rackTarget -PathType Leaf) {
        $saved = Join-Path $backup 'Presets\MIDI Effects\MIDI Effect Rack\Quinta MIDI Reciever.adg'
        New-Item -ItemType Directory -Force -Path (Split-Path $saved) | Out-Null
        Copy-Item -LiteralPath $rackTarget -Destination $saved
    }
    # Live stores both a User Library relative reference and an absolute fallback.
    $inputStream = [IO.File]::OpenRead($rackSource)
    try {
        $gzip = [IO.Compression.GzipStream]::new($inputStream, [IO.Compression.CompressionMode]::Decompress)
        try { $reader = [IO.StreamReader]::new($gzip, [Text.Encoding]::UTF8); $xml = $reader.ReadToEnd(); $reader.Dispose() }
        finally { $gzip.Dispose() }
    } finally { $inputStream.Dispose() }
    if (-not $xml.Contains('<RelativePath Value="QUINTA Receiver/QUINTA Receiver.amxd" />')) { throw 'La ruta relativa del Rack no coincide con el dispositivo incluido.' }
    $devicePath = (Join-Path $library 'QUINTA Receiver\QUINTA Receiver.amxd').Replace('\','/')
    $pattern = '<Path Value="[^"]*/QUINTA Receiver/QUINTA Receiver\.amxd" />'
    if ([regex]::Matches($xml, $pattern).Count -ne 1) { throw 'La referencia absoluta del Rack es ambigua.' }
    $replacement = '<Path Value="' + [Security.SecurityElement]::Escape($devicePath) + '" />'
    $xml = [regex]::Replace($xml, $pattern, [Text.RegularExpressions.MatchEvaluator]{ param($match) $replacement })
    [xml]$null = $xml
    foreach ($entry in $entries) {
        $from = Join-Path $source $entry[0]
        $target = Join-Path $library $entry[1]
        New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
        Copy-Item -LiteralPath $from -Destination $target -Force
        if ((Get-FileHash -LiteralPath $from).Hash -ne (Get-FileHash -LiteralPath $target).Hash) { throw "Falló la copia de $target" }
    }
    New-Item -ItemType Directory -Force -Path (Split-Path $rackTarget) | Out-Null
    $outputStream = [IO.File]::Create($rackTarget)
    try {
        $gzip = [IO.Compression.GzipStream]::new($outputStream, [IO.Compression.CompressionMode]::Compress)
        try { $bytes = [Text.Encoding]::UTF8.GetBytes($xml); $gzip.Write($bytes, 0, $bytes.Length) }
        finally { $gzip.Dispose() }
    } finally { $outputStream.Dispose() }
    "QUINTA instalado en $library. Respaldo: $backup. Reiniciá Live y seleccioná QUINTA en Control Surface." | Set-Content -LiteralPath $log -Encoding UTF8
} catch {
    New-Item -ItemType Directory -Force -Path $ableton | Out-Null
    "Error: $($_.Exception.Message)" | Set-Content -LiteralPath $log -Encoding UTF8
    Write-Error $_
    exit 1
}
