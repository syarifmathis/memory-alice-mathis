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

function finishSession() {
  const correctCount = results.filter((r) => r.correct).length;
  scoreLabel.textContent = `${correctCount} von ${results.length} Wörtern richtig geschrieben`;

  resultBody.innerHTML = "";
  results.forEach((r) => {
    const row = document.createElement("tr");
    row.className = "result-row " + (r.correct ? "correct" : "wrong");

    const wordCell = document.createElement("td");
    wordCell.textContent = r.word;

    const answerCell = document.createElement("td");
    answerCell.textContent = r.answer || "(keine Antwort)";

    const markCell = document.createElement("td");
    const mark = document.createElement("span");
    mark.className = "result-mark " + (r.correct ? "correct" : "wrong");
    mark.textContent = r.correct ? "✓" : "✗";
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
