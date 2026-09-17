/* =========================================================
   QUESTION VIEW — viser ett multiple-choice-spørsmål av gangen,
   der reklamen ellers ville dukket opp. Rent visningslag: den
   vet ikke hva som er riktig svar før den får beskjed om det
   (fra QuestionManager, via main.js). Spilleren får bare ett
   svarforsøk per spørsmål.
   ========================================================= */

const FEEDBACK_MS = 1300;

export class QuestionView {
  constructor(panelEl) {
    this.panelEl = panelEl;
    this.definitionEl = panelEl.querySelector('[data-role="definition"]');
    this.optionsEl = panelEl.querySelector('[data-role="options"]');
    this.feedbackEl = panelEl.querySelector('[data-role="feedback"]');
    this.feedbackTitleEl = panelEl.querySelector('[data-role="feedback-title"]');
    this.feedbackTextEl = panelEl.querySelector('[data-role="feedback-text"]');
  }

  show() {
    this.panelEl.classList.remove('is-hidden');
    requestAnimationFrame(() => this.panelEl.classList.add('is-visible'));
  }

  hide() {
    this.panelEl.classList.remove('is-visible');
    setTimeout(() => this.panelEl.classList.add('is-hidden'), 180);
  }

  /** Viser spørsmålet og venter til spilleren har valgt ett alternativ.
      Løser med den valgte indexen (0-3). */
  askChoice(question) {
    this.feedbackEl.classList.add('is-hidden');
    this.definitionEl.textContent = question.definition;
    this.optionsEl.innerHTML = '';

    return new Promise((resolve) => {
      question.options.forEach((optionText, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-button';
        btn.textContent = optionText;
        btn.addEventListener('click', () => {
          this.optionsEl.querySelectorAll('.option-button').forEach(b => { b.disabled = true; });
          resolve({ index: i, buttons: Array.from(this.optionsEl.children) });
        });
        this.optionsEl.appendChild(btn);
      });
    });
  }

  /** Markerer riktig/galt svar og viser kort feedback. Returnerer et
      løfte som er ferdig når feedback-vinduet er over. */
  async showFeedback({ buttons, chosenIndex, correct, correctIndex, word, rewarded }) {
    buttons[correctIndex].classList.add('is-correct');
    if (!correct) buttons[chosenIndex].classList.add('is-wrong');

    this.feedbackEl.classList.remove('is-hidden');
    if (correct) {
      this.feedbackEl.classList.remove('is-wrong-feedback');
      this.feedbackEl.classList.add('is-correct-feedback');
      this.feedbackTitleEl.textContent = '✓ Riktig!';
      this.feedbackTextEl.textContent = rewarded ? 'En rad/kolonne ble ryddet som gave.' : 'Bra jobba!';
    } else {
      this.feedbackEl.classList.remove('is-correct-feedback');
      this.feedbackEl.classList.add('is-wrong-feedback');
      this.feedbackTitleEl.textContent = '✕ Ikke helt.';
      this.feedbackTextEl.textContent = `Riktig svar: ${word}`;
    }

    await new Promise(resolve => setTimeout(resolve, FEEDBACK_MS));
  }
}
