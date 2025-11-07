// データ保存用の関数 
function saveData(jsonData) {
    // 受け取ったJSONデータをパース
    const data = JSON.parse(jsonData);

    // stimulusプロパティは長くなる可能性があるので、保存データから除外する
    // trial_indexなどの不要なプロパティもここで除外可能
    const cleanedData = data.map(trial => {
        const { stimulus, ...rest } = trial;
        return rest; // stripe_colorは既にデータに含まれるため変更不要
    });

    fetch('/save_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
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
