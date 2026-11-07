# Run manually with Live closed. This is a development test copy, not the release installer.
param([string]$UserLibrary = 'C:\Users\Produ\Documents\Ableton\User Library')
$ErrorActionPreference = 'Stop'
if (Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -like 'Ableton Live*' }) {
    throw 'Close Ableton Live before replacing the test receiver.'
}
if (-not (Test-Path -LiteralPath $UserLibrary -PathType Container)) { throw 'User Library not found.' }
$backup = Join-Path $env:TEMP ('QUINTA-backup-' + [guid]::NewGuid().ToString())
$files = @(
    @('QUINTA Receiver.amxd', 'QUINTA Receiver\QUINTA Receiver.amxd'),
    @('quinta_receiver.js', 'QUINTA Receiver\quinta_receiver.js'),
    @('Quinta MIDI Reciever.adg', 'Presets\MIDI Effects\MIDI Effect Rack\Quinta MIDI Reciever.adg'),
    @('Remote Scripts\QUINTA\__init__.py', 'Remote Scripts\QUINTA\__init__.py'),
    @('Remote Scripts\QUINTA\control_surface.py', 'Remote Scripts\QUINTA\control_surface.py')
)
foreach ($entry in $files) {
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $entry[0]))) { throw ('Missing source: ' + $entry[0]) }
}
foreach ($entry in $files) {
    $target = Join-Path $UserLibrary $entry[1]
    if (Test-Path -LiteralPath $target) {
        $saved = Join-Path $backup $entry[1]
        New-Item -ItemType Directory -Force -Path (Split-Path $saved) | Out-Null
        Copy-Item -LiteralPath $target -Destination $saved
    }
}
foreach ($entry in $files) {
    $source = Join-Path $PSScriptRoot $entry[0]
    $target = Join-Path $UserLibrary $entry[1]
    New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
    Copy-Item -LiteralPath $source -Destination $target
    if ((Get-FileHash -LiteralPath $source).Hash -ne (Get-FileHash -LiteralPath $target).Hash) { throw ('Copy verification failed: ' + $target) }
}
Write-Host ('Test files copied and verified. Previous files: ' + $backup)
Write-Host 'Open Live with QUINTA selected as Control Surface and test in a new Set without a receiver.'
