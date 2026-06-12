// report.js – Sluttrapport med Claude API

import { buildReportPrompt, getAchievements } from './game.js';

export async function generateReport(state, onProgress) {
  const prompt = buildReportPrompt(state);

  onProgress({ status: 'loading' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`API-feil: ${response.status}`);

    const data = await response.json();
    const text = data.content
      .map(b => (b.type === 'text' ? b.text : ''))
      .join('');

    // Rens og parse JSON
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    onProgress({ status: 'done', data: parsed });
    return parsed;

  } catch (err) {
    console.error('Rapport-feil:', err);
    // Fallback-rapport
    const fallback = generateFallbackReport(state);
    onProgress({ status: 'done', data: fallback });
    return fallback;
  }
}

// Fallback-rapport basert på meter-verdier
function generateFallbackReport(state) {
  const { meters, variables } = state;

  const headline = (() => {
    if (meters.nature < 35) return 'Naturen betalte prisen for veksten';
    if (meters.business < 35) return 'Øya valgte bort veksten';
    if (meters.people < 35) return 'Folk flest kom til kort';
    if (meters.business > 70 && meters.nature > 60) return 'Vekst og natur i sjelden balanse';
    if (meters.people > 70) return 'Folk flest fikk det bedre';
    return 'Femten år med vanskelige avveininger';
  })();

  const business = (() => {
    if (meters.business > 65)
      return `Tallene taler for seg – ${variables.jobs} arbeidsplasser og en statskasse på ${variables.treasury}. Vi har skapt noe varig her. Riktignok har vi tatt noen snarveier, men det er det som skaper arbeidsplasser.`;
    if (meters.business < 40)
      return `Dette var ikke bærekraftig for næringslivet. Vi mistet folk, vi mistet investeringer. Øya trenger arbeidsplasser – uten dem er alt annet tomme ord.`;
    return `Vi har klart oss. Ikke strålende, men stabilt. Grunnlaget er der for de neste 15 årene – hvis noen tør å ta tøffere valg.`;
  })();

  const people = (() => {
    if (meters.people > 65)
      return `Endelig! Helsevesenet fungerer, folk har tak over hodet, og vi stoler litt mer på hverandre. Selvfølgelig er ikke alt perfekt, men vi merker at beslutningene ble tatt med oss i tankene.`;
    if (meters.people < 40)
      return `Vi ble hengende etter. Ventetidene på sykehuset er lange, boligprisene skyhøye. Det er ikke godt nok – og vi husker hvem som styrte.`;
    return `Det er greit å bo her. Ikke fantastisk, men greit. Vi skulle gjerne sett mer til helsa og boligene, men vi forstår at det er vanskelig å prioritere alt.`;
  })();

  const nature = (() => {
    if (meters.nature > 65)
      return `Skogene pustet. Fjordene levde. ${variables.biodiversity > 60 ? 'Naturmangfoldet holdt seg.' : ''} Det er ikke selvfølgelig – det krevde mot å si nei. Takk for det.`;
    if (meters.nature < 40)
      return `Lydene er borte. Der det en gang var insekter og fugler, er det stille. Utslippene på ${variables.emissions} er ikke bare tall – det er alt som forsvant i disse 15 årene.`;
    return `Vi overlevde, men sårene er der. Noen habitater er borte for alltid. Andre henger igjen. Det er ikke for sent – men det haster.`;
  })();

  return { headline, business, people, nature };
}

// Render rapport-skjermen
export function renderReport(state, reportData) {
  const { meters } = state;
  const achievements = getAchievements(state);

  const meterColor = (val) => {
    if (val >= 65) return '#5BBFAD';
    if (val <= 40) return '#E87D5B';
    return '#E8C547';
  };

  return `
    <div class="report-inner">
      <p class="report-eyebrow">Balanseposten · Etter 15 år</p>
      <h1 class="report-headline">${reportData.headline}</h1>

      <div class="report-meters-summary">
        <div class="report-meter-block">
          <div class="report-meter-icon">💰</div>
          <div class="report-meter-val" style="color:${meterColor(meters.business)}">${meters.business}</div>
          <div class="report-meter-label">Næringslivet</div>
        </div>
        <div class="report-meter-block">
          <div class="report-meter-icon">👥</div>
          <div class="report-meter-val" style="color:${meterColor(meters.people)}">${meters.people}</div>
          <div class="report-meter-label">Innbyggerne</div>
        </div>
        <div class="report-meter-block">
          <div class="report-meter-icon">🌳</div>
          <div class="report-meter-val" style="color:${meterColor(meters.nature)}">${meters.nature}</div>
          <div class="report-meter-label">Naturen</div>
        </div>
      </div>

      <div class="report-voices">
        <div class="voice-card">
          <div class="voice-card-header">
            <span class="voice-icon">💰</span>
            <span class="voice-name">Næringslivet</span>
            <span class="voice-score" style="color:${meterColor(meters.business)}">${meters.business}</span>
          </div>
          <p class="voice-text">${reportData.business}</p>
        </div>

        <div class="voice-card">
          <div class="voice-card-header">
            <span class="voice-icon">👥</span>
            <span class="voice-name">Innbyggerne</span>
            <span class="voice-score" style="color:${meterColor(meters.people)}">${meters.people}</span>
          </div>
          <p class="voice-text">${reportData.people}</p>
        </div>

        <div class="voice-card">
          <div class="voice-card-header">
            <span class="voice-icon">🌳</span>
            <span class="voice-name">Naturen</span>
            <span class="voice-score" style="color:${meterColor(meters.nature)}">${meters.nature}</span>
          </div>
          <p class="voice-text">${reportData.nature}</p>
        </div>
      </div>

      ${achievements.length > 0 ? `
        <div class="report-achievements">
          <p class="sidebar-section-title">Achievements</p>
          <div class="achievement-list">
            ${achievements.map(a => `<span class="achievement-badge">${a.label}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <div class="report-actions">
        <button class="btn-primary" id="btn-restart">Spill igjen</button>
        <button class="btn-secondary" id="btn-share-result">Del resultatet</button>
      </div>
    </div>
  `;
}
