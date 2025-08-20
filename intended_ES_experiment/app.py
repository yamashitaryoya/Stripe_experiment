import os
import re
import math
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_file
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from io import BytesIO

FONT_PATH = "fonts/NotoSansJP-Regular.ttf"  # フォントファイルのパス

# --- Flaskアプリケーション ---
app = Flask(__name__, static_folder='public', static_url_path='')

# --- データ保存エンドポイント ---
@app.route('/save_data', methods=['POST'])
def save_data():
    if not os.path.exists('data'):
        os.makedirs('data')

    data = request.json
    if not data:
        return jsonify(success=False, error="データがありません。"), 400

    # 全データをPandas DataFrameに変換
    df = pd.json_normalize(data)

    # 'task'列が'main'の行のみをフィルタリング
    main_df = df[df['task'] == 'main'].copy()

    # 本番データがない場合は、ファイルを保存せずに終了
    if main_df.empty:
        return jsonify(success=True, message="本番データがなかったため、ファイルは保存されませんでした。")

    participant_id = None
    if 'participant_id' in main_df.columns:
        participant_id = main_df['participant_id'].iloc[0]

    safe_participant_id = re.sub(r'[\\/*?:"<>|]', "", str(participant_id))
    file_path = f'data/intended_results_{safe_participant_id}.csv'
    
    # 重複ファイル名対応 ---
    count = 2
    while os.path.exists(file_path):
        file_path = f'data/intended_results_{safe_participant_id}_{count}.csv'
        count += 1
    
    # 反応時間(rt)をtimeにリネーム
    if 'rt' in main_df.columns:
        main_df.rename(columns={'rt': 'time'}, inplace=True)
    
    # ユーザーの回答を'response_text'列に格納
    if 'response.response_text' in main_df.columns:
        main_df['response_text'] = main_df['response.response_text']
    
    # 保存する列を定義
    columns_to_save = [
        'participant_id',
        'time', 
        'period', 
        'duty',
        'angle',
        'font_size',
        'stripe_color', 
        'text',
        'response_text', 
    ]
    
    # 存在しない列を指定するとエラーになるため、存在する列のみに絞り込む
    final_columns = [col for col in columns_to_save if col in main_df.columns]
    final_df = main_df[final_columns]
    
    # フィルタリングおよび整形したデータをCSVとして保存
    final_df.to_csv(file_path, index=False, encoding='utf-8-sig', header=True)
    
    return jsonify(success=True)

# --- 画像生成エンドポイント ---
@app.route('/generate_image', methods=['POST'])
def generate_image():
    data = request.json
    text = data.get('text', 'EXAMPLE')
    font_size = data.get('font_size', 16)
    text_color = (0, 0, 0)
    image_width = data.get('width', 200)
    line_period = data.get('period')
    duty_cycle = data.get('duty')
    line_angle = data.get('angle')
    phase_px = 0
    alpha = data.get('blend_alpha')
    target_blur_radius = data.get('blur_radius')

    # Eye-Shieldアルゴリズムを使用して画像を生成
    image = generate_eyeshield_document_image(
        text=text,
        font_size=font_size,
        text_color=text_color,
        image_width=image_width,
        line_period=line_period,
        duty_cycle=duty_cycle,
        line_angle=line_angle,
        phase_px=phase_px,
        alpha=alpha,
        target_blur_radius=target_blur_radius
    )

    # 画像をバイナリデータとして返す
    img_io = BytesIO()
    image.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

def create_clean_background_image(width, height):
    """指定されたサイズの空白の画像を生成します。"""
    return Image.new('RGBA', (width, height), (255, 255, 255, 255))

def add_text_to_document_image(draw, text, font, text_color, image_width, image_height):
    """画像の中央にテキストを描画します。"""
    text_bbox = font.getbbox(text)
    text_actual_width, text_actual_height = text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1]
    text_x, text_y = (image_width - text_actual_width) / 2 - text_bbox[0], (image_height - text_actual_height) / 2 - text_bbox[1]
    draw.text((text_x, text_y), text, font=font, fill=text_color)

def eyeshield_stripe_blend(I_img, T_img, period_px, duty, angle_deg, phase_px=0, alpha=1.0):
    """
    Eye-Shieldアルゴリズムに基づき、元画像(I)とターゲット画像(T)を縞マスクで混合します。
    """
    I = np.asarray(I_img.convert('RGB'), dtype=np.float32) / 255.0
    T = np.asarray(T_img.resize(I_img.size, Image.Resampling.BILINEAR).convert('RGB'), dtype=np.float32) / 255.0
    h, w, _ = I.shape
    theta = math.radians(angle_deg)
    y, x = np.mgrid[0:h, 0:w]
    u = x*math.cos(theta) + y*math.sin(theta) + phase_px
    M = ((u % period_px) < (duty * period_px)).astype(np.float32)[..., None]
    O2 = I*I + alpha * M * (T*T - I*I)
    O  = np.sqrt(np.clip(O2, 0.0, 1.0))
    return Image.fromarray((O*255.0 + 0.5).astype(np.uint8))

def generate_eyeshield_document_image(text, font_size, text_color, image_width,
                                      line_period, duty_cycle, line_angle,
                                      phase_px, alpha, target_blur_radius):
    """
    指定されたパラメータに基づいて、Eye-Shield（縞版）アルゴリズムを適用した画像を生成します。
    """
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except IOError:
        font = ImageFont.load_default()

    text_bbox = font.getbbox(text)
    text_actual_height = text_bbox[3] - text_bbox[1]
    padding = 20
    img_h = text_actual_height + (padding * 2)
    img_w = image_width

    base_img_rgba = create_clean_background_image(img_w, img_h)
    draw = ImageDraw.Draw(base_img_rgba)
    add_text_to_document_image(draw, text, font, text_color, img_w, img_h)

    I_img = base_img_rgba.convert('RGB')
    T_img = I_img.filter(ImageFilter.GaussianBlur(radius=target_blur_radius))

    final_img = eyeshield_stripe_blend(
        I_img=I_img,
        T_img=T_img,
        period_px=line_period,
        duty=duty_cycle,
        angle_deg=line_angle,
        phase_px=phase_px,
        alpha=alpha
    )

    return final_img

@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    #app.run(debug=True, port=5000)
    
    # 本番環境用
    app.run(host='0.0.0.0', port=5000)