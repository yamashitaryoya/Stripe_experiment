import os
import pandas as pd
from Levenshtein import distance

# データフォルダのパス
data_folder = 'ex_1/data'

# データフォルダ内のすべてのCSVファイルを取得
csv_files = [f for f in os.listdir(data_folder) if f.endswith('.csv')]

# 各CSVファイルを処理
for file_name in csv_files:
    file_path = os.path.join(data_folder, file_name)
    
    # CSVファイルを読み込む
    df = pd.read_csv(file_path)
    
    # 必要な列が存在するか確認
    if 'text' in df.columns and 'input_text' in df.columns:
        # Levenshtein距離に基づいて精度を計算
        def calculate_accuracy(row):
            original_text = str(row['text']).lower()
            response_text = str(row['input_text']).lower()
            lev_distance = distance(original_text, response_text)
            return 1.0 - (lev_distance / len(original_text)) if len(original_text) > 0 else 0.0
        
        # 新しい列 'accuracy' を追加
        df['accuracy'] = df.apply(calculate_accuracy, axis=1)
        
        df['TorF'] = df['accuracy'].apply(lambda x: 'T' if x == 1.0 else 'F')
        
        # 加工後のデータを同じファイルに保存
        df.to_csv(f"ex_1/edit_data/edit_{file_name}", index=False, encoding='utf-8-sig')
        print(f"Processed and updated: {file_name}")
    else:
        print(f"Skipped (missing columns): {file_name}")