# 探针安装道:端口随槽渲染(%%BROWSE_PORT%% 单源替换)
# 用法:browse userscript install 换成 node scripts/install-probe.mjs <slot> <probe.user.js>
#   slot: default/web/gh(与 BROWSE_NAME 同名,daemon 端口按槽解析)
# 设计(S016):browse 侧原样落盘不消费模板,替换责任在本仓安装道;
# 每次安装渲染一份带本槽端口的临时件再落 browse userscript install。
# 兜底纪律:未渲染的 %%BROWSE_PORT%% 在 prelude 侧改为不报+warn,
# 静默错投比不投更糟(browse 工位定谳)。

param(
    [Parameter(Mandatory = $true)][string]$Slot,
    [Parameter(Mandatory = $true)][string]$ProbePath
)

$ErrorActionPreference = "Stop"

# 槽 → daemon 端口(与 browse 派生一致;default 9880,余者 9900+hash)
$ports = @{ default = "9880"; web = "9921"; gh = "9934" }
if (-not $ports.ContainsKey($Slot)) {
    Write-Host "未知槽:$Slot(可用:$($ports.Keys -join ' '))"
    exit 2
}
$port = $ports[$Slot]

$src = Get-Content $ProbePath -Raw -Encoding UTF8
$rendered = $src -replace '%%BROWSE_PORT%%', $port
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("probe-render-" + [guid]::NewGuid().ToString("N").Substring(0,8) + ".user.js")
Set-Content -Path $tmp -Value $rendered -Encoding UTF8

$env:BROWSE_NAME = $Slot
& browse userscript install $tmp --restart 2>&1 | Write-Host
Remove-Item $tmp.FullName -Force
Write-Host "[install-probe] $Slot 槽 $ProbePath 端口已渲染 $port"
