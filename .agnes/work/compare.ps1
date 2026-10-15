function Norm($n) {
  $n = $n.ToLowerInvariant()
  $n = $n -replace 'top.quality', ''
  $n = $n -replace 'denim.tears', ''
  $n = $n -replace 'the', ''
  $n = $n -replace '[^a-z0-9]', ' '
  $n = ($n -replace '\s+', ' ').Trim()
  return $n
}
$coco = Import-Csv -Delimiter "`t" '.agnes\work\coco_pairs.tsv' -Header @('Name','Url')
$drip = Import-Csv -Delimiter "`t" '.agnes\work\drip_pairs.tsv' -Header @('Name','Url')
$dnorm = @{}
foreach ($d in $drip) {
  $k = Norm $d.Name
  $dnorm[$k] = $d
}
$missing = @()
foreach ($c in $coco) {
  $k = Norm $c.Name
  if (-not $dnorm.ContainsKey($k)) { $missing += [PSCustomObject]@{ Name=$c.Name; Url=$c.Url; NormKey=$k } }
}
"MISSING: $($missing.Count) of $($coco.Count) coco items"
$missing | ForEach-Object { $_.Name } | Set-Content '.agnes\work\missing_names.txt' -Encoding utf8
$missing | ForEach-Object { $_.NormKey } | Set-Content '.agnes\work\missing_keys.txt' -Encoding utf8
"--- all coco norm keys ---"
($coco | ForEach-Object { Norm $_.Name }) -join "`n"
"--- all drip norm keys ---"
($drip | ForEach-Object { Norm $_.Name }) -join "`n"
