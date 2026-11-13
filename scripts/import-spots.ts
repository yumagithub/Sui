/**
 * スポットの CSV（data/spots_template.csv と同じ列）を spots テーブルに取り込む。
 *
 * 使い方:
 *   node --experimental-strip-types --env-file=.env.script.local scripts/import-spots.ts data/dev-spots.csv
 *   node --experimental-strip-types scripts/import-spots.ts data/dev-spots.csv --dry-run   # チェックだけ
 *
 * .env.script.local（git には入らない。Expo も読み込まない）:
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SECRET_KEY=sb_secret_...   # または旧形式の service_role キー
 *
 * 秘密キーはこのスクリプトを実行するときの環境変数からだけ読む。
 * アプリのコード（src/）からは絶対に import しないこと。
 */
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

const COLUMNS = [
  "name",
  "description",
  "category",
  "municipality",
  "lat",
  "lng",
  "is_indoor",
  "has_parking",
  "car_free_ok",
  "budget_yen",
  "hours_note",
  "photo_url",
  "google_maps_url",
  "tags",
  "is_published",
] as const;

// is_published は後から足した列なので、なくてもよい
const OPTIONAL_COLUMNS = new Set<string>(["is_published"]);

const CATEGORIES = new Set(["food", "cafe", "play", "nature", "view"]);
const MUNICIPALITIES = new Set([
  "うるま市",
  "沖縄市",
  "北谷町",
  "宜野湾市",
  "北中城村",
  "中城村",
  "西原町",
]);

// 沖縄本島のだいたいの範囲（緯度と経度の入れ違いに気づくため）
const LAT_RANGE = [25.9, 26.95] as const;
const LNG_RANGE = [127.6, 128.35] as const;

type CsvRow = Partial<Record<(typeof COLUMNS)[number], string>>;

type SpotRow = {
  name: string;
  description: string | null;
  category: string;
  municipality: string;
  location: string;
  is_indoor: boolean;
  has_parking: boolean | null;
  car_free_ok: boolean | null;
  budget_yen: number | null;
  hours_note: string | null;
  photo_url: string | null;
  google_maps_url: string;
  tags: string[];
  is_published: boolean;
};

class RowError extends Error {}

function text(value: string | undefined): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

function bool(value: string | undefined, column: string, required: boolean): boolean | null {
  const v = text(value)?.toLowerCase() ?? null;
  if (v === null) {
    if (required) throw new RowError(`${column} は必須です（true / false）`);
    return null;
  }
  if (v === "true") return true;
  if (v === "false") return false;
  throw new RowError(`${column} は true / false で書いてください（"${value}"）`);
}

function coordinate(value: string | undefined, column: string, range: readonly [number, number]): number {
  const v = text(value);
  const n = v === null ? NaN : Number(v);
  if (!Number.isFinite(n)) throw new RowError(`${column} が数値ではありません（"${value ?? ""}"）`);
  if (n < range[0] || n > range[1]) {
    throw new RowError(
      `${column}=${n} が沖縄本島の範囲外です（${range[0]}〜${range[1]}）。lat と lng が逆になっていませんか？`,
    );
  }
  return n;
}

function url(value: string | undefined, column: string): string | null {
  const v = text(value);
  if (v === null) return null;
  if (!/^https:\/\//.test(v)) throw new RowError(`${column} は https:// で始まる URL にしてください`);
  return v;
}

function toSpot(row: CsvRow): SpotRow {
  const name = text(row.name);
  if (name === null) throw new RowError("name は必須です");
  if ([...name].length > 80) throw new RowError("name は80文字までです");

  const description = text(row.description);
  if (description !== null && [...description].length > 200) {
    throw new RowError("description は200文字までです");
  }

  const category = text(row.category) ?? "";
  if (!CATEGORIES.has(category)) {
    throw new RowError(`category は ${[...CATEGORIES].join(" / ")} のどれかです（"${category}"）`);
  }

  const municipality = text(row.municipality) ?? "";
  if (!MUNICIPALITIES.has(municipality)) {
    throw new RowError(`municipality は ${[...MUNICIPALITIES].join(" / ")} のどれかです（"${municipality}"）`);
  }

  const lat = coordinate(row.lat, "lat", LAT_RANGE);
  const lng = coordinate(row.lng, "lng", LNG_RANGE);

  const budgetText = text(row.budget_yen);
  let budget_yen: number | null = null;
  if (budgetText !== null) {
    if (!/^\d+$/.test(budgetText)) throw new RowError(`budget_yen は0以上の整数です（"${budgetText}"）`);
    budget_yen = Number(budgetText);
  }

  const tags = [
    ...new Set(
      (row.tags ?? "")
        .split(";")
        .map((t) => t.trim())
        .filter((t) => t !== ""),
    ),
  ];

  return {
    name,
    description,
    category,
    municipality,
    location: `SRID=4326;POINT(${lng} ${lat})`,
    is_indoor: bool(row.is_indoor, "is_indoor", true) as boolean,
    has_parking: bool(row.has_parking, "has_parking", false),
    car_free_ok: bool(row.car_free_ok, "car_free_ok", false),
    budget_yen,
    hours_note: text(row.hours_note),
    photo_url: url(row.photo_url, "photo_url"),
    google_maps_url:
      url(row.google_maps_url, "google_maps_url") ??
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    tags,
    is_published: bool(row.is_published, "is_published", false) ?? true,
  };
}

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) fail("CSV ファイルを指定してください（例: data/dev-spots.csv）");

  let records: CsvRow[];
  let header: string[] = [];
  try {
    records = parse(readFileSync(file, "utf8"), {
      bom: true,
      columns: (h: string[]) => {
        header = h.map((c) => c.trim());
        return header;
      },
      skip_empty_lines: true,
    }) as CsvRow[];
  } catch (e) {
    fail(`CSV を読めませんでした: ${e instanceof Error ? e.message : String(e)}`);
  }

  const unknown = header.filter((c) => !(COLUMNS as readonly string[]).includes(c));
  const missing = COLUMNS.filter((c) => !header.includes(c) && !OPTIONAL_COLUMNS.has(c));
  if (unknown.length > 0) fail(`知らない列があります: ${unknown.join(", ")}`);
  if (missing.length > 0) fail(`足りない列があります: ${missing.join(", ")}`);

  const spots: SpotRow[] = [];
  const errors: string[] = [];
  const seen = new Map<string, number>();

  records.forEach((record, index) => {
    const line = index + 2; // 1行目はヘッダー
    if ((record.name ?? "").trim().startsWith("例：")) {
      console.warn(`! ${line}行目: 見本の行なので読み飛ばしました`);
      return;
    }
    try {
      const spot = toSpot(record);
      const key = `${spot.name}\u0000${spot.municipality}`;
      const firstLine = seen.get(key);
      if (firstLine !== undefined) {
        throw new RowError(`${firstLine}行目と同じスポット（名前と市町村）です`);
      }
      seen.set(key, line);
      spots.push(spot);
    } catch (e) {
      if (!(e instanceof RowError)) throw e;
      errors.push(`${line}行目（${record.name ?? ""}）: ${e.message}`);
    }
  });

  if (errors.length > 0) {
    console.error(`✗ ${errors.length}件のエラーがあるので、取り込みませんでした`);
    for (const message of errors) console.error(`  - ${message}`);
    process.exit(1);
  }

  if (spots.length === 0) fail("取り込むスポットがありません");

  const published = spots.filter((s) => s.is_published).length;
  console.log(`✓ ${spots.length}件 OK（公開 ${published}件 / 非公開 ${spots.length - published}件）`);

  if (dryRun) {
    console.log("--dry-run なので、書き込みはしていません");
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) {
    fail("SUPABASE_URL と SUPABASE_SECRET_KEY を環境変数で渡してください（--env-file=.env.script.local）");
  }
  if (secretKey.startsWith("sb_publishable_")) {
    fail("SUPABASE_SECRET_KEY に公開キーが入っています。秘密キー（sb_secret_...）を使ってください");
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // (name, municipality) が同じなら上書きする
  const { error, count } = await supabase
    .from("spots")
    .upsert(spots, { onConflict: "name,municipality", count: "exact" });

  if (error) fail(`取り込みに失敗しました: ${error.message}`);
  console.log(`✓ ${count ?? spots.length}件を spots に取り込みました`);
}

await main();
