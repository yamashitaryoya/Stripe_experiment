// jsPsychの初期化
const jsPsych = initJsPsych({
    on_finish: function() {
        saveData(jsPsych.data.get().json());
        jsPsych.getDisplayElement().innerHTML = '<h2>実験は以上です</h2><hr><h2>ご協力ありがとうございます</h2>';
    }
});

// 4桁のランダムな数字を生成する関数
function generateRandomSixDigits() {
    return Math.floor(Math.random() * 9000 + 1000).toString();
}

// シャッフル関数
function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}



// -------------------------------------------------
// 実験の流れを定義
// -------------------------------------------------

// タイムライン配列
let timeline = [];


// -------------------------------------------------
// 参加者IDの入力
// -------------------------------------------------

// 参加者IDの入力セッション
const participant_id_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <h3>指示されたIDを入力してください</h3>
        <div id="pid-display" style="font-size:32px;margin-top:40px;min-height:2em;"></div>
        <h3 style="margin-top:40px">（Enterキーで確定）</h3>
    `,
    choices: "NO_KEYS",
    on_load: function() {
        let inputStr = '';
        const display = document.getElementById('pid-display');

        const handler = function(e) {
        if (e.code === 'Enter' || e.code === 'NumpadEnter') {
            e.preventDefault();
            if (inputStr.trim() === '') {
            alert('IDを入力してください');
            return;
            }
            jsPsych.finishTrial({
            response: { participant_id: inputStr.trim() },
            });
            return;
        }
        if (e.key === 'Backspace') {
            inputStr = inputStr.slice(0, -1);
        } else if (e.key.length === 1) {
            inputStr += e.key;
        }
        display.textContent = inputStr;
        };

        document.addEventListener('keydown', handler);
        window._pidHandler = handler;
    },
    on_finish: function(data) {
        if (window._pidHandler) {
        document.removeEventListener('keydown', window._pidHandler);
        delete window._pidHandler;
        }
        const participant_id = data.response?.participant_id || '';
        jsPsych.data.addProperties({ participant_id });
    },
    post_trial_gap: 500
};
timeline.push(participant_id_trial);


// -------------------------------------------------
// 実験の教示
// -------------------------------------------------


// 実験開始前の教示画面
const instructions = {
    type: jsPsychHtmlKeyboardResponse, 
    stimulus: `
        <h2>実験の手順</h2>
        <hr>
        <p>画面に表示される4桁の数字を読み取り<br>キーボードで入力してください</p>
        <p>Enterキーで確定されます</>
        <p>時間を計測していますので入力後は<br>すみやかにEnterキーを押してください</p>
        <p>判読が困難な場合は無理に入力せず<br><b>読み取れた部分</b>または<b>無記入のまま</b><br>送信してください</p>
        <br>
        <p>まず、練習を3問行います</p>
    `,
    choices: ['Enter', 'NumpadEnter'], // Enterキーで進行
    post_trial_gap: 1000,
    data: { task: 'instructions' }
};
timeline.push(instructions);



// -------------------------------------------------
// 練習セッション
// -------------------------------------------------

// 練習で使うパラメータ
const practice_parameters = [
    { period: 4, line_width: 0, angle: 0, text: '', font_size: 16, stripe_color: 128 },
    { period: 6, line_width: 1, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { period: 8, line_width: 2, angle: 45, text: '' , font_size: 16, stripe_color: 128 },
];

// 各パラメータを設定
for (let param of practice_parameters) {
    param.text = generateRandomSixDigits();
}


// 練習試行のセッション
const practice_trials = {
    timeline: practice_parameters.map((params, idx) => {
    const canvas_id = `main-canvas-${idx}`;
    const typedDivId = `${canvas_id}-typed`;
    const stim = `<div style="margin-bottom:60px;">(${idx + 1}問/${practice_parameters.length}問)</div>` +
        getStripeCanvasHTML({ canvas_id }) +
        `<div id="${typedDivId}" style="text-align:center;margin-top:120px;font-size:64px;min-height:2em"></div>`;

    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: stim,
        choices: "NO_KEYS", 
        on_load: function() {
            drawStripeCanvas({ ...params, canvas_id });
        
            const canvasElem = document.getElementById(canvas_id);
            const displayElem = document.getElementById(typedDivId);
            if (!canvasElem || !displayElem) return;

            window._typedStore = window._typedStore || {};
            window._kbHandlers = window._kbHandlers || {};
            window._typedStore[canvas_id] = '';
            displayElem.textContent = '';

            const handler = function(e) {
                if (e.key === 'Enter'|| e.code === 'NumpadEnter') {
                    e.preventDefault();
                    jsPsych.finishTrial({
                        input_text: window._typedStore[canvas_id],
                    });
                    return;
                }
                if (e.key === 'Backspace') {
                    window._typedStore[canvas_id] = window._typedStore[canvas_id].slice(0, -1);
                    displayElem.textContent = window._typedStore[canvas_id];
                    e.preventDefault();
                    return;
                }
                if (e.key.length === 1) {
                    // 数字キーのみ入力を許可
                    if (/^[0-9]$/.test(e.key)) {
                        window._typedStore[canvas_id] += e.key;
                        displayElem.textContent = window._typedStore[canvas_id];
                    }
                    // 数字以外は無視
                    else {
                        e.preventDefault();
                    }
                }
            };
            document.addEventListener('keydown', handler);
            window._kbHandlers[canvas_id] = handler;
        },
        on_finish: function(data) {
            const handler = window._kbHandlers[canvas_id];
            if (handler) document.removeEventListener('keydown', handler);

            if (!data.input_text) {
                data.input_text = window._typedStore?.[canvas_id] || '';
            }
            delete window._typedStore[canvas_id];
            delete window._kbHandlers[canvas_id];
        },
        post_trial_gap: 1000,
        data: {
            ...params,
            task: 'practice'
        }
    };
    }),
    randomize_order: false
};
timeline.push(practice_trials);


// -------------------------------------------------
// 本番セッション
// -------------------------------------------------

// 本番実験で使うパラメータ
const test_stripe_parameters = [
    { scale: '', period: 4, line_width: 0, angle: 0, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 4, line_width: 0, angle: 0, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 4, line_width: 0, angle: 0, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 6, line_width: 1, angle: 45, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 6, line_width: 2, angle: 45, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 6, line_width: 3, angle: 45, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 7, line_width: 1, angle: 45, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 7, line_width: 2, angle: 45, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 7, line_width: 3, angle: 45, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 8, line_width: 1, angle: 45, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 8, line_width: 2, angle: 45, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 8, line_width: 3, angle: 45, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 3, line_width: 2, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 4, line_width: 1, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 4, line_width: 2, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 4, line_width: 3, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 5, line_width: 1, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 5, line_width: 2, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 5, line_width: 3, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 6, line_width: 1, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 6, line_width: 2, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 6, line_width: 3, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 7, line_width: 1, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 7, line_width: 2, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 7, line_width: 3, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 7, line_width: 4, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 8, line_width: 2, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 8, line_width: 3, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 8, line_width: 4, angle: 90, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 4, line_width: 2, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 5, line_width: 1, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 5, line_width: 2, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 5, line_width: 3, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 6, line_width: 1, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 6, line_width: 2, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 6, line_width: 3, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 7, line_width: 1, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 7, line_width: 2, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 7, line_width: 3, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 8, line_width: 1, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 8, line_width: 2, angle: 135, text: '', font_size: 16, stripe_color: 128 },
    { scale: '', period: 8, line_width: 3, angle: 135, text: '', font_size: 16, stripe_color: 128 },
];

const test_distances = shuffle([ 'intended', '50cm', '75cm', '100cm' ]);


// -------------------------------------------------
// 本番検証セッション
// -------------------------------------------------

// 開始の案内
const trial_1_instruction = {
    type: jsPsychHtmlKeyboardResponse, 
    stimulus: `
        <h3>これで練習は終わりです</h3>
        <h3>次に${test_distances[0]}の検証を行います</h3>
        <h3>指示があるまで何も押さないでください</h3>
    `,
    choices: ['Enter', 'NumpadEnter'], 
    post_trial_gap: 1000,
    data: { task: 'main_start_instruction' }
};
timeline.push(trial_1_instruction);

// test_parametersをシャッフル
const trial_1_test_parameters = shuffle(test_stripe_parameters.map(param => ({ ...param })));

for (let param of trial_1_test_parameters) {
    param.text = generateRandomSixDigits();
    param.scale = test_distances[0];
}

// メインの実験ループを作成
const trial_1 = {
    timeline: trial_1_test_parameters.map((params, idx) => {
    const canvas_id = `main-canvas-${idx}`;
    const typedDivId = `${canvas_id}-typed`;
    const trialParam = { ...params };
    const stim = `<div style="margin-bottom:60px;">(${idx + 1}問/${trial_1_test_parameters.length}問)</div>` +
        getStripeCanvasHTML({ canvas_id }) +
        `<div id="${typedDivId}" style="text-align:center;margin-top:120px;font-size:64px;min-height:2em"></div>`;

    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: stim,
        choices: "NO_KEYS", 
        on_load: function() {
            drawStripeCanvas({ ...trialParam, canvas_id });
        
            const canvasElem = document.getElementById(canvas_id);
            const displayElem = document.getElementById(typedDivId);
            if (!canvasElem || !displayElem) return;

            // 開始時間を記録
            const startTime = performance.now();

            window._typedStore = window._typedStore || {};
            window._kbHandlers = window._kbHandlers || {};
            window._typedStore[canvas_id] = '';
            displayElem.textContent = '';

            const handler = function(e) {
                if (e.key === 'Enter'|| e.code === 'NumpadEnter') {
                    e.preventDefault();
                    const endTime = performance.now();
                    const rt = Math.round(endTime - startTime); // 反応時間を計算
                    jsPsych.finishTrial({
                        input_text: window._typedStore[canvas_id],
                        rt: rt   
                    });
                    return;
                }
                if (e.key === 'Backspace') {
                    window._typedStore[canvas_id] = window._typedStore[canvas_id].slice(0, -1);
                    displayElem.textContent = window._typedStore[canvas_id];
                    e.preventDefault();
                    return;
                }
                if (e.key.length === 1) {
                    // 数字キーのみ入力を許可
                    if (/^[0-9]$/.test(e.key)) {
                        window._typedStore[canvas_id] += e.key;
                        displayElem.textContent = window._typedStore[canvas_id];
                    }
                    // 数字以外は無視
                    else {
                        e.preventDefault();
                    }
                }
            };
            document.addEventListener('keydown', handler);
            window._kbHandlers[canvas_id] = handler;
        },
        on_finish: function(data) {
            const handler = window._kbHandlers[canvas_id];
            if (handler) document.removeEventListener('keydown', handler);

            if (!data.input_text) {
                data.input_text = window._typedStore?.[canvas_id] || '';
            }
            delete window._typedStore[canvas_id];
            delete window._kbHandlers[canvas_id];
        },
        post_trial_gap: 1000,
        data: {
            ...trialParam,
            task: 'main'
        }
    };
    }),
    randomize_order: false
};
timeline.push(trial_1);


// -------------------------------------------------
// 2つ目のの検証セッション
// -------------------------------------------------

// 開始の案内
const trial_2_instruction = {
    type: jsPsychHtmlKeyboardResponse, 
    stimulus: `
        <h3>これで${test_distances[0]}の検証は終わりです</h3>
        <h3>次に${test_distances[1]}の検証を行います</h3>
        <h3>指示があるまで何も押さないでください</h3>
    `,
    choices: ['Enter', 'NumpadEnter'], 
    post_trial_gap: 1000,
    data: { task: 'main_start_instruction' }
};
timeline.push(trial_2_instruction);


// test_parametersをシャッフル
const trial_2_test_parameters = shuffle(test_stripe_parameters.map(param => ({ ...param })));

// 各パラメータを設定
for (let param of trial_2_test_parameters) {
    param.text = generateRandomSixDigits();
    param.scale = test_distances[1];
}

// メインの実験ループを作成
const trial_2 = {
    timeline: trial_2_test_parameters.map((params, idx) => {
    const canvas_id = `main-canvas-${idx}`;
    const typedDivId = `${canvas_id}-typed`;
    const trialParam = { ...params };
    const stim = `<div style="margin-bottom:60px;">(${idx + 1}問/${trial_2_test_parameters.length}問)</div>` +
        getStripeCanvasHTML({ canvas_id }) +
        `<div id="${typedDivId}" style="text-align:center;margin-top:120px;font-size:64px;min-height:2em"></div>`;

    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: stim,
        choices: "NO_KEYS", 
        on_load: function() {
            drawStripeCanvas({ ...trialParam, canvas_id });
        
            const canvasElem = document.getElementById(canvas_id);
            const displayElem = document.getElementById(typedDivId);
            if (!canvasElem || !displayElem) return;

            // 開始時間を記録
            const startTime = performance.now();

            window._typedStore = window._typedStore || {};
            window._kbHandlers = window._kbHandlers || {};
            window._typedStore[canvas_id] = '';
            displayElem.textContent = '';

            const handler = function(e) {
                if (e.key === 'Enter'|| e.code === 'NumpadEnter') {
                    e.preventDefault();
                    const endTime = performance.now();
                    const rt = Math.round(endTime - startTime); // 反応時間を計算
                    jsPsych.finishTrial({
                        input_text: window._typedStore[canvas_id],
                        rt: rt   
                    });
                    return;
                }
                if (e.key === 'Backspace') {
                    window._typedStore[canvas_id] = window._typedStore[canvas_id].slice(0, -1);
                    displayElem.textContent = window._typedStore[canvas_id];
                    e.preventDefault();
                    return;
                }
                if (e.key.length === 1) {
                    // 数字キーのみ入力を許可
                    if (/^[0-9]$/.test(e.key)) {
                        window._typedStore[canvas_id] += e.key;
                        displayElem.textContent = window._typedStore[canvas_id];
                    }
                    // 数字以外は無視
                    else {
                        e.preventDefault();
                    }
                }
            };
            document.addEventListener('keydown', handler);
            window._kbHandlers[canvas_id] = handler;
        },
        on_finish: function(data) {
            const handler = window._kbHandlers[canvas_id];
            if (handler) document.removeEventListener('keydown', handler);

            if (!data.input_text) {
                data.input_text = window._typedStore?.[canvas_id] || '';
            }
            delete window._typedStore[canvas_id];
            delete window._kbHandlers[canvas_id];
        },
        post_trial_gap: 1000,
        data: {
            ...trialParam,
            task: 'main'
        }
    };
    }),
    randomize_order: false
};
timeline.push(trial_2);



// -------------------------------------------------
// 3つ目の検証セッション
// -------------------------------------------------

// 開始の案内
const trial_3_instruction = {
    type: jsPsychHtmlKeyboardResponse, 
    stimulus: `
        <h3>これで${test_distances[1]}の検証は終わりです</h3>
        <h3>次に${test_distances[2]}の検証を行います</h3>
        <h3>指示があるまで何も押さないでください</h3>
    `,
    choices: ['Enter', 'NumpadEnter'], 
    post_trial_gap: 1000,
    data: { task: 'main_start_instruction' }
};
timeline.push(trial_3_instruction);



// test_parametersをシャッフル
const trial_3_test_parameters = shuffle(test_stripe_parameters.map(param => ({ ...param })));

// 各パラメータを設定
for (let param of trial_3_test_parameters) {
    param.text = generateRandomSixDigits();
    param.scale = test_distances[2];
}

// メインの実験ループを作成
const trial_3 = {
    timeline: trial_3_test_parameters.map((params, idx) => {
    const canvas_id = `main-canvas-${idx}`;
    const typedDivId = `${canvas_id}-typed`;
    const trialParam = { ...params };
    const stim = `<div style="margin-bottom:60px;">(${idx + 1}問/${trial_3_test_parameters.length}問)</div>` +
        getStripeCanvasHTML({ canvas_id }) +
        `<div id="${typedDivId}" style="text-align:center;margin-top:120px;font-size:64px;min-height:2em"></div>`;

    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: stim,
        choices: "NO_KEYS", 
        on_load: function() {
            drawStripeCanvas({ ...trialParam, canvas_id });
        
            const canvasElem = document.getElementById(canvas_id);
            const displayElem = document.getElementById(typedDivId);
            if (!canvasElem || !displayElem) return;

            // 開始時間を記録
            const startTime = performance.now();

            window._typedStore = window._typedStore || {};
            window._kbHandlers = window._kbHandlers || {};
            window._typedStore[canvas_id] = '';
            displayElem.textContent = '';

            const handler = function(e) {
                if (e.key === 'Enter'|| e.code === 'NumpadEnter') {
                    e.preventDefault();
                    const endTime = performance.now();
                    const rt = Math.round(endTime - startTime); // 反応時間を計算
                    jsPsych.finishTrial({
                        input_text: window._typedStore[canvas_id],
                        rt: rt   
                    });
                    return;
                }
                if (e.key === 'Backspace') {
                    window._typedStore[canvas_id] = window._typedStore[canvas_id].slice(0, -1);
                    displayElem.textContent = window._typedStore[canvas_id];
                    e.preventDefault();
                    return;
                }
                if (e.key.length === 1) {
                    // 数字キーのみ入力を許可
                    if (/^[0-9]$/.test(e.key)) {
                        window._typedStore[canvas_id] += e.key;
                        displayElem.textContent = window._typedStore[canvas_id];
                    }
                    // 数字以外は無視
                    else {
                        e.preventDefault();
                    }
                }
            };
            document.addEventListener('keydown', handler);
            window._kbHandlers[canvas_id] = handler;
        },
        on_finish: function(data) {
            const handler = window._kbHandlers[canvas_id];
            if (handler) document.removeEventListener('keydown', handler);

            if (!data.input_text) {
                data.input_text = window._typedStore?.[canvas_id] || '';
            }
            delete window._typedStore[canvas_id];
            delete window._kbHandlers[canvas_id];
        },
        post_trial_gap: 1000,
        data: {
            ...trialParam,
            task: 'main'
        }
    };
    }),
    randomize_order: false
};
timeline.push(trial_3);



// -------------------------------------------------
// 4つ目の検証セッション
// -------------------------------------------------

// 開始の案内
const trial_4_instruction = {
    type: jsPsychHtmlKeyboardResponse, 
    stimulus: `
        <h3>これで${test_distances[2]}の検証は終わりです</h3>
        <h3>最後に${test_distances[3]}の検証を行います</h3>
        <h3>指示があるまで何も押さないでください</h3>
    `,
    choices: ['Enter', 'NumpadEnter'], 
    post_trial_gap: 1000,
    data: { task: 'main_start_instruction' }
};
timeline.push(trial_4_instruction);


// test_parametersをシャッフル
const trial_4_test_parameters = shuffle(test_stripe_parameters.map(param => ({ ...param })));

// 各パラメータを設定
for (let param of trial_4_test_parameters) {
    param.text = generateRandomSixDigits();
    param.scale = test_distances[3];
}

// メインの実験ループを作成
const trial_4 = {
    timeline: trial_4_test_parameters.map((params, idx) => {
    const canvas_id = `main-canvas-${idx}`;
    const typedDivId = `${canvas_id}-typed`;
    const trialParam = { ...params };
    const stim = `<div style="margin-bottom:60px;">(${idx + 1}問/${trial_4_test_parameters.length}問)</div>` +
        getStripeCanvasHTML({ canvas_id }) +
        `<div id="${typedDivId}" style="text-align:center;margin-top:120px;font-size:64px;min-height:2em"></div>`;

    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: stim,
        choices: "NO_KEYS", 
        on_load: function() {
            drawStripeCanvas({ ...trialParam, canvas_id });
        
            const canvasElem = document.getElementById(canvas_id);
            const displayElem = document.getElementById(typedDivId);
            if (!canvasElem || !displayElem) return;

            // 開始時間を記録
            const startTime = performance.now();

            window._typedStore = window._typedStore || {};
            window._kbHandlers = window._kbHandlers || {};
            window._typedStore[canvas_id] = '';
            displayElem.textContent = '';

            const handler = function(e) {
                if (e.key === 'Enter'|| e.code === 'NumpadEnter') {
                    e.preventDefault();
                    const endTime = performance.now();
                    const rt = Math.round(endTime - startTime); // 反応時間を計算
                    jsPsych.finishTrial({
                        input_text: window._typedStore[canvas_id],
                        rt: rt   
                    });
                    return;
                }
                if (e.key === 'Backspace') {
                    window._typedStore[canvas_id] = window._typedStore[canvas_id].slice(0, -1);
                    displayElem.textContent = window._typedStore[canvas_id];
                    e.preventDefault();
                    return;
                }
                if (e.key.length === 1) {
                    // 数字キーのみ入力を許可
                    if (/^[0-9]$/.test(e.key)) {
                        window._typedStore[canvas_id] += e.key;
                        displayElem.textContent = window._typedStore[canvas_id];
                    }
                    // 数字以外は無視
                    else {
                        e.preventDefault();
                    }
                }
            };
            document.addEventListener('keydown', handler);
            window._kbHandlers[canvas_id] = handler;
        },
        on_finish: function(data) {
            const handler = window._kbHandlers[canvas_id];
            if (handler) document.removeEventListener('keydown', handler);

            if (!data.input_text) {
                data.input_text = window._typedStore?.[canvas_id] || '';
            }
            delete window._typedStore[canvas_id];
            delete window._kbHandlers[canvas_id];
        },
        post_trial_gap: 1000,
        data: {
            ...trialParam,
            task: 'main'
        }
    };
    }),
    randomize_order: false
};
timeline.push(trial_4);


// 実験を実行
jsPsych.run(timeline);