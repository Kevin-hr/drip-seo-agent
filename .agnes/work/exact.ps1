$ErrorActionPreference = 'Stop'

function Decode($s) {
  $s -replace '&amp;','&' -replace '&#39;',"'" -replace '&quot;','"' -replace '&lt;','<' -replace '&gt;','>' -replace '&#x27;',"'"
}
function NormName($n) {
  $n = Decode $n
  $n = $n.ToLowerInvariant()
  $n = $n -replace 'top quality',''
  $n = $n -replace 'denim tears',''
  $n = $n -replace '[^a-z0-9]',''
  return $n
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

$dripKeys = @{}
foreach ($d in $drip) { $dripKeys[$d.Key] = $d }

$missing = @()
$matchedList = @()
foreach ($c in $coco) {
  if ($dripKeys.ContainsKey($c.Key)) {
    $matchedList += ("MATCH: " + $c.RawName + " -> " + $dripKeys[$c.Key].Url)
  } else {
    $missing += $c
  }
}

$matchedList | Set-Content '.agnes\work\matched.txt' -Encoding utf8
$missing | ForEach-Object { "{0}`t{1}" -f $_.RawName, $_.Url } | Set-Content '.agnes\work\missing_exact.tsv' -Encoding utf8
"EXACT MATCHES: $($matchedList.Count)"
"MISSING (exact-key): $($missing.Count)"
""
"--- matched ---"
$matchedList -join "`n"
""
"--- missing ---"
$missing | ForEach-Object { $_.RawName + "  =>  " + $_.Url }
