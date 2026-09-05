// Logik für die "Wörter merken"-Übung.
// Die Wortliste selbst steht in words.js (Variable WORTLISTE).

const ANZAHL_WOERTER = 10;

// -- Bildschirme -------------------------------------------------------
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const resultScreen = document.getElementById("result-screen");

// -- Start-Bildschirm ----------------------------------------------------
const durationSelect = document.getElementById("duration-select");
const startBtn = document.getElementById("start-btn");

// -- Übungs-Bildschirm ---------------------------------------------------
const progressLabel = document.getElementById("progress-label");
const wordDisplay = document.getElementById("word-display");
const answerForm = document.getElementById("answer-form");
const answerInput = document.getElementById("answer-input");
const submitBtn = document.getElementById("submit-btn");

// -- Ergebnis-Bildschirm --------------------------------------------------
const scoreLabel = document.getElementById("score-label");
const resultBody = document.getElementById("result-body");
const restartBtn = document.getElementById("restart-btn");

// -- Zustand --------------------------------------------------------------
let sessionWords = [];
let currentIndex = 0;
let results = [];
let wordShownTimer = null;

function showScreen(screen) {
  [startScreen, gameScreen, resultScreen].forEach((s) => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickSessionWords() {
  const pool = shuffle(WORTLISTE);
  const count = Math.min(ANZAHL_WOERTER, pool.length);
  return pool.slice(0, count);
}

function startSession() {
  sessionWords = pickSessionWords();
  currentIndex = 0;
  results = [];
  showScreen(gameScreen);
  showNextWord();
}

function showNextWord() {
  clearTimeout(wordShownTimer);

  if (currentIndex >= sessionWords.length) {
    finishSession();
    return;
  }

  const word = sessionWords[currentIndex];
  const durationSeconds = parseInt(durationSelect.value, 10) || 3;

  progressLabel.textContent = `Wort ${currentIndex + 1} von ${sessionWords.length}`;

  // Wort anzeigen, Eingabe währenddessen sperren
  wordDisplay.textContent = word;
  answerInput.value = "";
  answerInput.disabled = true;
  submitBtn.disabled = true;

  wordShownTimer = setTimeout(() => {
    wordDisplay.textContent = "";
    answerInput.disabled = false;
    submitBtn.disabled = false;
    answerInput.focus();
  }, durationSeconds * 1000);
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function handleAnswerSubmit(event) {
  event.preventDefault();

  if (answerInput.disabled) {
    // Wort ist noch sichtbar, es kann noch nichts abgeschickt werden.
    return;
  }

  const word = sessionWords[currentIndex];
  const answer = answerInput.value;
  const correct = normalize(answer) === normalize(word);

  results.push({ word, answer, correct });

  currentIndex += 1;
  showNextWord();
}

// --------------------------------------------------------------------
// Buchstaben-Vergleich (Levenshtein-Alignment)
//
// Vergleicht das Zielwort mit der eingegebenen Antwort Buchstabe für
// Buchstabe und markiert:
//  - richtige Buchstaben normal
//  - falsche Buchstaben (statt eines anderen getippt)   -> rot, unterstrichen
//  - überflüssige Buchstaben (zu viel getippt)           -> orange, durchgestrichen
//  - fehlende Buchstaben (im Wort, aber nicht getippt)   -> grau, in Klammern
//
// So sieht man z.B. bei "Haus" -> "Hus" sofort, dass genau das "a"
// fehlt, statt die Antwort nur pauschal als falsch zu markieren.
// --------------------------------------------------------------------

function computeAlignment(word, answer) {
  const target = word.toLowerCase();
  const answerTrimmed = answer.trim();
  const ansLower = answerTrimmed.toLowerCase();
  const n = target.length;
  const m = ansLower.length;

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (target[i - 1] === ansLower[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Rückverfolgung: welche Operation hat zu jedem Zeichen geführt?
  let i = n;
  let j = m;
  const ops = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && target[i - 1] === ansLower[j - 1] && dp[i][j] === dp[i - 1][j - 1]) {
      ops.push({ type: "match", aIdx: j - 1, wIdx: i - 1 });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ type: "sub", aIdx: j - 1, wIdx: i - 1 });
      i--;
      j--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      ops.push({ type: "ins", aIdx: j - 1, wIdx: null });
      j--;
    } else {
      ops.push({ type: "del", aIdx: null, wIdx: i - 1 });
      i--;
    }
  }

  ops.reverse();
  return { distance: dp[n][m], ops, answerTrimmed };
}

// Ab wie vielen abweichenden Buchstaben gilt ein Wort noch als "fast
// richtig" statt "falsch"? Kurze Wörter verzeihen weniger, lange mehr.
function closenessThreshold(word) {
  if (word.length <= 4) return 1;
  if (word.length <= 7) return 2;
  return 3;
}

function classifyResult(word, distance) {
  if (distance === 0) {
    return { cls: "correct", label: "Richtig", icon: "✓" };
  }
  if (distance <= closenessThreshold(word)) {
    return { cls: "close", label: "Fast richtig", icon: "~" };
  }
  return { cls: "wrong", label: "Falsch", icon: "✗" };
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function buildDiffHtml(word, answerTrimmed, ops) {
  if (answerTrimmed === "") {
    return '<span class="no-answer">(keine Antwort)</span>';
  }

  return ops
    .map((op) => {
      if (op.type === "match") {
        return `<span class="d-match">${escapeHtml(answerTrimmed[op.aIdx])}</span>`;
      }
      if (op.type === "sub") {
        const expected = word[op.wIdx];
        return `<span class="d-sub" title="statt „${escapeHtml(expected)}“">${escapeHtml(answerTrimmed[op.aIdx])}</span>`;
      }
      if (op.type === "ins") {
        return `<span class="d-ins" title="überflüssig">${escapeHtml(answerTrimmed[op.aIdx])}</span>`;
      }
      // op.type === "del"
      return `<span class="d-del" title="fehlt">(${escapeHtml(word[op.wIdx])})</span>`;
    })
    .join("");
}

function finishSession() {
  const correctCount = results.filter((r) => r.correct).length;
  scoreLabel.textContent = `${correctCount} von ${results.length} Wörtern genau richtig geschrieben`;

  resultBody.innerHTML = "";
  results.forEach((r) => {
    const { distance, ops, answerTrimmed } = computeAlignment(r.word, r.answer || "");
    const status = classifyResult(r.word, distance);

    const row = document.createElement("tr");
    row.className = "result-row " + status.cls;

    const wordCell = document.createElement("td");
    wordCell.textContent = r.word;

    const answerCell = document.createElement("td");
    answerCell.className = "diff-cell";
    answerCell.innerHTML = buildDiffHtml(r.word, answerTrimmed, ops);

    const markCell = document.createElement("td");
    const mark = document.createElement("span");
    mark.className = "result-mark " + status.cls;
    mark.textContent = `${status.icon} ${status.label}`;
    markCell.appendChild(mark);

    row.appendChild(wordCell);
    row.appendChild(answerCell);
    row.appendChild(markCell);
    resultBody.appendChild(row);
  });

  showScreen(resultScreen);
}

startBtn.addEventListener("click", startSession);
answerForm.addEventListener("submit", handleAnswerSubmit);
restartBtn.addEventListener("click", () => showScreen(startScreen));
