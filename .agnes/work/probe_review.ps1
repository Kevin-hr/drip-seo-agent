$ErrorActionPreference='Stop'
$html=[IO.File]::ReadAllText('.agnes\work\prod_sample.html')
# find review section / ajax endpoints
foreach ($m in [regex]::Matches($html,'(?i)review')) {
}
$ms = [regex]::Matches($html,'(?i)href="[^"]*review[^"]*"|src="[^"]*review[^"]*"|url["\s:=]+["\x27][^"\x27]*review[^"\x27]*["\x27]')
$ms | ForEach-Object { $_.Value } | Select-Object -Unique -First 40
''
"---- SetBrowseInfo context ----"
$i=$html.IndexOf('SetBrowseInfo')
if ($i -ge 0) { $html.Substring([Math]::Max(0,$i-250),500) }
