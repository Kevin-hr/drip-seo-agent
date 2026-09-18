using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using DripOps.Configuration;

namespace DripOps.Browser;

public sealed class CdpClient : IAsyncDisposable
{
    private readonly ClientWebSocket _socket = new();
    private readonly ConcurrentDictionary<int, TaskCompletionSource<JsonElement>> _pending = new();
    private readonly SemaphoreSlim _sendLock = new(1, 1);
    private readonly CancellationTokenSource _shutdown = new();
    private Task? _receiveTask;
    private int _nextId;

    public async Task ConnectAsync(string webSocketDebuggerUrl, CancellationToken cancellationToken)
    {
        await _socket.ConnectAsync(new Uri(webSocketDebuggerUrl), cancellationToken);
        _receiveTask = Task.Run(() => ReceiveLoopAsync(_shutdown.Token), CancellationToken.None);
        await SendAsync("Runtime.enable", null, cancellationToken);
        await SendAsync("Page.enable", null, cancellationToken);
    }

    public async Task<JsonElement> SendAsync(string method, object? parameters = null, CancellationToken cancellationToken = default)
    {
        if (_socket.State != WebSocketState.Open) throw new InvalidOperationException("CDP socket is not connected.");
        var id = Interlocked.Increment(ref _nextId);
        var completion = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
        if (!_pending.TryAdd(id, completion)) throw new InvalidOperationException("Could not register CDP request.");

        var payload = JsonSerializer.SerializeToUtf8Bytes(new { id, method, @params = parameters }, JsonOptions.Default);
        await _sendLock.WaitAsync(cancellationToken);
        try
        {
            await _socket.SendAsync(payload, WebSocketMessageType.Text, true, cancellationToken);
        }
        finally
        {
            _sendLock.Release();
        }

        using var registration = cancellationToken.Register(() => completion.TrySetCanceled(cancellationToken));
        var response = await completion.Task;
        if (response.TryGetProperty("error", out var error))
            throw new InvalidOperationException($"CDP {method} failed: {error.GetRawText()}");
        return response.TryGetProperty("result", out var result) ? result.Clone() : default;
    }

    public async Task<JsonElement> EvaluateAsync(string expression, CancellationToken cancellationToken = default)
    {
        var result = await SendAsync("Runtime.evaluate", new
        {
            expression,
            awaitPromise = true,
            returnByValue = true,
            userGesture = false
        }, cancellationToken);
        if (result.TryGetProperty("exceptionDetails", out var exception))
            throw new InvalidOperationException($"Browser evaluation failed: {exception.GetRawText()}");
        var remoteObject = result.GetProperty("result");
        if (remoteObject.TryGetProperty("value", out var value)) return value.Clone();
        if (remoteObject.TryGetProperty("unserializableValue", out var raw))
            return JsonSerializer.SerializeToElement(raw.GetString(), JsonOptions.Default);
        return JsonSerializer.SerializeToElement<object?>(null, JsonOptions.Default);
    }

    public async Task NavigateAsync(string url, CancellationToken cancellationToken = default)
    {
        await SendAsync("Page.navigate", new { url }, cancellationToken);
        await WaitForAsync("document.readyState === 'complete' || document.readyState === 'interactive'",
            TimeSpan.FromSeconds(30), cancellationToken);
    }

    public async Task WaitForAsync(string conditionExpression, TimeSpan timeout, CancellationToken cancellationToken = default)
    {
        var deadline = DateTimeOffset.UtcNow + timeout;
        Exception? lastError = null;
        while (DateTimeOffset.UtcNow < deadline)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                var value = await EvaluateAsync($"Boolean({conditionExpression})", cancellationToken);
                if (value.ValueKind == JsonValueKind.True) return;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                lastError = ex;
            }
            await Task.Delay(250, cancellationToken);
        }
        throw new TimeoutException($"Timed out waiting for browser condition: {conditionExpression}", lastError);
    }

    private async Task ReceiveLoopAsync(CancellationToken cancellationToken)
    {
        var buffer = new byte[64 * 1024];
        try
        {
            while (!cancellationToken.IsCancellationRequested && _socket.State == WebSocketState.Open)
            {
                using var memory = new MemoryStream();
                WebSocketReceiveResult result;
                do
                {
                    result = await _socket.ReceiveAsync(buffer, cancellationToken);
                    if (result.MessageType == WebSocketMessageType.Close) return;
                    memory.Write(buffer, 0, result.Count);
                } while (!result.EndOfMessage);

                using var document = JsonDocument.Parse(memory.ToArray());
                var root = document.RootElement;
                if (root.TryGetProperty("id", out var idElement) && _pending.TryRemove(idElement.GetInt32(), out var completion))
                    completion.TrySetResult(root.Clone());
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            foreach (var item in _pending.Values) item.TrySetException(ex);
            _pending.Clear();
        }
    }

    public async ValueTask DisposeAsync()
    {
        _shutdown.Cancel();
        if (_socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
        {
            try { await _socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "DripOps closing", CancellationToken.None); }
            catch { /* cleanup only */ }
        }
        if (_receiveTask is not null)
        {
            try { await _receiveTask; } catch { /* cleanup only */ }
        }
        _socket.Dispose();
        _shutdown.Dispose();
        _sendLock.Dispose();
    }
}
