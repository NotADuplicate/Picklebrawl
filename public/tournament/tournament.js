import { fetchData } from "../api.js";

document.addEventListener('DOMContentLoaded', () => {
    fetchData(`/leagues/tournament/1`, 'GET', {}, null, (stages) => {
        console.log("Torny data:",stages)
        window.bracketsViewer.addLocale('en', {
            common: {
              'group-name-winner-bracket': '{{stage.name}}',
              'group-name-loser-bracket': '{{stage.name}} - Repechage',
            },
            'origin-hint': {
              'winner-bracket': 'WB {{round}}.{{position}}',
              'winner-bracket-semi-final': 'WB Semi {{position}}',
              'winner-bracket-final': 'WB Final',
              'consolation-final': 'Semi {{position}}',
            },
          });
        window.bracketsViewer.render(stages.data);
    });
});