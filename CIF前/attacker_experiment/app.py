import os
import re
import pandas as pd 
from flask import Flask, request, jsonify

# --- Flaskアプリケーション ---
app = Flask(__name__, static_folder='public', static_url_path='')

# --- 状態保存用 ---
import threading
state_lock = threading.Lock()
experiment_state = {
    "current_trial": 0,
    "test_parameters": []
}

@app.route('/set_trial', methods=['POST'])
def set_trial():
    global experiment_state
    data = request.json
    with state_lock:
        experiment_state["current_trial"] = data.get("current_trial", 0)
        if "test_parameters" in data:
            experiment_state["test_parameters"] = data["test_parameters"]
    return jsonify(success=True)

@app.route('/get_trial', methods=['GET'])
def get_trial():
    global experiment_state
    with state_lock:
        return jsonify(
            current_trial=experiment_state["current_trial"],
            test_parameters=experiment_state["test_parameters"]
        )

# --- データ保存エンドポイント ---
@app.route('/save_data', methods=['POST'])
def save_data(): 
    if not os.path.exists('data'):
        os.makedirs('data')

    data = request.json
    if not data:
        return jsonify(success=False, error="データがありません。"), 400

    df = pd.json_normalize(data)
    main_df = df[df.get('task') == 'main'].copy() if 'task' in df.columns else pd.DataFrame()

    if main_df.empty:
        return jsonify(success=True, message="本番データがなかったため、ファイルは保存されませんでした。")

    participant_id = main_df['participant_id'].iloc[0] if 'participant_id' in main_df.columns else "unknown"
    safe_participant_id = re.sub(r'[\\/*?:"<>|]', "", str(participant_id))
    file_path = f'data/attacker_results_{safe_participant_id}.csv'

    # 重複ファイル名対応 ---
    count = 2
    while os.path.exists(file_path):
        file_path = f'data/attacker_results_{safe_participant_id}_{count}.csv'
        count += 1

    if 'rt' in main_df.columns:
        main_df = main_df.rename(columns={'rt': 'time'})
    if 'response.response_text' in main_df.columns:
        main_df['response_text'] = main_df['response.response_text']

    columns_to_save = [
        'participant_id', 'time', 'period', 'duty', 'angle', 'font_size', 'stripe_color', 'text','response_text'
    ]
    final_columns = [col for col in columns_to_save if col in main_df.columns]
    final_df = main_df[final_columns]
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