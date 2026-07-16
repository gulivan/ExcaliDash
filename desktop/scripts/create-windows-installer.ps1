param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

$sourceDir = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../build/stable-win-x64'))
$output = [IO.Path]::GetFullPath($OutputPath)
$requiredFiles = @(
  'ExcaliDash-Setup.exe'
  'ExcaliDash-Setup.tar.zst'
  'ExcaliDash-Setup.metadata.json'
)

foreach ($file in $requiredFiles) {
  if (-not (Test-Path (Join-Path $sourceDir $file))) {
    throw "Windows installer input is missing: $file"
  }
}

$fileEntries = for ($index = 0; $index -lt $requiredFiles.Count; $index++) {
  "%FILE$index%="
}
$fileStrings = for ($index = 0; $index -lt $requiredFiles.Count; $index++) {
  "FILE$index=`"$($requiredFiles[$index])`""
}
$sourceWithSeparator = $sourceDir.TrimEnd('\') + '\'
$sedPath = Join-Path $env:RUNNER_TEMP "localdraw-$Version-installer.sed"
$sed = @"
[Version]
Class=IEXPRESS
SEDVersion=3

[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=0
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
$($fileEntries -join "`r`n")

[Strings]
TargetName="$output"
FriendlyName="LocalDraw $Version"
AppLaunched="ExcaliDash-Setup.exe"
SourceFiles0="$sourceWithSeparator"
$($fileStrings -join "`r`n")
"@

[IO.File]::WriteAllText($sedPath, $sed, [Text.Encoding]::ASCII)
& "$env:SystemRoot/System32/iexpress.exe" /N /Q $sedPath
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $output)) {
  throw "IExpress failed to create $output"
}

Write-Host "Created single-file Windows installer: $output"
