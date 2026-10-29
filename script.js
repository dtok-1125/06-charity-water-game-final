// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');
// ==============================
// GAME TIMER
// ==============================

const timerDisplay = document.getElementById("timer");
const restartButton = document.getElementById("restart-button");
const resultsDetails = document.getElementById("results-details");
const gameOverlay = document.getElementById("game-overlay");
const confettiLayer = document.getElementById("confetti-layer");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const difficultySettings = {
  easy: { timeLimit: 90, obstacleCount: 4, collisionPenalty: 3 },
  normal: { timeLimit: 60, obstacleCount: 7, collisionPenalty: 5 },
  hard: { timeLimit: 45, obstacleCount: 9, collisionPenalty: 7 }
};

let activeDifficulty = null;
let timeRemaining = difficultySettings.normal.timeLimit;
let timerInterval = null;
let obstacleTimeout = null;
let confettiTimeout = null;
let gamePaused = false;
let gameEnded = false;

function clearConfetti() {
  clearTimeout(confettiTimeout);
  confettiTimeout = null;
  confettiLayer.replaceChildren();
  confettiLayer.hidden = true;
}

function showConfetti() {
  if (prefersReducedMotion.matches) return;

  clearConfetti();
  confettiLayer.hidden = false;

  const colors = ["#FFC907", "#77A8BB", "#FFFFFF", "#003366"];
  const pieceCount = 360;
  const piecesPerSide = pieceCount / 2;
  const boardBounds = gameBoard.getBoundingClientRect();

  for (let index = 0; index < pieceCount; index++) {
    const piece = document.createElement("span");
    const startsOnLeft = index < piecesPerSide;
    const edgeInset = Math.random() * boardBounds.width * 0.08;
    const originX = startsOnLeft
      ? boardBounds.left + edgeInset
      : boardBounds.right - edgeInset;
    const originY = boardBounds.bottom - Math.random() * 24;
    const launchTargetX = window.innerWidth * (0.1 + Math.random() * 0.8);
    const launchX = launchTargetX - originX;
    const launchY = -boardBounds.height * (0.55 + Math.random() * 0.45);
    const fallX = launchX + (Math.random() - 0.5) * window.innerWidth * 0.3;
    const fallEndY = Math.max(
      originY + 20,
      Math.min(
        window.innerHeight * 0.9,
        boardBounds.bottom + window.innerHeight * (0.18 + Math.random() * 0.16)
      )
    );
    const fallY = fallEndY - originY;
    const spinDirection = Math.random() < 0.5 ? -1 : 1;
    const spinDegrees = spinDirection * (360 + Math.random() * 180);

    piece.className = "confetti-piece";
    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.setProperty("--confetti-color", colors[index % colors.length]);
    piece.style.setProperty("--confetti-launch-x", `${launchX}px`);
    piece.style.setProperty("--confetti-launch-y", `${launchY}px`);
    piece.style.setProperty("--confetti-mid-x", `${(launchX + fallX) / 2}px`);
    piece.style.setProperty("--confetti-mid-y", `${(launchY + fallY) / 2}px`);
    piece.style.setProperty("--confetti-fall-x", `${fallX}px`);
    piece.style.setProperty("--confetti-fall-y", `${fallY}px`);
    piece.style.setProperty("--confetti-width", `${6 + Math.random() * 4}px`);
    piece.style.setProperty("--confetti-height", `${10 + Math.random() * 8}px`);
    piece.style.setProperty("--confetti-spin", `${spinDegrees}deg`);
    piece.style.setProperty("--confetti-launch-spin", `${spinDegrees * 0.35}deg`);
    piece.style.setProperty("--confetti-mid-spin", `${spinDegrees * 0.675}deg`);
    piece.style.setProperty("--confetti-duration", `${7 + Math.random() * 3}s`);
    piece.style.setProperty("--confetti-delay", `${Math.random() * 0.2}s`);
    confettiLayer.appendChild(piece);
  }

  confettiTimeout = window.setTimeout(clearConfetti, 11000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function showOverlay(title, message, showRestartButton = false) {
  stopMovement();
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  restartButton.hidden = !showRestartButton;
  resultsDetails.hidden = !showRestartButton;
  gameOverlay.hidden = false;
}

function endGame() {
  if (gameEnded) return;

  gameEnded = true;
  gamePaused = false;
  clearInterval(timerInterval);
  timerInterval = null;

  showOverlay(
    "Time's up! 🎉",
    `You delivered ${deliveries} water ${deliveries === 1 ? "supply" : "supplies"} to the community!`,
    true
  );

  if (deliveries > 0) showConfetti();
}

function startTimer() {
  if (timerInterval !== null || gamePaused || gameEnded) return;

  timerInterval = setInterval(function () {
    if (gamePaused || gameEnded) return;

    timeRemaining = Math.max(0, timeRemaining - 1);
    updateTimerDisplay();

    if (timeRemaining === 0) {
      endGame();
    }
  }, 1000);
}


/* =================================
   EVERY DROP COUNTS - GAME LOGIC
================================= */

// Find our HTML elements
const startButton = document.getElementById("start-button");
const welcomeScreen = document.getElementById("welcome-screen");
const gameScreen = document.getElementById("game-screen");
const difficultyOptions = document.querySelectorAll('input[name="difficulty"]');
const difficultyInstruction = document.getElementById("difficulty-instruction");
const collisionInstruction = document.getElementById("collision-instruction");

difficultyOptions.forEach(function (option) {
  option.addEventListener("change", function () {
    difficultyInstruction.hidden = true;

    const settings = difficultySettings[option.value];
    collisionInstruction.textContent =
      `Avoid obstacles — hitting one costs you ${settings.collisionPenalty} seconds!`;
  });
});

function showGameScreen() {
  welcomeScreen.hidden = true;
  gameScreen.hidden = false;
  startTimer();
}

// Listen for the player to click START JOURNEY
startButton.addEventListener("click", function () {
  const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');

  if (!selectedDifficulty) {
    difficultyInstruction.hidden = false;
    difficultyOptions[0].focus();
    return;
  }

  activeDifficulty = difficultySettings[selectedDifficulty.value];
  resetGame();
  showGameScreen();

  console.log("Journey started!");
});

/* =================================
   PLAYER MOVEMENT
================================= */

const player = document.getElementById("player");
const gameBoard = document.getElementById("game-board");

// Player starting position
let playerX = 85;
let playerY = 80;

// Movement step as a percentage of the board on each move
const playerSpeed = 2.4;
const movementIntervalDelay = 160;

const movementButtons = document.querySelectorAll(".arrow-key");
let activeDirection = null;
let movementInterval = null;
let activePointerId = null;

function stopMovement(direction) {
  if (direction && activeDirection !== direction) return;

  clearInterval(movementInterval);
  movementInterval = null;
  activeDirection = null;
  activePointerId = null;
}

// Move the player from either the keyboard or the on-screen controls.
function movePlayer(direction) {
  if (gameScreen.hidden || gamePaused || gameEnded) return;

  if (direction === "up") {
    playerY -= playerSpeed;
  } else if (direction === "down") {
    playerY += playerSpeed;
  } else if (direction === "left") {
    playerX -= playerSpeed;
  } else if (direction === "right") {
    playerX += playerSpeed;
  } else {
    return;
  }

  // Keep player inside the game board
  playerX = Math.max(3, Math.min(97, playerX));
  playerY = Math.max(5, Math.min(95, playerY));

  // Update player's position
  player.style.left = playerX + "%";
  player.style.top = playerY + "%";

  checkWaterCollection();
  checkWaterDelivery();
  checkObstacleCollision();
}

function startMovement(direction) {
  if (gameScreen.hidden || gamePaused || gameEnded) return;
  if (activeDirection === direction) return;

  stopMovement();
  activeDirection = direction;
  movePlayer(direction);

  // A move can open an overlay, which stops movement immediately.
  if (activeDirection !== direction) return;

  movementInterval = window.setInterval(function () {
    if (gameScreen.hidden || gamePaused || gameEnded || !gameOverlay.hidden) {
      stopMovement();
      return;
    }

    movePlayer(direction);
  }, movementIntervalDelay);
}

movementButtons.forEach(function (button) {
  if ("PointerEvent" in window) {
    button.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      startMovement(button.dataset.direction);
      if (activeDirection === button.dataset.direction) {
        activePointerId = event.pointerId;
      }
    });

    button.addEventListener("pointerup", function (event) {
      if (event.pointerId === activePointerId) stopMovement();
    });

    button.addEventListener("pointercancel", function (event) {
      if (event.pointerId === activePointerId) stopMovement();
    });

    button.addEventListener("lostpointercapture", function (event) {
      if (event.pointerId === activePointerId) stopMovement();
    });

    button.addEventListener("pointerleave", function (event) {
      if (event.pointerId === activePointerId) stopMovement();
    });

    button.addEventListener("click", function (event) {
      // Keep native keyboard and assistive-technology button activation working.
      if (event.detail === 0) {
        movePlayer(button.dataset.direction);
      }
    });
  } else {
    button.addEventListener("click", function () {
      movePlayer(button.dataset.direction);
    });
  }
});

window.addEventListener("pointerup", function (event) {
  if (event.pointerId === activePointerId) stopMovement();
});

window.addEventListener("pointercancel", function (event) {
  if (event.pointerId === activePointerId) stopMovement();
});

window.addEventListener("blur", function () {
  stopMovement();
});

document.addEventListener("visibilitychange", function () {
  if (document.hidden) stopMovement();
});

// Listen for arrow keys
document.addEventListener("keydown", function (event) {
  // Only move while the game screen is visible
  if (gameScreen.hidden || gamePaused || gameEnded) return;

  const directions = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right"
  };
  const direction = directions[event.key];

  if (!direction) return;

  // Stop arrow keys from scrolling the page
  event.preventDefault();
  if (!event.repeat) startMovement(direction);
});

document.addEventListener("keyup", function (event) {
  const directions = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right"
  };
  const direction = directions[event.key];

  if (direction) stopMovement(direction);
});

/* =================================
   WATER COLLECTION
================================= */

const waterSource = document.getElementById("water-source");
const gameFeedback = document.getElementById("game-feedback");
const community = document.getElementById("community");
const deliveriesDisplay = document.getElementById("deliveries");
const deliveryCollection = document.getElementById("delivery-collection");

let deliveries = 0;

// ==============================
// OBSTACLE COLLISION
// ==============================

// Find all obstacles
const obstacles = document.querySelectorAll(".obstacle");

// Track obstacles the player is still touching to prevent repeat penalties.
const obstaclesInContact = new Set();

// Is the player carrying water?
let carryingWater = false;

function resetGame() {
  stopMovement();
  clearInterval(timerInterval);
  timerInterval = null;
  clearTimeout(obstacleTimeout);
  obstacleTimeout = null;
  clearConfetti();

  timeRemaining = activeDifficulty.timeLimit;
  gamePaused = false;
  gameEnded = false;
  deliveries = 0;
  carryingWater = false;
  obstaclesInContact.clear();
  deliveryCollection.replaceChildren();

  obstacles.forEach(function (obstacle, index) {
    obstacle.hidden = index >= activeDifficulty.obstacleCount;
  });

  playerX = 85;
  playerY = 80;
  player.style.left = `${playerX}%`;
  player.style.top = `${playerY}%`;
  player.classList.remove("is-full");

  updateTimerDisplay();
  deliveriesDisplay.textContent = deliveries;
  gameFeedback.textContent = "Collect water to begin your journey!";
  gameOverlay.hidden = true;
}

// Check whether two elements overlap
function isTouching(element1, element2) {
  const circle = element1.getBoundingClientRect();
  const rectangle = element2.getBoundingClientRect();

  // Find the center of the player
  const centerX = circle.left + circle.width / 2;
  const centerY = circle.top + circle.height / 2;
  const radius = Math.min(circle.width, circle.height) / 2;

  // Find the closest point on the obstacle
  const closestX = Math.max(
    rectangle.left,
    Math.min(centerX, rectangle.right)
  );
  const closestY = Math.max(
    rectangle.top,
    Math.min(centerY, rectangle.bottom)
  );

  // Calculate the distance
  const distanceX = centerX - closestX;
  const distanceY = centerY - closestY;

  return (
    distanceX * distanceX + distanceY * distanceY <=
    radius * radius
  );
}

function isTouchingObstacle(player, obstacle) {
  console.log("Checking obstacle collision!");

  const rect1 = player.getBoundingClientRect();
  const rect2 = obstacle.getBoundingClientRect();

  const padding = 2;

  return (
    rect1.left + padding < rect2.right - padding &&
    rect1.right - padding > rect2.left + padding &&
    rect1.top + padding < rect2.bottom - padding &&
    rect1.bottom - padding > rect2.top + padding
  );
}

// Collect water when the player reaches the source
function checkWaterCollection() {

  // Don't collect more water if already carrying some
  if (carryingWater) return;

  if (isTouching(player, waterSource)) {
    carryingWater = true;

    // Show that the can is full.
    player.classList.add("is-full");

    // Written feedback
    gameFeedback.textContent =
      "💧 Water collected! Deliver it to the community!";

    console.log("Water collected!");
  }
}
// Deliver water when the player returns to the community
function checkWaterDelivery() {

  // Only deliver if carrying water
  if (!carryingWater) return;

  if (isTouching(player, document.getElementById("community-house"))) {
    community.classList.remove("delivery-glow");
    void community.offsetWidth;
    community.classList.add("delivery-glow");

    deliveries++;
    deliveriesDisplay.textContent = deliveries;

    if (deliveryCollection.children.length < 10) {
      const jerrycan = document.createElement("img");
      jerrycan.src = "img/water-can-transparent.png";
      jerrycan.alt = "";
      jerrycan.className = "delivery-jerrycan";
      jerrycan.setAttribute("aria-hidden", "true");
      deliveryCollection.appendChild(jerrycan);
    }

    carryingWater = false;

    // Show that the can is empty again.
    player.classList.remove("is-full");

    // Celebrate successful delivery
    gameFeedback.textContent =
      "💛 Water delivered! Your community thanks you!";

    console.log("Delivery completed!");
  }
}
function checkObstacleCollision() {
  if (gamePaused || gameEnded || timeRemaining <= 0) return;

  const touchingObstacles = [];

  for (const obstacle of obstacles) {
    if (obstacle.hidden) continue;

    if (isTouchingObstacle(player, obstacle)) {
      touchingObstacles.push(obstacle);
    }
  }

  for (const obstacle of obstaclesInContact) {
    if (!touchingObstacles.includes(obstacle)) {
      obstaclesInContact.delete(obstacle);
    }
  }

  const newlyTouchedObstacle = touchingObstacles.find(
    (obstacle) => !obstaclesInContact.has(obstacle)
  );

  if (newlyTouchedObstacle) {
    obstaclesInContact.add(newlyTouchedObstacle);

    // Apply this difficulty's penalty without letting the timer go below zero.
    timeRemaining = Math.max(0, timeRemaining - activeDifficulty.collisionPenalty);
    updateTimerDisplay();

    gamePaused = true;
    clearInterval(timerInterval);
    timerInterval = null;
    const message =
      `🚧 Ouch! Obstacle hit! You lost ${activeDifficulty.collisionPenalty} seconds!`;
    gameFeedback.textContent = message;
    showOverlay("Obstacle!", message);

    obstacleTimeout = window.setTimeout(function () {
      obstacleTimeout = null;
      gameOverlay.hidden = true;

      if (timeRemaining === 0) {
        endGame();
      } else {
        gamePaused = false;
        startTimer();
      }
    }, 1500);

  }
}

/* ==============================
   RESTART GAME
================================= */

restartButton.addEventListener("click", function () {
  resetGame();
  showGameScreen();
});
