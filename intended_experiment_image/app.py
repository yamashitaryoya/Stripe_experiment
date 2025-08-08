import io
import os
import math
import re
import pandas as pd 
from flask import Flask, request, send_file, jsonify
from PIL import Image, ImageDraw, ImageFont

# --- 画像生成ロジック---
FONT_PATH = "C:/Windows/Fonts/arial.ttf" 

def generate_dynamic_image(text, font_size, line_period, duty_cycle, line_angle):
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except IOError:
        print(f"Warning: Font not found at {FONT_PATH}. Using default font.")
        font = ImageFont.load_default()
    text_bbox = font.getbbox(text)
    text_w, text_h = text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1]
    padding = 20
    img_w, img_h = text_w + (padding * 2), text_h + (padding * 2)
    img = Image.new('RGBA', (img_w, img_h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    text_color = (0, 0, 0, 255)
    draw.text((padding - text_bbox[0], padding - text_bbox[1]), text, font=font, fill=text_color)
    line_color = (200, 200, 200, 255)
    line_width = int(line_period * duty_cycle)
    if line_width > 0:
        max_dim = int(math.sqrt(img_w**2 + img_h**2))
        center_x, center_y = img_w / 2, img_h / 2
        angle_rad = math.radians(line_angle)
        cos_a, sin_a = math.cos(angle_rad), math.sin(angle_rad)
        for i in range(-max_dim, max_dim, line_period):
            p1_x = -max_dim * cos_a - i * sin_a + center_x
            p1_y = -max_dim * sin_a + i * cos_a + center_y
            p2_x = max_dim * cos_a - i * sin_a + center_x
            p2_y = max_dim * sin_a + i * cos_a + center_y
            draw.line([(p1_x, p1_y), (p2_x, p2_y)], fill=line_color, width=line_width)
    return img

# --- Flaskアプリケーション ---
app = Flask(__name__, static_folder='public', static_url_path='')

@app.route('/generate_image')
def image_generator():
    text = request.args.get("text")
    font_size = int(request.args.get("font_size"))
    line_period = int(request.args.get("period"))
    duty_cycle = float(request.args.get("duty"))
    line_angle = float(request.args.get("angle"))
    img = generate_dynamic_image(text, font_size, line_period, duty_cycle, line_angle)
    img_io = io.BytesIO()
    img.save(img_io, 'PNG', compress_level=0)
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

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

    # 参加者IDを取得してファイル名を決定
    participant_id = main_df['participant_id'].iloc[0]
    safe_participant_id = re.sub(r'[\\/*?:"<>|]', "", participant_id)
    file_path = f'data/results_{safe_participant_id}.csv'
    
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
        'text',
        'response_text', 
    ]
    
    # 存在しない列を指定するとエラーになるため、存在する列のみに絞り込む
    final_columns = [col for col in columns_to_save if col in main_df.columns]
    final_df = main_df[final_columns]
    
    # フィルタリングおよび整形したデータをCSVとして保存
    final_df.to_csv(file_path, index=False, encoding='utf-8-sig', header=True)
    
    return jsonify(success=True)

@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    # ローカル開発用
    #app.run(debug=True, port=5000)
    
    # 本番環境用
    app.run(host='0.0.0.0', port=5000)