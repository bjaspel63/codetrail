let levelsData = [];
let currentLevel = 0;
let score = 0;
let timer;
let timeLimit = 120; // seconds per level (2 minutes)
let playerName = "";

let usedAnyHint = false;        // track hint usage globally
let gameStartTime = 0;          // track game start timestamp
let totalTimeTaken = 0;         // total time taken in seconds

const achievementsList = [
  {
    id: "firstPerfectScore",
    name: "First Perfect Score",
    description: "Get a perfect score on your first playthrough.",
    achieved: false,
  },
  {
    id: "noHintsUsed",
    name: "Hintless Hero",
    description: "Finish the game without using any hints.",
    achieved: false,
  },
  {
    id: "fastFinisher",
    name: "Speed Runner",
    description: "Finish the game under the total time limit.",
    achieved: false,
  },
];

const bgMusic = new Audio("background-music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;

function startBgMusic() {
  bgMusic.play().catch(() => {});
}
function stopBgMusic() {
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

// Load questions from JSON
fetch("levels.json")
  .then(response => response.json())
  .then(data => {
    levelsData = data;
  })
  .catch(() => alert("Failed to load levels.json"));

// Start game after name entered
function startGame() {
  playerName = document.getElementById("playerName").value.trim();
  if (!playerName) {
    alert("Please enter your name!");
    return;
  }
  if (levelsData.length === 0) {
    alert("Please wait, game is still loading...");
    return;
  }

  document.getElementById("splash-screen").style.display = "none";
  document.getElementById("game").style.display = "block";

  currentLevel = 0;
  score = 0;
  usedAnyHint = false;
  gameStartTime = Date.now();

  document.getElementById("hintBtn").disabled = false;
  document.getElementById("skipBtn").style.display = "inline-block";

  startBgMusic();
  loadLevel();
}

function loadLevel(resetTimer = true) {
  if (currentLevel >= levelsData.length) {
    showFinalScore();
    return;
  }

  const level = levelsData[currentLevel];

  // Reset UI
  const output = document.getElementById("output");
  output.innerHTML = `<div class="content-box">${level.prompt}</div>`;
  document.getElementById("hint").textContent = "";
  document.getElementById("progress").textContent = `Level ${currentLevel + 1} of ${levelsData.length}`;

  const inputElem = document.getElementById("answer");
  inputElem.value = "";
  document.getElementById("choices-container").innerHTML = "";

  // Show multiple choice buttons if choices exist
  if (level.choices && level.choices.length > 0) {
    inputElem.style.display = "none";
    document.getElementById("submitBtn").style.display = "none";

    const choicesContainer = document.getElementById("choices-container");
    level.choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.textContent = choice;
      btn.onclick = () => checkAnswer(choice);
      choicesContainer.appendChild(btn);
    });
  } else {
    inputElem.style.display = "inline-block";
    document.getElementById("submitBtn").style.display = "inline-block";
  }

  if (resetTimer) {
    clearInterval(timer);
    startTimer();
  }
}

function startTimer() {
  let timeRemaining = timeLimit;
  const progressBar = document.getElementById("progress-bar");
  progressBar.style.width = "100%";

  document.getElementById("timer").textContent = `Time: ${formatTime(timeRemaining)}`;

  timer = setInterval(() => {
    timeRemaining--;
    document.getElementById("timer").textContent = `Time: ${formatTime(timeRemaining)}`;

    // Calculate percentage remaining
    let percent = (timeRemaining / timeLimit) * 100;
    progressBar.style.width = percent + "%";

    if (timeRemaining <= 0) {
      clearInterval(timer);
      handleResult(false, true); // timed out
    }
  }, 1000);
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// Check answer (for both input and multiple choice)
function checkAnswer(input = null) {
  const level = levelsData[currentLevel];
  const userAnswer = input !== null ? input.trim() : document.getElementById("answer").value.trim();

  let isCorrect = false;

  // For text input with string or array answerCheck
  if (level.answerCheck) {
    if (typeof level.answerCheck === 'string') {
      isCorrect = userAnswer.toLowerCase() === level.answerCheck.toLowerCase();
    } else if (Array.isArray(level.answerCheck)) {
      isCorrect = level.answerCheck.every(substring =>
        userAnswer.toLowerCase().includes(substring.toLowerCase())
      );
    }
  }

  // For multiple choice
  if (level.correctChoiceIndex !== undefined && level.choices) {
    isCorrect = level.choices[level.correctChoiceIndex] === userAnswer;
  }

  handleResult(isCorrect, false);
}

function handleResult(isCorrect, isTimeout) {
  if (isCorrect) {
    clearInterval(timer);
    const output = document.getElementById("output");
    score++;
    playSound("success");
    output.innerHTML = `<div class="content-box success">${levelsData[currentLevel].successMsg}</div>`;

    setTimeout(() => {
      currentLevel++;
      loadLevel(); // reset timer for next level
    }, 2000);

  } else if (isTimeout) {
    clearInterval(timer);
    const output = document.getElementById("output");
    playSound("error");
    output.innerHTML = `<div class="content-box error">⏰ Time's up! Moving to next level.</div>`;

    setTimeout(() => {
      currentLevel++;
      loadLevel(); // reset timer for next level
    }, 2000);

  } else {
    // ❌ Wrong or empty → DO NOT clearInterval(timer)
    const output = document.getElementById("output");
    playSound("error");
    output.innerHTML = `<div class="content-box error">${levelsData[currentLevel].errorMsg}</div>`;

    setTimeout(() => {
      loadLevel(false); // reload same level UI, keep timer running
      document.getElementById("answer").focus();
    }, 1500);
  }
}


// Show hint (always available)
function showHint() {
  const hintElem = document.getElementById("hint");
  const level = levelsData[currentLevel];

  if (level.hint && level.hint.trim() !== "") {
    hintElem.textContent = "💡 Hint: " + level.hint;
    usedAnyHint = true; // track hint usage globally
  } else {
    hintElem.textContent = "💡 No hint available for this level.";
  }
}

// Skip question without scoring
function skipQuestion() {
  clearInterval(timer);
  document.getElementById("output").innerHTML = `<div class="content-box error">⏩ Skipped! Moving to next level.</div>`;
  playSound("error");

  setTimeout(() => {
    currentLevel++;
    loadLevel(); // reset timer on skip
  }, 2000);
}

// Final score screen
function showFinalScore() {
  clearInterval(timer);
  document.getElementById("progress").textContent = "";
  document.getElementById("timer").textContent = "";
  document.getElementById("choices-container").innerHTML = "";
  document.getElementById("answer").style.display = "none";
  document.getElementById("submitBtn").style.display = "none";
  document.getElementById("hintBtn").style.display = "none";
  document.getElementById("skipBtn").style.display = "none";

  stopBgMusic();

  totalTimeTaken = (Date.now() - gameStartTime) / 1000; // seconds
  checkAchievements();

  document.getElementById("output").innerHTML = `
    <div id="finalScoreDisplay" style="
      font-family: Consolas, monospace;
      font-weight: bold;
      font-size: 1.5rem;
      color: #2e7d32;
      text-align: left;
      max-width: 700px;
      margin: 20px auto;
      line-height: 1.4;
    ">
      <div class="final-congrats">🎉 Congratulations 🎉</div>
	<div class="final-player-name">${playerName}</div>


      <div class="final-score">${score} / ${levelsData.length}</div>

	<p class="final-message">Your adventure is complete!</p>


		<div id="achievement-badge-line" style="
		  font-size: 0.8rem;
		  color: #555;
		  margin-bottom: 20px;
		  display: flex;
		  flex-wrap: wrap;
		  gap: 10px;
		  max-width: 600px;
		  padding: 0 10px;
		  box-sizing: border-box;
		">
		  ${achievementsList.map(ach => `
			<span style="white-space: nowrap;">
			  ${ach.achieved ? "🔓" : "🔒"} ${ach.name}
			</span>
		  `).join('')}
		</div>


      <div id="achievement-details" style="
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
      ">
        ${achievementsList.map(ach => `
          <div style="
			  flex: 1 1 180px;
			  border: 2px solid ${ach.achieved ? '#4caf50' : '#ccc'};
			  border-radius: 10px;
			  padding: 10px;
			  font-weight: bold;
			  color: #333;
			  box-sizing: border-box;
			  display: flex;
			  flex-direction: column;
			  align-items: center;
			">
			  <div style="
				white-space: nowrap; 
				overflow: hidden; 
				text-overflow: ellipsis;
				text-align: center;
				width: 100%;
			  ">
				${ach.achieved ? '🏅' : '🔒'} ${ach.name}
			  </div>
			  <small style="
				font-weight: normal; 
				color: #555; 
				margin-top: 4px; /* smaller space */
				text-align: center;
			  ">
				${ach.description}
			  </small>
			</div>


        `).join('')}
      </div>
    </div>

    <button id="saveScoreBtn" style="margin-top: 20px;">💾 Save as PNG</button>
    <button id="playAgainBtn" style="margin-top: 15px;">🔄 Play Again</button>
  `;

  document.getElementById("saveScoreBtn").addEventListener("click", saveScoreAsImage);
  document.getElementById("playAgainBtn").addEventListener("click", () => {
    document.getElementById("game").style.display = "none";
    document.getElementById("splash-screen").style.display = "block";
    currentLevel = 0;
    score = 0;
    usedAnyHint = false;
    document.getElementById("output").innerHTML = "";
    document.getElementById("answer").style.display = "inline-block";
    document.getElementById("submitBtn").style.display = "inline-block";
    document.getElementById("hintBtn").style.display = "inline-block";
    document.getElementById("skipBtn").style.display = "inline-block";
    startBgMusic();
  });

  playSound("victory");
}


// Render achievement summary
function renderAchievementsSummary(forPng = false) {
  if (forPng) {
    let badges = achievementsList.map(ach =>
      `${ach.achieved ? "🔓" : "🔒"} ${ach.name}`
    ).join(" &nbsp;&nbsp; ");
	return `<div id="achievement-badge-line" style="
	  margin-top: 20px; 
	  font-size: 0.8rem;    /* smaller font */
	  color: #555; 
	  text-align: left;
	  max-width: 600px;
	  display: flex;
	  flex-wrap: wrap;
	  gap: 10px;
	  padding: 0 10px;
	  box-sizing: border-box;
	  word-break: break-word;   /* allow breaking if needed */
	  overflow-wrap: anywhere;
	">${badges}</div>`;
	
  } else {
    let html = '<div style="margin-top: 20px; max-width: 600px;">';
    achievementsList.forEach(ach => {
      html += `
        <div style="
          display: inline-block; 
          margin: 5px; 
          padding: 10px; 
          border: 2px solid ${ach.achieved ? '#4caf50' : '#ccc'}; 
          border-radius: 10px; 
          width: 180px; 
          text-align: left; 
          font-weight: bold;
          vertical-align: top;
        ">
          ${ach.achieved ? '🏅' : '🔒'} ${ach.name}
          <br><small style="font-weight: normal; color: #555;">${ach.description}</small>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }
}


function checkAchievements() {
  if (!achievementsList.find(a => a.id === "firstPerfectScore").achieved && score === levelsData.length) {
    awardAchievement("firstPerfectScore");
  }
  if (!achievementsList.find(a => a.id === "noHintsUsed").achieved && !usedAnyHint) {
    awardAchievement("noHintsUsed");
  }
  const totalAllowedTime = levelsData.length * timeLimit;
  if (!achievementsList.find(a => a.id === "fastFinisher").achieved && totalTimeTaken <= totalAllowedTime) {
    awardAchievement("fastFinisher");
  }
}

function awardAchievement(id) {
  const achievement = achievementsList.find(a => a.id === id);
  if (!achievement || achievement.achieved) return;
  achievement.achieved = true;
  showAchievementPopup(achievement);
}

function showAchievementPopup(achievement) {
  let popup = document.getElementById("achievement-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "achievement-popup";
    Object.assign(popup.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      background: "#4caf50",
      color: "white",
      padding: "15px 20px",
      borderRadius: "8px",
      fontWeight: "bold",
      boxShadow: "0 0 10px rgba(0,0,0,0.3)",
      opacity: "0",
      pointerEvents: "none",
      transition: "opacity 0.3s ease",
      zIndex: "1000",
    });
    document.body.appendChild(popup);
  }
  popup.textContent = `🏆 Achievement unlocked: ${achievement.name}`;
  popup.style.opacity = "1";
  popup.style.pointerEvents = "auto";

  setTimeout(() => {
    popup.style.opacity = "0";
    popup.style.pointerEvents = "none";
  }, 4000);
}

// Save score card as PNG
function saveScoreAsImage() {
  const element = document.getElementById("finalScoreDisplay");

  // Hide detailed achievement cards for cleaner image
  const detailedCards = element.querySelectorAll("#achievement-details > div");
  detailedCards.forEach(el => (el.style.display = "none"));

  const badgeLine = document.getElementById("achievement-badge-line");
  let originalBadgeTextAlign = "", originalBadgeDisplay = "", originalBadgeFontSize = "";

  if (badgeLine) {
    originalBadgeTextAlign = badgeLine.style.textAlign;
    originalBadgeDisplay = badgeLine.style.display;
    originalBadgeFontSize = badgeLine.style.fontSize;

    badgeLine.style.display = "flex";
    badgeLine.style.justifyContent = "center";
    badgeLine.style.flexWrap = "wrap";
    badgeLine.style.textAlign = "center";
    badgeLine.style.fontSize = "0.7rem";
  }

  // Use dom-to-image to export PNG with higher quality
	  domtoimage.toPng(element, {
	  quality: 1,
	  width: element.scrollWidth + 4,
	  height: element.scrollHeight + 20,
	  style: {
		transform: 'scale(1)',
		transformOrigin: 'top left'
	  }
	})
    .then(function (dataUrl) {
      // Restore styles
      detailedCards.forEach(el => (el.style.display = "flex"));
	  
      // Create download link and trigger
      const link = document.createElement("a");
      link.download = "CodeTrail-Score.png";
      link.href = dataUrl;
      link.click();

      // Success message
      const savedMsg = document.createElement("div");
      savedMsg.textContent = "✅ Score saved!";
      savedMsg.style.color = "#4caf50";
      savedMsg.style.fontWeight = "bold";
      savedMsg.style.marginTop = "10px";
      document.getElementById("output").appendChild(savedMsg);
      setTimeout(() => savedMsg.remove(), 3000);
    })
    .catch(function (error) {
      alert("Oops, failed to save image: " + error);
    });
}

function playSound(type) {
  let soundId = "";
  if (type === "success") soundId = "sound-success";
  else if (type === "error") soundId = "sound-error";
  else if (type === "victory") soundId = "sound-victory";

  const sound = document.getElementById(soundId);
  if (sound) {
    sound.currentTime = 0;
    sound.play();
  }
}

const bgMusicControl = document.getElementById("bg-music-control");
if(bgMusicControl){
  bgMusicControl.addEventListener("click", () => {
    if (bgMusic.paused) {
      startBgMusic();
      bgMusicControl.textContent = "🎵";
    } else {
      stopBgMusic();
      bgMusicControl.textContent = "🔇";
    }
  });
}

document.getElementById("submitBtn").addEventListener("click", () => checkAnswer());
document.getElementById("hintBtn").addEventListener("click", showHint);
document.getElementById("answer").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    checkAnswer();
  }
});

const skipBtn = document.getElementById("skipBtn");
if(skipBtn){
  skipBtn.addEventListener("click", skipQuestion);
}
