$ErrorActionPreference = 'Stop'

function Get-Pairs($files, $pattern) {
  $out = @()
  foreach ($f in $files) {
    $html = [IO.File]::ReadAllText($f)
    foreach ($m in [regex]::Matches($html, $pattern)) {
      $url = $m.Groups[1].Value
      $name = ($m.Groups[2].Value -replace '\s+', ' ').Trim()
      if ($name) { $out += [PSCustomObject]@{ Url = $url; Name = $name } }
    }
  }
  return $out
}

# coco: <a class="product-name" href="URL">\n Name </a>
$coco = Get-Pairs @('.agnes\work\denim_coco_p1.html','.agnes\work\denim_coco_p2.html','.agnes\work\denim_coco_p3.html') '(?s)<a class="product-name" href="([^"]+)"[^>]*>\s*(?:<span[^>]*>)?([^<]+?)\s*(?:</span>)?\s*</a>'
# drip: <a href="URL" class="animation-underline">Name</a>
$drip = Get-Pairs @('.agnes\work\denim_drip_p1.html','.agnes\work\denim_drip_p2.html') '(?s)<a href="([^"]+)" class="animation-underline">\s*([^<]+?)\s*</a>'

$coco = $coco | Sort-Object { $_.Url } -Unique
$drip = $drip | Sort-Object { $_.Url } -Unique
"COCO pairs: $($coco.Count)"
"DRIp pairs: $($drip.Count)"

$coco | ForEach-Object { "{0}`t{1}" -f $_.Name, $_.Url } | Set-Content '.agnes\work\coco_pairs.tsv' -Encoding utf8
$drip | ForEach-Object { "{0}`t{1}" -f $_.Name, $_.Url } | Set-Content '.agnes\work\drip_pairs.tsv' -Encoding utf8
