$ErrorActionPreference='Stop'
$base='.agnes\work\prod_pages'
function GetPage($u){ $s=[IO.Path]::GetFileName(($u -split '/')[ -1]); $s=$s -replace '[^A-Za-z0-9-]','_'; return [IO.File]::ReadAllText("$base\$s.html") }

$withReview = @()
$rows = Import-Csv '.agnes\work\review_final.csv'
foreach($r in $rows){
  $t=[int]$r.NText+[int]$r.NImg
  if($t -gt 0){ $withReview += $r }
}
"=== products with reviews: $($withReview.Count) ==="
foreach($r in $withReview){
  $h=GetPage $r.URL
  # count Review JSON-LD items precisely
  $nReview=([regex]::Matches($h,'(?i)"@type"\s*:\s*"Review"')).Count
  # image reviews
  $secIm=[regex]::Match($h,'(?s)data-section-id="review_images".*?</section>')
  $nImg=0; if($secIm.Success){$nImg=([regex]::Matches($secIm.Value,'<img class="review-photo"')).Count}
  $secVd=[regex]::Match($h,'(?s)data-section-id="review_videos".*?</section>')
  $nVid=0; if($secVd.Success){$nVid=([regex]::Matches($secVd.Value,'<video|\.mp4|\.webm|\.mov')).Count}
  # JSON-LD review block sample
  $jsonld=[regex]::Match($h,'(?s)"review"\s*:\s*\[.*?\]\}')
  $bodySample=''
  if($jsonld.Success){ $bodySample=$jsonld.Value.Substring(0,[Math]::Min(400,$jsonld.Value.Length)) -replace '\s+',' ' }
  ""
  "$($r.URL)"
  "  JSON-LD Review items=$nReview, imageReviews=$nImg, videoReviews=$nVid"
  "  JSON-LD: $bodySample"
}
