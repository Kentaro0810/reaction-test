const reactionArea = document.getElementById("reactionArea");
const areaIcon = document.getElementById("areaIcon");
const areaTitle = document.getElementById("gameTitle");
const areaText = document.getElementById("areaText");
const roundLabel = document.getElementById("roundLabel");
const bestLabel = document.getElementById("bestLabel");
const averageResult = document.getElementById("averageResult");
const fastestResult = document.getElementById("fastestResult");
const falseStartCount = document.getElementById("falseStartCount");
const progressText = document.getElementById("progressText");
const resultList = document.getElementById("resultList");
const resetButton = document.getElementById("resetButton");
const clearBestButton = document.getElementById("clearBestButton");
const liveMessage = document.getElementById("liveMessage");

const TOTAL_ROUNDS = 5;
const MIN_WAIT_MS = 1800;
const MAX_WAIT_MS = 4500;
const BEST_STORAGE_KEY = "reaction-test-best-average";

let state = "idle";
let results = [];
let falseStarts = 0;
let waitTimer = null;
let readyAt = 0;

function randomWait() {
  return Math.floor(Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS + 1)) + MIN_WAIT_MS;
}

function setArea(nextState, icon, title, text) {
  state = nextState;
  reactionArea.className = `reaction-area state-${nextState}`;
  areaIcon.textContent = icon;
  areaTitle.textContent = title;
  areaText.textContent = text;
  liveMessage.textContent = `${title}。${text}`;
}

function getBest() {
  const value = Number(localStorage.getItem(BEST_STORAGE_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function updateBestLabel() {
  const best = getBest();
  bestLabel.textContent = best ? `自己ベスト：${best} ms` : "自己ベスト：未記録";
}

function updateHistory() {
  [...resultList.children].forEach((item, index) => {
    const value = results[index];
    item.querySelector("strong").textContent = value === undefined ? "---" : `${value} ms`;
  });
  progressText.textContent = `${results.length} / ${TOTAL_ROUNDS} 完了`;
  roundLabel.textContent = results.length < TOTAL_ROUNDS
    ? `ラウンド ${results.length + 1} / ${TOTAL_ROUNDS}`
    : "5回完了";
}

function updateStats() {
  falseStartCount.textContent = `${falseStarts}回`;
  if (results.length === 0) {
    averageResult.textContent = "---";
    fastestResult.textContent = "---";
    return;
  }
  const average = Math.round(results.reduce((sum, value) => sum + value, 0) / results.length);
  averageResult.textContent = results.length === TOTAL_ROUNDS ? `${average} ms` : "---";
  fastestResult.textContent = `${Math.min(...results)} ms`;
}

function beginWaiting() {
  window.clearTimeout(waitTimer);
  setArea("waiting", "✋", "待って…", "緑色になるまでタップしないでください");
  reactionArea.disabled = false;
  waitTimer = window.setTimeout(() => {
    readyAt = performance.now();
    setArea("ready", "⚡", "今すぐタップ！", "できるだけ早くタップしてください");
  }, randomWait());
}

function startRound() {
  if (results.length >= TOTAL_ROUNDS) {
    resetGame();
  }
  beginWaiting();
}

function handleFalseStart() {
  window.clearTimeout(waitTimer);
  falseStarts += 1;
  updateStats();
  setArea("false", "⚠️", "フライング！", "タップして同じラウンドをやり直します");
}

function finishRound() {
  const reactionTime = Math.max(1, Math.round(performance.now() - readyAt));
  results.push(reactionTime);
  updateHistory();
  updateStats();

  if (results.length === TOTAL_ROUNDS) {
    completeGame();
    return;
  }

  setArea("result", "✅", `${reactionTime} ms`, "タップして次のラウンドへ");
}

function completeGame() {
  const average = Math.round(results.reduce((sum, value) => sum + value, 0) / results.length);
  const previousBest = getBest();
  const isNewBest = previousBest === null || average < previousBest;

  if (isNewBest) {
    localStorage.setItem(BEST_STORAGE_KEY, String(average));
    updateBestLabel();
  }

  setArea(
    "complete",
    isNewBest ? "🏆" : "🎉",
    `平均 ${average} ms`,
    isNewBest ? "新しい自己ベストです！ タップでもう一度" : "5回完了しました。タップでもう一度"
  );
}

function handleAreaPress() {
  if (state === "idle" || state === "result") {
    startRound();
  } else if (state === "waiting") {
    handleFalseStart();
  } else if (state === "false") {
    beginWaiting();
  } else if (state === "ready") {
    finishRound();
  } else if (state === "complete") {
    resetGame();
    startRound();
  }
}

function resetGame() {
  window.clearTimeout(waitTimer);
  results = [];
  falseStarts = 0;
  readyAt = 0;
  updateHistory();
  updateStats();
  setArea("idle", "⚡", "準備ができたらタップ", "5回の平均と最速記録を測定します");
}

function clearBest() {
  if (!getBest()) {
    liveMessage.textContent = "削除する自己ベストはありません。";
    return;
  }
  if (!window.confirm("保存されている自己ベストを削除しますか？")) return;
  localStorage.removeItem(BEST_STORAGE_KEY);
  updateBestLabel();
  liveMessage.textContent = "自己ベストを削除しました。";
}

reactionArea.addEventListener("click", handleAreaPress);
resetButton.addEventListener("click", resetGame);
clearBestButton.addEventListener("click", clearBest);

updateBestLabel();
resetGame();
