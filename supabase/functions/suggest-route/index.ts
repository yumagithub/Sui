// @ts-nocheck — Deno runtime。Node.js の型チェックは対象外
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mood, time_of_day, genre_slugs, area } = await req.json();

    // Supabase クライアント（DBからスポット取得用）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // スポット候補を取得（ジャンル・エリアで絞り込み）
    let query = supabase
      .from('spots')
      .select('id, name, description, area, spot_genres(genres(slug, name))')
      .limit(30);

    if (area) {
      query = query.eq('area', area);
    }

    const { data: spotsRaw, error: spotsError } = await query;
    if (spotsError) throw spotsError;

    const spots = (spotsRaw ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      area: s.area,
      genres: (s.spot_genres ?? []).map((sg: any) => sg.genres?.slug).filter(Boolean),
    }));

    // ジャンルフィルター（クライアント側で絞り込み）
    const filtered =
      genre_slugs && genre_slugs.length > 0
        ? spots.filter((s: any) => s.genres.some((g: string) => genre_slugs.includes(g)))
        : spots;

    const candidates = filtered.length >= 3 ? filtered : spots; // 候補が少なければ全件使う

    // Gemini へのプロンプト
    const spotList = candidates
      .map((s: any) => `- ID:${s.id} [${s.area}] ${s.name}（${s.genres.join('/')}）: ${s.description ?? ''}`)
      .join('\n');

    const prompt = `
あなたは沖縄在住者向けのスポット巡りアプリのAIです。
以下の条件とスポット候補リストから、今日のルートに最適なスポットを3〜5件選んでください。

【ユーザーの今日の状態】
- 気分: ${mood ?? 'のんびり'}
- 時間帯: ${time_of_day ?? '午後'}
- 希望ジャンル: ${genre_slugs?.join(', ') ?? 'なし（なんでもOK）'}
- エリア: ${area ?? 'どこでも'}

【スポット候補】
${spotList}

【出力形式】
選んだスポットのIDを配列としてJSONのみで返してください。説明文は不要です。
{"spot_ids": ["id1", "id2", "id3"]}
`.trim();

    // Gemini API 呼び出し
    const geminiRes = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': Deno.env.get('GEMINI_API_KEY')!,
      },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error: ${errText}`);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const { spot_ids } = JSON.parse(rawText);

    if (!spot_ids || spot_ids.length === 0) {
      throw new Error('Gemini returned no spot IDs');
    }

    // 選ばれた ID でスポット詳細を取得
    const { data: selectedSpots, error: selectedError } = await supabase
      .from('spots')
      .select('*, spot_genres(genres(slug, name))')
      .in('id', spot_ids);

    if (selectedError) throw selectedError;

    // spot_ids の順序を維持
    const ordered = spot_ids
      .map((id: string) => selectedSpots?.find((s: any) => s.id === id))
      .filter(Boolean)
      .map((s: any) => ({
        ...s,
        genres: (s.spot_genres ?? []).map((sg: any) => sg.genres).filter(Boolean),
      }));

    return new Response(JSON.stringify({ spots: ordered }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
