function Get-Pairs($files, $urlPattern, $namePattern) {
  $out = @()
  foreach ($f in $files) {
    $html = [IO.File]::ReadAllText($f)
    foreach ($m in [regex]::Matches($html, $urlPattern)) { $out += [PSCustomObject]@{Url=$m.Groups[1].Value} }
    foreach ($m in [regex]::Matches($html, $namePattern)) { }
  }
  return $out
}
# coco: name is inside <a class="product-name" href="URL">  Name</a>
$cocoPairs = @()
foreach ($f in @('.agnes\work\denim_coco_p1.html','.agnes\work\denim_coco_p2.html','.agnes\work\denim_coco_p3.html')) {
  $html = [IO.File]::ReadAllText($f)
  foreach ($m in [regex]::Matches($html, '(?s)<a class="product-name" href="([^"]+)">\s*([^<]*?)\s*</a>')) {
    $cocoPairs += [PSCustomObject]@{Url=$m.Groups[1].Value; Name=($m.Groups[2].Value -replace '\s+',' ').Trim()}
  }
}
$dripPairs = @()
foreach ($f in @('.agnes\work\denim_drip_p1.html','.agnes\work\denim_drip_p2.html')) {
  $html = [IO.File]::ReadAllText($f)
  foreach ($m in [regex]::Matches($html, '(?s)<a href="([^"]+)" class="animation-underline">\s*([^<]*?)\s*</a>')) {
    $dripPairs += [PSCustomObject]@{Url=$m.Groups[1].Value; Name=($m.Groups[2].Value -replace '\s+',' ').Trim()}
  }
}
"COCO: $($cocoPairs.Count)  DRIP: $($dripPairs.Count)"
function NormName($n) {
  $n = $n.ToLowerInvariant()
  $n = $n -replace 'top quality ',''
  $n = $n -replace '^denim tears ','' -replace 'denim tears ',''
  $n = $n -replace 'denim-tears ','' -replace 'denim-tears',''
  $n = $n -replace '[^a-z0-9 ]',' '
  $n = ($n -replace '\s+',' ').Trim()
  return $n
}
$cocoPairs | ForEach-Object { "{0}|{1}" -f $_.Name,(NormName $_.Name) } | Set-Content '.agnes\work\coco_names.txt' -Encoding utf8
$dripPairs | ForEach-Object { "{0}|{1}" -f $_.Name,(NormName $_.Name) } | Set-Content '.agnes\work\drip_names.txt' -Encoding utf8
$cocoPairs | Where-Object Name -ne $null | Sort-Object {'{0}|{1}' -f $_.Name,$_.Url} | Select-Object -Unique
