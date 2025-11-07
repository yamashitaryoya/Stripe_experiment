// jsPsychの初期化
const jsPsych = initJsPsych({
    on_finish: function() {
        saveData(jsPsych.data.get().json());
        jsPsych.getDisplayElement().innerHTML = '<h2>ご協力ありがとうございました。</h2><p>このウィンドウは閉じて構いません。</p>';
    }
});

// タイムライン（実験の流れ）を格納する配列
let timeline = [];

// 同意確認のセッション
const consent_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>研究へのご協力のお願い</h2>

        <p>以下の説明をお読みいただき、研究への参加にご同意いただける場合は、「同意して実験を開始する」ボタンを押してください。</p>
        <hr>
            
        <h3>研究の目的</h3>
        <p>本研究は、特定の視覚条件下における文字列の可読性を評価することを目的としています。</p>
            
        <h3>実験の内容</h3>
        <p>画面に表示される文字列を読み取り、入力欄に記入していただきます。回答の正確さと反応時間が記録されます。</p>
            
        <h3>取得するデータとプライバシーの保護</h3>
        <p>本実験では、以下の情報を取得します：</p>
        <ul>
            <li>はじめに入力いただく参加者氏名</li>
            <li>各課題におけるあなたの回答内容</li>
            <li>各課題におけるあなたの反応時間</li>
        </ul>
        <p>
            収集されたデータは厳重に管理し、統計的な処理にのみ利用します。結果を公表する際には、個人が特定できる形で公開することは一切ありません。
        </p>

        <h3>参加の任意性</h3>
        <p>この実験への参加は任意です。いつでも理由を問わず実験を中断することができます。</p>
            
        <h3>問い合わせ先</h3>
        <p>本研究に関するご質問は、以下の連絡先までお願いいたします。<br>
           メールアドレス: b222430@photon.chitose.ac.jp
        </p>
        <hr>
    `,
    choices: ['上記の内容に同意し、実験を開始する'],
    post_trial_gap: 500,
};
//timeline.push(consent_trial);



// 参加者IDの入力セッション
const participant_id_trial = {
    type: jsPsychSurveyText,
    questions: [
        {prompt: '氏名を入力してください:', name: 'participant_id', required: true}
    ],
    data: {
        task: 'participant_id_entry'
    },
    on_finish: function(data) {
        // 入力されたIDを、これ以降の全ての試行データにプロパティとして追加する
        const participant_id = data.response.participant_id;
        jsPsych.data.addProperties({participant_id: participant_id});
    },
    post_trial_gap: 500,
};
//timeline.push(participant_id_trial);


// 画面の明るさ調整のお願い
const brightness_instruction = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h3>画面の明るさ調整のお願い</h3>
        <p>正確な実験のため同じ環境で<br>参加いただく必要がございます。</p>
        <p><strong>画面の明るさを最大（100%）</strong><br>に設定してください。</p>
        <br>
        <p>設定が終わりましたら、次に進んでください。</p>
    `,
    choices: ['設定しました'],
    post_trial_gap: 500,
    data: { task: 'brightness_instruction' }
};
//timeline.push(brightness_instruction);


// 実験開始前の教示画面
const instructions = {
    type: jsPsychHtmlButtonResponse, 
    stimulus: `
        <h2>可読性実験へようこそ</h2>
        <p>画面に表示される文字列を読み取り<br>入力欄に入力してください。</p>
        <p>時間を計測していますので入力後は<br>すみやかに回答ボタンを押してください。</p>
        <br>
        <p>まず、練習を2問行います。</p>
    `,
    choices: ['練習をはじめる'], 
    post_trial_gap: 1000,
    data: { task: 'instructions' }
};
//timeline.push(instructions);




// 練習で使うパラメータ
const practice_parameters = [
    { period: 4, duty: 0.3, angle: 45, text: 'PRACTICE', font_size: 16, phase_px: 0, alpha: 1.0, target_blur_radius: 2 },
    { period: 6, duty: 0.4, angle: 60, text: 'EXAMPLE' , font_size: 16, phase_px: 0, alpha: 1.0, target_blur_radius: 2 },
];


// 練習試行のセッション
const practice_trials = {
    timeline: practice_parameters.map(params => {
        return {
            type: jsPsychSurveyText,
            preamble: () => {
                const imageUrl = `/generate_image?period=${params.period}&duty=${params.duty}&angle=${params.angle}&text=${params.text}&font_size=${params.font_size}&phase_px=${params.phase_px}&alpha=${params.alpha}&target_blur_radius=${params.target_blur_radius}`;
                // キャッシュを避けるためにタイムスタンプを追加
                return `<img src="${imageUrl}&t=${new Date().getTime()}">`;
            },
            questions: [
                {prompt: '読み取った文字列を入力してください:', name: 'response_text', required: true}
            ],
            data: {
                ...params, // パラメータをデータとして保存
                task: 'practice' // この試行が練習であることを示す
            },
            choices: ['回答する'],
            post_trial_gap: 1000,
        };
    })
};
//timeline.push(practice_trials);

// 練習終了と本番開始の案内
const main_start_instruction = {
    type: jsPsychHtmlButtonResponse, 
    stimulus: `
        <p>これで練習は終わりです。</p>
        <p>次に本番が始まります。</p>
    `,
    choices: ['本番をはじめる'], 
    post_trial_gap: 1000,
    data: { task: 'main_start_instruction' }
};
timeline.push(main_start_instruction);


// -------------------------------------------------
// 本番セッション
// -------------------------------------------------


const angles = [0,45,90,135];
const duties = [0.4,0.5,0.6];
const periods = [4];
const font_size = 16;
const phase_pxs =[1];
const alphas = [0.8];
const target_blur_radiuss = [1];
    const texts = [
    "ABSENCE", "AMAZING", "ARCHIVE", "ARRIVAL", "AIRPORT",
    "BALANCE", "BANQUET", "BATTERY", "BENEFIT", "BUILDER",
    "CABINET", "CALIBER", "CARRIER", "CONCERT", "CRYSTAL",
    "DEFAULT", "DELIVER", "DENSITY", "DIAMOND", "DILEMMA",
    "EARLIER", "ECLIPSE", "EMOTION", "EDITION", "EXHIBIT",
    "FAILURE", "FICTION", "FINANCE", "FOREVER", "FREEDOM",
    "GALLERY", "GARMENT", "GENERAL", "GLIMPSE", "GRAVITY",
    "HALLWAY", "HARVEST", "HEALTHY", "HONESTY", "HOUSING",
    "ICEBERG", "ICONIFY", "IMAGINE", "IMPROVE", "INSTALL",
    "JOURNEY", "JUSTICE", "JUBILEE", "JAVELIN", "JEOPARDY",
    "KITCHEN", "KINGDOM", "KEYWORD", "KISSING", "KIDNEYS",
    "LANDING", "LAWYERS", "LETTERS", "LIBRARY", "LOGICAL",
    "MACHINE", "MANAGER", "MARRIED", "MEANING", "MUSICAL",
    "NATURAL", "NETWORK", "NOTABLE", "NUCLEAR", "NUMBERS",
    "OBSCURE", "OFFLINE", "OPINION", "OUTCOME", "OVERLAP",
    "PACKAGE", "PASSAGE", "PATIENT", "PICTURE", "PROTECT",
    "QUALITY", "QUANTUM", "QUICKLY", "QUOTING", "QUIZZES",
    "READERS", "REALITY", "REBOUND", "RESOLVE", "REVENUE",
    "SCIENCE", "SHELTER", "SIGNALS", "SPECIAL", "STRETCH",
    "TEACHER", "TEXTURE", "THOUGHT", "TUNNELS", "TROUBLE",
    "UNIFORM", "UPGRADE", "UPSCALE", "UTILITY", "UNCOVER",
    "VARIETY", "VENTURE", "VICTORY", "VISIBLE", "VOLTAGE",
    "WARRIOR", "WEALTHY", "WILLING", "WITNESS", "WONDERED",
    "YAWNING", "YEARNED", "YOUNGER", "YELLING", "YANKING",
    "ZEALOTS", "ZEPHYRS", "ZEROING", "ZIPPING", "ZODIACS"
    ]


 // シャッフルする関数
function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 組み合わせを作る
let param_pairs = [];
angles.forEach(angle => {
    duties.forEach(duty => {
        periods.forEach(period => {; 
            phase_pxs.forEach(phase_px => {
                alphas.forEach(alpha => {
                    target_blur_radiuss.forEach(target_blur_radius => {
                        param_pairs.push({angle, duty, period, phase_px, alpha, target_blur_radius});
                    });
                });
            });
        });
    });
});

// テキストをランダムに必要数だけ選ぶ
const texts_needed = param_pairs.length;
const shuffled_texts = shuffle(texts).slice(0, texts_needed);

// test_parametersを作成
let test_parameters = param_pairs.map((pair, idx) => ({
    period: pair.period,
    duty: pair.duty,
    angle: pair.angle,
    text: shuffled_texts[idx],
    font_size: font_size,
    phase_px: pair.phase_px,
    alpha: pair.alpha,
    target_blur_radius: pair.target_blur_radius
}));

test_parameters = shuffle(test_parameters); // 最終的なパラメータをシャッフル

// メインの実験ループを作成
const trials = {
    timeline: test_parameters.map((params, idx) => {
        return {
            type: jsPsychSurveyText,
            preamble: () => {
                const imageUrl = `/generate_image?period=${params.period}&duty=${params.duty}&angle=${params.angle}&text=${params.text}&font_size=${params.font_size}&phase_px=${params.phase_px}&alpha=${params.alpha}&target_blur_radius=${params.target_blur_radius}`;
                return `<div style="margin-bottom:8px;">(${idx + 1}問目/${test_parameters.length}問中)</div> 
                        <img src="${imageUrl}&t=${new Date().getTime()}">` + 
                        `<div style="margin-top:8px;"> period: ${params.period}, duty: ${params.duty}, angle: ${params.angle}</div>`;
            },
            questions: [
                {prompt: '読み取った文字列を入力してください:', name: 'response_text', required: true}
            ],
            choices: ['回答する'],
            post_trial_gap: 1000,
            data: {
                ...params, 
                task: 'main' // この試行が本番であることを示す
            }
        };
    }),
};
timeline.push(trials);


// データ保存用の関数 
function saveData(jsonData) {
    // jsPsychが出力するJSONは既にオブジェクトの配列なのでパースは不要
    const data = JSON.parse(jsonData);

    // stimulusプロパティは長くなる可能性があるので、保存データから除外する
    // trial_indexなどの不要なプロパティもここで除外可能
    const cleanedData = data.map(trial => {
        const { stimulus, ...rest } = trial;
        return rest;
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

// 実験を実行
jsPsych.run(timeline);