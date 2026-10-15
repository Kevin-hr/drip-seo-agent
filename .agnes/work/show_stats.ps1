$ErrorActionPreference='Stop'
$rows = Import-Csv '.agnes\work\review_final.csv'
$rows = $rows | Where-Object { $_.ERR -eq $null -or -not $_.PSObject.Properties.Name.Contains('ERR') }

"=== SUMMARY (50 products) ==="
$withAny = $rows | Where-Object { ([int]$_.NText + [int]$_.NImg + [int]$_.NVid) -gt 0 }
"products with ANY review content: $($withAny.Count) / 50"
""
"--- sorted by total reviews desc ---"
$rows | Sort-Object { ([int]$_.NText + [int]$_.NImg + [int]$_.NVid) } -Desc | ForEach-Object {
  $t = [int]$_.NText + [int]$_.NImg + [int]$_.NVid
  "total={0}  text={1} img={2} vid={3}  {4}" -f $t,$_.NText,$_.NImg,$_.NVid,$_.URL
}
""
"--- type breakdown across all 50 ---"
$sumTxt = ($rows | Measure-Object -Property {[int]$_.NText} -Sum).Sum
$sumImg = ($rows | Measure-Object -Property {[int]$_.NImg} -Sum).Sum
$sumVid = ($rows | Measure-Object -Property {[int]$_.NVid} -Sum).Sum
"TOTAL text={0}  image={1}  video={2}" -f $sumTxt,$sumImg,$sumVid
