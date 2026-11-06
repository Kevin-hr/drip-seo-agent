using DripOps.Rules.V50;

var root = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ".."));
var doc = Path.Combine(root, "standards", "V5.0", V50Standard.FileName);
var std = V50Standard.LoadPreview(doc);
Assert(std.Version == "5.0", "V5 version load");
Assert(std.DocumentHash == V50Standard.PinnedSha256, "pinned hash");
Assert(!std.ProductionWritesEnabled, "production writes disabled");

var valid = new V50AcceptanceFacts {
    ImageActuallyReviewed = true,
    IndependentExactEntityEvidence = true,
    SkuVerdict = "SKU_OMIT",
    SoldUnit = "set", SelectedUnit = "set",
    VariantChecked = true, SizeChecked = true, CheckoutChecked = true,
    SubtitleMatchesPurchaseUnit = true, VariantPriceChecked = true,
    SchemaOfferMatchesFrontend = true,
    Brand = "Sp5der", BrandLinkLiveVerified = true, BrandLink = "/Sp5der/",
    Slug = "sp5der-og-web-suit-black",
    CanonicalUrl = "https://www.dripsneakers.org/sp5der-og-web-suit-black",
    MetaDescription = "Shop Sp5der OG Web Suit Black reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.",
    KeyDescriptionHtml = "<p>Black matching set.</p><h2>Product Details</h2><ul>" +
        "<li><strong>Brand:</strong> <a href=\"/Sp5der/\"><strong>Sp5der</strong></a></li>" +
        "<li>Set</li><li>Black</li><li>Web</li><li>Hoodie and pants</li></ul>",
    Mobile360Checked = true, Tablet768Checked = true,
    MediaChecked = true, SchemaChecked = true
};
Assert(V50AcceptanceGate.Evaluate(valid).Count == 0, "valid preview facts");
Assert(V50AcceptanceGate.Evaluate(valid with { ImageActuallyReviewed = false }).Contains("EXACT_ENTITY_NOT_PROVEN"), "visual missing HOLD");
Assert(V50AcceptanceGate.Evaluate(valid with { SelectedUnit = "single_hoodie" }).Contains("PURCHASE_UNIT_MISMATCH"), "hoodie vs set HOLD");
Assert(V50AcceptanceGate.Evaluate(valid with { Sku = "old-url-sku" }).Contains("SKU_MUST_BE_OMITTED"), "SKU omission gate");
Assert(V50AcceptanceGate.Evaluate(valid with { SkuVerdict = "VERIFIED_SKU", Sku = "AWDNGH1023-812" }).Contains("SKU_NOT_VERIFIED"), "SKU exact entity gate");
Assert(V50AcceptanceGate.Evaluate(valid with { Slug = "/sp5der-og-web-suit-black" }).Contains("SLUG_NOT_SLUG_ONLY"), "slug-only");
Assert(V50AcceptanceGate.Evaluate(valid with { Brand = "Chanel", BrandLink = "/chanel/" }).Contains("CHANEL_FIXED_LINK"), "Chanel registry");
Assert(V50AcceptanceGate.Evaluate(valid with { BrandLinkLiveVerified = false }).Contains("BRAND_LINK_NOT_VERIFIED_RELATIVE"), "live internal link");
Assert(V50AcceptanceGate.Evaluate(valid with { CheckoutChecked = false }).Contains("PURCHASE_PATH_UNVERIFIED"), "checkout check");
Assert(V50AcceptanceGate.Evaluate(valid with { SchemaOfferMatchesFrontend = false }).Contains("SCHEMA_OFFER_MISMATCH"), "offer consistency");
Assert(V50AcceptanceGate.Evaluate(valid with { SubtitleMatchesPurchaseUnit = false }).Contains("SUBTITLE_UNIT_MISMATCH"), "subtitle consistency");
Assert(V50AcceptanceGate.Evaluate(valid with { MetaDescription = "Features beautiful pink denim." }).Contains("META_V46_CONTRACT"), "V4.6 SERP assurance");
Assert(V50AcceptanceGate.Evaluate(valid with { Mobile360Checked = false }).Contains("MOBILE_NOT_VERIFIED"), "mobile first");
Console.WriteLine("V50 DripOps preview gate tests: PASS (14 assertions). No production writes.");

static void Assert(bool value, string message) {
    if (!value) throw new InvalidOperationException($"FAILED: {message}");
}
