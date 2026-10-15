$ErrorActionPreference='Stop'
$base='.agnes\work\prod_pages'
function GetPage($u){ $s=[IO.Path]::GetFileName(($u -split '/')[ -1]); $s=$s -replace '[^A-Za-z0-9-]','_'; return [IO.File]::ReadAllText("$base\$s.html") }

$targets=@(
 'https://www.coco-shoes.org/Denim-Tears-The-Cotton-Wreath-Sweatpants-Blue',
 'https://www.coco-shoes.org/Denim-Tears-The-Cotton-Wreath-Sweatshirt-Royal-Grey',
 'https://www.coco-shoes.org/Denim-Tears-The-Cotton-Wreath-Jean-Black'
)
foreach($u in $targets){
  $h=GetPage $u
  "==== $u ===="
  $secIm=[regex]::Match($h,'(?s)data-section-id="review_images".*?</section>')
  "IMAGES SEC: " + ($secIm.Value -replace '\s+',' ')
  ''
  # embedded product data: look for review-related arrays
  $ms=[regex]::Matches($h,'(?i)(review[a-z_]*)"\s*:\s*("[^"]*"|\[[^\]]{0,300}\]|null|0|\d+)')
  foreach($m in $ms){ "DATA: "+$m.Value }
  ''
}
