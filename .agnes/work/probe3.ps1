$ErrorActionPreference='Stop'
$h = [IO.File]::ReadAllText('.agnes\work\prod_sample.html')

# context around "reviews":
$ms=[regex]::Matches($h,'(?s)".{0,40}"reviews"\s*:\s*[^,]{0,200}')
$ms | ForEach-Object { $_.Value.Substring(0,[Math]::Min(200,$_.Value.Length)) }
''
"---- no-review block context ----"
$ni=$h.IndexOf('no-review')
$h.Substring([Math]::Max(0,$ni-100),500) -replace '\s+',' '
''
"---- review count element in markup? ----"
$cc=[regex]::Matches($h,'(?i)review[^<]{0,30}count|count[^<]{0,30}review')
$cc | ForEach-Object { $_.Value } | Select-Object -First 10
''
"---- any numeric review total in data-attr ----"
$cc2=[regex]::Matches($h,'data-[a-z-]*review[a-z-]*="[^"]*"')
$cc2 | ForEach-Object { $_.Value } | Select-Object -First 20
