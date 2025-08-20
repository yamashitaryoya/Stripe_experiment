// ストライプ＋テキストをCanvasに描画する共通関数
function drawStripeCanvas({period, duty, angle, text, font_size, canvas_id, stripe_color, width=200, height=60}) {
    const canvas = document.getElementById(canvas_id);
    if (!canvas) return;

    // --- 改善点：高解像度ディスプレイ対応 ---
    // 1. デバイスのピクセル比を取得
    const dpr = window.devicePixelRatio || 1;

    // 2. Canvasの描画バッファサイズを物理ピクセルに合わせる
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // 3. CSSでCanvasの表示サイズを指定する
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    
    // 4. 描画コンテキスト全体をスケールし、くっきりと描画させる
    ctx.scale(dpr, dpr);
    // --- ここまでが改善点 ---

    // 以降の描画処理は論理ピクセルサイズ(width, height)を基準に行う
    ctx.clearRect(0, 0, width, height);

    // テキストを描画
    ctx.font = `${font_size}px 'NotoSans', sans-serif`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width/2, height/2);

    // ======= ストライプ矩形のパラメータ =======
    const rectW = 1500;
    const rectH = 500;
    const rectX = Math.round(width/2 - rectW/2);
    const rectY = Math.round(height/2 - rectH/2);

    // 1. ストライプパターン作成
    const stripeCanvas = document.createElement('canvas');
    stripeCanvas.width = period;
    stripeCanvas.height = period;
    const sctx = stripeCanvas.getContext('2d');
    sctx.clearRect(0, 0, period, period);
    sctx.fillStyle = `rgba(${stripe_color},${stripe_color},${stripe_color},1)`; // stripe_colorを使用
    sctx.fillRect(0, 0, period * duty, period);

    // 2. ストライプ矩形のみクリッピングしてストライプを重ねる
    ctx.save();
    ctx.beginPath();
    ctx.rect(rectX, rectY, rectW, rectH);
    ctx.closePath();
    ctx.clip();

    ctx.save();
    ctx.translate(width/2, height/2);
    ctx.rotate(angle * Math.PI / 180);
    ctx.translate(-width/2, -height/2);
    const pattern = ctx.createPattern(stripeCanvas, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(rectX, rectY, rectW, rectH);
    ctx.restore();

    ctx.restore();
}