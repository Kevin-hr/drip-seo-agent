using System.Text.Json;
using DripOps.AI;
using DripOps.Browser;
using DripOps.Configuration;
using DripOps.Domain;
using DripOps.Rules;
using DripOps.State;

namespace DripOps;

internal static class Program
{
    private static async Task<int> Main(string[] args)
    {
        try
        {
            if (args.Length == 0 || args[0] is "help" or "--help" or "-h")
            {
                PrintHelp();
                return 0;
            }

            var command = args[0].ToLowerInvariant();
            var options = CliOptions.Parse(args.Skip(1).ToArray());
            if (command == "self-test") return RunSelfTests();

            var configPath = FindConfigPath(options.Optional("config"));
            var appRoot = string.Equals(Path.GetFileName(Path.GetDirectoryName(configPath)), "config", StringComparison.OrdinalIgnoreCase)
                ? Directory.GetParent(Path.GetDirectoryName(configPath)!)!.FullName
                : Path.GetDirectoryName(configPath)!;
            var config = DripOpsConfig.Load(configPath).ResolvePaths(appRoot);
            var store = new RunStore(config.StateDirectory);
            using var cancellation = new CancellationTokenSource();
            Console.CancelKeyPress += (_, eventArgs) => { eventArgs.Cancel = true; cancellation.Cancel(); };

            // The bridge's decision layer is SEO-PDP V4.4 CLEAN_CONSOLIDATED, so it is
            // routed before the historical 3.2 machine standard is loaded. The bridge
            // must never be able to read 3.2 rules: 3.2 mandates a verified SKU while
            // V4.4 §5/§5A permits SKU_OMIT.
            if (command == "serve") return await ServeAsync(config, store, options, cancellation.Token);

            var standard = MachineStandard.Load(config.StandardPath);

            return command switch
            {
                "init" => Init(config, standard),
                "login" => await LoginAsync(config, cancellation.Token),
                "find-category" => await FindCategoryAsync(config, options, cancellation.Token),
                "scan" => await ScanAsync(config, standard, store, options, cancellation.Token),
                "snapshot" => await SnapshotAsync(config, store, options, cancellation.Token),
                "resume" => Resume(config, standard, store, options),
                "status" => Status(store, options.Required("run")),
                "compose" => Compose(config, standard, store, options),
                "resolve-slug-collisions" => ResolveSlugCollisions(config, standard, store, options),
                "ai-export" => ExportAi(config, standard, store, options),
                "ai-import" => ImportAi(config, standard, store, options),
                "apply" => await ApplyAsync(config, standard, store, options, cancellation.Token),
                "publish-saved" => await PublishSavedAsync(config, standard, store, options, cancellation.Token),
                "verify-frontend" => await VerifyFrontendAsync(config, standard, store, options, cancellation.Token),
                _ => throw new ArgumentException($"Unknown command: {command}")
            };
        }
        catch (OperationCanceledException)
        {
            Console.Error.WriteLine("Operation cancelled. The latest completed checkpoint remains saved.");
            return 2;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"ERROR: {ex.Message}");
            if (Environment.GetEnvironmentVariable("DRIPOPS_DEBUG") == "1") Console.Error.WriteLine(ex);
            return 1;
        }
    }

    /// <summary>
    /// Local HTTP bridge for the ChatGPT MCP plugin. Thin adapter over the existing
    /// MrShopPlus execution path; it does not reimplement any of it.
    /// </summary>
    private static async Task<int> ServeAsync(DripOpsConfig config, RunStore store, CliOptions options, CancellationToken cancellationToken)
    {
        var token = Environment.GetEnvironmentVariable("LOCAL_AGENT_TOKEN");
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException(
                "LOCAL_AGENT_TOKEN must be set before starting the bridge. " +
                "The bridge refuses to listen without a bearer token.");
        }

        var mode = (options.Optional("mode") ?? config.ExecutionMode ?? "live").Trim().ToLowerInvariant();
        if (mode is not ("live" or "simulate"))
        {
            throw new ArgumentException("--mode must be 'live' or 'simulate'.");
        }

        var host = options.Optional("host") ?? config.BridgeHost;
        var port = int.TryParse(options.Optional("port"), out var parsedPort) ? parsedPort : config.BridgePort;

        var v44Standard = Rules.V44.V44Standard.Load(config.StandardV44Path, config.StandardV44DocumentPath);
        var planStore = new Bridge.PlanStore(config.BridgeDirectory);
        var server = new Bridge.BridgeServer(config, v44Standard, store, planStore, token, mode);

        Console.WriteLine(JsonSerializer.Serialize(new
        {
            ok = true,
            mode,
            host,
            port,
            standard = v44Standard.Version,
            standardHash = v44Standard.DocumentHash
        }, JsonOptions.Default));

        await server.RunAsync(host, port, cancellationToken);
        return 0;
    }

    private static int Init(DripOpsConfig config, MachineStandard standard)
    {
        Directory.CreateDirectory(config.ChromeProfileDirectory);
        Directory.CreateDirectory(config.StateDirectory);
        Directory.CreateDirectory(config.ExchangeDirectory);
        Console.WriteLine(JsonSerializer.Serialize(new
        {
            ok = true,
            standard = standard.Version,
            config.ChromeProfileDirectory,
            config.StateDirectory,
            config.ExchangeDirectory,
            next = "Run `DripOps login`, sign in to Mrshopplus once, then run `DripOps scan ...`."
        }, JsonOptions.Default));
        return 0;
    }

    private static async Task<int> LoginAsync(DripOpsConfig config, CancellationToken cancellationToken)
    {
        await using var chrome = new ChromeController(config);
        await chrome.OpenPageAsync(config.AdminOrigin, cancellationToken);
        Console.WriteLine("Dedicated DripOps Chrome profile opened. Sign in to Mrshopplus in that window, then close this command with Ctrl+C if it remains open.");
        return 0;
    }

    private static async Task<int> ScanAsync(DripOpsConfig config, MachineStandard standard, RunStore store,
        CliOptions options, CancellationToken cancellationToken)
    {
        var categoryAdminUrl = options.Required("category-admin-url");
        int? limit = null;
        var limitText = options.Optional("limit");
        if (limitText is not null)
        {
            if (!int.TryParse(limitText, out var parsedLimit) || parsedLimit <= 0)
                throw new ArgumentException("--limit must be a positive integer.");
            limit = parsedLimit;
        }
        var runId = store.CreateRun(categoryAdminUrl, options.Optional("category-url"), standard.Version, options.Optional("run-id"));
        using var runLock = store.AcquireRunLock(runId);
        await using var chrome = new ChromeController(config);
        var page = await chrome.OpenPageAsync(categoryAdminUrl, cancellationToken);
        var client = new MrshopplusClient(config, page);
        var snapshot = await client.ScanCategoryAsync(categoryAdminUrl, cancellationToken, limit);
        store.SaveCategorySnapshot(runId, snapshot);
        var countMismatches = new List<string>();
        CheckExpected(options.Optional("expected-total"), snapshot.Total, "total", countMismatches);
        CheckExpected(options.Optional("expected-published"), snapshot.Published, "published", countMismatches);
        CheckExpected(options.Optional("expected-unpublished"), snapshot.Unpublished, "unpublished", countMismatches);
        if (countMismatches.Count > 0)
        {
            store.AppendEvent(runId, "CATEGORY_EXPECTATION_MISMATCH", new { countMismatches });
            throw new InvalidDataException("Category expectation mismatch: " + string.Join("; ", countMismatches));
        }
        Console.WriteLine(JsonSerializer.Serialize(new { runId, snapshot.CategoryName, snapshot.Total, snapshot.Published, snapshot.Unpublished }, JsonOptions.Default));
        return 0;
    }

    private static async Task<int> FindCategoryAsync(DripOpsConfig config, CliOptions options,
        CancellationToken cancellationToken)
    {
        var name = options.Required("name");
        await using var chrome = new ChromeController(config);
        var page = await chrome.OpenPageAsync(config.AdminOrigin, cancellationToken);
        var client = new MrshopplusClient(config, page);
        var results = await client.FindCategoriesAsync(name, cancellationToken);
        Console.WriteLine(JsonSerializer.Serialize(new { query = name, count = results.Count, results }, JsonOptions.Default));
        return results.Count > 0 ? 0 : 3;
    }

    private static async Task<int> SnapshotAsync(DripOpsConfig config, RunStore store, CliOptions options,
        CancellationToken cancellationToken)
    {
        var runId = options.Required("run");
        var force = options.Flag("force");
        var includePublished = options.Flag("include-published");
        var selectedProducts = (options.Optional("products") ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.Ordinal);
        using var runLock = store.AcquireRunLock(runId);
        var run = store.LoadRun(runId);
        var category = run.CategorySnapshot ?? throw new InvalidOperationException("Run has no category snapshot. Run scan first.");
        await using var chrome = new ChromeController(config);
        var page = await chrome.OpenPageAsync(config.AdminOrigin, cancellationToken);
        var client = new MrshopplusClient(config, page);
        var completed = 0;
        foreach (var row in category.Products
                     .Where(row => includePublished || !row.IsPublished)
                     .Where(row => selectedProducts.Count == 0 || selectedProducts.Contains(row.ProductId)))
        {
            var job = store.LoadProduct(runId, row.ProductId);
            if (!force && job.Snapshot is not null) continue;
            try
            {
                var snapshot = await client.ReadProductAsync(row.ProductId, row.AdminUrl, cancellationToken);
                store.SaveProduct(runId, job with
                {
                    Snapshot = snapshot,
                    Stage = WorkflowStage.SnapshotCaptured,
                    InputAuditStatus = AuditStatus.Fix,
                    ReleaseStatus = ReleaseStatus.Blocked
                });
                completed++;
            }
            catch (Exception ex)
            {
                store.SaveProduct(runId, job with
                {
                    Stage = WorkflowStage.Failed,
                    ReleaseStatus = ReleaseStatus.Blocked,
                    FailureCodes = [.. job.FailureCodes, "BROWSER-01 SNAPSHOT_FAILED"]
                });
                store.AppendEvent(runId, "PRODUCT_SNAPSHOT_FAILED", new { row.ProductId, error = ex.Message });
            }
        }
        Console.WriteLine(JsonSerializer.Serialize(new { runId, snapshotsCaptured = completed }, JsonOptions.Default));
        return 0;
    }

    private static int Status(RunStore store, string runId)
    {
        var run = store.LoadRun(runId);
        var products = store.LoadProducts(runId);
        Console.WriteLine(JsonSerializer.Serialize(new
        {
            run.RunId,
            run.StandardVersion,
            category = run.CategorySnapshot,
            stages = products.GroupBy(product => product.Stage).ToDictionary(group => group.Key.ToString(), group => group.Count()),
            release = products.GroupBy(product => product.ReleaseStatus).ToDictionary(group => group.Key.ToString(), group => group.Count()),
            products = products.Select(product => new { product.ProductId, product.CategoryIndex, product.Stage, product.InputAuditStatus, product.ReleaseStatus, product.FailureCodes })
        }, JsonOptions.Default));
        return 0;
    }

    private static int Resume(DripOpsConfig config, MachineStandard standard, RunStore store, CliOptions options)
    {
        var runId = options.Required("run");
        using var runLock = store.AcquireRunLock(runId);
        var jobs = store.LoadProducts(runId);
        var exchange = new FileExchangeService(config.ExchangeDirectory);
        var exported = new List<string>();
        foreach (var job in jobs.Where(job => job.Snapshot is not null && job.Facts is null &&
                                              job.Stage is WorkflowStage.SnapshotCaptured or WorkflowStage.EvidenceRequired))
        {
            exported.Add(exchange.Export(new AiJobRequest
            {
                RunId = runId,
                StandardVersion = standard.Version,
                Snapshot = job.Snapshot!,
                ExistingVerifiedFacts = null
            }));
            if (job.Stage != WorkflowStage.EvidenceRequired)
                store.SaveProduct(runId, job with { Stage = WorkflowStage.EvidenceRequired });
        }

        var refreshed = store.LoadProducts(runId);
        var missingSnapshots = refreshed.Where(job => job.Snapshot is null).Select(job => job.ProductId).ToList();
        var ready = refreshed.Where(job => job.ReleaseStatus == ReleaseStatus.Ready).Select(job => job.ProductId).ToList();
        var failed = refreshed.Where(job => job.Stage == WorkflowStage.Failed).Select(job => job.ProductId).ToList();
        var next = missingSnapshots.Count > 0
            ? $"DripOps snapshot --run {runId}"
            : ready.Count > 0
                ? $"DripOps apply --run {runId}"
                : exported.Count > 0
                    ? "Give the exported request files to any AI, then run ai-import for each response."
                    : "No deterministic work is pending. Inspect HOLD/FAILED jobs with status.";
        Console.WriteLine(JsonSerializer.Serialize(new { runId, missingSnapshots, exportedAiRequests = exported, ready, failed, next }, JsonOptions.Default));
        return 0;
    }

    private static int Compose(DripOpsConfig config, MachineStandard standard, RunStore store, CliOptions options)
    {
        var runId = options.Required("run");
        var productId = options.Required("product");
        var factsPath = options.Required("facts");
        using var runLock = store.AcquireRunLock(runId);
        var facts = JsonSerializer.Deserialize<ProductFacts>(File.ReadAllText(factsPath), JsonOptions.Default)
                    ?? throw new InvalidDataException($"Invalid facts file: {factsPath}");
        var job = store.LoadProduct(runId, productId);
        var composer = new SeoPdpComposer(standard, config);
        var validator = new SeoPdpValidator(standard, config);
        var migrateUrl = options.Flag("migrate-url");
        var currentUrl = job.Snapshot?.ExistingSlug;
        var redirectFrom = options.Optional("redirect-from");
        if (migrateUrl && string.IsNullOrWhiteSpace(redirectFrom) && !string.IsNullOrWhiteSpace(currentUrl))
            redirectFrom = $"/{currentUrl.Trim('/')}";
        SeoDraft? draft = null;
        ValidationResult validation;
        try
        {
            draft = composer.Compose(facts, currentUrl: currentUrl, urlChangeRequired: migrateUrl,
                redirectFrom: redirectFrom);
            validation = validator.Validate(facts, draft, job.Snapshot);
        }
        catch (Exception ex)
        {
            validation = new ValidationResult
            {
                IsValid = false,
                Issues = [new() { Code = "FACT-00 CORE_GATE", Severity = "error", Message = ex.Message }]
            };
        }

        var audit = validation.IsValid
            ? (job.Snapshot is not null && string.Equals(job.Snapshot.ExistingName, draft!.ProductName, StringComparison.Ordinal) ? AuditStatus.Pass : AuditStatus.Fix)
            : AuditStatus.Hold;
        store.SaveProduct(runId, job with
        {
            Facts = facts,
            Draft = draft,
            Validation = validation,
            Stage = WorkflowStage.Validated,
            InputAuditStatus = audit,
            ReleaseStatus = validation.IsValid ? ReleaseStatus.Ready : ReleaseStatus.Blocked,
            FailureCodes = validation.Issues.Where(issue => issue.Severity == "error").Select(issue => issue.Code).Distinct().ToList()
        });
        Console.WriteLine(JsonSerializer.Serialize(new { runId, productId, auditStatus = audit, releaseStatus = validation.IsValid ? ReleaseStatus.Ready : ReleaseStatus.Blocked, validation }, JsonOptions.Default));
        return validation.IsValid ? 0 : 3;
    }

    private static int ExportAi(DripOpsConfig config, MachineStandard standard, RunStore store, CliOptions options)
    {
        var runId = options.Required("run");
        var productId = options.Required("product");
        var job = store.LoadProduct(runId, productId);
        var snapshot = job.Snapshot ?? throw new InvalidOperationException("Product snapshot is missing. Run snapshot first.");
        var exchange = new FileExchangeService(config.ExchangeDirectory);
        var path = exchange.Export(new AiJobRequest
        {
            RunId = runId,
            StandardVersion = standard.Version,
            Snapshot = snapshot,
            ExistingVerifiedFacts = job.Facts
        });
        Console.WriteLine(path);
        return 0;
    }

    private static int ResolveSlugCollisions(DripOpsConfig config, MachineStandard standard, RunStore store,
        CliOptions options)
    {
        var runId = options.Required("run");
        using var runLock = store.AcquireRunLock(runId);
        var jobs = store.LoadProducts(runId).Where(job => job.Draft is not null).ToList();
        var collisionGroups = jobs.GroupBy(job => job.Draft!.Slug, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .ToList();
        var collidingIds = collisionGroups.SelectMany(group => group).Select(job => job.ProductId).ToHashSet(StringComparer.Ordinal);
        var used = jobs.Where(job => !collidingIds.Contains(job.ProductId))
            .Select(job => job.Draft!.Slug)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var changed = new List<object>();
        var validator = new SeoPdpValidator(standard, config);

        foreach (var group in collisionGroups)
        {
            foreach (var job in group.OrderBy(item => item.CategoryIndex))
            {
                if (job.ReleaseStatus is ReleaseStatus.Saved or ReleaseStatus.Published or ReleaseStatus.Verified)
                    throw new InvalidOperationException($"Cannot alter a post-save slug collision: {job.ProductId}");
                if (job.Facts is null || job.Snapshot is null)
                    throw new InvalidOperationException($"Cannot resolve slug without facts and snapshot: {job.ProductId}");

                var baseSlug = job.Draft!.Slug;
                var legacyParts = job.Snapshot.ExistingSlug.Trim().Trim('/')
                    .Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Where(part => !string.Equals(part, "pkgod", StringComparison.OrdinalIgnoreCase))
                    .Select(part => string.Equals(part, "manire", StringComparison.OrdinalIgnoreCase) ? "maniere" : part);
                var normalizedLegacy = SeoPdpComposer.Slugify(string.Join(' ', legacyParts));
                var candidates = new[] { normalizedLegacy, baseSlug, $"{baseSlug}-{job.ProductId}" }
                    .Where(candidate => !string.IsNullOrWhiteSpace(candidate))
                    .Distinct(StringComparer.OrdinalIgnoreCase);
                var selected = candidates.First(candidate => used.Add(candidate));
                var current = job.Snapshot.ExistingSlug.Trim().Trim('/');
                var migration = !string.Equals(current, selected, StringComparison.OrdinalIgnoreCase);
                var updatedDraft = job.Draft with
                {
                    Slug = selected,
                    CanonicalUrl = $"{config.StoreOrigin.TrimEnd('/')}/{selected}",
                    CurrentUrl = current,
                    UrlChangeRequired = migration,
                    RedirectFrom = migration ? $"/{current}" : null
                };
                var validation = validator.Validate(job.Facts, updatedDraft, job.Snapshot);
                if (!validation.IsValid)
                    throw new InvalidDataException($"Resolved slug did not validate for {job.ProductId}: " +
                                                   string.Join("; ", validation.Issues.Select(issue => issue.Message)));
                store.SaveProduct(runId, job with
                {
                    Draft = updatedDraft,
                    Validation = validation,
                    Stage = WorkflowStage.Validated,
                    ReleaseStatus = ReleaseStatus.Ready,
                    FailureCodes = []
                });
                changed.Add(new { job.ProductId, previousSlug = baseSlug, slug = selected });
            }
        }

        Console.WriteLine(JsonSerializer.Serialize(new { runId, collisionGroups = collisionGroups.Count, changed }, JsonOptions.Default));
        return 0;
    }

    private static int ImportAi(DripOpsConfig config, MachineStandard standard, RunStore store, CliOptions options)
    {
        var runId = options.Required("run");
        var productId = options.Required("product");
        var input = options.Required("input");
        using var runLock = store.AcquireRunLock(runId);
        var exchange = new FileExchangeService(config.ExchangeDirectory);
        var response = exchange.Import(input, productId);
        var job = store.LoadProduct(runId, productId);
        SeoDraft? draft = null;
        ValidationResult? validation = null;
        var release = ReleaseStatus.Blocked;
        if (response.Facts is not null && response.AuditStatus is AuditStatus.Pass or AuditStatus.Fix)
        {
            try
            {
                draft = new SeoPdpComposer(standard, config).Compose(response.Facts, currentUrl: job.Snapshot?.ExistingSlug);
                validation = new SeoPdpValidator(standard, config).Validate(response.Facts, draft, job.Snapshot);
                if (validation.IsValid) release = ReleaseStatus.Ready;
            }
            catch (Exception ex)
            {
                validation = new ValidationResult
                {
                    IsValid = false,
                    Issues = [new() { Code = "FACT-00 CORE_GATE", Severity = "error", Message = ex.Message }]
                };
            }
        }
        store.SaveProduct(runId, job with
        {
            Facts = response.Facts,
            Draft = draft,
            Validation = validation,
            InputAuditStatus = response.AuditStatus,
            ReleaseStatus = release,
            Stage = validation?.IsValid == true ? WorkflowStage.Validated : WorkflowStage.EvidenceRequired,
            FailureCodes = [.. response.FailureCodes, .. (validation?.Issues.Where(issue => issue.Severity == "error").Select(issue => issue.Code) ?? [])]
        });
        Console.WriteLine(JsonSerializer.Serialize(new { runId, productId, response.AuditStatus, release, validation }, JsonOptions.Default));
        return release == ReleaseStatus.Ready ? 0 : 3;
    }

    private static async Task<int> ApplyAsync(DripOpsConfig config, MachineStandard standard, RunStore store,
        CliOptions options, CancellationToken cancellationToken)
    {
        var runId = options.Required("run");
        var publish = options.Flag("publish");
        var productFilter = options.Optional("product");
        using var runLock = store.AcquireRunLock(runId);
        var jobs = store.LoadProducts(runId)
            .Where(job => productFilter is null || string.Equals(job.ProductId, productFilter, StringComparison.Ordinal))
            .Where(job => job.ReleaseStatus == ReleaseStatus.Ready)
            .ToList();
        if (jobs.Count == 0) throw new InvalidOperationException("No READY product jobs matched the apply request.");

        await using var chrome = new ChromeController(config);
        var page = await chrome.OpenPageAsync(config.AdminOrigin, cancellationToken);
        var client = new MrshopplusClient(config, page);
        var frontend = new FrontendVerifier();
        var succeeded = 0;
        foreach (var job in jobs)
        {
            if (job.Draft is null || job.Facts is null || job.Validation?.IsValid != true)
                throw new InvalidOperationException($"Product {job.ProductId} is READY but lacks a valid draft/facts package.");
            try
            {
                await client.ReadProductAsync(job.ProductId, job.AdminUrl, cancellationToken);
                await client.WriteAndSaveAsync(job.Draft, publish: false, cancellationToken);
                var readBack = await client.ReadProductAsync(job.ProductId, job.AdminUrl, cancellationToken);
                var seoReadBack = await client.ReadSeoAsync(cancellationToken);
                var mismatch = CompareReadBack(standard, job.Draft, readBack, seoReadBack);
                if (mismatch.Count > 0) throw new InvalidDataException("Save read-back mismatch: " + string.Join("; ", mismatch));
                var updated = job with { Snapshot = readBack, Stage = WorkflowStage.ReadBackVerified, ReleaseStatus = ReleaseStatus.Saved };
                store.SaveProduct(runId, updated);

                if (publish)
                {
                    await client.SetPublishedAndSaveAsync(cancellationToken);
                    var publishedReadBack = await client.ReadProductAsync(job.ProductId, job.AdminUrl, cancellationToken);
                    if (!publishedReadBack.IsPublished) throw new InvalidDataException("Backend publish switch did not remain enabled after save.");
                    store.SaveProduct(runId, updated with { Snapshot = publishedReadBack, Stage = WorkflowStage.Published, ReleaseStatus = ReleaseStatus.Published });
                    var frontendResult = await frontend.VerifyAsync(job.Draft, cancellationToken);
                    if (!frontendResult.IsValid)
                        throw new InvalidDataException("Frontend verification failed: " + string.Join("; ", frontendResult.Issues.Select(issue => issue.Message)));
                    store.SaveProduct(runId, updated with
                    {
                        Snapshot = publishedReadBack,
                        Stage = WorkflowStage.FrontendVerified,
                        ReleaseStatus = ReleaseStatus.Verified,
                        Validation = new ValidationResult
                        {
                            IsValid = true,
                            Issues = [.. job.Validation.Issues, .. frontendResult.Issues]
                        }
                    });
                }
                succeeded++;
            }
            catch (Exception ex)
            {
                var latest = store.LoadProduct(runId, job.ProductId);
                var checkpointed = latest.ReleaseStatus is ReleaseStatus.Saved or ReleaseStatus.Published or ReleaseStatus.Verified;
                store.SaveProduct(runId, latest with
                {
                    Stage = checkpointed ? latest.Stage : WorkflowStage.Failed,
                    ReleaseStatus = checkpointed ? latest.ReleaseStatus : ReleaseStatus.Blocked,
                    FailureCodes = [.. latest.FailureCodes, checkpointed ? "VERIFY-01 FRONTEND_VERIFICATION_DEFERRED" : "SAVE-01 APPLY_OR_READBACK_FAILED"]
                });
                store.AppendEvent(runId, "PRODUCT_APPLY_FAILED", new { job.ProductId, error = ex.Message });
            }
        }
        Console.WriteLine(JsonSerializer.Serialize(new { runId, requested = jobs.Count, succeeded, publish }, JsonOptions.Default));
        return succeeded == jobs.Count ? 0 : 4;
    }

    private static async Task<int> PublishSavedAsync(DripOpsConfig config, MachineStandard standard, RunStore store,
        CliOptions options, CancellationToken cancellationToken)
    {
        var runId = options.Required("run");
        var productFilter = options.Optional("product");
        using var runLock = store.AcquireRunLock(runId);
        var jobs = store.LoadProducts(runId)
            .Where(job => productFilter is null || string.Equals(job.ProductId, productFilter, StringComparison.Ordinal))
            .Where(job => job.ReleaseStatus == ReleaseStatus.Saved)
            .ToList();
        if (jobs.Count == 0) throw new InvalidOperationException("No SAVED product jobs matched the publish request.");

        await using var chrome = new ChromeController(config);
        var page = await chrome.OpenPageAsync(config.AdminOrigin, cancellationToken);
        var client = new MrshopplusClient(config, page);
        var frontend = new FrontendVerifier();
        var verified = 0;
        foreach (var job in jobs)
        {
            if (job.Draft is null || job.Validation?.IsValid != true)
                throw new InvalidOperationException($"Product {job.ProductId} is SAVED but lacks a valid draft package.");
            try
            {
                var savedReadBack = await client.ReadProductAsync(job.ProductId, job.AdminUrl, cancellationToken);
                var seoReadBack = await client.ReadSeoAsync(cancellationToken);
                var mismatch = CompareReadBack(standard, job.Draft, savedReadBack, seoReadBack);
                if (mismatch.Count > 0) throw new InvalidDataException("Saved read-back mismatch: " + string.Join("; ", mismatch));
                if (!savedReadBack.IsPublished) await client.SetPublishedAndSaveAsync(cancellationToken);
                var publishedReadBack = await client.ReadProductAsync(job.ProductId, job.AdminUrl, cancellationToken);
                if (!publishedReadBack.IsPublished) throw new InvalidDataException("Backend publish switch did not remain enabled after save.");
                store.SaveProduct(runId, job with
                {
                    Snapshot = publishedReadBack,
                    Stage = WorkflowStage.Published,
                    ReleaseStatus = ReleaseStatus.Published
                });
                var frontendResult = await frontend.VerifyAsync(job.Draft, cancellationToken);
                if (!frontendResult.IsValid)
                    throw new InvalidDataException("Frontend verification failed: " + string.Join("; ", frontendResult.Issues.Select(issue => issue.Message)));
                store.SaveProduct(runId, job with
                {
                    Snapshot = publishedReadBack,
                    Stage = WorkflowStage.FrontendVerified,
                    ReleaseStatus = ReleaseStatus.Verified,
                    Validation = new ValidationResult
                    {
                        IsValid = true,
                        Issues = [.. job.Validation.Issues, .. frontendResult.Issues]
                    },
                    FailureCodes = [.. job.FailureCodes.Where(code =>
                        code is not "SAVE-01 APPLY_OR_READBACK_FAILED" and not "VERIFY-01 FRONTEND_VERIFICATION_DEFERRED")]
                });
                verified++;
            }
            catch (Exception ex)
            {
                var latest = store.LoadProduct(runId, job.ProductId);
                var published = latest.Snapshot?.IsPublished == true || latest.ReleaseStatus == ReleaseStatus.Published;
                store.SaveProduct(runId, latest with
                {
                    Stage = published ? WorkflowStage.Published : WorkflowStage.ReadBackVerified,
                    ReleaseStatus = published ? ReleaseStatus.Published : ReleaseStatus.Saved,
                    FailureCodes = [.. latest.FailureCodes, "VERIFY-01 FRONTEND_VERIFICATION_DEFERRED"]
                });
                store.AppendEvent(runId, "PUBLISH_SAVED_FAILED", new { job.ProductId, error = ex.Message });
            }
        }

        Console.WriteLine(JsonSerializer.Serialize(new { runId, requested = jobs.Count, verified }, JsonOptions.Default));
        return verified == jobs.Count ? 0 : 4;
    }

    private static async Task<int> VerifyFrontendAsync(DripOpsConfig config, MachineStandard standard, RunStore store,
        CliOptions options, CancellationToken cancellationToken)
    {
        var runId = options.Required("run");
        var productFilter = options.Optional("product");
        using var runLock = store.AcquireRunLock(runId);
        var jobs = store.LoadProducts(runId)
            .Where(job => productFilter is null || string.Equals(job.ProductId, productFilter, StringComparison.Ordinal))
            .Where(job => job.Draft is not null && job.Validation?.IsValid == true)
            .ToList();
        if (jobs.Count == 0) throw new InvalidOperationException("No valid drafted product jobs matched the frontend verification request.");

        await using var chrome = new ChromeController(config);
        var page = await chrome.OpenPageAsync(config.AdminOrigin, cancellationToken);
        var client = new MrshopplusClient(config, page);
        var frontend = new FrontendVerifier();
        var verified = 0;

        foreach (var job in jobs)
        {
            try
            {
                var readBack = await client.ReadProductAsync(job.ProductId, job.AdminUrl, cancellationToken);
                if (!readBack.IsPublished) throw new InvalidDataException("Backend product is not published.");
                var seoReadBack = await client.ReadSeoAsync(cancellationToken);
                var mismatch = CompareReadBack(standard, job.Draft!, readBack, seoReadBack);
                if (mismatch.Count > 0) throw new InvalidDataException("Published read-back mismatch: " + string.Join("; ", mismatch));

                var frontendResult = await frontend.VerifyAsync(job.Draft!, cancellationToken);
                if (!frontendResult.IsValid)
                    throw new InvalidDataException("Frontend verification failed: " + string.Join("; ", frontendResult.Issues.Select(issue => issue.Message)));

                store.SaveProduct(runId, job with
                {
                    Snapshot = readBack,
                    Stage = WorkflowStage.FrontendVerified,
                    ReleaseStatus = ReleaseStatus.Verified,
                    Validation = new ValidationResult
                    {
                        IsValid = true,
                        Issues = [.. job.Validation!.Issues, .. frontendResult.Issues]
                    },
                    FailureCodes = [.. job.FailureCodes.Where(code =>
                        code is not "SAVE-01 APPLY_OR_READBACK_FAILED" and not "VERIFY-01 FRONTEND_VERIFICATION_DEFERRED")]
                });
                store.AppendEvent(runId, "FRONTEND_VERIFIED", new { job.ProductId, job.Draft!.CanonicalUrl });
                verified++;
            }
            catch (Exception ex)
            {
                var latest = store.LoadProduct(runId, job.ProductId);
                var published = latest.Snapshot?.IsPublished == true || latest.ReleaseStatus is ReleaseStatus.Published or ReleaseStatus.Verified;
                store.SaveProduct(runId, latest with
                {
                    Stage = published ? WorkflowStage.Published : WorkflowStage.Failed,
                    ReleaseStatus = published ? ReleaseStatus.Published : ReleaseStatus.Blocked,
                    FailureCodes = [.. latest.FailureCodes, "VERIFY-01 FRONTEND_VERIFICATION_DEFERRED"]
                });
                store.AppendEvent(runId, "FRONTEND_VERIFY_FAILED", new { job.ProductId, error = ex.Message });
            }
        }

        Console.WriteLine(JsonSerializer.Serialize(new { runId, requested = jobs.Count, verified }, JsonOptions.Default));
        return verified == jobs.Count ? 0 : 4;
    }

    private static List<string> CompareReadBack(MachineStandard standard, SeoDraft draft, ProductSnapshot snapshot, ProductSeoReadback seo)
    {
        var mismatches = new List<string>();
        if (!string.Equals(snapshot.ExistingName, draft.ProductName, StringComparison.Ordinal)) mismatches.Add("Product Name");
        if (!snapshot.ExistingDescriptionHtml.Contains($"data-version=\"{standard.Version}\"", StringComparison.Ordinal)) mismatches.Add("PDP data-version");
        if (!snapshot.ExistingDescriptionHtml.Contains($"<h2>{System.Net.WebUtility.HtmlEncode(draft.ProductName)}</h2>", StringComparison.OrdinalIgnoreCase) &&
            !snapshot.ExistingDescriptionHtml.Contains($"<h2>{draft.ProductName}</h2>", StringComparison.OrdinalIgnoreCase)) mismatches.Add("PDP H2");
        if (!string.Equals(seo.SeoTitle, draft.SeoTitle, StringComparison.Ordinal)) mismatches.Add("SEO Title");
        if (!string.Equals(seo.MetaDescription, draft.MetaDescription, StringComparison.Ordinal)) mismatches.Add("Meta Description");
        if (!string.Equals(seo.Slug.Trim('/'), draft.Slug.Trim('/'), StringComparison.OrdinalIgnoreCase)) mismatches.Add("SEO Slug");
        if (!seo.Keywords.SequenceEqual(draft.Keywords, StringComparer.OrdinalIgnoreCase)) mismatches.Add("SEO Keywords");
        return mismatches;
    }

    private static int RunSelfTests()
    {
        var failures = new List<string>();
        void Assert(bool condition, string name) { if (!condition) failures.Add(name); }
        var temp = Path.Combine(Path.GetTempPath(), "dripops-selftest-" + Guid.NewGuid().ToString("N"));
        try
        {
            Directory.CreateDirectory(temp);
            var config = new DripOpsConfig
            {
                StateDirectory = Path.Combine(temp, "runs"),
                ExchangeDirectory = Path.Combine(temp, "exchange"),
                ChromeProfileDirectory = Path.Combine(temp, "chrome"),
                TrustClaims = new TrustClaimsConfig()
            };
            var standard = new MachineStandard
            {
                Version = "3.2",
                RelatedProductsMax = 0,
                DefaultInternalLinks = 1,
                ForbiddenPlaceholders = ["TBD"],
                ForbiddenDomains = ["luckdog.mrshopplus.com"],
                RiskTerms = ["fake", "official", "replica"],
                OfficialEntityTermExceptions = ["Maison Margiela Replica"]
            };
            var facts = new ProductFacts
            {
                Brand = "Chrome Hearts",
                ModelName = "Horseshoe Floral Hoodie",
                PrimaryColorway = "Black",
                Sku = "CH-TEST-001",
                ProductType = "Hoodie",
                BrandCategoryPath = "/Chrome-Hearts/",
                CategoryPath = "/Chrome-Hearts-Hoodies/",
                ProductIntro = "The Chrome Hearts Horseshoe Floral Hoodie in black features the verified horseshoe and floral graphic treatment shown in the current product images.",
                ImageMatchVerified = true,
                SkuVerified = true,
                Evidence = [new EvidenceItem { Field = "sku", Value = "CH-TEST-001", SourceUrl = "https://example.test/product", SourceTier = "official", VerifiedAt = DateTimeOffset.Now }]
            };
            var draft = new SeoPdpComposer(standard, config).Compose(facts);
            var validation = new SeoPdpValidator(standard, config).Validate(facts, draft,
                new ProductSnapshot { ProductId = "1", AdminUrl = "https://admin.test", ImageUrls = ["https://img.test/1.jpg"] });
            Assert(validation.IsValid, "valid draft passes");
            Assert(draft.ProductName == "Chrome Hearts Horseshoe Floral Hoodie Black CH-TEST-001", "product name includes sku");
            Assert(draft.SeoTitle == "Chrome Hearts Horseshoe Floral Hoodie Black CH-TEST-001 Reps | Drip Sneakers", "title keeps name plus sku format without duplication");
            Assert(draft.SeoTitle.EndsWith("Reps | Drip Sneakers", StringComparison.Ordinal), "title format");
            Assert(SeoPdpComposer.Slugify("Crème & Black / A") == "creme-and-black-a", "slug normalization");
            var migratedDraft = new SeoPdpComposer(standard, config).Compose(facts,
                currentUrl: "Top-Quality-Old-Slug", urlChangeRequired: true,
                redirectFrom: "/Top-Quality-Old-Slug");
            Assert(migratedDraft.Slug == "chrome-hearts-horseshoe-floral-hoodie-black-ch-test-001",
                "explicit URL migration generates normalized slug");
            Assert(migratedDraft.UrlChangeRequired && migratedDraft.RedirectFrom == "/Top-Quality-Old-Slug",
                "explicit URL migration retains redirect source");

            var store = new RunStore(config.StateDirectory);
            var runId = store.CreateRun("https://admin.test/category", "https://shop.test/category", standard.Version, "self-test");
            store.SaveCategorySnapshot(runId, new CategorySnapshot
            {
                CategoryAdminUrl = "https://admin.test/category",
                CategoryName = "Test",
                Total = 1,
                Published = 0,
                Unpublished = 1,
                Products = [new CategoryProductRow { Index = 1, ProductId = "1", Name = "Old", AdminUrl = "https://admin.test/product/1", IsPublished = false }]
            });
            var loaded = store.LoadRun(runId);
            Assert(loaded.ProductIds.SequenceEqual(["1"]), "run persistence");
            using (store.AcquireRunLock(runId))
            {
                try { using var duplicate = store.AcquireRunLock(runId); failures.Add("run lock exclusivity"); }
                catch (IOException) { }
            }
        }
        finally
        {
            if (Directory.Exists(temp)) Directory.Delete(temp, true);
        }

        Console.WriteLine(JsonSerializer.Serialize(new { ok = failures.Count == 0, failures }, JsonOptions.Default));
        return failures.Count == 0 ? 0 : 1;
    }

    private static void CheckExpected(string? expectedText, int actual, string label, List<string> mismatches)
    {
        if (string.IsNullOrWhiteSpace(expectedText)) return;
        if (!int.TryParse(expectedText, out var expected) || expected < 0)
            throw new ArgumentException($"--expected-{label} must be a non-negative integer.");
        if (expected != actual) mismatches.Add($"{label}: expected {expected}, actual {actual}");
    }

    private static string FindConfigPath(string? requested)
    {
        if (!string.IsNullOrWhiteSpace(requested)) return Path.GetFullPath(requested);
        var candidates = new[]
        {
            Path.Combine(Environment.CurrentDirectory, "config", "dripops.json"),
            Path.Combine(Environment.CurrentDirectory, "dripops", "config", "dripops.json"),
            Path.Combine(AppContext.BaseDirectory, "config", "dripops.json"),
            Path.Combine(AppContext.BaseDirectory, "dripops.json")
        };
        return candidates.FirstOrDefault(File.Exists)
               ?? throw new FileNotFoundException("dripops.json was not found. Copy config/dripops.example.json to config/dripops.json or pass --config.");
    }

    private static void PrintHelp()
    {
        Console.WriteLine("""
            DripOps - resumable Mrshopplus SEO/PDP automation

            Commands:
              init [--config PATH]
              login [--config PATH]
              find-category --name "Air Jordan 5"
              scan --category-admin-url URL [--category-url URL] [--run-id ID] [--limit N]
                   [--expected-total N] [--expected-published N] [--expected-unpublished N]
              snapshot --run ID [--products ID1,ID2] [--include-published] [--force]
              resume --run ID
              status --run ID
              ai-export --run ID --product PRODUCT_ID
              ai-import --run ID --product PRODUCT_ID --input RESPONSE.json
              compose --run ID --product PRODUCT_ID --facts FACTS.json [--migrate-url] [--redirect-from PATH]
              resolve-slug-collisions --run ID
              apply --run ID [--product PRODUCT_ID] [--publish]
              publish-saved --run ID [--product PRODUCT_ID]
              verify-frontend --run ID [--product PRODUCT_ID]
              serve [--mode live|simulate] [--host 127.0.0.1] [--port 8787]
              self-test

            Safety:
              Only READY jobs can be saved. Only deterministic read-back matches can be published.
              Missing or unverified core facts remain HOLD/BLOCKED.
            """);
    }

    private sealed class CliOptions
    {
        private readonly Dictionary<string, string?> _values = new(StringComparer.OrdinalIgnoreCase);
        public static CliOptions Parse(string[] args)
        {
            var result = new CliOptions();
            for (var i = 0; i < args.Length; i++)
            {
                var arg = args[i];
                if (!arg.StartsWith("--", StringComparison.Ordinal)) throw new ArgumentException($"Unexpected argument: {arg}");
                var key = arg[2..];
                string? value = null;
                if (i + 1 < args.Length && !args[i + 1].StartsWith("--", StringComparison.Ordinal)) value = args[++i];
                result._values[key] = value;
            }
            return result;
        }
        public string Required(string key) => Optional(key) ?? throw new ArgumentException($"Missing required option --{key}.");
        public string? Optional(string key) => _values.TryGetValue(key, out var value) ? value : null;
        public bool Flag(string key) => _values.ContainsKey(key) && _values[key] is null or "true" or "1";
    }
}
