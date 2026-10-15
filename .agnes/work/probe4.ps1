$ErrorActionPreference='Stop'
$h = [IO.File]::ReadAllText('.agnes\work\prod_sample.html')

# Find JS that loads reviews: look for ajax/post URLs in scripts
$scripts = [regex]::Matches($h,'(?s)<script(?![^>]*src)[^>]*>.*?</script>')
foreach ($s in $scripts) {
  $t = $s.Value
  if ($t -match '(?i)review' -and $t.Length -lt 6000) {
    "=== SCRIPT ($($t.Length) chars) ==="
    $t
    ''
  }
}
# external theme js likely has the ajax URL; list script srcs
[regex]::Matches($h,'<script[^>]*src="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Select-String -Pattern 'theme|review|extract|bus' 
