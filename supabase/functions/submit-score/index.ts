import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Levenshtein距離を計算
 */
function calculateLevenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // 行列の初期化
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // 行列の計算
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // 置換
                    Math.min(
                        matrix[i][j - 1] + 1, // 挿入
                        matrix[i - 1][j] + 1  // 削除
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * 正確度を計算
 */
function calculateAccuracy(input: string, target: string): number {
    if (!target) return 0;
    if (!input) return 0;

    const distance = calculateLevenshteinDistance(input, target);
    const maxLength = Math.max(input.length, target.length);

    if (maxLength === 0) return 100;

    const accuracy = ((maxLength - distance) / maxLength) * 100;
    return Math.max(0, Math.round(accuracy * 10) / 10);
}

/**
 * スコアを計算
 */
function calculateScore(input: string, targetText: string, timeSeconds: number) {
    // CPM (Characters Per Minute) の計算
    const cpm = Math.round((input.length / timeSeconds) * 60);

    // 正確度の計算（入力した長さまでの対象テキストと比較）
    const accuracy = calculateAccuracy(input, targetText.slice(0, input.length));

    // スコア計算: CPM * (正確度 / 100) * log10(文字数 + 1) * 100
    const score = Math.round(cpm * (accuracy / 100) * Math.log10(input.length + 1) * 100);

    return { score, cpm, accuracy };
}

/**
 * スコアの妥当性を検証
 */
function validateScore(
    input: string,
    targetText: string,
    startTime: number,
    endTime: number,
    clientSubmitTime: number
): { valid: boolean; error?: string; timeSeconds?: number } {
    const now = Date.now();

    // 1. タイムスタンプの妥当性チェック
    if (startTime <= 0 || endTime <= 0) {
        return { valid: false, error: 'Invalid timestamps' };
    }

    if (endTime <= startTime) {
        return { valid: false, error: 'End time must be after start time' };
    }

    // 2. 未来の時刻チェック
    if (startTime > now || endTime > now) {
        return { valid: false, error: 'Timestamps cannot be in the future' };
    }

    // 3. クライアント送信時刻との整合性チェック（±10秒の誤差を許容）
    const timeDiff = Math.abs(clientSubmitTime - now);
    if (timeDiff > 10000) {
        return { valid: false, error: 'Client time mismatch (possible time manipulation)' };
    }

    // 4. プレイ時間の計算
    const timeSeconds = (endTime - startTime) / 1000;

    // 5. プレイ時間の妥当性チェック（最低0.1秒、最大600秒）
    if (timeSeconds < 0.1 || timeSeconds > 600) {
        return { valid: false, error: 'Invalid play duration' };
    }

    // 6. 入力テキストの長さチェック
    if (input.length === 0) {
        return { valid: false, error: 'Empty input' };
    }

    if (input.length > targetText.length * 1.5) {
        return { valid: false, error: 'Input too long' };
    }

    // 7. CPMの妥当性チェック（人間の限界: 最大600 CPM）
    const cpm = (input.length / timeSeconds) * 60;
    if (cpm > 600) {
        return { valid: false, error: 'CPM too high (physically impossible)' };
    }

    // 8. 対象テキストの検証
    if (!targetText || targetText.length === 0) {
        return { valid: false, error: 'Invalid target text' };
    }

    return { valid: true, timeSeconds };
}

serve(async (req) => {
    // CORSヘッダーの設定
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // OPTIONSリクエスト（プリフライト）への対応
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // リクエストボディの取得
        const { input, targetText, startTime, endTime, username } = await req.json()

        // 必須パラメータのチェック
        if (!input || !targetText || !startTime || !endTime || !username) {
            return new Response(
                JSON.stringify({ error: 'Missing required parameters' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ユーザー名の検証
        if (username.trim().length === 0 || username.length > 20) {
            return new Response(
                JSON.stringify({ error: 'Invalid username (must be 1-20 characters)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // スコアの妥当性検証
        const clientSubmitTime = Date.now();
        const validation = validateScore(input, targetText, startTime, endTime, clientSubmitTime);

        if (!validation.valid) {
            return new Response(
                JSON.stringify({ error: validation.error }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // スコアの計算
        const { score, cpm, accuracy } = calculateScore(input, targetText, validation.timeSeconds!);

        // Supabaseクライアントの作成
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 既存のスコアを確認
        const { data: existingScores, error: fetchError } = await supabase
            .from('scores')
            .select('*')
            .eq('username', username.trim())
            .order('score', { ascending: false });

        if (fetchError) {
            console.error('Error fetching scores:', fetchError);
            return new Response(
                JSON.stringify({ error: 'Database error' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        let rank = 0;
        let isHighScore = false;

        if (existingScores && existingScores.length > 0) {
            const bestRecord = existingScores[0];
            const duplicateIds = existingScores.slice(1).map((r: any) => r.id);

            // 重複レコードの削除
            if (duplicateIds.length > 0) {
                await supabase
                    .from('scores')
                    .delete()
                    .in('id', duplicateIds);
            }

            // ハイスコアの場合は更新
            if (score > bestRecord.score) {
                const { error: updateError } = await supabase
                    .from('scores')
                    .update({
                        score: score,
                        cpm: cpm,
                        accuracy: accuracy,
                        created_at: new Date().toISOString(),
                        last_played_at: new Date().toISOString()
                    })
                    .eq('id', bestRecord.id);

                if (updateError) {
                    console.error('Error updating score:', updateError);
                    return new Response(
                        JSON.stringify({ error: 'Failed to update score' }),
                        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }
                isHighScore = true;
            } else {
                // ハイスコアでない場合も最終プレイ日時を更新
                await supabase
                    .from('scores')
                    .update({
                        last_played_at: new Date().toISOString()
                    })
                    .eq('id', bestRecord.id);
            }
        } else {
            // 新規ユーザーの場合は挿入
            const { error: insertError } = await supabase
                .from('scores')
                .insert([
                    {
                        username: username.trim(),
                        score: score,
                        cpm: cpm,
                        accuracy: accuracy,
                        last_played_at: new Date().toISOString()
                    }
                ]);

            if (insertError) {
                console.error('Error inserting score:', insertError);
                return new Response(
                    JSON.stringify({ error: 'Failed to insert score' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
            isHighScore = true;
        }

        // ランキングの計算
        const { count, error: countError } = await supabase
            .from('scores')
            .select('*', { count: 'exact', head: true })
            .gt('score', score);

        if (countError) {
            console.error('Error counting rank:', countError);
        } else {
            rank = (count || 0) + 1;
        }

        // 成功レスポンス
        return new Response(
            JSON.stringify({
                success: true,
                score,
                cpm,
                accuracy,
                rank,
                isHighScore
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
