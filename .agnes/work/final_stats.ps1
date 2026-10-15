$ErrorActionPreference='Stop'
$base='.agnes\work\prod_pages'
$csv = Import-Csv '.agnes\work\review_results.csv'

$rows=@()
foreach($r in $csv){
  $s=[IO.Path]::GetFileName(($r.URL -split '/')[ -1]); $s=$s -replace '[^A-Za-z0-9-]','_'
  $fp="$base\$s.html"
  if(-not (Test-Path $fp)){ $rows+=[PSCustomObject]@{URL=$r.URL;NText=0;NImg=0;NVid=0;NRating=0;ERR='no page'}; continue }
  $h=[IO.File]::ReadAllText($fp)

  # 1) JSON-LD reviews (text reviews with rating)
  $nText=0; $nRating=0
  $ml=[regex]::Matches($h,'(?s)"@type"\s*:\s*"Review"[^]]*?')
  $nText = ([regex]::Matches($h,'(?i)"@type"\s*:\s*"Review"')).Count
  $nRating = ([regex]::Matches($h,'(?i)"ratingValue"\s*:\s*"\d')).Count

  # 2) image reviews: customer photos in review_images section
  $secIm=[regex]::Match($h,'(?s)data-section-id="review_images".*?</section>')
  $nImg=0
  if($secIm.Success){ $nImg=([regex]::Matches($secIm.Value,'<img class="review-photo"')).Count }

  # 3) video reviews: review_videos section
  $secVd=[regex]::Match($h,'(?s)data-section-id="review_videos".*?</section>')
  $nVid=0
  if($secVd.Success){ $nVid=([regex]::Matches($secVd.Value,'<video|\.mp4|\.webm|\.mov')).Count }

  $rows+=[PSCustomObject]@{URL=$r.URL;NText=$nText;NImg=$nImg;NVid=$nVid;NRating=$nRating}
}
$rows|ConvertTo-Csv -NoTypeInformation|Set-Content '.agnes\work\review_final.csv' -Encoding utf8

"=== SUMMARY (50 products) ==="
$withAny=$rows|Where-Object{($_.NText+$_.NImg+$_.NVid) -gt 0}
"products with ANY review content: $($withAny.Count) / 50"
""
"--- sorted by total reviews desc ---"
$rows|ForEach-Object{$_.NTotal=($_.NText+$_.NImg+$_.NVid)}|Sort-Object NTotal -Desc|ForEach-Object{
  "total={0}  text={1} img={2} vid={3}  {4}" -f $_.NTotal,$_.NText,$_.NImg,$_.NVid,$_.URL
}
