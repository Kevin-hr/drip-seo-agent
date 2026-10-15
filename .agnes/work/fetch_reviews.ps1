$ErrorActionPreference='Stop'
$urls = Get-Content '.agnes\work\Missing_List.tsv' | ForEach-Object { ($_ -split "`t")[1].Trim() } | Sort-Object -Unique
"URL count: $($urls.Count)"
$results = @()
$i = 0
foreach ($u in $urls) {
  $i++
  try {
    $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 60
    $h = $r.Content
    # review_count embedded in product data
    $rc = 0
    $m = [regex]::Match($h, 'review_count:(\d+)')
    if ($m.Success) { $rc = [int]$m.Groups[1].Value }
    # check sections for actual content
    $imgs = ([regex]::Matches($h, 'mrshop-section-review_images[\s\S]{0,400}?data-section-type="review_images"[^>]*>[\s\S]*?</section>')).Count
    $secImgs = $null
    $secImgs = [regex]::Match($h, '(?s)data-section-id="review_images".*?<\/section>')
    $imgContent = 0; $vidContent = 0; $textContent = 0
    if ($secImgs.Success) {
      $sec = $secImgs.Value
      $imgContent = ([regex]::Matches($sec,'<img ')).Count
      $vidContent = ([regex]::Matches($sec,'<video|\.mp4|\.webm')).Count
    }
    $secVid = [regex]::Match($h, '(?s)data-section-id="review_videos".*?<\/section>')
    if ($secVid.Success) {
      $vidContent += ([regex]::Matches($secVid.Value,'<video|\.mp4|\.webm')).Count
    }
    # text reviews inside review_info_list
    $secList = [regex]::Match($h, '(?s)data-section-id="review_info_list".*?<\/section>')
    if ($secList.Success) {
      $li = ([regex]::Matches($secList.Value,'<li|<p ')).Count
      $textContent = $li
    }
    $hasNoReview = $h -match 'no-review'
    $results += [PSCustomObject]@{
      URL=$u; RC=$rc; ImgSec=$imgContent; VidSec=$vidContent; TextLi=$textContent; NoReview=$hasNoReview
    }
    "{0,2}/50 {1} rc={2} img={3} vid={4} txt={5}" -f $i,$u,$rc,$imgContent,$vidContent,$textContent | Out-Null
    Write-Host ("{0,2}: rc={1} imgs={2} vids={3} txtLi={4} noReview={5}" -f $i,$rc,$imgContent,$vidContent,$textContent,$hasNoReview)
    Start-Sleep -Milliseconds 300
  } catch {
    Write-Host ("{0}: FETCH FAIL {1} {2}" -f $i,$u,$_.Exception.Message)
    $results += [PSCustomObject]@{ URL=$u; RC=-1; ImgSec=0; VidSec=0; TextLi=0; NoReview=$null; Error=$_.Exception.Message }
  }
}
$results | ConvertTo-Html -ExcludeHeader -PostContent ' -script:' | Set-Content '.agnes\work\review_report.html' -Encoding utf8
$results | ForEach-Object { "{0}`t{1}`t{2}`t{3}`t{4}`t{5}" -f $_.URL,$_.RC,$_.ImgSec,$_.VidSec,$_.TextLi,$_.NoReview } | Set-Content '.agnes\work\review_results.tsv' -Encoding utf8
"Done. saved to review_results.tsv"
