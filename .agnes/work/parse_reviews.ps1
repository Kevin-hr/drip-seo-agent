$ErrorActionPreference='Stop'
$csv = Import-Csv '.agnes\work\review_results.csv'
$base = '.agnes\work\prod_pages'

# Map CSV rows to files by URL
$byUrl = @{}
Get-ChildItem $base -Filter *.html | ForEach-Object { $byUrl[$_.BaseName] = $_.FullName }

function SlugOf($u) { $s=[IO.Path]::GetFileName(($u -split '/')[ -1]); ($s -replace '[^A-Za-z0-9-]','_') }

$rows = @()
foreach ($r in $csv) {
  $fp = "$base\" + (SlugOf $r.URL) + '.html'
  $has = Test-Path $fp
  $h = if($has){ [IO.File]::ReadAllText($fp) } else { '' }
  # real image review: <img inside review_images section
  $secIm=[regex]::Match($h,'(?s)data-section-id="review_images".*?</section>')
  $secVd=[regex]::Match($h,'(?s)data-section-id="review_videos".*?</section>')
  $secLst=[regex]::Match($h,'(?s)data-section-id="review_info_list".*?</section>')
  $nImg=0;$nVid=0;$nTxt=0
  if($secIm.Success){ $nImg=([regex]::Matches($secIm.Value,'<img')).Count }
  if($secVd.Success){ $nVid=([regex]::Matches($secVd.Value,'<video|\.mp4|\.webm')).Count }
  if($secLst.Success){
    # text reviews: paragraph/list with content that is not the "no-review" placeholder
    $list=$secLst.Value
    $nTxt=([regex]::Matches($list,'(?i)<li[^>]*>|<p[^>]*>')).Count
  }
  $rows += [PSCustomObject]@{URL=$r.URL; NImg=$nImg; NVid=$nVid; NTxt=$nTxt; ImSec=$($secIm.Value.Length); VdSec=$($secVd.Value.Length); LsSec=$($secLst.Value.Length)}
}
$rows | ConvertTo-Csv -NoTypeInformation | Set-Content '.agnes\work\review_parsed.csv' -Encoding utf8
"--- products with ANY review content (img/vid/txt > baseline) ---"
$rows | Where-Object { $_.NImg -gt 0 -or $_.NVid -gt 0 } | ForEach-Object {
  "img={0} vid={1}  {2}" -f $_.NImg,$_.NVid,$_.URL
}
""
"--- review_info_list content sample (first one with large listSec) ---"
$sample = $rows | Where-Object { $_.LsSec -gt 2500 } | Select-Object -First 1
if ($sample) {
  $fp="$base\"+(SlugOf $sample.URL)+'.html'
  $h=[IO.File]::ReadAllText($fp)
  $secLst=[regex]::Match($h,'(?s)data-section-id="review_info_list".*?</section>')
  $secLst.Value.Substring(0,[Math]::Min(1500,$secLst.Value.Length)) -replace '\s+',' '
}
