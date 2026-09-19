using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DripOps.Browser;
using DripOps.Configuration;
using DripOps.Domain;
using DripOps.Rules.V44;
using DripOps.State;

namespace DripOps.Bridge;

/// <summary>
/// Local HTTP bridge between the ChatGPT MCP plugin and the existing MrShopPlus
/// execution path.
///
/// Responsibilities (and nothing more):
///   search → read → prepare (dry run, immutable plan) → execute (plan only) →
///   verify → run status.
///
/// It is NOT an SEO engine and it does NOT reimplement the MrShopPlus workflow:
/// writes go through the existing MrshopplusClient, and acceptance goes through
/// the existing FrontendVerifier (extended by V44FrontendAuditor).
///
/// The decision layer is SEO-PDP V4.4 CLEAN_CONSOLIDATED only. SEO/PDP 3.2 rule
/// classes (SeoPdpComposer / SeoPdpValidator) are deliberately not referenced.
/// </summary>
public sealed class BridgeServer
{
    private readonly DripOpsConfig _config;
    private readonly V44Standard _standard;
    private readonly RunStore _store;
    private readonly PlanStore _plans;
    private readonly string _token;
    private readonly string _executionMode;

    public BridgeServer(
        DripOpsConfig config,
        V44Standard standard,
        RunStore store,
        PlanStore plans,
        string token,
        string executionMode)
    {
        _config = config;
        _standard = standard;
        _store = store;
        _plans = plans;
        _token = token;
        _executionMode = executionMode;
    }

    public async Task RunAsync(string host, int port, CancellationToken cancellationToken)
    {
        using var listener = new HttpListener();
        var prefix = $"http://{host}:{port}/";
        listener.Prefixes.Add(prefix);
        listener.Start();

        Console.WriteLine(JsonSerializer.Serialize(new
        {
            ok = true,
            service = "dripops-local-bridge",
            endpoint = prefix,
            standard_version = _standard.Version,
            standard_hash = _standard.DocumentHash,
            standard_file = _standard.DocumentFile,
            execution_mode = _executionMode,
            plan_directory = _plans.Directory_,
            state_directory = _config.StateDirectory,
            routes = new[]
            {
                "POST /api/chatgpt-mcp/products/search",
                "POST /api/chatgpt-mcp/products/read",
                "POST /api/chatgpt-mcp/products/prepare-v44",
                "POST /api/chatgpt-mcp/products/execute-v44",
                "POST /api/chatgpt-mcp/products/verify-v44",
                "GET  /api/chatgpt-mcp/runs/status",
                "GET  /health",
            }
        }, BridgeJson.Options));

        while (!cancellationToken.IsCancellationRequested)
        {
            HttpListenerContext context;
            try
            {
                context = await listener.GetContextAsync().WaitAsync(cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            _ = Task.Run(() => HandleAsync(context), CancellationToken.None);
        }

        listener.Stop();
    }

    // ------------------------------------------------------------------ routing

    private async Task HandleAsync(HttpListenerContext context)
    {
        var path = context.Request.Url?.AbsolutePath.TrimEnd('/') ?? "";
        try
        {
            if (path is "/health" or "")
            {
                await WriteJsonAsync(context, 200, new
                {
                    ok = true,
                    standard_version = _standard.Version,
                    standard_status = _standard.Status,
                    standard_hash = _standard.DocumentHash,
                    standard_file = _standard.DocumentFile,
                    execution_mode = _executionMode,
                    snapshot_max_age_hours = _config.SnapshotMaxAgeHours,
                    require_complete_snapshot = _config.RequireCompleteSnapshot,
                });
                return;
            }

            if (!IsAuthorized(context.Request))
            {
                await WriteJsonAsync(context, 401, Error("unauthorized", "Missing or invalid bearer token."));
                return;
            }

            switch (path)
            {
                case "/api/chatgpt-mcp/products/search":
                {
                    var request = await ReadBodyAsync<ProductSearchRequest>(context);
                    if (request is null) return;
                    if (!CheckStandard(context, request.StandardHash, request.StandardVersion)) return;
                    if (!await WriteJsonAsync(context, 200, SearchProducts(request))) return;
                    return;
                }

                case "/api/chatgpt-mcp/products/read":
                {
                    var request = await ReadBodyAsync<ProductReadRequest>(context);
                    if (request is null) return;
                    if (!CheckStandard(context, request.StandardHash, request.StandardVersion)) return;
                    await HandleReadAsync(context, request);
                    return;
                }

                case "/api/chatgpt-mcp/products/prepare-v44":
                {
                    var request = await ReadBodyAsync<ProductPrepareRequest>(context);
                    if (request is null) return;
                    if (!CheckStandard(context, request.StandardHash, request.StandardVersion)) return;
                    await HandlePrepareAsync(context, request);
                    return;
                }

                case "/api/chatgpt-mcp/products/execute-v44":
                {
                    var request = await ReadBodyAsync<ProductExecuteRequest>(context);
                    if (request is null) return;
                    if (!CheckStandard(context, request.StandardHash, request.StandardVersion)) return;
                    await HandleExecuteAsync(context, request);
                    return;
                }

                case "/api/chatgpt-mcp/products/verify-v44":
                {
                    var request = await ReadBodyAsync<ProductVerifyRequest>(context);
                    if (request is null) return;
                    if (!CheckStandard(context, request.StandardHash, request.StandardVersion)) return;
                    await HandleVerifyAsync(context, request);
                    return;
                }

                case "/api/chatgpt-mcp/runs/status":
                {
                    RunStatusRequest request;
                    if (string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
                    {
                        request = new RunStatusRequest
                        {
                            RunId = context.Request.QueryString["run_id"] ?? "",
                            StandardHash = context.Request.QueryString["standard_hash"],
                            StandardVersion = context.Request.QueryString["standard_version"],
                        };
                    }
                    else
                    {
                    var parsed = await ReadBodyAsync<RunStatusRequest>(context);
                    if (parsed is null) return;
                        request = parsed;
                    }
                    if (!CheckStandard(context, request.StandardHash, request.StandardVersion)) return;
                    await HandleRunStatusAsync(context, request);
                    return;
                }

                default:
                    await WriteJsonAsync(context, 404, Error("unknown_route", path));
                    return;
            }
        }
        catch (Exception exception)
        {
            await WriteJsonAsync(context, 500, Error("bridge_error", exception.Message));
        }
    }

    // ------------------------------------------------------------ search / read

    private ProductSearchResponse SearchProducts(ProductSearchRequest request)
    {
        var query = request.Query.Trim();
        var hits = new List<ProductSearchHit>();
        var scanned = 0;

        foreach (var (runId, job) in EnumerateProductJobs())
        {
            scanned++;
            var name = job.Snapshot?.ExistingName ?? "";
            var matches = query.Length == 0
                || job.ProductId.Contains(query, StringComparison.OrdinalIgnoreCase)
                || name.Contains(query, StringComparison.OrdinalIgnoreCase);
            if (!matches) continue;

            var isPublished = job.Snapshot?.IsPublished ?? false;
            if (string.Equals(request.Status, "published", StringComparison.OrdinalIgnoreCase) && !isPublished) continue;
            if (string.Equals(request.Status, "unpublished", StringComparison.OrdinalIgnoreCase) && isPublished) continue;

            hits.Add(new ProductSearchHit
            {
                ProductId = job.ProductId,
                Name = name,
                AdminUrl = job.AdminUrl,
                RunId = runId,
                IsPublished = isPublished,
                Stage = job.Stage.ToString(),
                AuditStatus = job.InputAuditStatus.ToString(),
                ReleaseStatus = job.ReleaseStatus.ToString(),
                UpdatedAt = job.UpdatedAt.ToString("O"),
                ImageCount = job.Snapshot?.ImageUrls.Count ?? 0,
            });
        }

        return new ProductSearchResponse
        {
            Products = hits
                .OrderByDescending(hit => hit.UpdatedAt, StringComparer.Ordinal)
                .Take(Math.Clamp(request.Limit, 1, 100))
                .ToList(),
            TotalScanned = scanned,
        };
    }

    private async Task HandleReadAsync(HttpListenerContext context, ProductReadRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
        {
            await WriteJsonAsync(context, 400, Error("invalid_request", "product_id is required."));
            return;
        }

        var located = FindProduct(request.ProductId);

        // A live request always refreshes, even when a local checkpoint exists.
        if (request.Live)
        {
            var live = await ReadLiveSnapshotAsync(request.ProductId);
            if (live is null)
            {
                await WriteJsonAsync(context, 502, Error("live_read_failed",
                    $"live=true was requested for {request.ProductId} but the backend read did not return a snapshot. " +
                    "Refusing to fall back to a possibly stale local checkpoint. " +
                    $"Cause: {_lastLiveReadError ?? "unknown"}"));
                return;
            }
            located = live;
        }

        if (located is null)
        {
            await WriteJsonAsync(context, 404, Error("product_not_indexed",
                $"No local checkpoint for {request.ProductId}. Run `DripOps snapshot` for its run first, or retry with live=true."));
            return;
        }

        await WriteJsonAsync(context, 200, BuildReadPayload(located.Value));
    }

    private object BuildReadPayload((string RunId, ProductJob Job, ProductSnapshot Snapshot) located)
    {
        var (runId, job, snapshot) = located;
        return new
        {
            product_id = job.ProductId,
            run_id = runId,
            admin_url = job.AdminUrl,
            name = snapshot.ExistingName,
            subtitle = snapshot.ExistingSubtitle,
            is_published = snapshot.IsPublished,
            stage = job.Stage.ToString(),
            audit_status = job.InputAuditStatus.ToString(),
            release_status = job.ReleaseStatus.ToString(),
            failure_codes = job.FailureCodes,
            captured_at = snapshot.CapturedAt.ToString("O"),
            snapshot_hash = PlanStore.ComputeSnapshotHash(snapshot),
            // `images` mirrors snapshot.imageUrls so the MCP image loader can pick them up.
            images = snapshot.ImageUrls,
            snapshot,
            // Agent Contract V2.0 §4. Always computed, so the caller can see which
            // fields the snapshot does and does not carry before attempting a plan.
            snapshot_completeness = V44SnapshotCompleteness.Evaluate(snapshot),
            current_seo = new
            {
                seo_title = snapshot.ExistingSeoTitle,
                keywords = snapshot.ExistingSeoKeywords,
                meta_description = snapshot.ExistingMetaDescription,
                slug = snapshot.ExistingSlug,
            },
            facts = job.Facts,
            local_evidence = job.Facts?.Evidence ?? [],
            sku_status = "UNRESOLVED",
            v44_required = true,
            research_instruction =
                "Resolve the exact entity and SKU evidence externally. Never use the MrShopPlus Product ID, supplier code, listing ID, URL suffix or image filename as a public SKU.",
        };
    }

    // ------------------------------------------------------------- prepare-v44

    private async Task HandlePrepareAsync(HttpListenerContext context, ProductPrepareRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
        {
            await WriteJsonAsync(context, 400, Error("invalid_request", "product_id is required."));
            return;
        }

        // Defense in depth: the MCP plugin already gates, the bridge gates again.
        var gateErrors = V44SkuGate.Validate(request.SkuResolution);
        if (gateErrors.Count > 0)
        {
            await WriteJsonAsync(context, 400, new BridgeError
            {
                Ok = false,
                Error = "sku_gate_failed",
                Detail = "No plan was created.",
                GateErrors = gateErrors,
            });
            return;
        }

        if (request.SkuResolution.IsHold)
        {
            await WriteJsonAsync(context, 409, new BridgeError
            {
                Ok = false,
                Error = "hold_forbids_plan",
                Detail = "Exact entity / SKU verdict is HOLD. V4.4 §4 forbids preparing a publish-ready PDP.",
            });
            return;
        }

        var located = FindProduct(request.ProductId);

        // P0-2: an explicit live request must actually refresh, even when a local
        // checkpoint exists. Silently falling back to a stale checkpoint would make
        // the freshness guarantee meaningless.
        if (request.Live)
        {
            var live = await ReadLiveSnapshotAsync(request.ProductId);
            if (live is null)
            {
                await WriteJsonAsync(context, 502, Error("live_read_failed",
                    $"live=true was requested for {request.ProductId} but the backend read did not return a snapshot. " +
                    "No plan was created. Refusing to fall back to a possibly stale local checkpoint. " +
                    $"Cause: {_lastLiveReadError ?? "unknown"}"));
                return;
            }
            located = live;
        }

        if (located is null)
        {
            await WriteJsonAsync(context, 404, Error("product_not_indexed",
                $"No local checkpoint for {request.ProductId}. Run `DripOps snapshot` for its run first, or retry with live=true."));
            return;
        }

        var (runId, job, snapshot) = located.Value;

        // P0-2: snapshot freshness. snapshot_hash proves the plan matches the stored
        // snapshot; it does not prove the stored snapshot matches reality. A product
        // that already has a storefront URL must be planned from a recent snapshot.
        var snapshotAgeHours = (DateTimeOffset.Now - snapshot.CapturedAt).TotalHours;
        var hasStorefrontUrl = !string.IsNullOrWhiteSpace(snapshot.ExistingSlug);
        if (hasStorefrontUrl && snapshotAgeHours > _config.SnapshotMaxAgeHours)
        {
            await WriteJsonAsync(context, 409, new BridgeError
            {
                Ok = false,
                Error = "stale_snapshot_requires_refresh",
                Detail =
                    $"The local snapshot for {request.ProductId} was captured {snapshotAgeHours:F1} hours ago " +
                    $"({snapshot.CapturedAt:O}) and the product already has a storefront URL. " +
                    $"Maximum age is {_config.SnapshotMaxAgeHours} hours. No plan was created. " +
                    "Re-run with live=true to read a fresh snapshot from the backend.",
            });
            return;
        }

        // Agent Contract V2.0 §4: a snapshot missing one of the four STOP-condition
        // fields cannot support the identity decision at all, so no plan may be
        // built from it. The report is always attached to the response; whether it
        // halts the run is controlled by requireCompleteSnapshot, because the
        // variants reader does not exist yet and enforcing it unconditionally would
        // block every product rather than the incomplete ones.
        var completeness = V44SnapshotCompleteness.Evaluate(snapshot);
        if (_config.RequireCompleteSnapshot && !completeness.Complete)
        {
            var brokenSources = completeness.Fields
                .Where(f => f.StopCondition is not null && completeness.MissingStopConditions.Contains(f.StopCondition))
                .Select(f => $"{f.Field}={f.Source}");
            await WriteJsonAsync(context, 409, new BridgeError
            {
                Ok = false,
                Error = "snapshot_incomplete",
                Detail =
                    $"The snapshot for {request.ProductId} fails {completeness.MissingStopConditions.Count} of the four " +
                    $"fields Agent Contract V2.0 §4 treats as a stop condition: " +
                    $"{string.Join(", ", completeness.MissingStopConditions)}. " +
                    $"No plan was created. The snapshot is not a sufficient basis for an identity decision. " +
                    $"Sources: {string.Join("; ", brokenSources)}.",
            });
            return;
        }

        var snapshotHash = PlanStore.ComputeSnapshotHash(snapshot);

        var composer = new V44Composer(_standard);
        var facts = request.V44Facts ?? new V44Facts();
        var draft = composer.Compose(request.SkuResolution.ExactEntity, facts, request.SkuResolution.Sku, snapshot);

        var validator = new V44Validator(_standard);
        // The existing slug is passed so the URL layer can tell a bad proposed slug
        // apart from a legacy slug the plan deliberately leaves in place.
        var validation = validator.Validate(draft, request.SkuResolution, snapshot.ExistingSlug);

        // P0-1 visibility: a URL change on an existing product is never silent.
        var extraChecks = new List<V44Check>();
        if (hasStorefrontUrl && draft.UrlChangeRequired)
        {
            extraChecks.Add(new V44Check
            {
                Code = "URL-10",
                Severity = "WARN",
                Message =
                    $"This product already has a storefront URL ('{snapshot.ExistingSlug}'). The plan changes it to " +
                    $"'{draft.Slug}'. A direct 301 from the old URL to the new one must be configured at site level, " +
                    $"and redirectFrom is recorded as '{draft.RedirectFrom}'.",
            });
        }
        if (!snapshot.IsPublished && hasStorefrontUrl)
        {
            extraChecks.Add(new V44Check
            {
                Code = "URL-11",
                Severity = "WARN",
                Message =
                    "snapshot.IsPublished is false while the product already has a slug. That flag may be stale " +
                    "(the storefront URL can still resolve). URL stability no longer depends on it, but the " +
                    "published state should not be trusted for this product until read live.",
            });
        }
        if (extraChecks.Count > 0)
        {
            validation = validation with { Checks = [.. validation.Checks, .. extraChecks] };
        }
        if (!validation.IsPass)
        {
            // A failing dry run must not leave a plan behind.
            await WriteJsonAsync(context, 409, new BridgeError
            {
                Ok = false,
                Error = "v44_validation_failed",
                Detail = "Dry run failed. No plan was created and nothing was written.",
                Checks = validation.Checks,
            });
            return;
        }

        var planId = PlanStore.NewPlanId();
        var plan = new V44Plan
        {
            PlanId = planId,
            ProductId = request.ProductId,
            RunId = runId,
            AdminUrl = job.AdminUrl,
            CreatedAt = DateTimeOffset.UtcNow.ToString("O"),
            Operation = string.IsNullOrWhiteSpace(request.Operation) ? "auto" : request.Operation,
            StandardVersion = _standard.Version,
            StandardHash = _standard.DocumentHash,
            StandardFile = _standard.DocumentFile,
            SnapshotHash = snapshotHash,
            SkuVerdict = request.SkuResolution.Verdict.Trim().ToUpperInvariant(),
            Sku = request.SkuResolution.Sku?.Trim(),
            SkuResolution = request.SkuResolution,
            Draft = draft,
            ProposedChanges = new Dictionary<string, string>
            {
                ["product_name"] = draft.ProductName,
                ["h1"] = draft.H1,
                ["seo_title"] = draft.SeoTitle,
                ["seo_keywords"] = string.Join(", ", draft.Keywords),
                ["meta_description"] = draft.MetaDescription,
                ["slug"] = draft.Slug,
                ["canonical_url"] = draft.CanonicalUrl,
                ["url_change_required"] = draft.UrlChangeRequired ? "true" : "false",
                ["key_description"] = draft.KeyDescriptionHtml,
                ["description"] = draft.DescriptionHtml,
                ["schema"] = draft.SchemaJson,
            },
            ValidationStatus = validation.Status,
            Checks = validation.Checks,
        };

        _plans.Save(plan);
        // Auditing goes to the bridge's own log. prepare must leave the shop run
        // state byte-identical, which is asserted by the acceptance tests.
        AppendBridgeEvent("V44_PLAN_CREATED", new
        {
            planId,
            runId,
            productId = plan.ProductId,
            standardVersion = plan.StandardVersion,
            standardHash = plan.StandardHash,
            snapshotHash,
            skuVerdict = plan.SkuVerdict,
            sku = plan.Sku,
            validation = plan.ValidationStatus,
            written = false,
        });

        await WriteJsonAsync(context, 200, plan);
    }

    // ------------------------------------------------------------- execute-v44

    private async Task HandleExecuteAsync(HttpListenerContext context, ProductExecuteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId) || string.IsNullOrWhiteSpace(request.PlanId))
        {
            await WriteJsonAsync(context, 400, Error("invalid_request", "product_id and plan_id are required; no other field is accepted."));
            return;
        }

        if (!PlanStore.IsValidPlanId(request.PlanId))
        {
            await WriteJsonAsync(context, 400, Error("invalid_plan_id", $"Malformed plan_id: {request.PlanId}"));
            return;
        }

        var plan = _plans.TryLoad(request.PlanId);
        if (plan is null)
        {
            await WriteJsonAsync(context, 404, Error("unknown_plan", $"No plan named {request.PlanId}."));
            return;
        }

        if (!string.Equals(plan.ProductId, request.ProductId, StringComparison.Ordinal))
        {
            await WriteJsonAsync(context, 409, Error("plan_product_mismatch",
                $"plan_id belongs to {plan.ProductId}, not {request.ProductId}."));
            return;
        }

        if (plan.Executed)
        {
            await WriteJsonAsync(context, 409, Error("plan_already_executed", $"Plan was executed at {plan.ExecutedAt}."));
            return;
        }

        if (!string.Equals(plan.ValidationStatus, "PASS", StringComparison.Ordinal))
        {
            await WriteJsonAsync(context, 409, Error("plan_not_validated", $"Plan validation status is {plan.ValidationStatus}."));
            return;
        }

        if (!string.Equals(plan.StandardHash, _standard.DocumentHash, StringComparison.Ordinal))
        {
            await WriteJsonAsync(context, 409, Error("standard_hash_changed",
                $"Plan was built against {plan.StandardHash} but the active standard is {_standard.DocumentHash}."));
            return;
        }

        var located = FindProduct(request.ProductId);
        if (located is null)
        {
            await WriteJsonAsync(context, 409, Error("snapshot_missing",
                $"No local checkpoint for {request.ProductId}; cannot confirm the snapshot is unchanged."));
            return;
        }

        var currentSnapshotHash = PlanStore.ComputeSnapshotHash(located.Value.Snapshot);
        if (!string.Equals(currentSnapshotHash, plan.SnapshotHash, StringComparison.Ordinal))
        {
            await WriteJsonAsync(context, 409, Error("stale_plan",
                $"Product snapshot changed since the plan was created (plan {plan.SnapshotHash}, current {currentSnapshotHash}). Re-run prepare."));
            return;
        }

        var seoDraft = ToSeoDraft(plan.Draft);
        V44ExecutionResult execution;

        if (string.Equals(_executionMode, "simulate", StringComparison.OrdinalIgnoreCase))
        {
            execution = new V44ExecutionResult
            {
                RunId = located.Value.RunId,
                Published = false,
                SaveStatus = "SIMULATED — MrShopPlus was NOT contacted",
                ReadbackStatus = "SIMULATED",
                FrontendStatus = "SIMULATED",
                ReadbackChecks = [],
                FrontendChecks =
                [
                    new V44Check
                    {
                        Code = "SIM-01",
                        Severity = "WARN",
                        Message = "Bridge is running in simulate mode; no write, read-back or storefront check was performed.",
                    }
                ],
            };
        }
        else
        {
            execution = await ExecuteLiveAsync(plan, seoDraft, located.Value.RunId);
        }

        var updated = _plans.MarkExecuted(plan.PlanId, execution);

        AppendBridgeEvent("V44_PLAN_EXECUTED", new
        {
            planId = plan.PlanId,
            runId = located.Value.RunId,
            productId = plan.ProductId,
            mode = _executionMode,
            saveStatus = execution.SaveStatus,
            readbackStatus = execution.ReadbackStatus,
            frontendStatus = execution.FrontendStatus,
        });

        // Only a real write may mutate the shop run state. A simulated execution
        // must leave the run tree byte-identical.
        if (!string.Equals(_executionMode, "simulate", StringComparison.OrdinalIgnoreCase))
        {
            _store.AppendEvent(located.Value.RunId, "V44_PLAN_EXECUTED", new
            {
                planId = plan.PlanId,
                productId = plan.ProductId,
                saveStatus = execution.SaveStatus,
                readbackStatus = execution.ReadbackStatus,
                frontendStatus = execution.FrontendStatus,
            });

            if (execution.ReadbackStatus == "PASS" && execution.FrontendStatus == "PASS")
            {
                var current = _store.TryLoadProduct(located.Value.RunId, plan.ProductId);
                if (current is not null)
                {
                    _store.SaveProduct(located.Value.RunId, current with
                    {
                        Stage = WorkflowStage.FrontendVerified,
                        ReleaseStatus = ReleaseStatus.Verified,
                        InputAuditStatus = AuditStatus.Pass,
                        Draft = seoDraft,
                    });
                }
            }
        }

        await WriteJsonAsync(context, 200, updated);
    }

    private async Task<V44ExecutionResult> ExecuteLiveAsync(V44Plan plan, SeoDraft draft, string runId)
    {
        var cancellationToken = CancellationToken.None;

        await using var chrome = new ChromeController(_config);
        var page = await chrome.OpenPageAsync(plan.AdminUrl, cancellationToken);
        var client = new MrshopplusClient(_config, page);

        // Publish is requested only when the plan actually changes the URL.
        //
        // A plan that leaves the URL alone is a Phase 8.1 SEO-field correction:
        // touching the publish toggle in the same pass would turn a content fix
        // into a visibility change as a side effect, and the review gate would
        // have approved a scope that did not include it. A URL migration, which
        // is the Phase 8.2 operation, is the only case that publishes.
        var shouldPublish = draft.UrlChangeRequired;
        await client.WriteAndSaveAsync(draft, publish: shouldPublish, cancellationToken);

        // Backend read-back through the existing path.
        var readbackChecks = new List<V44Check>();
        var readbackStatus = "PASS";
        try
        {
            var readback = await client.ReadSeoAsync(cancellationToken);
            void Compare(string field, string expected, string actual)
            {
                if (!string.Equals(expected.Trim(), actual.Trim(), StringComparison.Ordinal))
                {
                    readbackChecks.Add(new V44Check
                    {
                        Code = $"READBACK-{field.ToUpperInvariant()}",
                        Severity = "ERROR",
                        Message = $"{field} mismatch after save. expected='{expected}' actual='{actual}'",
                    });
                }
            }

            Compare("seo_title", draft.SeoTitle, readback.SeoTitle);
            Compare("meta_description", draft.MetaDescription, readback.MetaDescription);
            Compare("slug", draft.Slug, readback.Slug);
            if (readback.Keywords.Count != draft.Keywords.Count
                || readback.Keywords.Where((value, index) => !string.Equals(value, draft.Keywords[index], StringComparison.Ordinal)).Any())
            {
                readbackChecks.Add(new V44Check
                {
                    Code = "READBACK-KEYWORDS",
                    Severity = "ERROR",
                    Message = $"keywords mismatch after save. expected='{string.Join("|", draft.Keywords)}' actual='{string.Join("|", readback.Keywords)}'",
                });
            }
            if (readbackChecks.Count > 0) readbackStatus = "FAIL";
        }
        catch (Exception exception)
        {
            readbackStatus = "ERROR";
            readbackChecks.Add(new V44Check { Code = "READBACK-EXCEPTION", Severity = "ERROR", Message = exception.Message });
        }

        // Storefront acceptance: existing verifier plus V4.4 placement audit.
        var frontendChecks = new List<V44Check>();
        var frontendStatus = "PASS";
        try
        {
            var baseResult = await new FrontendVerifier().VerifyAsync(draft, cancellationToken);
            frontendChecks.AddRange(baseResult.Issues.Select(issue => new V44Check
            {
                Code = issue.Code,
                Severity = string.Equals(issue.Severity, "error", StringComparison.OrdinalIgnoreCase) ? "ERROR" : "WARN",
                Message = issue.Message,
            }));

            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(120) };
            var html = await http.GetStringAsync(draft.CanonicalUrl!, cancellationToken);
            frontendChecks.AddRange(new V44FrontendAuditor(_standard).Audit(html, plan.Draft));

            if (frontendChecks.Any(check => check.Severity == "ERROR")) frontendStatus = "FAIL";
        }
        catch (Exception exception)
        {
            frontendStatus = "ERROR";
            frontendChecks.Add(new V44Check { Code = "FRONTEND-EXCEPTION", Severity = "ERROR", Message = exception.Message });
        }

        return new V44ExecutionResult
        {
            RunId = runId,
            Published = true,
            SaveStatus = "SAVED_AND_PUBLISHED",
            ReadbackStatus = readbackStatus,
            FrontendStatus = frontendStatus,
            ReadbackChecks = readbackChecks,
            FrontendChecks = frontendChecks,
        };
    }

    // -------------------------------------------------------------- verify-v44

    private async Task HandleVerifyAsync(HttpListenerContext context, ProductVerifyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
        {
            await WriteJsonAsync(context, 400, Error("invalid_request", "product_id is required."));
            return;
        }

        var plan = string.IsNullOrWhiteSpace(request.PlanId) ? null : _plans.TryLoad(request.PlanId);
        if (plan is null || !string.Equals(plan.ProductId, request.ProductId, StringComparison.Ordinal))
        {
            await WriteJsonAsync(context, 409, Error("plan_required",
                "verify-v44 needs the plan_id that produced the write, so the V4.4 draft can be compared against the storefront."));
            return;
        }

        var draft = ToSeoDraft(plan.Draft);
        var checks = new List<V44Check>();

        var baseResult = await new FrontendVerifier().VerifyAsync(draft, CancellationToken.None);
        checks.AddRange(baseResult.Issues.Select(issue => new V44Check
        {
            Code = issue.Code,
            Severity = string.Equals(issue.Severity, "error", StringComparison.OrdinalIgnoreCase) ? "ERROR" : "WARN",
            Message = issue.Message,
        }));

        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(120) };
            var html = await http.GetStringAsync(draft.CanonicalUrl!, CancellationToken.None);
            checks.AddRange(new V44FrontendAuditor(_standard).Audit(html, plan.Draft));
        }
        catch (Exception exception)
        {
            checks.Add(new V44Check { Code = "FRONTEND-EXCEPTION", Severity = "ERROR", Message = exception.Message });
        }

        if (plan.Executed)
        {
            checks.Add(new V44Check
            {
                Code = "EXEC-01",
                Severity = "WARN",
                Message = $"Plan executed at {plan.ExecutedAt} with save status {plan.Execution?.SaveStatus}. " +
                          "Bridge verify covers storefront acceptance only; backend read-back is recorded on the plan.",
            });
        }

        _plans.AttachVerification(plan.PlanId, checks);

        await WriteJsonAsync(context, 200, new
        {
            product_id = request.ProductId,
            plan_id = plan.PlanId,
            standard_version = _standard.Version,
            standard_hash = _standard.DocumentHash,
            pass = !checks.Any(check => check.Severity == "ERROR"),
            checks,
            execution = plan.Execution,
        });
    }

    // -------------------------------------------------------------- run status

    private async Task HandleRunStatusAsync(HttpListenerContext context, RunStatusRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RunId))
        {
            var runs = new List<object>();
            foreach (var directory in Directory.EnumerateDirectories(_config.StateDirectory))
            {
                var runFile = Path.Combine(directory, "run.json");
                if (!File.Exists(runFile)) continue;
                try
                {
                    var state = JsonSerializer.Deserialize<RunState>(File.ReadAllText(runFile), JsonOptions.Default);
                    if (state is null) continue;
                    runs.Add(new { run_id = state.RunId, standard_version = state.StandardVersion, updated_at = state.UpdatedAt.ToString("O") });
                }
                catch (JsonException)
                {
                    // ignore unreadable run files
                }
            }
            await WriteJsonAsync(context, 200, new { runs });
            return;
        }

        var run = _store.LoadRun(request.RunId);
        var jobs = _store.LoadProducts(run.RunId);

        var products = jobs
            .Select(job => new RunStatusProduct
            {
                ProductId = job.ProductId,
                Stage = job.Stage.ToString(),
                AuditStatus = job.InputAuditStatus.ToString(),
                ReleaseStatus = job.ReleaseStatus.ToString(),
                FailureCodes = job.FailureCodes,
                UpdatedAt = job.UpdatedAt.ToString("O"),
            })
            .ToList();

        var response = new RunStatusResponse
        {
            RunId = run.RunId,
            Status = jobs.Count == 0
                ? "EMPTY"
                : products.Any(product => product.Stage == WorkflowStage.Failed.ToString()) ? "HAS_FAILURES" : "IN_PROGRESS",
            StandardVersion = run.StandardVersion,
            CreatedAt = run.CreatedAt.ToString("O"),
            UpdatedAt = run.UpdatedAt.ToString("O"),
            Total = products.Count,
            Published = products.Count(product => product.ReleaseStatus is nameof(ReleaseStatus.Published) or nameof(ReleaseStatus.Verified)),
            Pass = products.Count(product => product.AuditStatus == nameof(AuditStatus.Pass)),
            Hold = products.Count(product => product.AuditStatus == nameof(AuditStatus.Hold)),
            Failed = products.Count(product => product.Stage == WorkflowStage.Failed.ToString()),
            Pending = products.Count(product => product.AuditStatus is nameof(AuditStatus.Verify) or nameof(AuditStatus.Fix)),
            Products = products,
        };

        await WriteJsonAsync(context, 200, response);
    }

    // ----------------------------------------------------------------- helpers

    private IEnumerable<(string RunId, ProductJob Job)> EnumerateProductJobs()
    {
        if (!Directory.Exists(_config.StateDirectory)) yield break;

        foreach (var runDirectory in Directory.EnumerateDirectories(_config.StateDirectory))
        {
            var products = Path.Combine(runDirectory, "products");
            if (!Directory.Exists(products)) continue;
            var runId = Path.GetFileName(runDirectory);

            foreach (var file in Directory.EnumerateFiles(products, "*.json"))
            {
                ProductJob? job = null;
                try
                {
                    job = JsonSerializer.Deserialize<ProductJob>(File.ReadAllText(file), JsonOptions.Default);
                }
                catch (JsonException)
                {
                    // ignore unreadable checkpoints
                }
                if (job is not null) yield return (runId, job);
            }
        }
    }

    private (string RunId, ProductJob Job, ProductSnapshot Snapshot)? FindProduct(string productId)
    {
        (string RunId, ProductJob Job, ProductSnapshot Snapshot)? best = null;
        foreach (var (runId, job) in EnumerateProductJobs())
        {
            if (!string.Equals(job.ProductId, productId, StringComparison.Ordinal)) continue;
            if (job.Snapshot is null) continue;
            if (best is null || job.UpdatedAt > best.Value.Job.UpdatedAt)
            {
                best = (runId, job, job.Snapshot);
            }
        }
        return best;
    }

    /// <summary>
    /// The reason the most recent live read failed, when it failed. Bridge
    /// diagnostics go to stderr, which the caller never sees; an operator
    /// debugging an expired admin session needs the cause in the response, not a
    /// generic "did not return a snapshot".
    /// </summary>
    private string? _lastLiveReadError;

    private async Task<(string RunId, ProductJob Job, ProductSnapshot Snapshot)?> ReadLiveSnapshotAsync(string productId)
    {
        _lastLiveReadError = null;
        try
        {
            var adminUrl = $"{_config.AdminOrigin.TrimEnd('/')}/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B{productId}%5D";

            await using var chrome = new ChromeController(_config);
            var page = await chrome.OpenPageAsync(adminUrl, CancellationToken.None);
            var client = new MrshopplusClient(_config, page);
            var snapshot = await client.ReadProductAsync(productId, adminUrl, CancellationToken.None);

            // The snapshot is the rollback baseline for a write. A baseline that is
            // missing the four SEO fields cannot be used to restore them, and
            // because PlanStore.ComputeSnapshotHash covers those fields an always-empty
            // value also weakens tamper detection. Read them in the same session and
            // fail the whole live read rather than hand back a baseline with a silent
            // hole in it.
            ProductSeoReadback seo;
            try
            {
                seo = await client.ReadSeoAsync(CancellationToken.None);
            }
            catch (Exception exception)
            {
                throw new InvalidOperationException(
                    $"Live snapshot for {productId} did not capture the SEO fields, so it is not a complete " +
                    $"rollback baseline. Refusing to return a partial snapshot. " +
                    $"SEO dialog read failed: {exception.Message}",
                    exception);
            }

            snapshot = snapshot with
            {
                ExistingSeoTitle = seo.SeoTitle,
                ExistingSeoKeywords = seo.Keywords,
                ExistingMetaDescription = seo.MetaDescription,
            };

            var job = new ProductJob { ProductId = productId, AdminUrl = adminUrl, Snapshot = snapshot };
            return ("live", job, snapshot);
        }
        catch (Exception exception)
        {
            _lastLiveReadError = exception.Message;
            Console.Error.WriteLine($"Live read failed for {productId}: {exception.Message}");
            return null;
        }
    }

    public static SeoDraft ToSeoDraft(V44Draft draft) => new()
    {
        ProductName = draft.ProductName,
        SeoTitle = draft.SeoTitle,
        Keywords = draft.Keywords,
        MetaDescription = draft.MetaDescription,
        Slug = draft.Slug,
        CanonicalUrl = draft.CanonicalUrl,
        UrlChangeRequired = draft.UrlChangeRequired,
        RedirectFrom = draft.RedirectFrom,
        // The backend description editor receives the V4.4 placement block first,
        // then the image-only gallery (V4.4 §11 / §16).
        PdpHtml = draft.KeyDescriptionHtml + draft.DescriptionHtml,
        RelatedProducts = [],
    };

    private bool CheckStandard(HttpListenerContext context, string? hash, string? version)
    {
        // Absent standard identity is tolerated only for /health-style probes;
        // every real route refuses a mismatched hash outright.
        if (!string.IsNullOrWhiteSpace(version) && !string.Equals(version, _standard.Version, StringComparison.Ordinal))
        {
            WriteJsonAsync(context, 409, Error("standard_version_mismatch",
                $"Bridge active standard is {_standard.Version}, request declared {version}.")).GetAwaiter().GetResult();
            return false;
        }
        if (!string.IsNullOrWhiteSpace(hash) && !string.Equals(hash, _standard.DocumentHash, StringComparison.OrdinalIgnoreCase))
        {
            WriteJsonAsync(context, 409, Error("standard_hash_mismatch",
                $"Bridge active standard hash is {_standard.DocumentHash}, request declared {hash}.")).GetAwaiter().GetResult();
            return false;
        }
        return true;
    }

    private bool IsAuthorized(HttpListenerRequest request)
    {
        var header = request.Headers["Authorization"] ?? "";
        const string prefix = "Bearer ";
        if (!header.StartsWith(prefix, StringComparison.Ordinal)) return false;
        var provided = header[prefix.Length..].Trim();
        if (provided.Length == 0) return false;

        var expectedBytes = Encoding.UTF8.GetBytes(_token);
        var providedBytes = Encoding.UTF8.GetBytes(provided);
        return expectedBytes.Length == providedBytes.Length
               && CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes);
    }

    private static async Task<T?> ReadBodyAsync<T>(HttpListenerContext context) where T : class
    {
        using var reader = new StreamReader(context.Request.InputStream, context.Request.ContentEncoding);
        var body = await reader.ReadToEndAsync();
        try
        {
            var parsed = JsonSerializer.Deserialize<T>(body, BridgeJson.Options);
            if (parsed is null)
            {
                await WriteJsonAsync(context, 400, Error("invalid_json", "Request body was empty."));
            }
            return parsed;
        }
        catch (JsonException exception)
        {
            await WriteJsonAsync(context, 400, Error("invalid_json", exception.Message));
            return null;
        }
    }

    private static async Task<bool> WriteJsonAsync(HttpListenerContext context, int status, object payload)
    {
        try
        {
            var bytes = JsonSerializer.SerializeToUtf8Bytes(payload, BridgeJson.Options);
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json; charset=utf-8";
            context.Response.ContentLength64 = bytes.Length;
            await context.Response.OutputStream.WriteAsync(bytes);
            return true;
        }
        catch (HttpListenerException)
        {
            return false;
        }
        catch (ObjectDisposedException)
        {
            return false;
        }
        finally
        {
            try { context.Response.Close(); } catch { /* response already closed */ }
        }
    }

    private void AppendBridgeEvent(string eventType, object payload)
    {
        try
        {
            Directory.CreateDirectory(_config.BridgeDirectory);
            var envelope = new
            {
                event_id = Guid.NewGuid().ToString("N"),
                event_type = eventType,
                timestamp = DateTimeOffset.UtcNow.ToString("O"),
                standard_version = _standard.Version,
                standard_hash = _standard.DocumentHash,
                execution_mode = _executionMode,
                payload,
            };
            File.AppendAllText(
                Path.Combine(_config.BridgeDirectory, "events.jsonl"),
                JsonSerializer.Serialize(envelope, BridgeJson.Options) + Environment.NewLine);
        }
        catch (IOException exception)
        {
            Console.Error.WriteLine($"Bridge audit write failed: {exception.Message}");
        }
    }

    private static BridgeError Error(string code, string detail) =>
        new() { Ok = false, Error = code, Detail = detail };
}

/// <summary>snake_case JSON, matching the MCP plugin's wire format.</summary>
public static class BridgeJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DictionaryKeyPolicy = null,
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never,
    };
}
