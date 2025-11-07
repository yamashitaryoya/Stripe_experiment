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
            
        <h3>問い合わせ先</h3>
        <p>本研究に関するご質問は、以下の連絡先までお願いいたします。<br>
        メールアドレス: b222430@photon.chitose.ac.jp
        </p>
        <hr>
    `,
    choices: ['上記の内容に同意し、実験を開始する'],
    post_trial_gap: 500,
};
timeline.push(consent_trial);



// 参加者IDの入力セッション
const participant_id_trial = {
    type: jsPsychSurveyText,
    questions: [
        {prompt: '氏名を入力してください', name: 'participant_id', required: true}
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
timeline.push(participant_id_trial);


// 画面の明るさ調整のお願い
const brightness_instruction = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h3>画面の明るさ調整のお願い</h3>
        <hr>
        <p>正確な実験のため同じ環境で<br>参加いただく必要がございます。</p>
        <p><strong>画面の明るさを最大（100%）</strong><br>に設定してください。</p>
        <br>
        <p>設定が終わりましたら、次に進んでください。</p>
    `,
    choices: ['設定しました'],
    post_trial_gap: 500,
    data: { task: 'brightness_instruction' }
};
timeline.push(brightness_instruction);


// 実験開始前の教示画面
const instructions = {
    type: jsPsychHtmlButtonResponse, 
    stimulus: `
        <h2>可読性実験</h2>
        <hr>
        <p>画面に表示される文字列を読み取り<br>入力欄に入力してください。</p>
        <p>時間を計測していますので入力後は<br>すみやかに回答ボタンを押してください。</p>
        <br>
        <p><strong>注意事項</strong></p>
        <ul>
            <li>入力するアルファベットの大文字小文字は問いません</li>
            <li>キーボード入力の予測変換機能は使用しないでください</li>
            <li>Webサイトの拡大及び縮小はしないでください</li>
        </ul>
        <br>
        <p>まず、練習を2問行います。</p>
    `,
    choices: ['練習をはじめる'], 
    post_trial_gap: 1000,
    data: { task: 'instructions' }
};
timeline.push(instructions);


// 練習で使うパラメータ
const practice_parameters = [
    { period: 4, duty: 0.3, angle: 45, text: 'PRACTICE', font_size: 16, stripe_color: 128 },
    { period: 3, duty: 0.1, angle: 135, text: 'EXAMPLE' , font_size: 16, stripe_color: 0 },
];


// 練習試行のセッション
const practice_trials = {
    timeline: practice_parameters.map((params, idx) => {
        // canvas_idをユニークに
        const canvas_id = `practice-canvas-${idx}`;
        return {
            type: jsPsychSurveyText,
            preamble: getStripeCanvasHTML({canvas_id}),
            on_load: function() {
                drawStripeCanvas({
                    ...params,
                    canvas_id
                });
            },
            questions: [
                {prompt: '読み取った文字列を入力してください', name: 'response_text', required: true}
            ],
            data: {
                ...params,
                task: 'practice'
            },
            post_trial_gap: 1000,
        };
    })
};
timeline.push(practice_trials);


// 練習終了と本番開始の案内
const no_stripe_instruction = {
    type: jsPsychHtmlButtonResponse, 
    stimulus: `
        <p>これで練習は終わりです。</p>
        <p>次に無加工の検証セッションが始まります。</p>
    `,
    choices: ['はじめる'], 
    post_trial_gap: 1000,
    data: { task: 'main_start_instruction' }
};
timeline.push(no_stripe_instruction);

// -------------------------------------------------
// 縞模様なしの検証セッション
// -------------------------------------------------

// 縞模様なしの検証セッション用パラメータ
const no_stripe_parameters = [
    { period: 4, duty: 0, angle: 0, text: "TABLES", font_size: 16, stripe_color: 200 },
    { period: 4, duty: 0, angle: 0, text: 'LITTLE', font_size: 16, stripe_color: 200 },
    { period: 4, duty: 0, angle: 0, text: 'FISHES', font_size: 16, stripe_color: 200 },
];

// 縞模様なしの検証セッション
const no_stripe_trials = {
    timeline: no_stripe_parameters.map((params, idx) => {
        const canvas_id = `no-stripe-canvas-${idx}`;
        return {
            type: jsPsychSurveyText,
            preamble: `<div style="margin-bottom:8px;">(${idx + 1}問/${no_stripe_parameters.length}問)</div>` +
                getStripeCanvasHTML({ canvas_id }),
            on_load: function() {
                drawStripeCanvas({
                    ...params,
                    canvas_id
                });
            },
            questions: [
                { prompt: '読み取った文字列を入力してください', name: 'response_text', required: true }
            ],
            post_trial_gap: 500,
            data: {
                ...params,
                task: 'main' // データを保存するためにtaskを'main'に設定
            }
        };
    })
};
timeline.push(no_stripe_trials);


// 練習終了と本番開始の案内
const main_start_instruction = {
    type: jsPsychHtmlButtonResponse, 
    stimulus: `
        <p>これで無加工の検証セッションは終わりです。</p>
        <p>次に加工の検証セッションが始まります。</p>
    `,
    choices: ['はじめる'], 
    post_trial_gap: 1000,
    data: { task: 'main_start_instruction' }
};
timeline.push(main_start_instruction);


// -------------------------------------------------
// 本番セッション
// -------------------------------------------------


// 本番実験で使うパラメータ
const angles = [0,45,90,135];
const duties = [0.1, 0.3, 0.5];
const stripe_colors = [128, 200]; 
const periods = [3, 4];
const font_size = 16;
const texts = [
    "ANIMAL", "BOTTLE", "BUTTON", "CANDLE", "CIRCLE",
    "COOKIE", "DOCTOR", "ELEVEN", "FAMILY", "FATHER",
    "FLOWER", "FRIDAY", "FRIEND", "GARDEN", "GUITAR",
    "HAMMER", "HANDLE", "HEALTH", "INSECT", "JACKET",
    "JUNGLE", "JUMPER", "KITTEN", "LADDER", "LITTLE",
    "MARKET", "MOTHER", "MONKEY", "NATION", "NUMBER",
    "OBJECT", "OFFICE", "ORANGE", "PENCIL", "PEOPLE",
    "PLANET", "POCKET", "POLICE", "POTATO", "PUZZLE",
    "QUOTES", "QUAINT", "QUIZZY", "RABBIT", "REMOTE",
    "REWARD", "RULERS", "SALMON", "SCHOOL", "SCREEN",
    "SEASON", "SHOULD", "SILENT", "SISTER", "SLEEPY",
    "SMILED", "SNAKES", "SQUARE", "STOMPS", "SUGARS",
    "SUMMER", "SUNDAY", "TABLES", "TENNIS", "THEORY",
    "THIRST", "THINGS", "TIGERS", "TOMATO", "TOUCHY",
    "TOWELS", "TRAVEL", "TROPHY", "TUNNEL", "TURKEY",
    "UNLOCK", "UNSEEN", "USEFUL", "VISION", "VOICES",
    "VOLUME", "WALKED", "WARMTH", "WATERY", "WEAPON",
    "WEIGHT", "WINDOW", "WINTER", "WONDER", "WORKER",
    "YELLOW", "YAWNED", "YOGURT", "YOUNGS", "YIELDS",
    "ZEBRAS", "ZEALOT", "ZINGER", "ZIPPED", "ZIPPER",
    "ACTORS", "BRIDGE", "BASKET", "CLOUDY", "DRAGON",
    "DINNER", "EASTER", "FINGER", "FROZEN", "GLOVES",
    "GHOSTS", "HUNTER", "ISLAND", "IMPACT", "JELLYS",
    "JUMPED", "KINDLY", "KNIGHT", "LEMONS", "LETTER",
    "MARKER", "MAGNET", "MONDAY", "NATURE", "NEEDLE",
    "OCEANS", "PRISON", "PLAYER", "PIRATE", "QUEENS",
    "QUICKY", "ROCKET", "RUNNER", "RACING", "SEWING",
    "STONEY", "SINGER", "SPOONS", "TARGET", "TICKET",
    "TIMBER", "TUNING", "UNITED", "URBANS", "VACUUM",
    "VALLEY", "VISITS", "WOLVES", "FRUITS", "WHEELS",
    "XENONS", "XMARKS", "XYLOPH", "ZENITH", "ZAPPED",
    "ZOMBIE", "BANANA", "BRICKS", "CARTON", "CHERRY",
    "DEEPER", "DESERT", "DRIVER", "DOUBTS", "EAGLES",
    "EDITOR", "ENERGY", "FOSSIL", "FRAMES", "FISHES",
    "GRAPES", "GROWTH", "GROUND", "HEARTS", "HOPELY",
    "ICICLE", "IRONED", "INCOME", "JOURNY", "JIGSAW",
    "KARATE", "LIVING", "LOCATE", "LUNCHY", "MOUNTS",
    "NICKEL", "NIGHTS", "OPENER", "OPTICS", "ORCHID",
    "PRAYER", "PYTHON", "RANGER", "RIVERS", "RISING",
    "SWORDS", "SPICES", "TOWERS", "TWILIT", "TRICKS"
];



// シャッフル関数
function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 組み合わせを複数回作る
let param_pairs = [];
angles.forEach(angle => {
    duties.forEach(duty => {
        stripe_colors.forEach(stripe_color => {
            periods.forEach(period => {
                param_pairs.push({ angle, duty, stripe_color , period });
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
    stripe_color: pair.stripe_color,
    text: shuffled_texts[idx],
    font_size: font_size,
}));

// test_parametersをシャッフル
test_parameters = shuffle(test_parameters);

// メインの実験ループを作成
const trials = {
    timeline: test_parameters.map((params, idx) => {
        const canvas_id = `main-canvas-${idx}`;
        return {
            type: jsPsychSurveyText,
            preamble: `<div style="margin-bottom:8px;">(${idx + 1}問/${test_parameters.length}問)</div>` +
                getStripeCanvasHTML({ canvas_id }),
            on_load: function() {
                drawStripeCanvas({
                    ...params,
                    canvas_id
                });
            },
            questions: [
                { prompt: '読み取った文字列を入力してください', name: 'response_text', required: true }
            ],
            post_trial_gap: 1000,
            data: {
                ...params,
                task: 'main'
            }
        };
    }),
    randomize_order: false
};
timeline.push(trials);


// 実験を実行
jsPsych.run(timeline);