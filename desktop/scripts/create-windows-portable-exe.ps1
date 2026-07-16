param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [Parameter(Mandatory = $true)]
  [string]$PayloadPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

$payload = [IO.Path]::GetFullPath($PayloadPath)
$output = [IO.Path]::GetFullPath($OutputPath)
if (-not (Test-Path $payload)) {
  throw "Windows portable payload is missing: $payload"
}

$stagingDir = Join-Path $env:RUNNER_TEMP "localdraw-$Version-portable"
Remove-Item $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stagingDir | Out-Null
Copy-Item $payload (Join-Path $stagingDir 'LocalDraw.zip')

$launcher = @'
@echo off
setlocal
set "DEST=%TEMP%\LocalDraw-__VERSION__-%RANDOM%%RANDOM%"
powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%~dp0LocalDraw.zip' -DestinationPath '%DEST%' -Force"
if errorlevel 1 exit /b %errorlevel%
start "" "%DEST%\bin\launcher.exe"
'@.Replace('__VERSION__', $Version)
[IO.File]::WriteAllText(
  (Join-Path $stagingDir 'launch.cmd'),
  $launcher,
  [Text.Encoding]::ASCII
)

$sourceWithSeparator = $stagingDir.TrimEnd('\') + '\'
$sedPath = Join-Path $env:RUNNER_TEMP "localdraw-$Version-portable.sed"
$sed = @"
[Version]
Class=IEXPRESS
SEDVersion=3

[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles

[SourceFiles]
SourceFiles0=%SourceFiles0%

[SourceFiles0]
%FILE0%=
%FILE1%=

[Strings]
TargetName="$output"
FriendlyName="LocalDraw $Version Portable"
AppLaunched="cmd.exe /d /c launch.cmd"
SourceFiles0="$sourceWithSeparator"
FILE0="LocalDraw.zip"
FILE1="launch.cmd"
"@

[IO.File]::WriteAllText($sedPath, $sed, [Text.Encoding]::ASCII)
& "$env:SystemRoot/System32/iexpress.exe" /N /Q $sedPath
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $output)) {
  throw "IExpress failed to create $output"
}

Write-Host "Created single-file portable Windows launcher: $output"
