# Hellstar Hoodies V4.4 Evidence Pack

## Scope

This package preserves the local evidence used to derive the Hellstar Hoodies
case study and V4.4 end-to-end playbook.

```text
Captured: 2026-09-02
Published: 2026-09-21
Files: 31
Facts JSON: 8
Image files: 23 (21 unique SHA-256 payloads)
Bytes: 14,377,220
```

The package is evidence, not a current live-store acceptance certificate.
Before any new write, reopen the sources, read a fresh MrShopPlus snapshot and
re-run the V4.4 Exact Entity, SKU and storefront gates.

## Product coverage

| Product ID | Historical entity | Facts | Overview image |
|---|---|---:|---:|
| `536027371237407` | Hellstar Sport Hoodie Black | yes | yes |
| `536027374483989` | Hellstar Records Tour Hoodie Faded Black | yes | yes |
| `536027374517277` | Hellstar Sports 96 Crewneck Black | yes | yes |
| `536027374647062` | Hellstar No Guts No Glory Hoodie Blue | yes | yes |
| `536027374725661` | Hellstar Future Flame Hoodie Grey | yes | yes |
| `536027405581596` | Hellstar Hoodie Fire Orange | yes | yes |
| `536027452609305` | Hellstar Sports Tie-Dye Skull Hoodie Red | yes | yes |
| `536027558969104` | Hellstar Path To Paradise Hoodie Black | yes | yes |
| `536027374677018` | Unpaired overview image | no | yes |

The unpaired image is retained for chain-of-custody completeness. It must not be
treated as an entity-verified product until a fresh facts record passes V4.4.

`images/product-01/01.jpg` duplicates `images/01-536027558969104.jpg`, and
`images/product-08/01.jpg` duplicates `images/08-536027374483989.jpg`. Both paths
are retained because they record the original evidence layout.

## Safety and integrity

- JSON text was scanned for email, phone, address, customer/order data, cookies,
  tokens, secrets, passwords, authorization values, API keys and sessions: no
  matches.
- Embedded image metadata was scanned for the same sensitive markers: no
  matches.
- No credentials, browser profiles or runtime session artifacts are included.
- Every file is pinned in `SHA256SUMS`.

Verify from this directory with PowerShell:

```powershell
Get-Content .\SHA256SUMS | ForEach-Object {
  $hash, $path = $_ -split '  ', 2
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant() -ne $hash) {
    throw "Hash mismatch: $path"
  }
}
```

## Execution authority

The sole active decision standard remains:

```text
standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
```

Use the evidence with
`docs/playbooks/HELLSTAR_HOODIES_SEO_PDP_V4.4_END_TO_END.md`. Historical facts
may seed research; they never bypass a fresh snapshot or V4.4 gate.
