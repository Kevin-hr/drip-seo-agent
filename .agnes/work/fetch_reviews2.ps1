$ErrorActionPreference='Stop'
$urls = Get-Content '.agnes\work\Missing_List.tsv' | ForEach-Object { ($_ -split "`t")[1].Trim() } | Sort-Object -Unique
$base = '.agnes\work\prod_pages'
New-Item -ItemType Directory -Force -Path $base | Out-Null

$results = @()
$i = 0
foreach ($u in $urls) {
  $i++
  $slug = [IO.Path]::GetFileName(($u -split '/')[ -1])
  $slug = $slug -replace '[^A-Za-z0-9-]', '_'
  $fp = "$base\$slug.html"
  try {
    if (-not (Test-Path $fp)) {
      $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 90
      [IO.File]::WriteAllText($fp, $r.Content, [Text.Encoding]::UTF8)
      Start-Sleep -Milliseconds 300
    }
    $h = [IO.File]::ReadAllText($fp)
    # review_count values
    $rcs = [regex]::Matches($h,'review_count:(\d+)')
    $rc = 0
    if ($rcs.Count -gt 0) { $rc = ($rcs | ForEach-Object { [int]$_.Groups[1].Value } | Measure-Object -Maximum).Maximum }
    $noReview = [bool]($h -match 'no-review')
    # review images / videos
    $imgs = ([regex]::Matches($h,'(?i)review[_-]?(?:image|photo|img)')).Count
    # count media in the review section area
    $secIm = [regex]::Match($h,'(?s)data-section-id="review_images".*?</section>')
    $secVd = [regex]::Match($h,'(?s)data-section-id="review_videos".*?</section>')
    $secLst= [regex]::Match($h,'(?s)data-section-id="review_info_list".*?</section>')
    $imgSecLen = if($secIm.Success){$secIm.Value.Length}else{0}
    $vidSecLen = if($secVd.Success){$secVd.Value.Length}else{0}
    $listSecLen= if($secLst.Success){$secLst.Value.Length}else{0}
    $results += [PSCustomObject]@{
      URL=$u; RC=$rc; NoReview=$noReview
      ReviewImgSec=$imgSecLen; ReviewVidSec=$vidSecLen; ReviewListSec=$listSecLen
    }
    Write-Host ("{0,2}/50 rc={1} noReview={2} imgSec={3} vidSec={4} listSec={5}" -f $i,$rc,$noReview,$imgSecLen,$vidSecLen,$listSecLen)
  } catch {
    Write-Host ("{0,2}: FAIL {1} :: {2}" -f $i,$u,$_.Exception.Message)
    $results += [PSCustomObject]@{URL=$u;RC=-1;NoReview=$null;ReviewImgSec=0;ReviewVidSec=0;ReviewListSec=0}
  }
}
$results | ConvertTo-Csv -NoTypeInformation | Set-Content '.agnes\work\review_results.csv' -Encoding utf8
"Done. -> review_results.csv"
