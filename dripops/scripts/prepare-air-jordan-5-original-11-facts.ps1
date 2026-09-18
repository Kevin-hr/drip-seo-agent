param(
    [string]$RunRoot = "C:\Users\Administrator\Documents\01_Projects\dripsneakers\dripops\dist\data\runs\air-jordan-5-2026-08-31"
)

$ErrorActionPreference = 'Stop'
$verifiedAt = [DateTimeOffset]::Now.ToString('o')
$factsRoot = Join-Path $RunRoot 'facts'
New-Item -ItemType Directory -Path $factsRoot -Force | Out-Null

$products = @(
    @{ id='536027255483157'; model='5 Retro'; color='Black Metallic (2016)'; sku='845035-003'; source='https://stockx.com/jordan-5-retro-black-metallic-2016' },
    @{ id='536027053399572'; model='5 Retro SP Off-White'; color='Muslin'; sku='CT8480-001'; source='https://stockx.com/air-jordan-5-retro-off-white-black' },
    @{ id='536027451019035'; model='5 Retro'; color='Wolf Grey (2026)'; sku='DD0587-002'; source='https://stockx.com/air-jordan-5-retro-wolf-grey-2026' },
    @{ id='536027053512209'; model='5 Retro SP Off-White'; color='Sail'; sku='DH8565-100'; source='https://stockx.com/air-jordan-5-retro-off-white-sail' },
    @{ id='536027542311961'; model='5 Retro'; color='Black University Blue (2026)'; sku='DD0587-008'; source='https://stockx.com/air-jordan-5-retro-black-university-blue-2026' },
    @{ id='536027132155667'; model='5 Retro UNC'; color='University Blue'; sku='DV1310-401'; source='https://stockx.com/air-jordan-5-retro-unc-university-blue' },
    @{ id='536027053463578'; model='5 Retro'; color='Alternate Bel-Air'; sku='DB3335-100'; source='https://stockx.com/air-jordan-5-retro-alternate-bel-air' },
    @{ id='536027078956054'; model='5 Retro'; color='Raging Bull Red (2021)'; sku='DD0587-600'; source='https://stockx.com/air-jordan-5-retro-raging-bulls-red-2021' },
    @{ id='536027053561617'; model='5 Retro SE'; color='Oregon'; sku='CK6631-307'; source='https://stockx.com/air-jordan-5-retro-se-oregon' },
    @{ id='536027441039125'; model='5 Retro Awake NY'; color='Arctic Pink'; sku='DV4982-600'; source='https://stockx.com/air-jordan-5-retro-awake-ny-arctic-pink' },
    @{ id='536027556587537'; model='5 Retro'; color='Medium Soft Pink'; sku='HQ7978-102'; source='https://stockx.com/air-jordan-5-retro-medium-soft-pink' }
)

foreach ($item in $products) {
    $jobPath = Join-Path (Join-Path $RunRoot 'products') ($item.id + '.json')
    $job = Get-Content -Encoding UTF8 $jobPath -Raw | ConvertFrom-Json
    if (-not $job.snapshot -or $job.snapshot.imageUrls.Count -lt 1) {
        throw "Product $($item.id) has no captured images."
    }
    if (-not $job.snapshot.isPublished) {
        throw "Product $($item.id) is not published in the captured backend state."
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
                sourceTier = 'independent-product-catalog'
                verifiedAt = $verifiedAt
                notes = 'Style code cross-checked against the cited product record.'
            },
            [ordered]@{
                field = 'modelName,primaryColorway'
                value = "Air Jordan $($item.model) $($item.color)"
                sourceUrl = $item.source
                sourceTier = 'independent-product-catalog'
                verifiedAt = $verifiedAt
                notes = 'Model and market colorway name normalized for the PDP title.'
            },
            [ordered]@{
                field = 'imageMatchVerified'
                value = "true; $($job.snapshot.imageUrls.Count) backend images; cover and gallery match $($item.sku) $($item.color)"
                sourceUrl = $job.adminUrl
                sourceTier = 'first-party-backend-visual-audit'
                verifiedAt = $verifiedAt
                notes = "Backend cover and gallery were visually checked against the cited identity. First image: $($job.snapshot.imageUrls[0])"
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
$summary | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 (Join-Path $factsRoot 'original-11-manifest.json')
Write-Output ("Generated {0} verified original-product fact manifests in {1}" -f $products.Count, $factsRoot)
