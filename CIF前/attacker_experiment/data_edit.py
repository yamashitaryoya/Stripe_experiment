import os
import pandas as pd
from Levenshtein import distance

# データフォルダのパス
data_folder = 'data'

# データフォルダ内のすべてのCSVファイルを取得
csv_files = [f for f in os.listdir(data_folder) if f.endswith('.csv')]

# 各CSVファイルを処理
for file_name in csv_files:
    file_path = os.path.join(data_folder, file_name)
    
    # CSVファイルを読み込む
    df = pd.read_csv(file_path)
    
    df['type'] = 'attacker'  # 新しい列 'type' を追加
    
    # Vision_level 列を初期化します
    df['vision_level'] = None

    # 被験者IDに基づいてVision_levelを設定します
    df.loc[df['participant_id'] == '戸澤直哉', 'vision_level'] = 8
    df.loc[df['participant_id'] == '福本渉樹', 'vision_level'] = 6
    df.loc[df['participant_id'] == '小泉拓夢', 'vision_level'] = 6
    df.loc[df['participant_id'] == '阿部智信', 'vision_level'] = 7
    df.loc[df['participant_id'] == '米田虎汰郎', 'vision_level'] = 6
    df.loc[df['participant_id'] == '山平竜世', 'vision_level'] = 6
    
    # 必要な列が存在するか確認
    if 'text' in df.columns and 'response_text' in df.columns:
        # Levenshtein距離に基づいて精度を計算
        def calculate_accuracy(row):
            original_text = str(row['text']).lower()
            response_text = str(row['response_text']).lower()
            lev_distance = distance(original_text, response_text)
            return 1.0 - (lev_distance / len(original_text)) if len(original_text) > 0 else 0.0
        
        # 新しい列 'accuracy' を追加
        df['accuracy'] = df.apply(calculate_accuracy, axis=1)
        
        # 加工後のデータを同じファイルに保存
        df.to_csv(file_path, index=False, encoding='utf-8-sig')
        print(f"Processed and updated: {file_name}")
    else:
        print(f"Skipped (missing columns): {file_name}")