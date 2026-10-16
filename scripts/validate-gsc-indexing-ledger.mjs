#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_LEDGER = path.resolve(
  "reports/gsc-indexing-2026-10-16/895-casefold-groups-898-url-ledger.csv",
);

function parseArgs(argv) {
  let mode = "baseline";
  let ledger = DEFAULT_LEDGER;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--mode") mode = argv[++i];
    else if (argv[i] === "--ledger") ledger = path.resolve(argv[++i]);
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!new Set(["baseline", "report", "complete"]).has(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  return { mode, ledger };
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (quoted) throw new Error("CSV ended inside a quoted field");
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...data] = rows.filter((r) => r.some((v) => v !== ""));
  return data.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
  });
}

function fail(errors, row, message) {
  errors.push(`${row.record_id || "unknown record"}: ${message}`);
}

const { mode, ledger } = parseArgs(process.argv.slice(2));
const records = parseCsv(fs.readFileSync(ledger, "utf8"));
const errors = [];

if (records.length !== 898) errors.push(`Expected 898 raw URL rows, found ${records.length}`);

const exactUrls = new Set(records.map((r) => r.original_url));
if (exactUrls.size !== 898) errors.push(`Expected 898 exact URL strings, found ${exactUrls.size}`);

const groups = new Map();
for (const record of records) {
  if (!record.original_url.startsWith("https://")) fail(errors, record, "original_url must be absolute HTTPS");
  if (!record.casefold_group_id) fail(errors, record, "missing casefold_group_id");
  const key = record.original_url.toLowerCase();
  const existing = groups.get(key);
  if (existing && existing.id !== record.casefold_group_id) {
    fail(errors, record, "case-insensitive variants use different group IDs");
  } else if (!existing) groups.set(key, { id: record.casefold_group_id, rows: [] });
  groups.get(key).rows.push(record);
}

if (groups.size !== 895) errors.push(`Expected 895 case-insensitive URL groups, found ${groups.size}`);

for (const group of groups.values()) {
  for (const record of group.rows) {
    if (Number(record.casefold_variant_count) !== group.rows.length) {
      fail(errors, record, `casefold_variant_count must be ${group.rows.length}`);
    }
  }
}

const expectedGroups = new Map([
  ["clean_path", 630],
  ["trailing_slash", 52],
  ["legacy_biz_route", 143],
  ["pagination", 53],
  ["amp_host", 17],
]);
const actualGroups = new Map();
for (const group of groups.values()) {
  const kinds = new Set(group.rows.map((r) => r.structure_group));
  if (kinds.size !== 1) errors.push(`${group.id}: variants cross structural groups`);
  const kind = group.rows[0].structure_group;
  actualGroups.set(kind, (actualGroups.get(kind) || 0) + 1);
}
for (const [kind, expected] of expectedGroups) {
  if ((actualGroups.get(kind) || 0) !== expected) {
    errors.push(`Expected ${expected} ${kind} groups, found ${actualGroups.get(kind) || 0}`);
  }
}

const resolved = new Set(["INDEXED", "CONSOLIDATED_TARGET_INDEXED"]);
const unresolved = new Set([
  "UNRESOLVED",
  "AWAITING_GOOGLE_RECRAWL",
  "RECRAWLED_STILL_NOT_INDEXED",
  "TECHNICAL_ERROR_UNRESOLVED",
  "CONTENT_QUALITY_UNRESOLVED",
]);

if (mode !== "baseline") {
  for (const record of records) {
    if (!new Set(["YES", "NO"]).has(record.requires_independent_indexing)) {
      fail(errors, record, "requires_independent_indexing must be YES or NO");
    }
    for (const field of ["decision_basis", "verified_primary_url", "identity_evidence", "current_http_status", "rendered_content_verified_at", "internal_link_verified_at"]) {
      if (!record[field]) fail(errors, record, `missing ${field}`);
    }
    if (record.sitemap_membership === "UNVERIFIED" || !record.sitemap_membership) {
      fail(errors, record, "sitemap_membership is not verified");
    }
    if (!resolved.has(record.final_outcome) && !unresolved.has(record.final_outcome)) {
      fail(errors, record, `unsupported final_outcome ${record.final_outcome}`);
    }
    if (record.final_outcome === "INDEXED") {
      if (record.requires_independent_indexing !== "YES") fail(errors, record, "INDEXED requires YES");
      if (!record.postfix_last_crawl_time || !record.final_verified_at || !record.inspection_evidence_url) {
        fail(errors, record, "INDEXED lacks post-fix crawl/verification evidence");
      }
    }
    if (record.final_outcome === "CONSOLIDATED_TARGET_INDEXED") {
      if (record.requires_independent_indexing !== "NO") fail(errors, record, "consolidation requires NO");
      if (!record.verified_primary_url || !record.final_verified_at || !record.inspection_evidence_url) {
        fail(errors, record, "consolidation lacks indexed-target evidence");
      }
    }
    if (unresolved.has(record.final_outcome) && !record.unresolved_reason) {
      fail(errors, record, "unresolved row must retain an unresolved_reason");
    }
  }
}

if (mode === "complete") {
  const pending = records.filter((r) => !resolved.has(r.final_outcome));
  if (pending.length) errors.push(`${pending.length} raw URL rows remain unresolved; completion claim is forbidden`);
}

const summary = {
  mode,
  rawUrlRows: records.length,
  exactUrlStrings: exactUrls.size,
  casefoldGroups: groups.size,
  structuralGroups: Object.fromEntries([...actualGroups].sort()),
  resolvedRows: records.filter((r) => resolved.has(r.final_outcome)).length,
  unresolvedRows: records.filter((r) => !resolved.has(r.final_outcome)).length,
  errors: errors.length,
};
console.log(JSON.stringify(summary, null, 2));
if (errors.length) {
  console.error(errors.slice(0, 50).join("\n"));
  if (errors.length > 50) console.error(`... ${errors.length - 50} more errors`);
  process.exit(1);
}
