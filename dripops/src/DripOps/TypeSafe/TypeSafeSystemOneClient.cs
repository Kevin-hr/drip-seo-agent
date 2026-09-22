using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using DripOps.Configuration;

namespace DripOps.TypeSafe;

/// <summary>
/// Thin, typed HTTP client for the TypeSafe System One endpoint
/// (<c>POST https://api.typesafe.ai/v1/systemone</c>).
///
/// Designed on the TypeSafe "code owns the flow" model: this client only asks
/// narrow questions and returns typed answers; it never asks the model to take an
/// action. The caller composes Choice/Noul/Score answers with deterministic logic.
///
/// No key (or Enabled=false) means the client refuses to send and throws a clear
/// credential error — a fail-closed contract, never a silent success.
/// </summary>
public sealed class TypeSafeSystemOneClient
{
    private readonly TypeSafeOptions _options;
    private readonly HttpClient _http;

    public TypeSafeSystemOneClient(TypeSafeOptions options, HttpClient? httpClient = null)
    {
        _options = options;
        _http = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(45) };
        var key = options.HasCredentials
            ? Environment.GetEnvironmentVariable(options.ApiKeyEnvironmentVariable)
            : null;
        if (!string.IsNullOrWhiteSpace(key))
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", key);
    }

    public bool HasCredentials => _options.HasCredentials;

    public string Endpoint => _options.Endpoint;

    public string Model => _options.Model;

    /// <summary>Send one request over the shared state and return the typed answers by id.</summary>
    /// <remarks>
    /// `state` may be a raw JSON node (matched against the backtick paths the
    /// questions name) or a simple string for lightweight states.
    /// </remarks>
    public async Task<SystemOneResponse> AskAsync(
        JsonNode? state,
        IReadOnlyDictionary<string, SystemOneQuestion> questions,
        CancellationToken cancellationToken)
    {
        if (!_options.HasCredentials)
        {
            throw new InvalidOperationException(
                $"TypeSafe is not configured for calls: {nameof(TypeSafeOptions.Enabled)} is false or the " +
                $"environment variable '{_options.ApiKeyEnvironmentVariable}' is empty.");
        }
        if (questions.Count == 0)
        {
            throw new ArgumentException("At least one question is required.", nameof(questions));
        }

        var body = new SystemOneRequest
        {
            Model = _options.Model,
            State = state,
            Questions = new Dictionary<string, SystemOneQuestion>(questions, StringComparer.Ordinal),
        };

        using var response = await _http.PostAsJsonAsync(_options.Endpoint, body, JsonOptions.Default, cancellationToken);
        var text = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"TypeSafe {_options.Endpoint} returned {(int)response.StatusCode}: {text}");
        }

        return SystemOneResponse.Parse(text);
    }
}