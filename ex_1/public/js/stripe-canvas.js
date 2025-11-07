// ストライプ＋テキストをCanvasに描画する関数
function getStripeCanvasHTML({width=120, height=60, canvas_id=""}) {
    if (!canvas_id) canvas_id = 'stripe-canvas-' + Math.random().toString(36).slice(2,10);
    return `<canvas id="${canvas_id}" width="${width}" height="${height}" style="display:block;margin:auto;"></canvas>`;
}

// ストライプ＋テキストをCanvasに描画する共通関数
function drawStripeCanvas({period, line_width=2, angle=0, text='None', font_size=16, canvas_id, stripe_color = 128, width=120, height=60}) {
    const canvas = document.getElementById(canvas_id);
    if (!canvas) return;

    // DPI対応
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // キャンバスをクリア
    ctx.clearRect(0, 0, width, height);

    // テキストを描画
    ctx.font = `${font_size}px 'NotoSans-Regular'`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width/2, height/2);

    // ======= 縞模様の描画 =======
    
    // line_width が 1px未満 の場合は縞模様を描画しない
    if (line_width < 1) {
        ctx.restore();
        return;
    } 

    // 画像の対角線の長さを計算
    const max_dim = Math.ceil(Math.sqrt(width * width + height * height));
    const center_x = width / 2;
    const center_y = height / 2;

    // 角度をラジアンに変換して三角関数を計算
    let angle_rad = angle * Math.PI / 180;
    let cos_a = Math.cos(angle_rad);
    let sin_a = Math.sin(angle_rad);

    // 特殊角度の場合は精度を上げるため直接値を設定
    if (angle === 0) {
        cos_a = 1;
        sin_a = 0;
    } else if (angle === 90) {
        cos_a = 0;
        sin_a = 1;
    }

    // 縞模様を描画
    ctx.save();
    ctx.strokeStyle = `rgb(${stripe_color},${stripe_color},${stripe_color})`;
    ctx.lineWidth = line_width;

    // max_dim の範囲で周期的に線を引く
    for (let i = -max_dim; i <= max_dim; i += period) {
        // 線の始点と終点を計算
        const p1_x = -max_dim * cos_a - i * sin_a + center_x;
        const p1_y = -max_dim * sin_a + i * cos_a + center_y;
        const p2_x = max_dim * cos_a - i * sin_a + center_x;
        const p2_y = max_dim * sin_a + i * cos_a + center_y;

        // 線を描画
        ctx.beginPath();
        ctx.moveTo(p1_x, p1_y);
        ctx.lineTo(p2_x, p2_y);
        ctx.stroke();
    }

    ctx.restore();
}
