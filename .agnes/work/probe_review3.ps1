$ErrorActionPreference='Stop'
$html=[IO.File]::ReadAllText('.agnes\work\prod_sample.html')
$ms=[regex]::Matches($html,'(?i)review')
$last=-1; $cnt=0
foreach ($m in $ms) {
  $cnt++
  # show surrounding context for matches that look like data/markup
  $s=[Math]::Max(0,$m.Index-60)
  $len=[Math]::Min(120, $html.Length-$s)
  $ctx=$html.Substring($s,$len) -replace "`n"," "
  if ($ctx -match '(?i)class|data-|img|video|ajax|/biz|choicereview|comment|count') {
    "{0} :: {1}" -f $cnt, $ctx
  }
}
"TOTAL review occurrences: $cnt"
