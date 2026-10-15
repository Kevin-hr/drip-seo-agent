$ErrorActionPreference='Stop'
$h = [IO.File]::ReadAllText('.agnes\work\prod_sample.html')
# find .ajax, $.post, url: and product id
[regex]::Matches($h,'(?i)\.(ajax|post)\(\s*["\x27]?([^"\x27,]+)') | ForEach-Object { $_.Value } | Select-Object -First 20
''
"---- url: pattern ----"
[regex]::Matches($h,'(?i)url\s*:\s*["\x27][^"\x27]+["\x27]') | ForEach-Object { $_.Value } | Select-Object -First 20
''
"---- product id / pid ----"
[regex]::Matches($h,'(?i)"pid"\s*:\s*(\d+)|data-id="(\d+)"') | ForEach-Object { $_.Value } | Select-Object -First 20
''
"---- prod_no / no: ----"
[regex]::Matches($h,'(?i)"no"\s*:\s*["\x27]?[A-Z0-9-]+') | ForEach-Object { $_.Value } | Select-Object -First 10
''
"---- DTB_ api names anywhere ----"
[regex]::Matches($h,'(?i)DTB_[A-Za-z]+') | ForEach-Object { $_.Value } | Sort-Object -Unique
