        // JavaScript to handle tab switching
        function openTab(event, tabName) {
            var i, tabcontent, tabbuttons;

            // Hide all tab content
            tabcontent = document.getElementsByClassName("tab-content");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].classList.remove("active");
            }

            // Remove active class from all buttons
            tabbuttons = document.getElementsByClassName("tab-button");
            for (i = 0; i < tabbuttons.length; i++) {
                tabbuttons[i].classList.remove("active");
            }

            // Show the selected tab content and set the button as active
            document.getElementById(tabName).classList.add("active");
            event.currentTarget.classList.add("active");
        }

        // Set default active tab
        window.onload = function() {
            document.getElementsByClassName('tab-button')[0].click();
        };

function toggleDropdown(button) {
    const content = button.nextElementSibling;
    if (content.style.display === "none" || content.style.display === "") {
        content.style.display = "block";
        button.textContent = "▲";
    } else {
        content.style.display = "none";
        button.textContent = "▼";
    }
}

function updateRangeValue(value) {
    const rangeValue = 100 - value;
    let rangeStr = "Close"
    if(rangeValue > 55) {
        rangeStr = "Full Field";
    } else if(rangeValue > 40) {
        rangeStr = "Half Field"
    } else if(rangeValue > 28) {
        rangeStr = "Far"
    } else if(rangeValue > 12) {
        rangeStr = "Medium"
    } 
    document.getElementById('range-value').textContent = rangeValue + " " + rangeStr;

    calculateScore()
}

function calculateScore() {
    const range = 100-parseFloat(document.getElementById('range').value);
    const finesse = parseFloat(document.getElementById('finesse').value) + 1.5;
    const height = parseFloat(document.getElementById('height').value);

    if (isNaN(range) || isNaN(finesse) || isNaN(height) || height < 0 || finesse < 0) {
        document.getElementById('score-result').textContent = "Please enter valid numeric values.";
        return;
    }

    // Calculate percent chance of a successful score
    let T = -1.5 + (range*0.08 + 0.001*(range^2));
    let prob = 0;
    if (finesse <= 0) {
        // Invalid parameters lead to 0% chance
        prob = 0;
    } else if (T < -height) {
        // For every defender position, the bonus makes it always succeed
        prob = 1;
    } else if (finesse - T <= 0) {
        // Even the maximum shooting value can't overcome the threshold plus any block value
        prob = 0;
    } else {
        // Define integration limits:
        // For y in [0, y_a], block chance is 0 (i.e. probability=1) because (y+T) is negative.
        // For y in [y_a, y_b], success probability is (finesse - (y+T)) / finesse.
        // For y > y_b, probability is 0.
        let y_a = (T < 0) ? Math.min(height, -T) : 0;
        let y_b = Math.min(height, finesse - T);
        let area = 0;
        // Area for y where success is guaranteed.
        area += y_a;
        // Area for y where success probability decreases linearly.
        if (y_b > y_a) {
            area += (((finesse - T) * (y_b - y_a)) - ((y_b * y_b - y_a * y_a) / 2)) / finesse;
        }
        // Total probability is the area divided by the range of defender values (height)
        prob = area / height;
    }
    const chancePercent = (prob * 100).toFixed(2);
    const result = `${chancePercent}% chance of success`;
    document.getElementById('score-result').textContent = `Result: ${result} (Score Threshold: ${T.toFixed(2)})`;
}

window.toggleDropdown = toggleDropdown;
window.calculateScore = calculateScore;
window.updateRangeValue = updateRangeValue;