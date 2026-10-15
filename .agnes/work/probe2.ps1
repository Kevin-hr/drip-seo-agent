$ErrorActionPreference='Stop'
$urls = Get-Content '.agnes\work\Missing_List.tsv' | ForEach-Object { ($_ -split "`t")[1].Trim() } | Sort-Object -Unique
"URL count: $($urls.Count)"

$probe = Invoke-WebRequest -Uri $urls[0] -UseBasicParsing -TimeoutSec 60
$h = $probe.Content

# 1) all review_count values embedded
$rcs = [regex]::Matches($h,'review_count:(\d+)')
$rcVals = @($rcs | ForEach-Object { [int]$_.Groups[1].Value } | Sort-Object -Unique)
"review_count values: $($rcVals -join ',')  (max: $(($rcVals | Measure-Object -Maximum).Maximum))"

# 2) check review data blocks
foreach ($kw in @('review_list','reviewList','reviews:','"reviews"','reviewContent','choicereview-content','review-data','reviewData')) {
  $n = ([regex]::Matches($h,[regex]::Escape($kw))).Count
  "{0}: {1}" -f $kw,$n
}

# 3) find the JSON/JS product block, dump a sample around 'prod_name'
$idx = $h.IndexOf('prod_name')
if ($idx -ge 0) {
  $sample = $h.Substring([Math]::Max(0,$idx-300), 800) -replace '\s+',' '
  "PROD BLOCK SAMPLE: $sample"
}
