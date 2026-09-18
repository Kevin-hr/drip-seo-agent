using System.Net;
using System.Text.RegularExpressions;
using DripOps.Configuration;
using DripOps.Domain;

namespace DripOps.Browser;

public sealed class FrontendVerifier(HttpClient? httpClient = null)
{
    private readonly HttpClient _http = httpClient ?? new HttpClient
    {
        Timeout = TimeSpan.FromSeconds(120)
    };

    public async Task<ValidationResult> VerifyAsync(SeoDraft draft, CancellationToken cancellationToken)
    {
        var issues = new List<ValidationIssue>();
        void Error(string code, string message) => issues.Add(new() { Code = code, Severity = "error", Message = message });
        void Warn(string code, string message) => issues.Add(new() { Code = code, Severity = "warning", Message = message });
        if (string.IsNullOrWhiteSpace(draft.CanonicalUrl))
        {
            Error("FRONTEND-01 MISSING_URL", "Canonical URL is missing from the draft.");
            return new ValidationResult { IsValid = false, Issues = issues };
        }

        using var response = await GetWithRetryAsync(draft.CanonicalUrl, cancellationToken);
        var html = await response.Content.ReadAsStringAsync(cancellationToken);
        if (response.StatusCode != HttpStatusCode.OK) Error("FRONTEND-02 HTTP_STATUS", $"Frontend returned {(int)response.StatusCode}.");

        var h1 = ExtractTagText(html, "h1");
        if (!string.Equals(WebUtility.HtmlDecode(h1).Trim(), draft.ProductName, StringComparison.Ordinal))
            Error("FRONTEND-03 H1_MISMATCH", $"Frontend H1 mismatch. Found: {WebUtility.HtmlDecode(h1).Trim()}");

        var meta = Regex.Match(html, "<meta[^>]+name=[\"']description[\"'][^>]+content=[\"']([^\"']*)", RegexOptions.IgnoreCase).Groups[1].Value;
        if (string.IsNullOrWhiteSpace(meta))
            Warn("FRONTEND-04 META_NOT_FOUND", "Meta description was not found in raw HTML.");
        else if (!string.Equals(WebUtility.HtmlDecode(meta).Trim(), draft.MetaDescription, StringComparison.Ordinal))
            Error("FRONTEND-05 META_MISMATCH", "Frontend meta description does not match the saved draft.");

        var canonical = Regex.Match(html, "<link[^>]+rel=[\"']canonical[\"'][^>]+href=[\"']([^\"']*)", RegexOptions.IgnoreCase).Groups[1].Value;
        if (string.IsNullOrWhiteSpace(canonical))
            Warn("FRONTEND-06 CANONICAL_NOT_FOUND", "Canonical link was not found in raw HTML.");
        else if (!string.Equals(canonical.TrimEnd('/'), draft.CanonicalUrl.TrimEnd('/'), StringComparison.OrdinalIgnoreCase))
            Error("FRONTEND-07 CANONICAL_MISMATCH", $"Canonical mismatch. Found: {canonical}");

        if (html.Contains("noindex", StringComparison.OrdinalIgnoreCase))
            Error("FRONTEND-08 NOINDEX", "Frontend HTML contains noindex.");
        if (!html.Contains("application/ld+json", StringComparison.OrdinalIgnoreCase))
            Warn("SCHEMA-01 PRODUCT_SCHEMA_NOT_FOUND", "No JSON-LD block was found in raw HTML.");

        return new ValidationResult
        {
            IsValid = issues.All(issue => !string.Equals(issue.Severity, "error", StringComparison.OrdinalIgnoreCase)),
            Issues = issues
        };
    }

    private async Task<HttpResponseMessage> GetWithRetryAsync(string url, CancellationToken cancellationToken)
    {
        Exception? lastError = null;
        for (var attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                return await _http.GetAsync(url, cancellationToken);
            }
            catch (Exception ex) when (attempt < 3 &&
                                       ex is HttpRequestException or TaskCanceledException &&
                                       !cancellationToken.IsCancellationRequested)
            {
                lastError = ex;
                await Task.Delay(TimeSpan.FromSeconds(attempt * 2), cancellationToken);
            }
        }

        throw new HttpRequestException($"Frontend request failed after 3 attempts: {url}", lastError);
    }

    private static string ExtractTagText(string html, string tag)
    {
        var match = Regex.Match(html, $"<{tag}[^>]*>(.*?)</{tag}>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        return Regex.Replace(match.Groups[1].Value, "<[^>]+>", " ");
    }
}
