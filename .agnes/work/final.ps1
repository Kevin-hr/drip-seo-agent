$ErrorActionPreference = 'Stop'
function Load($f) {
  $out = @()
  foreach ($line in (Get-Content $f)) {
    $parts = $line -split "`t"
    if ($parts.Count -ge 2 -and $parts[1]) { $out += [PSCustomObject]@{ Name = $parts[0]; Url = $parts[1]; Prefix = ($parts[1] -split 'coco-shoes\.org/')[1] } }
  }
  return $out
}
$coco = Load '.agnes\work\coco_pairs.tsv'

# coco URL-fragment keys that HAVE an equivalent in dripsneakers (matched by product line + color)
$matchedKeys = @(
  'Denim-Tears-Cashmere-Swarovski-Cotton-Wreath-Shorts',                 # drip: Cashmere Swarovski Shorts Black
  'Denim-Tears-Cotton-Wreath-Hooded-Sweatshirt-Black-Monochrome',       # drip: Cotton Wreath Hoodie Black Monochrome
  'Denim-Tears-Cotton-Wreath-Sweatpants-Black-Monochrome',             # drip: same
  'Denim-Tears-The-Cotton-Wreath-Shorts-Black-402-010-30',            # drip F
  'Denim-Tears-The-Cotton-Wreath-Shorts-Brown',                        # drip G
  'Denim-Tears-The-Cotton-Wreath-Shorts-Grey',                         # drip H
  'Denim-Tears-The-Cotton-Wreath-Shorts-Orange',                       # drip J
  'Denim-Tears-The-Cotton-Wreath-Shorts-Pink',                         # drip K
  'Denim-Tears-The-Cotton-Wreath-Shorts-Purple',                       # drip L
  'Denim-Tears-The-Cotton-Wreath-Shorts-Red',                          # drip M
  'Denim-Tears-The-Cotton-Wreath-Shorts-Blue',                         # drip N Royal Blue (color-name mapping)
  'Denim-Tears-The-Cotton-Wreath-Shorts-Dark-Blue',                    # drip I Navy (color-name mapping)
  'Denim-Tears-The-Cotton-Wreath-Sweatpants-Pink',                    # drip O
  'Denim-Tears-The-Cotton-Wreath-Sweatshirt-Royal-Blue-1',            # drip Q
  'Denim-Tears-The-Cotton-Wreath-Sweatshirt-Royal-Pink',             # drip: The Cotton Wreath Sweatshirt Pink (401-100-30)
  'Denim-Tears-Big-Cotton-Wreath-Shorts-8671-Black-Grey-Purple',      # drip has Big Cotton Wreath Sweat Shorts Black (partial: Grey/Purple variants missing)
  'Denim-Tears-Big-Cotton-Wreath-T-Shirt-2672-Black-Grey-Purple',     # drip: Big Cotton Wreath Sweatshirt Black/Grey/Purple/in Purple
  'Denim-Tears-Washed-Flame-Denim-Jacket-Black',                      # drip: Washed Flam Jacket Black
  "Denim-Tears-x-Levs-Cotton-Wreath-Jean-Short-Light-Wash-404-081-30" # drip: x Levi's Jean Short Light Wash
)

$missing = @($coco | Where-Object { -not ($matchedKeys -contains $_.Prefix) })
"TOTAL coco: $($coco.Count)"
"matched: $($matchedKeys.Count)"
"missing: $($missing.Count)"
$missing | ForEach-Object { "{0}`t{1}" -f $_.Name, $_.Url } | Set-Content '.agnes\work\Missing_List.tsv' -Encoding utf8
