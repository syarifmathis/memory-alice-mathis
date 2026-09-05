// Logik für die "Wörter merken"-Übung.
// Die Wortliste selbst steht in words.js (Variable WORTLISTE).
//
// Ablauf:
//  1. Alle 10 Wörter werden nacheinander kurz gezeigt (Anzeige-Bildschirm).
//  2. Erst danach schreibt die Person alle Wörter auf, an die sie sich
//     erinnert - ein Wort pro Zeile, Reihenfolge egal (Erinnerungs-Bildschirm).
//  3. Die aufgeschriebenen Wörter werden den gezeigten Wörtern automatisch
//     zugeordnet (auch bei kleinen Schreibfehlern) und ausgewertet.

const ANZAHL_WOERTER = 10;
const PAUSE_ZWISCHEN_WOERTERN_MS = 400;

// -- Bildschirme -------------------------------------------------------
const startScreen = document.getElementById("start-screen");
const showScreenEl = document.getElementById("show-screen");
const recallScreen = document.getElementById("recall-screen");
const resultScreen = document.getElementById("result-screen");

// -- Start-Bildschirm ----------------------------------------------------
const durationSelect = document.getElementById("duration-select");
const startBtn = document.getElementById("start-btn");

// -- Anzeige-Bildschirm ---------------------------------------------------
const progressLabel = document.getElementById("progress-label");
const wordDisplay = document.getElementById("word-display");

// -- Erinnerungs-Bildschirm ------------------------------------------------
const recallForm = document.getElementById("recall-form");
const recallInput = document.getElementById("recall-input");

// -- Ergebnis-Bildschirm --------------------------------------------------
const scoreLabel = document.getElementById("score-label");
const resultBody = document.getElementById("result-body");
const leftoverBlock = document.getElementById("leftover-block");
const leftoverList = document.getElementById("leftover-list");
const restartBtn = document.getElementById("restart-btn");

// -- Zustand --------------------------------------------------------------
let sessionWords = [];
let showIndex = 0;
let showTimer = null;

function showScreen(screen) {
  [startScreen, showScreenEl, recallScreen, resultScreen].forEach((s) => s.classList.add("hidden"));
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
  showIndex = 0;
  showScreen(showScreenEl);
  showNextWordInSequence();
}

function showNextWordInSequence() {
  clearTimeout(showTimer);

  if (showIndex >= sessionWords.length) {
    startRecallPhase();
    return;
  }

  const word = sessionWords[showIndex];
  const durationSeconds = parseInt(durationSelect.value, 10) || 3;

  progressLabel.textContent = `Wort ${showIndex + 1} von ${sessionWords.length}`;
  wordDisplay.textContent = word;

  showTimer = setTimeout(() => {
    wordDisplay.textContent = "";
    showIndex += 1;
    showTimer = setTimeout(showNextWordInSequence, PAUSE_ZWISCHEN_WOERTERN_MS);
  }, durationSeconds * 1000);
}

function startRecallPhase() {
  recallInput.value = "";
  showScreen(recallScreen);
  recallInput.focus();
}

// --------------------------------------------------------------------
// Buchstaben-Vergleich (Levenshtein-Alignment)
//
// Vergleicht ein Zielwort mit einer Antwort Buchstabe für Buchstabe und
// markiert:
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

// Wie weit darf eine aufgeschriebene Antwort von einem Zielwort entfernt
// sein, damit sie überhaupt noch als (versuchte) Antwort auf DIESES Wort
// gilt? Etwas großzügiger als die "fast richtig"-Grenze, damit auch
// größere Schreibfehler noch zugeordnet werden - aber nicht beliebig
// weit, damit ein völlig anderes Wort nicht einfach dem nächstbesten
// noch offenen Zielwort zugeordnet wird.
function maxMatchDistance(word) {
  return closenessThreshold(word) + 1;
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

// --------------------------------------------------------------------
// Zuordnung: welche aufgeschriebene Antwort gehört zu welchem gezeigten
// Wort? Da beim freien Erinnern die Reihenfolge nicht feststeht, wird
// jede Antwort mit jedem noch nicht zugeordneten Wort verglichen und
// die jeweils naheliegendste Zuordnung gewählt (kleinster Buchstaben-
// Abstand zuerst). Antworten, die zu keinem Wort mehr nah genug passen,
// bleiben als "sonstige Antworten" übrig.
// --------------------------------------------------------------------

function matchAnswersToWords(targets, rawAnswers) {
  const candidates = [];

  rawAnswers.forEach((answer, aIdx) => {
    targets.forEach((word, tIdx) => {
      const { distance } = computeAlignment(word, answer);
      if (distance <= maxMatchDistance(word)) {
        candidates.push({ aIdx, tIdx, distance });
      }
    });
  });

  candidates.sort((a, b) => a.distance - b.distance);

  const assignedAnswerForTarget = new Array(targets.length).fill(null);
  const answerIsUsed = new Array(rawAnswers.length).fill(false);

  candidates.forEach((c) => {
    if (assignedAnswerForTarget[c.tIdx] === null && !answerIsUsed[c.aIdx]) {
      assignedAnswerForTarget[c.tIdx] = c.aIdx;
      answerIsUsed[c.aIdx] = true;
    }
  });

  const results = targets.map((word, tIdx) => {
    const aIdx = assignedAnswerForTarget[tIdx];
    return { word, answer: aIdx === null ? null : rawAnswers[aIdx] };
  });

  const leftoverAnswers = rawAnswers.filter((_, aIdx) => !answerIsUsed[aIdx]);

  return { results, leftoverAnswers };
}

function parseRecallInput(text) {
  return text
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function handleRecallSubmit(event) {
  event.preventDefault();

  const rawAnswers = parseRecallInput(recallInput.value);
  const { results, leftoverAnswers } = matchAnswersToWords(sessionWords, rawAnswers);
  showResults(results, leftoverAnswers);
}

function showResults(results, leftoverAnswers) {
  const rows = results.map((r) => {
    if (r.answer === null) {
      return {
        word: r.word,
        status: { cls: "missing", label: "Nicht erinnert", icon: "–" },
        diffHtml: '<span class="no-answer">(nicht genannt)</span>',
      };
    }
    const { distance, ops, answerTrimmed } = computeAlignment(r.word, r.answer);
    const status = classifyResult(r.word, distance);
    return {
      word: r.word,
      status,
      diffHtml: buildDiffHtml(r.word, answerTrimmed, ops),
    };
  });

  const correctCount = rows.filter((row) => row.status.cls === "correct").length;
  scoreLabel.textContent = `${correctCount} von ${rows.length} Wörtern genau richtig erinnert`;

  resultBody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "result-row " + row.status.cls;

    const wordCell = document.createElement("td");
    wordCell.textContent = row.word;

    const answerCell = document.createElement("td");
    answerCell.className = "diff-cell";
    answerCell.innerHTML = row.diffHtml;

    const markCell = document.createElement("td");
    const mark = document.createElement("span");
    mark.className = "result-mark " + row.status.cls;
    mark.textContent = `${row.status.icon} ${row.status.label}`;
    markCell.appendChild(mark);

    tr.appendChild(wordCell);
    tr.appendChild(answerCell);
    tr.appendChild(markCell);
    resultBody.appendChild(tr);
  });

  leftoverList.innerHTML = "";
  if (leftoverAnswers.length > 0) {
    leftoverAnswers.forEach((answer) => {
      const li = document.createElement("li");
      li.textContent = answer;
      leftoverList.appendChild(li);
    });
    leftoverBlock.classList.remove("hidden");
  } else {
    leftoverBlock.classList.add("hidden");
  }

  showScreen(resultScreen);
}

startBtn.addEventListener("click", startSession);
recallForm.addEventListener("submit", handleRecallSubmit);
restartBtn.addEventListener("click", () => showScreen(startScreen));
