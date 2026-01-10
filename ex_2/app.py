import os
import re
import pandas as pd 
from flask import Flask, request, jsonify

# --- Flaskアプリケーション ---
app = Flask(__name__, static_folder='public', static_url_path='')

# --- データ保存エンドポイント ---
@app.route('/save_data', methods=['POST'])
def save_data():
    if not os.path.exists('ex_2/data'):
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
    file_path = f'ex_2/data/results_{safe_participant_id}.csv'
    
    # 重複ファイル名対応 ---
    count = 2
    while os.path.exists(file_path):
        file_path = f'ex_2/data/results_{safe_participant_id}_{count}.csv'
        count += 1
    
    # 反応時間(rt)をtimeにリネーム
    if 'rt' in main_df.columns:
        main_df.rename(columns={'rt': 'time'}, inplace=True)

    
    # 保存する列を定義
    columns_to_save = [
        'participant_id',
        'time', 
        'scale',
        'period', 
        'line_width',
        'duty',
        'angle',
        'font_size',
        'stripe_color', 
        'text',
        'input_text', 
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