import os
import pandas as pd

# resultsフォルダ内のファイルリストを取得
folder_path = '縞模様_A_scale0.5_pytesseract_大_200'
# .csvで終わるすべてのファイルを取得
file_list = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.endswith('.csv')]

# 各ファイルを読み込み、データフレームのリストを作成
df_list = []
for file in file_list:
    try:
        df = pd.read_csv(file)
        df_list.append(df)
        print(f"Successfully read {file}")
    except Exception as e:
        print(f"Error reading {file}: {e}")
        
        
text_color = 200
        
# データフレームを結合
if df_list:
    combined_df = pd.concat(df_list, ignore_index=True)
    
    combined_df["text_color"] = text_color
    
    # 最初にファイルパスを完成させる
    output_path = f"{folder_path}/combined_results_{text_color}.csv"
    
    # 完成した1つのパスを to_csv に渡す
    combined_df.to_csv(output_path, index=False)

    print(f"ファイルを {output_path} に保存しました。")