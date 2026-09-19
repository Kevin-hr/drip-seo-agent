using System.Text.Json;
using System.Text.RegularExpressions;
using DripOps.Configuration;
using DripOps.Domain;

namespace DripOps.Browser;

public sealed class MrshopplusClient
{
    private readonly DripOpsConfig _config;
    private readonly CdpClient _page;

    public MrshopplusClient(DripOpsConfig config, CdpClient page)
    {
        _config = config;
        _page = page;
    }

    public async Task<CategorySnapshot> ScanCategoryAsync(string categoryAdminUrl, CancellationToken cancellationToken,
        int? rowLimit = null)
    {
        if (rowLimit <= 0) throw new ArgumentOutOfRangeException(nameof(rowLimit), "Row limit must be positive.");
        await NavigateFreshAsync(categoryAdminUrl, cancellationToken);
        await EnsureAuthenticatedAsync(cancellationToken);
        await WaitForAuthenticatedFormAsync(
            "document.querySelector('main') && document.body.innerText.includes('类别中的商品')", cancellationToken);
        await LoadCategoryRowsAsync(rowLimit, cancellationToken);

        const string script = """
            (() => {
              const main = document.querySelector('main');
              const text = main?.innerText || '';
              const summary = (text.match(/类别中的商品\s*共\s*(\d+)个商品，已上架(\d+)个，未上架(\d+)个/) || []);
              const rows = [...(main?.querySelectorAll('table tbody tr') || [])]
                .map((tr, index) => {
                  const link = [...tr.querySelectorAll('a')].find(a => (a.getAttribute('href') || '').includes('/product/form_DTB_proProduct/'));
                  if (!link) return null;
                  const href = link.getAttribute('href') || '';
                  const idMatch = href.match(/%5B(\d+)%5D/i);
                  const rowText = (tr.innerText || '').replace(/\s+/g, ' ').trim();
                  return {
                    index: index + 1,
                    productId: idMatch ? idMatch[1] : '',
                    name: (link.textContent || '').trim(),
                    href,
                    isPublished: !rowText.includes('未上架') && /(已上架|上架)/.test(rowText)
                  };
                }).filter(Boolean);
              return {
                categoryName: (main?.querySelector('input[placeholder="请输入类别名称"]')?.value || '').trim(),
                total: summary[1] ? Number(summary[1]) : rows.length,
                published: summary[2] ? Number(summary[2]) : rows.filter(r => r.isPublished).length,
                unpublished: summary[3] ? Number(summary[3]) : rows.filter(r => !r.isPublished).length,
                rows
              };
            })()
            """;
        var value = await _page.EvaluateAsync(script, cancellationToken);
        var data = JsonSerializer.Deserialize<CategoryDomResult>(value.GetRawText(), JsonOptions.Default)
                   ?? throw new InvalidDataException("Could not deserialize category DOM result.");
        var products = data.Rows.Select(row => new CategoryProductRow
        {
            Index = row.Index,
            ProductId = row.ProductId,
            Name = row.Name,
            AdminUrl = ToAbsoluteAdminUrl(row.Href),
            IsPublished = row.IsPublished
        }).Take(rowLimit ?? int.MaxValue).ToList();
        if (rowLimit is null && products.Count != data.Total)
            throw new InvalidDataException($"Category summary reports {data.Total} products but {products.Count} product rows were extracted.");
        if (rowLimit is not null && products.Count != rowLimit.Value)
            throw new InvalidDataException($"Requested {rowLimit.Value} category rows but extracted {products.Count}.");

        return new CategorySnapshot
        {
            CategoryAdminUrl = categoryAdminUrl,
            CategoryName = data.CategoryName,
            Total = products.Count,
            Published = products.Count(product => product.IsPublished),
            Unpublished = products.Count(product => !product.IsPublished),
            Products = products
        };
    }

    public async Task<IReadOnlyList<CategoryLookupResult>> FindCategoriesAsync(string categoryName, CancellationToken cancellationToken)
    {
        var listUrl = _config.AdminOrigin.TrimEnd('/') + "/#/product/list_DTB_proCategory";
        await NavigateFreshAsync(listUrl, cancellationToken);
        await EnsureAuthenticatedAsync(cancellationToken);
        await WaitForAuthenticatedFormAsync(
            "document.querySelector('main input[placeholder=\"请输入要搜索的内容\"]')", cancellationToken);
        var searchValue = JsonSerializer.Serialize(categoryName, JsonOptions.Default);
        var searchScript = $$"""
            (() => {
              const main = document.querySelector('main');
              const input = main.querySelector('input[placeholder="请输入要搜索的内容"]');
              const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
              if (!input || !setter) throw new Error('category search input not found');
              setter.call(input, {{searchValue}});
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              const buttons = [...main.querySelectorAll('button')].filter(button => button.textContent?.trim() === '查询');
              if (buttons.length !== 1) throw new Error('expected one Query button, found ' + buttons.length);
              buttons[0].click();
              return true;
            })()
            """;
        await _page.EvaluateAsync(searchScript, cancellationToken);
        await _page.WaitForAsync($"[...document.querySelectorAll('main a')].some(a => (a.textContent || '').includes({searchValue}))",
            TimeSpan.FromSeconds(20), cancellationToken);
        const string readScript = """
            (() => [...document.querySelectorAll('main table tbody tr')].map(tr => {
              const admin = [...tr.querySelectorAll('a')].find(a => (a.getAttribute('href') || '').includes('/product/form_DTB_proCategory/'));
              if (!admin) return null;
              const publicLink = [...tr.querySelectorAll('a')].find(a => (a.getAttribute('href') || '').startsWith('//www.dripsneakers.org/'));
              return {
                name: (admin.textContent || '').trim(),
                adminHref: admin.getAttribute('href') || '',
                publicUrl: publicLink ? 'https:' + publicLink.getAttribute('href') : null
              };
            }).filter(Boolean))()
            """;
        var value = await _page.EvaluateAsync(readScript, cancellationToken);
        var rows = JsonSerializer.Deserialize<List<CategoryLookupDomResult>>(value.GetRawText(), JsonOptions.Default) ?? [];
        return rows.Select(row => new CategoryLookupResult
        {
            Name = row.Name,
            AdminUrl = ToAbsoluteAdminUrl(row.AdminHref),
            PublicUrl = row.PublicUrl
        }).ToList();
    }

    public async Task<ProductSnapshot> ReadProductAsync(string productId, string productAdminUrl, CancellationToken cancellationToken)
    {
        await NavigateFreshAsync(productAdminUrl, cancellationToken);
        await EnsureAuthenticatedAsync(cancellationToken);
        await WaitForAuthenticatedFormAsync(
            "document.querySelector('main input[placeholder=\"请输入商品名称\"]')?.value", cancellationToken);

        // The form becomes usable before the image-list component has finished
        // hydrating. Reading immediately can turn a real 12-16 image gallery
        // into an empty snapshot and incorrectly block a valid product.
        try
        {
            await _page.WaitForAsync("document.querySelectorAll('main img.imglist-img').length > 0",
                TimeSpan.FromSeconds(12), cancellationToken);
            await Task.Delay(350, cancellationToken);
        }
        catch (TimeoutException)
        {
            // A genuinely image-less product remains a valid audit finding; the
            // validator will emit IMAGE-01 MISSING_IMAGE for it later.
        }

        const string script = """
            (() => {
              const main = document.querySelector('main');
              const name = main?.querySelector('input[placeholder="请输入商品名称"]')?.value || '';
              const subtitle = main?.querySelector('input[placeholder="请输入商品副标题"]')?.value || '';
              const frames = [...(main?.querySelectorAll('iframe') || [])];
              let descriptionHtml = '';
              for (const frame of frames) {
                try {
                  const html = frame.contentDocument?.body?.innerHTML || '';
                  if (html.length > descriptionHtml.length) descriptionHtml = html;
                } catch (_) {}
              }
              const images = [...(main?.querySelectorAll('img.imglist-img') || [])]
                .map(img => (img.currentSrc || img.src || '').replace(/-100$/, ''))
                .filter(Boolean);
              const text = main?.innerText || '';
              const publishedLabel = [...(main?.querySelectorAll('*') || [])].find(el => el.childElementCount === 0 && el.textContent?.trim() === '商品上架');
              let isPublished = false;
              if (publishedLabel) {
                const box = publishedLabel.closest('.el-form-item') || publishedLabel.parentElement?.parentElement;
                isPublished = Boolean(box?.querySelector('input[type="checkbox"]:checked, [role="switch"][aria-checked="true"]'));
              }
              const slugMatch = text.match(/https:\/\/www\.dripsneakers\.org\/([^\s]+)/);
              return { name: name.trim(), subtitle: subtitle.trim(), descriptionHtml, images, isPublished, slug: slugMatch ? slugMatch[1].replace(/\/$/, '') : '' };
            })()
            """;
        var value = await _page.EvaluateAsync(script, cancellationToken);
        var data = JsonSerializer.Deserialize<ProductDomResult>(value.GetRawText(), JsonOptions.Default)
                   ?? throw new InvalidDataException("Could not deserialize product DOM result.");
        return new ProductSnapshot
        {
            ProductId = productId,
            AdminUrl = productAdminUrl,
            ExistingName = data.Name,
            ExistingSubtitle = data.Subtitle,
            ExistingDescriptionHtml = data.DescriptionHtml,
            ExistingSlug = data.Slug,
            IsPublished = data.IsPublished,
            ImageUrls = data.Images
        };
    }

    public async Task<ProductSeoReadback> ReadSeoAsync(CancellationToken cancellationToken)
    {
        const string openScript = """
            (() => {
              const main = document.querySelector('main');
              const buttons = [...main.querySelectorAll('button')].filter(button => button.textContent?.includes('编辑SEO'));
              if (buttons.length !== 1) throw new Error('expected exactly one SEO edit button, found ' + buttons.length);
              buttons[0].click();
              return true;
            })()
            """;
        await _page.EvaluateAsync(openScript, cancellationToken);
        await _page.WaitForAsync("[...document.querySelectorAll('[role=dialog], .el-dialog')].some(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea'))",
            TimeSpan.FromSeconds(10), cancellationToken);

        const string readScript = """
            (() => {
              const dialogs = [...document.querySelectorAll('[role=dialog], .el-dialog')]
                .filter(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea'));
              const dialog = dialogs[dialogs.length - 1];
              if (!dialog) throw new Error('SEO dialog not found');
              const textareas = [...dialog.querySelectorAll('textarea.el-textarea__inner, textarea')];
              if (textareas.length < 3) {
                const controls = [...dialog.querySelectorAll('input, textarea')]
                  .map(el => `${el.tagName}.${el.className}[${el.getAttribute('placeholder') || ''}]`).join('|');
                throw new Error(`expected SEO title, description and slug textareas; controls=${controls}`);
              }
              const keywordTags = [...dialog.querySelectorAll('.el-select__tags .el-tag, .el-tag')]
                .map(tag => (tag.firstChild?.textContent || tag.textContent || '').trim())
                .filter(Boolean);
              const result = {
                seoTitle: textareas[0].value || '',
                keywordsText: keywordTags.join(', '),
                metaDescription: textareas[1].value || '',
                slug: textareas[2].value || ''
              };
              const cancel = [...dialog.querySelectorAll('button')].find(button => /取消|关闭/.test(button.textContent || ''));
              if (cancel) cancel.click();
              else {
                const close = dialog.querySelector('.el-dialog__headerbtn, [aria-label="Close"]');
                if (close) close.click();
              }
              return result;
            })()
            """;
        var value = await _page.EvaluateAsync(readScript, cancellationToken);
        var data = JsonSerializer.Deserialize<SeoDomResult>(value.GetRawText(), JsonOptions.Default)
                   ?? throw new InvalidDataException("Could not deserialize SEO read-back result.");
        return new ProductSeoReadback
        {
            SeoTitle = data.SeoTitle.Trim(),
            Keywords = data.KeywordsText.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
            MetaDescription = data.MetaDescription.Trim(),
            Slug = data.Slug.Trim().Trim('/')
        };
    }

    public async Task WriteAndSaveAsync(SeoDraft draft, bool publish, CancellationToken cancellationToken)
    {
        var payload = JsonSerializer.Serialize(new
        {
            productName = draft.ProductName,
            pdpHtml = draft.PdpHtml,
            seoTitle = draft.SeoTitle,
            keywords = draft.Keywords,
            meta = draft.MetaDescription,
            slug = draft.Slug,
            publish
        }, JsonOptions.Default);
        var script = $$"""
            (() => {
              const data = {{payload}};
              const main = document.querySelector('main');
              if (!main) throw new Error('main not found');
              const setValue = (el, value) => {
                const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
                const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
                if (!setter) throw new Error('native value setter not found');
                setter.call(el, value);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              };
              const name = main.querySelector('input[placeholder="请输入商品名称"]');
              if (!name) throw new Error('product name input not found');
              setValue(name, data.productName);

              const editors = [...(window.tinymce?.editors || [])]
                .filter(editor => editor?.getElement?.() && main.contains(editor.getElement()))
                .sort((a, b) => (b.getContent?.().length || 0) - (a.getContent?.().length || 0));
              const descriptionEditor = editors[0];
              if (!descriptionEditor) throw new Error('TinyMCE description editor not found');
              descriptionEditor.setContent(data.pdpHtml);
              if (typeof descriptionEditor.fire === 'function') descriptionEditor.fire('change');
              if (typeof descriptionEditor.dispatch === 'function') descriptionEditor.dispatch('change');
              descriptionEditor.save();
              const source = descriptionEditor.getElement();
              source.dispatchEvent(new Event('input', { bubbles: true }));
              source.dispatchEvent(new Event('change', { bubbles: true }));

              const seoButton = [...main.querySelectorAll('button')].find(button => button.textContent?.includes('编辑SEO'));
              if (!seoButton) throw new Error('SEO edit button not found');
              seoButton.click();
              return true;
            })()
            """;
        await _page.EvaluateAsync(script, cancellationToken);
        await _page.WaitForAsync("[...document.querySelectorAll('[role=dialog], .el-dialog')].some(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea'))",
            TimeSpan.FromSeconds(10), cancellationToken);

        var seoScript = $$"""
            (() => {
              const data = {{payload}};
              const dialogs = [...document.querySelectorAll('[role=dialog], .el-dialog')]
                .filter(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea'));
              const dialog = dialogs[dialogs.length - 1];
              if (!dialog) throw new Error('SEO dialog not found');
              const setValue = (el, value) => {
                const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
                const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
                setter.call(el, value);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              };
              const textareas = [...dialog.querySelectorAll('textarea.el-textarea__inner, textarea')];
              if (textareas.length < 3) {
                const controls = [...dialog.querySelectorAll('input, textarea')]
                  .map(el => `${el.tagName}.${el.className}[${el.getAttribute('placeholder') || ''}]`).join('|');
                throw new Error(`expected SEO title, description and slug textareas; controls=${controls}`);
              }
              const fields = [
                [textareas[0], data.seoTitle, 'SEO title'],
                [textareas[1], data.meta, 'SEO description'],
                [textareas[2], data.slug, 'SEO slug']
              ];
              for (const [element, value, name] of fields) {
                if (!element) throw new Error(name + ' field not found');
                setValue(element, value);
              }
              return true;
            })()
            """;
        await _page.EvaluateAsync(seoScript, cancellationToken);

        // Element-UI re-renders the tag list after every removal. Clicking a
        // cached collection removes only some tags, so clear one live tag per
        // round and re-query before continuing.
        for (var attempt = 0; attempt < 20; attempt++)
        {
            const string clearOneKeywordScript = """
                (() => {
                  const dialog = [...document.querySelectorAll('[role=dialog], .el-dialog')]
                    .filter(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea')).at(-1);
                  if (!dialog) throw new Error('SEO dialog not found while clearing keywords');
                  const tags = [...dialog.querySelectorAll('.el-select__tags .el-tag')];
                  if (tags.length === 0) return 0;
                  const close = tags[0].querySelector('.el-tag__close, [class*=close]');
                  if (!close) throw new Error('SEO keyword close control not found');
                  close.click();
                  return tags.length;
                })()
                """;
            var beforeCount = await _page.EvaluateAsync(clearOneKeywordScript, cancellationToken);
            if (beforeCount.ValueKind == JsonValueKind.Number && beforeCount.GetInt32() == 0) break;
            await Task.Delay(100, cancellationToken);
        }

        var remainingKeywordTags = await _page.EvaluateAsync("""
            (() => {
              const dialog = [...document.querySelectorAll('[role=dialog], .el-dialog')]
                .filter(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea')).at(-1);
              return dialog?.querySelectorAll('.el-select__tags .el-tag').length ?? -1;
            })()
            """, cancellationToken);
        if (remainingKeywordTags.ValueKind != JsonValueKind.Number || remainingKeywordTags.GetInt32() != 0)
            throw new InvalidDataException("Could not clear existing SEO keyword tags deterministically.");

        const string focusKeywordScript = """
            (() => {
              const dialog = [...document.querySelectorAll('[role=dialog], .el-dialog')]
                .filter(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea')).at(-1);
              const input = dialog?.querySelector('input.el-select__input');
              if (!input) throw new Error('SEO keyword input not found before entry');
              input.focus();
              return true;
            })()
            """;
        await _page.EvaluateAsync(focusKeywordScript, cancellationToken);
        await Task.Delay(180, cancellationToken);

        foreach (var keyword in draft.Keywords)
        {
            var keywordPayload = JsonSerializer.Serialize(keyword, JsonOptions.Default);
            var keywordScript = $$"""
                (() => {
                  const dialog = [...document.querySelectorAll('[role=dialog], .el-dialog')]
                    .filter(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea')).at(-1);
                  if (!dialog) throw new Error('SEO dialog not found while adding keyword');
                  const input = dialog.querySelector('input.el-select__input');
                  if (!input) throw new Error('SEO keyword input not found');
                  input.focus();
                  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
                  setter.call(input, {{keywordPayload}});
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                  return true;
                })()
                """;
            await _page.EvaluateAsync(keywordScript, cancellationToken);
            // Element-UI updates the select's internal query on the next tick.
            // Sending Enter immediately drops the first keyword.
            await Task.Delay(80, cancellationToken);
            await _page.SendAsync("Input.dispatchKeyEvent", new
            {
                type = "keyDown",
                key = "Enter",
                code = "Enter",
                windowsVirtualKeyCode = 13,
                nativeVirtualKeyCode = 13
            }, cancellationToken);
            await _page.SendAsync("Input.dispatchKeyEvent", new
            {
                type = "keyUp",
                key = "Enter",
                code = "Enter",
                windowsVirtualKeyCode = 13,
                nativeVirtualKeyCode = 13
            }, cancellationToken);
            await Task.Delay(100, cancellationToken);
        }

        var expectedKeywordsJson = JsonSerializer.Serialize(draft.Keywords, JsonOptions.Default);
        var verifyKeywordsScript = $$"""
            (() => {
              const expected = {{expectedKeywordsJson}};
              const dialog = [...document.querySelectorAll('[role=dialog], .el-dialog')]
                .filter(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea')).at(-1);
              if (!dialog) throw new Error('SEO dialog not found while verifying keywords');
              const actual = [...dialog.querySelectorAll('.el-select__tags .el-tag')]
                .map(tag => (tag.firstChild?.textContent || tag.textContent || '').trim()).filter(Boolean);
              if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
                throw new Error(`SEO keyword entry mismatch before confirm: expected=${expected.join('|')} actual=${actual.join('|')}`);
              }
              return true;
            })()
            """;
        await _page.EvaluateAsync(verifyKeywordsScript, cancellationToken);

        const string confirmSeoScript = """
            (() => {
              const dialog = [...document.querySelectorAll('[role=dialog], .el-dialog')]
                .filter(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea')).at(-1);
              if (!dialog) throw new Error('SEO dialog not found before confirm');
              const confirm = [...dialog.querySelectorAll('button')].find(button => /确定|保存/.test(button.textContent || ''));
              if (!confirm) throw new Error('SEO confirm button not found');
              confirm.click();
              return true;
            })()
            """;
        await _page.EvaluateAsync(confirmSeoScript, cancellationToken);
        await Task.Delay(300, cancellationToken);

        if (publish)
        {
            const string publishScript = """
                (() => {
                  const main = document.querySelector('main');
                  const label = [...main.querySelectorAll('*')].find(el => el.childElementCount === 0 && el.textContent?.trim() === '商品上架');
                  if (!label) throw new Error('publish label not found');
                  const box = label.closest('.el-form-item') || label.parentElement?.parentElement;
                  const control = box?.querySelector('[role="switch"], .el-switch, input[type="checkbox"]');
                  if (!control) throw new Error('publish switch not found');
                  const checked = control.matches('input') ? control.checked : control.getAttribute('aria-checked') === 'true' || control.classList.contains('is-checked');
                  if (!checked) control.click();
                  return true;
                })()
                """;
            await _page.EvaluateAsync(publishScript, cancellationToken);
        }

        const string saveScript = """
            (() => {
              const main = document.querySelector('main');
              const buttons = [...main.querySelectorAll('button')].filter(button => button.textContent?.trim() === '保存');
              if (buttons.length !== 1) throw new Error('expected exactly one main Save button, found ' + buttons.length);
              buttons[0].click();
              return true;
            })()
            """;
        await _page.EvaluateAsync(saveScript, cancellationToken);
        await Task.Delay(500, cancellationToken);
    }

    public async Task SetPublishedAndSaveAsync(CancellationToken cancellationToken)
    {
        const string publishAndSaveScript = """
            (() => {
              const main = document.querySelector('main');
              if (!main) throw new Error('main not found');
              const label = [...main.querySelectorAll('*')].find(el => el.childElementCount === 0 && el.textContent?.trim() === '商品上架');
              if (!label) throw new Error('publish label not found');
              const box = label.closest('.el-form-item') || label.parentElement?.parentElement;
              const control = box?.querySelector('[role="switch"], .el-switch, input[type="checkbox"]');
              if (!control) throw new Error('publish switch not found');
              const checked = control.matches('input') ? control.checked :
                control.getAttribute('aria-checked') === 'true' || control.classList.contains('is-checked');
              if (!checked) control.click();
              const buttons = [...main.querySelectorAll('button')].filter(button => button.textContent?.trim() === '保存');
              if (buttons.length !== 1) throw new Error('expected exactly one main Save button, found ' + buttons.length);
              buttons[0].click();
              return true;
            })()
            """;
        await _page.EvaluateAsync(publishAndSaveScript, cancellationToken);
        await Task.Delay(500, cancellationToken);
    }

    private async Task NavigateFreshAsync(string url, CancellationToken cancellationToken)
    {
        await _page.NavigateAsync("about:blank", cancellationToken);
        await _page.NavigateAsync(url, cancellationToken);
    }

    /// <summary>
    /// Waits for an authenticated page to render the given form control.
    ///
    /// A dead session is not an edge case. MrShopPlus is a hash-routed SPA whose
    /// auth guard redirects to <c>#/login</c> only after the first render, so
    /// reading <c>location.href</c> immediately after navigation races that guard
    /// and can pass on a session that is already invalid. The failure then
    /// surfaces as a full-length timeout on a selector that will never appear,
    /// which says nothing about the real cause.
    ///
    /// This waits for whichever comes first — the form control or the login route
    /// — and then reports the precise reason.
    /// </summary>
    private async Task WaitForAuthenticatedFormAsync(string selectorExpression, CancellationToken cancellationToken)
    {
        await _page.WaitForAsync(
            $"({selectorExpression}) || location.href.includes('#/login')",
            TimeSpan.FromSeconds(45), cancellationToken);
        await EnsureAuthenticatedAsync(cancellationToken);
    }

    private async Task LoadCategoryRowsAsync(int? rowLimit, CancellationToken cancellationToken)
    {
        const string countScript = """
            (() => {
              const text = document.querySelector('main')?.innerText || '';
              const summary = text.match(/类别中的商品\s*共\s*(\d+)个商品/);
              const expected = summary ? Number(summary[1]) : 0;
              const loaded = [...document.querySelectorAll('main table tbody tr')]
                .filter(tr => [...tr.querySelectorAll('a')].some(a => (a.getAttribute('href') || '').includes('/product/form_DTB_proProduct/'))).length;
              return { expected, loaded };
            })()
            """;
        var deadline = DateTimeOffset.UtcNow + TimeSpan.FromSeconds(90);
        var previous = -1;
        var stagnantRounds = 0;
        while (DateTimeOffset.UtcNow < deadline)
        {
            var value = await _page.EvaluateAsync(countScript, cancellationToken);
            var counts = JsonSerializer.Deserialize<CategoryLoadCount>(value.GetRawText(), JsonOptions.Default)
                         ?? throw new InvalidDataException("Could not read category load count.");
            var target = rowLimit ?? counts.Expected;
            if (target > 0 && counts.Loaded >= target) return;
            if (counts.Loaded == previous) stagnantRounds++; else stagnantRounds = 0;
            previous = counts.Loaded;

            const string scrollScript = """
                (() => {
                  window.scrollTo(0, document.documentElement.scrollHeight);
                  const main = document.querySelector('main');
                  for (const element of (main ? [...main.querySelectorAll('*')] : [])) {
                    if (element.scrollHeight > element.clientHeight + 80) element.scrollTop = element.scrollHeight;
                  }
                  return true;
                })()
                """;
            await _page.EvaluateAsync(scrollScript, cancellationToken);
            await Task.Delay(stagnantRounds > 3 ? 800 : 350, cancellationToken);
        }
        var finalValue = await _page.EvaluateAsync(countScript, cancellationToken);
        var finalCounts = JsonSerializer.Deserialize<CategoryLoadCount>(finalValue.GetRawText(), JsonOptions.Default);
        throw new TimeoutException($"Category lazy loading stopped at {finalCounts?.Loaded ?? 0}/{finalCounts?.Expected ?? 0} rows.");
    }

    private async Task EnsureAuthenticatedAsync(CancellationToken cancellationToken)
    {
        var location = await _page.EvaluateAsync("location.href", cancellationToken);
        var url = location.GetString() ?? "";
        if (url.Contains("#/login", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Mrshopplus login is required in the dedicated DripOps Chrome profile. Log in once, then rerun the command.");
    }

    private string ToAbsoluteAdminUrl(string href)
    {
        if (Uri.TryCreate(href, UriKind.Absolute, out var absolute)) return absolute.ToString();
        return _config.AdminOrigin.TrimEnd('/') + "/" + href.TrimStart('/');
    }

    private sealed record CategoryDomResult
    {
        public string CategoryName { get; init; } = "";
        public int Total { get; init; }
        public int Published { get; init; }
        public int Unpublished { get; init; }
        public List<CategoryDomRow> Rows { get; init; } = [];
    }

    private sealed record CategoryLoadCount
    {
        public int Expected { get; init; }
        public int Loaded { get; init; }
    }

    private sealed record CategoryLookupDomResult
    {
        public string Name { get; init; } = "";
        public string AdminHref { get; init; } = "";
        public string? PublicUrl { get; init; }
    }

    private sealed record CategoryDomRow
    {
        public int Index { get; init; }
        public string ProductId { get; init; } = "";
        public string Name { get; init; } = "";
        public string Href { get; init; } = "";
        public bool IsPublished { get; init; }
    }

    private sealed record ProductDomResult
    {
        public string Name { get; init; } = "";
        public string Subtitle { get; init; } = "";
        public string DescriptionHtml { get; init; } = "";
        public string Slug { get; init; } = "";
        public bool IsPublished { get; init; }
        public List<string> Images { get; init; } = [];
    }

    private sealed record SeoDomResult
    {
        public string SeoTitle { get; init; } = "";
        public string KeywordsText { get; init; } = "";
        public string MetaDescription { get; init; } = "";
        public string Slug { get; init; } = "";
    }
}
