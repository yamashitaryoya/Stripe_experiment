let last_trial = -1;

function updateDisplay() {
    fetch('/get_trial')
        .then(res => res.json())
        .then(data => {
            if (!data.test_parameters || data.test_parameters.length === 0) return;
            const idx = data.current_trial;
            if (idx !== last_trial && idx < data.test_parameters.length) {
                last_trial = idx;
                const params = data.test_parameters[idx];
                const canvas_id = "display-canvas";
                document.getElementById("canvas-container").innerHTML =
                    `<canvas id="${canvas_id}" width="200" height="60"></canvas>`;
                drawStripeCanvas({...params, canvas_id});
            }
        });
}

// 100msごとに状態を確認
setInterval(updateDisplay, 100);