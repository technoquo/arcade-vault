param()

$stdinJson = [Console]::In.ReadToEnd()
if (-not $stdinJson) { exit 0 }

try {
    $hookInput = $stdinJson | ConvertFrom-Json
} catch {
    exit 0
}

$filePath = $hookInput.tool_input.file_path
if (-not $filePath) { exit 0 }
if (-not (Test-Path $filePath)) { exit 0 }

$absolutePath = (Resolve-Path $filePath).Path
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$prettierBin = Join-Path $projectRoot "node_modules\.bin\prettier.cmd"
$eslintBin   = Join-Path $projectRoot "node_modules\.bin\eslint.cmd"

$jsExtensions = @('.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cjs', '.cts')
$ext = [System.IO.Path]::GetExtension($absolutePath).ToLower()

if (($ext -in $jsExtensions) -and (Test-Path $eslintBin)) {
    & $eslintBin --fix $absolutePath 2>&1 | Out-Null
}

if (Test-Path $prettierBin) {
    & $prettierBin --write --ignore-unknown $absolutePath 2>&1 | Out-Null
}

exit 0
