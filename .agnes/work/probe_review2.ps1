$ErrorActionPreference='Stop'
$html=[IO.File]::ReadAllText('.agnes\work\prod_sample.html')
$ms=[regex]::Matches($html,'/biz/[A-Za-z0-9_]+')
$ms | ForEach-Object { $_.Value } | Sort-Object -Unique
''
"---- data-product / review script vars ----"
$ms2=[regex]::Matches($html,'(?i)(review[s]?[A-Za-z]*\s*[:=][^,;<]{0,120})')
$ms2 | ForEach-Object { $_.Groups[1].Value } | Select-Object -First 30
