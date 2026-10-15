$ErrorActionPreference = 'Stop'

function Decode($s) {
  $s -replace '&amp;','&' -replace '&#39;',"'" -replace '&quot;','"' -replace '&lt;','<' -replace '&gt;','>'
}
function NormName($n) {
  $n = Decode $n
  $n = $n.ToLowerInvariant()
  $n = $n -replace 'top quality',''
  $n = $n -replace 'denim tears',''
  $n = $n -replace '[^a-z0-9]',''
  return $n
}
function Jaccard($a, $b) {
  $sa = @{}; foreach ($ch in $a.ToCharArray()) { $sa[$ch] = ($sa[$ch] + 1) }
  $sb = @{}; foreach ($ch in $b.ToCharArray()) { $sb[$ch] = ($sb[$ch] + 1) }
  $inter = 0; $union = 0
  foreach ($k in $sa.Keys) {
    if ($sb.ContainsKey($k)) { $inter += [Math]::Min($sa[$k], $sb[$k]); $union += [Math]::Max($sa[$k], $sb[$k]) }
    else { $union += $sa[$k] }
  }
  foreach ($k in $sb.Keys) {
    if (-not $sa.ContainsKey($k)) { $union += $sb[$k] }
  }
  if ($union -eq 0) { return 0 }
  return $inter / $union
}

function Load-Pairs($file) {
  $out = @()
  foreach ($line in (Get-Content $file)) {
    $parts = $line -split "`t"
    if ($parts.Count -ge 2 -and $parts[1]) {
      $out += [PSCustomObject]@{ RawName = $parts[0]; Url = $parts[1]; Key = (NormName $parts[0]) }
    }
  }
  return $out
}

$coco = Load-Pairs '.agnes\work\coco_pairs.tsv'
$drip = Load-Pairs '.agnes\work\drip_pairs.tsv'

$matchedCoco = @{}
foreach ($c in $coco) {
  $best = $null; $bestScore = 0
  foreach ($d in $drip) {
    $s = Jaccard $c.Key $d.Key
    if ($s -gt $bestScore) { $bestScore = $s; $best = $d }
    # also try drip without "the"
  }
  $c | Add-Member NoteProperty MatchedDripName $best.RawName
  $c | Add-Member NoteProperty MatchedDripUrl $best.Url
  $c | Add-Member NoteProperty Score $bestScore
  if ($bestScore -ge 0.55) { $matchedCoco[$c.Url] = $true }
}

$missing = @($coco | Where-Object { -not $matchedCoco.ContainsKey($_.Url) })
$coco | Sort-Object Score | ForEach-Object {
  "{0:0.00} | {1}  <==  {2}" -f $_.Score, $_.RawName, $_.MatchedDripName
} | Set-Content '.agnes\work\match_all.txt' -Encoding utf8
$missing | ForEach-Object { "{0}`t{1}" -f $_.RawName, $_.Url } | Set-Content '.agnes\work\missing_final.tsv' -Encoding utf8
"MISSING: $($missing.Count) / $($coco.Count)"
"--- low-confidence matches ---"
$coco | Where-Object Score -lt 0.6 | ForEach-Object { "{0:0.00} | {1} <== {2}" -f $_.Score, $_.RawName, $_.MatchedDripName }
