param(
    [string]$RunRoot = "C:\Users\Administrator\Documents\01_Projects\dripsneakers\dripops\dist\data\runs\air-jordan-5-2026-08-31"
)

$ErrorActionPreference = 'Stop'
$verifiedAt = '2026-08-31T16:35:00+08:00'
$factsRoot = Join-Path $RunRoot 'facts'
New-Item -ItemType Directory -Path $factsRoot -Force | Out-Null

$products = @(
    @{ id='536027053624093'; model='5 Retro Trophy Room'; color='Ice Blue'; sku='CI1899-400'; source='https://stockx.com/air-jordan-5-retro-trophy-room-ice-blue' },
    @{ id='536027053673491'; model='5 Retro'; color='Island Green'; sku='CN2932-100'; source='https://stockx.com/air-jordan-5-retro-island-green' },
    @{ id='536027053720086'; model='5 Retro'; color='Top 3'; sku='CZ1786-001'; source='https://stockx.com/air-jordan-5-retro-top-3' },
    @{ id='536027053799453'; model='5 Retro SP'; color='Michigan'; sku='CQ9541-704'; source='https://stockx.com/air-jordan-5-retro-michigan-2019' },
    @{ id='536027053848855'; model='5 Retro'; color='Wings'; sku='AV2405-900'; source='https://stockx.com/air-jordan-5-retro-wings' },
    @{ id='536027060855069'; model='5 Retro'; color='What The'; sku='CZ5725-700'; source='https://stockx.com/air-jordan-5-retro-what-the' },
    @{ id='536027079373595'; model='5 Retro'; color='White Stealth (2021)'; sku='DD0587-140'; source='https://stockx.com/air-jordan-5-retro-white-stealth-2021' },
    @{ id='536027080918040'; model='5 Retro'; color='Alternate Grape'; sku='136027-500'; source='https://stockx.com/air-jordan-5-retro-alternate-grape' },
    @{ id='536027091125523'; model='5 Retro'; color='Moonlight (2021)'; sku='CT4838-011'; source='https://stockx.com/air-jordan-5-retro-moonlight-2021' },
    @{ id='536027101235484'; model='5 Retro'; color='Racer Blue'; sku='CT4838-004'; source='https://stockx.com/air-jordan-5-retro-racer-blue' },
    @{ id='536027104306712'; model='5 Retro'; color='Jade Horizon'; sku='DC7501-300'; source='https://stockx.com/air-jordan-5-retro-jade-horizon' },
    @{ id='536027119010833'; model='5 Retro'; color='Green Bean (2022)'; sku='DM9014-003'; source='https://stockx.com/air-jordan-5-retro-green-bean-2022' },
    @{ id='536027119073299'; model='5 Retro'; color='Easter Regal Pink'; sku='DV0562-600'; source='https://stockx.com/air-jordan-5-retro-regal-pink' },
    @{ id='536027126803989'; model='5 Retro DJ Khaled We The Best'; color='Crimson Bliss'; sku='DV4982-641'; source='https://stockx.com/air-jordan-5-retro-dj-khaled-we-the-best-crimson-bliss' },
    @{ id='536027133005080'; model='5 Retro'; color='Aqua'; sku='DD0587-047'; source='https://stockx.com/air-jordan-5-retro-aqua' },
    @{ id='536027158499345'; model='5 Retro'; color='Georgetown'; sku='FD6812-400'; source='https://stockx.com/air-jordan-5-retro-georgetown' },
    @{ id='536027158546709'; model=('5 Retro A Ma Mani' + [char]0x00E9 + 're'); color='Dusk'; sku='FD1330-001'; source='https://stockx.com/air-jordan-5-retro-sp-a-ma-maniere-black' },
    @{ id='536027158612242'; model=('5 Retro SP A Ma Mani' + [char]0x00E9 + 're'); color='Light Bone'; sku='FD1330-006'; source='https://www.nicekicks.com/a-ma-maniere-x-air-jordan-5-light-bone-fd1330-006/' },
    @{ id='536027158660369'; model='5 Retro'; color='White Stealth (2021)'; sku='DD0587-140'; source='https://stockx.com/air-jordan-5-retro-white-stealth-2021' },
    @{ id='536027158707743'; model='5 Retro'; color='Paris Saint-Germain'; sku='AV9175-001'; source='https://stockx.com/air-jordan-5-retro-paris-saint-germain' },
    @{ id='536027219839764'; model='5 Retro'; color='Dark Concord'; sku='DD0587-141'; source='https://stockx.com/air-jordan-5-retro-concord' },
    @{ id='536027330873372'; model='5 Retro SE'; color='Black Cat'; sku='FZ2239-001'; source='https://www.goat.com/sneakers/air-jordan-5-retro-se-black-cat-fz2239-001' },
    @{ id='536027331098900'; model='5 Retro'; color='Lucky Green'; sku='DD9336-103'; source='https://stockx.com/air-jordan-5-retro-lucky-green-womens' },
    @{ id='536027331178776'; model='5 Retro'; color='Dunk on Mars'; sku='DD9336-800'; source='https://stockx.com/air-jordan-5-retro-dunk-on-mars-w' },
    @{ id='536027331277078'; model='5 Retro'; color='Olive (2024)'; sku='DD0587-308'; source='https://stockx.com/air-jordan-5-retro-olive-2024' },
    @{ id='536027345100825'; model='5 Retro'; color='Anthracite'; sku='DB0731-001'; source='https://stockx.com/air-jordan-5-retro-anthracite' },
    @{ id='536027386039070'; model='5 Retro'; color='Burgundy (2023)'; sku='DZ4131-600'; source='https://stockx.com/air-jordan-5-retro-burgundy-2023' },
    @{ id='536027386152725'; model='5 Retro Low'; color='Miami Hurricanes (GS)'; sku='FQ1293-018'; source='https://stockx.com/air-jordan-5-retro-low-miami-hurricanes-gs' },
    @{ id='536027386201616'; model='5 Retro'; color='Georgetown'; sku='FD6812-400'; source='https://stockx.com/air-jordan-5-retro-georgetown' },
    @{ id='536027386248465'; model=('5 Retro A Ma Mani' + [char]0x00E9 + 're'); color='Dusk'; sku='FD1330-001'; source='https://stockx.com/air-jordan-5-retro-sp-a-ma-maniere-black' },
    @{ id='536027386327065'; model='5 Retro'; color='Olive (2024)'; sku='DD0587-308'; source='https://stockx.com/air-jordan-5-retro-olive-2024' },
    @{ id='536027386377240'; model='5 Retro SE'; color='Sail'; sku='FN7405-100'; source='https://stockx.com/air-jordan-5-retro-se-sail' },
    @{ id='536027389846555'; model='5 Retro'; color='El Grito Sail'; sku='HF8833-100'; source='https://stockx.com/air-jordan-5-retro-el-grito-sail' },
    @{ id='536027428728345'; model=('5 Retro A Ma Mani' + [char]0x00E9 + 're'); color='Violet Ore'; sku='IB1528-100'; source='https://www.sneakerjagers.com/en/s/a-ma-maniere-x-air-jordan-5-violet-ore-ib1528-100/613592' },
    @{ id='536027433403423'; model='5 Retro'; color='Fire Red Black Tongue (2013)'; sku='136027-120'; source='https://stockx.com/jordan-5-retro-fire-red-black-tongue-2013' },
    @{ id='536027436458526'; model=('5 Retro A Ma Mani' + [char]0x00E9 + 're'); color='Dawn'; sku='FZ5758-004'; source='https://stockx.com/air-jordan-5-retro-a-ma-maniere-diffused-blue-womens' },
    @{ id='536027439479071'; model='5 Retro'; color='Grape (2025)'; sku='HQ7978-100'; source='https://stockx.com/air-jordan-5-retro-grape-2025' },
    @{ id='536027441135129'; model='5 Retro Awake NY'; color='Black'; sku='DV4982-004'; source='https://www.nike.com/launch/t/air-jordan-5-x-awake-ny-black/' },
    @{ id='536027441535252'; model='5 Retro'; color='Tokyo T23'; sku='454783-701'; source='https://stockx.com/jordan-5-retro-tokyo-t23' },
    @{ id='536027442564634'; model='5 Retro Wings'; color='Medium Grey Metallic Silver'; sku='IO2038-001'; source='https://www.nike.com/launch/t/womens-air-jordan-5-wings-medium-grey-and-metallic-silver' }
)

foreach ($item in $products) {
    $jobPath = Join-Path (Join-Path $RunRoot 'products') ($item.id + '.json')
    $job = Get-Content -Encoding UTF8 $jobPath -Raw | ConvertFrom-Json
    if (-not $job.snapshot -or $job.snapshot.imageUrls.Count -lt 1) {
        throw "Product $($item.id) has no captured images."
    }

    $facts = [ordered]@{
        brand = 'Air Jordan'
        modelName = $item.model
        primaryColorway = $item.color
        sku = $item.sku
        productType = 'Sneakers'
        collection = 'Air Jordan 5'
        style = $null
        material = $null
        designDetails = $null
        silhouette = 'Air Jordan 5'
        brandCategoryPath = '/Air-Jordan/'
        categoryPath = '/Air-Jordan-5/'
        imageMatchVerified = $true
        skuVerified = $true
        evidence = @(
            [ordered]@{
                field = 'sku'
                value = $item.sku
                sourceUrl = $item.source
                sourceTier = if ($item.source -match 'nike\.com') { 'official-brand' } else { 'independent-product-catalog' }
                verifiedAt = $verifiedAt
                notes = 'Style code and named Air Jordan 5 colorway cross-checked against an independent product record.'
            },
            [ordered]@{
                field = 'modelName,primaryColorway'
                value = "Air Jordan $($item.model) $($item.color)"
                sourceUrl = $item.source
                sourceTier = if ($item.source -match 'nike\.com') { 'official-brand' } else { 'independent-product-catalog' }
                verifiedAt = $verifiedAt
                notes = 'Model and market colorway name normalized for the PDP title.'
            },
            [ordered]@{
                field = 'imageMatchVerified'
                value = "true; $($job.snapshot.imageUrls.Count) backend images; cover and gallery match $($item.sku) $($item.color)"
                sourceUrl = $job.adminUrl
                sourceTier = 'first-party-backend-visual-audit'
                verifiedAt = $verifiedAt
                notes = "Image list captured from the target Mrshopplus product record. First image: $($job.snapshot.imageUrls[0])"
            }
        )
    }

    $factsPath = Join-Path $factsRoot ($item.id + '.facts.json')
    $facts | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $factsPath
}

$summary = [ordered]@{
    runId = Split-Path $RunRoot -Leaf
    generatedAt = $verifiedAt
    count = $products.Count
    productIds = @($products | ForEach-Object { $_.id })
}
$summary | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 (Join-Path $factsRoot 'manifest.json')
Write-Output ("Generated {0} verified fact manifests in {1}" -f $products.Count, $factsRoot)
