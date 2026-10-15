function Get-UrLs($files, $pattern) {
  $out = @()
  foreach ($f in $files) {
    $html = [IO.File]::ReadAllText($f)
    foreach ($m in [regex]::Matches($html, $pattern)) {
      $out += $m.Groups[1].Value
    }
  }
  return ($out | Sort-Object -Unique)
}
$coco = Get-UrLs @('.agnes\work\denim_coco_p1.html','.agnes\work\denim_coco_p2.html','.agnes\work\denim_coco_p3.html') '<a class="product-name" href="([^"]+)"'
$drip = Get-UrLs @('.agnes\work\denim_drip_p1.html','.agnes\work\denim_drip_p2.html') '<a class="product-image img-box" href="([^"]+)"'
"COCO: $($coco.Count)  DRIP: $($drip.Count)"
$coco | Set-Content '.agnes\work\coco_urls.txt' -Encoding utf8
$drip | Set-Content '.agnes\work\drip_urls.txt' -Encoding utf8
# normalize: strip domain, lower, remove trailing, strip leading Top-Quality-
function Norm($u) {
  $u -replace '^https?://[^/]+/','' -replace '^top-quality-','' -replace '^Top-Quality-',''
}
$dnorm = @{}
foreach ($d in $drip) { $dnorm[(Norm $d).ToLowerInvariant()] = $d }
$missing = @()
foreach ($c in $coco) {
  $k = (Norm $c).ToLowerInvariant()
  if (-not $dnorm.ContainsKey($k)) { $missing += $c }
}
"MISSING COUNT: $($missing.Count)"
$missing | Set-Content '.agnes\work\missing_urls.txt' -Encoding utf8
