// データ保存用の関数 
function saveData(jsonData) {
    // 受け取ったJSONデータをパース
    const data = JSON.parse(jsonData);
    // 不要なプロパティを除外
    const cleanedData = data.map(({ stimulus, ...rest }) => rest);
    fetch('/save_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData) 
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('データの保存に失敗しました。');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}