using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.Json;
using DripOps.Configuration;

namespace DripOps.Browser;

public sealed class ChromeController : IAsyncDisposable
{
    private readonly DripOpsConfig _config;
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(5) };
    private Process? _startedProcess;
    private CdpClient? _page;

    public ChromeController(DripOpsConfig config) => _config = config;

    public async Task<CdpClient> OpenPageAsync(string url, CancellationToken cancellationToken)
    {
        await EnsureChromeAsync(cancellationToken);
        var endpoint = $"http://127.0.0.1:{_config.ChromeDebugPort}";
        using var request = new HttpRequestMessage(HttpMethod.Put, $"{endpoint}/json/new?{Uri.EscapeDataString(url)}");
        using var response = await _http.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var webSocketUrl = document.RootElement.GetProperty("webSocketDebuggerUrl").GetString()
                           ?? throw new InvalidDataException("Chrome target did not provide webSocketDebuggerUrl.");
        _page = new CdpClient();
        await _page.ConnectAsync(webSocketUrl, cancellationToken);
        return _page;
    }

    public async Task EnsureChromeAsync(CancellationToken cancellationToken)
    {
        if (await IsDebuggerAvailableAsync(cancellationToken)) return;
        var chrome = FindChromeExecutable();
        Directory.CreateDirectory(_config.ChromeProfileDirectory);
        var start = new ProcessStartInfo(chrome)
        {
            UseShellExecute = false,
            CreateNoWindow = false
        };
        start.ArgumentList.Add($"--remote-debugging-port={_config.ChromeDebugPort}");
        start.ArgumentList.Add($"--user-data-dir={_config.ChromeProfileDirectory}");
        start.ArgumentList.Add("--no-first-run");
        start.ArgumentList.Add("--no-default-browser-check");
        if (_config.Headless) start.ArgumentList.Add("--headless=new");
        start.ArgumentList.Add(_config.AdminOrigin);
        _startedProcess = Process.Start(start) ?? throw new InvalidOperationException("Could not start Chrome.");

        var deadline = DateTimeOffset.UtcNow + TimeSpan.FromSeconds(30);
        while (DateTimeOffset.UtcNow < deadline)
        {
            if (await IsDebuggerAvailableAsync(cancellationToken)) return;
            await Task.Delay(300, cancellationToken);
        }
        throw new TimeoutException("Chrome started but its DevTools endpoint did not become available.");
    }

    private async Task<bool> IsDebuggerAvailableAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var response = await _http.GetAsync($"http://127.0.0.1:{_config.ChromeDebugPort}/json/version", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (HttpRequestException) { return false; }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested) { return false; }
    }

    private string FindChromeExecutable()
    {
        if (!string.IsNullOrWhiteSpace(_config.ChromeExecutablePath) && File.Exists(_config.ChromeExecutablePath))
            return _config.ChromeExecutablePath;

        var candidates = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google", "Chrome", "Application", "chrome.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google", "Chrome", "Application", "chrome.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Google", "Chrome", "Application", "chrome.exe")
        };
        return candidates.FirstOrDefault(File.Exists)
               ?? throw new FileNotFoundException("Google Chrome was not found. Set chromeExecutablePath in config.");
    }

    public async ValueTask DisposeAsync()
    {
        if (_page is not null) await _page.DisposeAsync();
        _http.Dispose();
        // Do not terminate Chrome: its dedicated profile contains the user's authenticated session.
    }
}
