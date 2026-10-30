// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');
// ==============================
// GAME TIMER
// ==============================

const timerDisplay = document.getElementById("timer");
const restartButton = document.getElementById("restart-button");
const footerContinueButton = document.getElementById("footer-continue-button");
const donationLink = document.getElementById("donation-link");
const resultsDetails = document.getElementById("results-details");
const gameOverlay = document.getElementById("game-overlay");
const confettiLayer = document.getElementById("confetti-layer");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const difficultySettings = {
  easy: { timeLimit: 90, obstacleLayout: "easy", collisionPenalty: 3 },
  normal: { timeLimit: 60, obstacleLayout: "normal", collisionPenalty: 5 },
  hard: { timeLimit: 45, obstacleLayout: "hard", collisionPenalty: 7 }
};

let activeDifficulty = null;
let activeDifficultyName = "normal";
let timeRemaining = difficultySettings.normal.timeLimit;
let timerInterval = null;
let obstacleTimeout = null;
let confettiTimeout = null;
let gamePaused = false;
let gameEnded = false;
let designerMode = false;

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
  if (!designerLayouts) positionPlayerBesideCommunity();
  initializeDesignerLayouts();
  applyLayout(activeDifficultyName);
  setObstacleVisibility(activeDifficultyName);
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

  activeDifficultyName = selectedDifficulty.value;
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
const designerToggle = document.getElementById("designer-toggle");
const designerPanel = document.getElementById("designer-panel");
const designerExit = document.getElementById("designer-exit");
const designerDifficulty = document.getElementById("designer-difficulty");
const designerSize = document.getElementById("designer-size");
const designerSizeValue = document.getElementById("designer-size-value");
const designerFontSize = document.getElementById("designer-font-size");
const designerFontSizeValue = document.getElementById("designer-font-size-value");
const designerCollision = document.getElementById("designer-collision");
const designerCollisionControl = document.querySelector(".designer-collision-control");
const designerSave = document.getElementById("designer-save");
const designerReset = document.getElementById("designer-reset");
const designerStatus = document.getElementById("designer-status");
const designerDelete = document.getElementById("designer-delete");
const assetLibrary = [
  { file: "desert-boulders.png", category: "rocks", obstacle: true },
  { file: "sandstone-tower.png", category: "rocks", obstacle: true },
  { file: "sandstone_rock_formation.png", category: "rocks", obstacle: true },
  { file: "sandstone_ledge.png", category: "rocks", obstacle: true },
  { file: "rock_and_grass.png", category: "rocks", obstacle: true },
  { file: "rock_with_shrub.png", category: "rocks", obstacle: true },
  { file: "flat_sandstone.png", category: "rocks", obstacle: true },
  { file: "flat_gray_stone.png", category: "rocks", obstacle: true },
  { file: "mini_grass_rocks.png", category: "rocks", obstacle: true },
  { file: "small_grass_rock.png", category: "rocks", obstacle: true },
  { file: "small_gray_rock.png", category: "rocks", obstacle: true },
  { file: "small_red_rock.png", category: "rocks", obstacle: true },
  { file: "mixed_pebbles.png", category: "rocks", obstacle: true },
  { file: "scattered_pebbles.png", category: "rocks", obstacle: true },
  { file: "blue_green_agave.png", category: "plants", obstacle: false },
  { file: "dry_coral_shrub.png", category: "plants", obstacle: false },
  { file: "feathery_grass.png", category: "plants", obstacle: false },
  { file: "flowering_prickly_pear.png", category: "plants", obstacle: false },
  { file: "golden_grass_clump.png", category: "plants", obstacle: false },
  { file: "golden_wheat_grass.png", category: "plants", obstacle: false },
  { file: "orange_flowering_bush.png", category: "plants", obstacle: false },
  { file: "orange_flowering_shrub.png", category: "plants", obstacle: false },
  { file: "round_barrel_cactus.png", category: "plants", obstacle: false },
  { file: "sage_green_shrub.png", category: "plants", obstacle: false },
  { file: "sage_yellow_bush.png", category: "plants", obstacle: false },
  { file: "silver_sage.png", category: "plants", obstacle: false },
  { file: "spiky_agave.png", category: "plants", obstacle: false },
  { file: "tall_desert_grass.png", category: "plants", obstacle: false },
  { file: "upright_grass.png", category: "plants", obstacle: false },
  { file: "yellow_flowering_shrub.png", category: "plants", obstacle: false },
  { file: "yellow_wildflowers.png", category: "plants", obstacle: false },
  { file: "fallen_tree_trunk.png", category: "decor", obstacle: false },
].map(function (asset) {
  return {
    ...asset,
    src: `img/desert%20assets/${asset.file}`,
    name: asset.file.replace(/\.png$/, "").replaceAll("_", " ").replaceAll("-", " ")
  };
});

// Player starting position
let playerX = 75;
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
  if (gameScreen.hidden || gamePaused || gameEnded || designerMode) return;

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
  if (gameScreen.hidden || gamePaused || gameEnded || designerMode) return;
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
const landmarkElements = [
  { element: waterSource, id: "landmark-water-source", kind: "image" },
  { element: community.querySelector(".community-art"), id: "landmark-community", kind: "image" },
  { element: waterSource.querySelector(".water-source-label"), id: "label-water-source", kind: "label" },
  { element: community.querySelector(".community-art .location-label"), id: "label-community", kind: "label" }
];

let deliveries = 0;

// ==============================
// OBSTACLE COLLISION
// ==============================

// Find all obstacles
const obstacleFormations = document.querySelectorAll(".obstacle-formation");
const baseEditableAssets = Array.from(document.querySelectorAll(".scenery-item, .obstacle"));
const sceneryLayer = document.querySelector(".scenery-layer");
const libraryCategories = {
  rocks: document.getElementById("library-rocks"),
  plants: document.getElementById("library-plants"),
  decor: document.getElementById("library-decor")
};
const layoutStorageKey = "every-drop-counts-layouts-v1";
const layoutDifficultyNames = ["easy", "normal", "hard"];
let defaultLayout = null;
let designerLayouts = null;
let savedDesignerLayouts = {};
let selectedAsset = null;
let dragState = null;
let designerLoadWarning = "";
let nextAssetId = 1;
let designerEditingDifficulty = "normal";

// Track obstacles the player is still touching to prevent repeat penalties.
const obstaclesInContact = new Set();

// Is the player carrying water?
let carryingWater = false;

function getAssetLayoutId(asset) {
  return asset.dataset.layoutId;
}

function getAssetSource(asset) {
  const image = asset.matches("img") ? asset : asset.querySelector("img");
  return image.getAttribute("src");
}

function getEditableAssets() {
  return Array.from(gameBoard.querySelectorAll(".scenery-item, .obstacle"));
}

function getLandmarkDefinition(elementOrId) {
  return landmarkElements.find(function (landmark) {
    return landmark.id === elementOrId || landmark.element === elementOrId;
  });
}

function prepareLandmarkLabels() {
  const boardRect = gameBoard.getBoundingClientRect();
  const boardWidth = gameBoard.clientWidth;
  const boardHeight = gameBoard.clientHeight;

  landmarkElements.forEach(function (landmark) {
    const element = landmark.element;
    element.dataset.layoutId = landmark.id;
    element.dataset.layoutType = "landmark";
    if (landmark.kind !== "label" || element.parentElement === gameBoard) return;

    const rect = element.getBoundingClientRect();
    const left = rect.left - boardRect.left - gameBoard.clientLeft;
    const top = rect.top - boardRect.top - gameBoard.clientTop;
    gameBoard.appendChild(element);
    element.style.position = "absolute";
    element.style.left = `${(left / boardWidth) * 100}%`;
    element.style.top = `${(top / boardHeight) * 100}%`;
    element.style.right = "auto";
    element.style.bottom = "auto";
    element.style.transform = "none";
  });
}

function copyLayout(layout) {
  return layout.map(function (item) {
    return { ...item };
  });
}

function getLandmarkRecord(element, difficulty = designerEditingDifficulty) {
  const landmark = getLandmarkDefinition(element);
  if (!landmark) return null;

  const boardRect = gameBoard.getBoundingClientRect();
  const rect = landmark.element.getBoundingClientRect();
  const item = designerLayouts[difficulty].find(function (entry) {
    return entry.id === landmark.id;
  });
  if (!item || !gameBoard.clientWidth || !gameBoard.clientHeight) return null;

  item.left = ((rect.left - boardRect.left - gameBoard.clientLeft) / gameBoard.clientWidth) * 100;
  item.top = ((rect.top - boardRect.top - gameBoard.clientTop) / gameBoard.clientHeight) * 100;
  if (landmark.kind === "image") {
    item.width = (rect.width / gameBoard.clientWidth) * 100;
    item.height = (rect.height / gameBoard.clientHeight) * 100;
  } else {
    item.fontSize = Number.parseFloat(window.getComputedStyle(landmark.element).fontSize);
  }
  return item;
}

function getPlayerRecord(difficulty = designerEditingDifficulty) {
  const item = designerLayouts[difficulty].find(function (entry) {
    return entry.id === "player-start";
  });
  if (!item) return null;

  item.left = playerX;
  item.top = playerY;
  return item;
}

function getAssetRecord(asset, difficulty = designerEditingDifficulty) {
  const parent = asset.offsetParent;
  if (!parent || parent.clientWidth === 0 || parent.clientHeight === 0) return null;

  const width = (asset.offsetWidth / parent.clientWidth) * 100;
  const height = (asset.offsetHeight / parent.clientHeight) * 100;
  const record = designerLayouts[difficulty].find(function (item) {
    return item.id === getAssetLayoutId(asset);
  });

  if (!record) return null;

  record.left = (asset.offsetLeft / parent.clientWidth) * 100;
  record.top = (asset.offsetTop / parent.clientHeight) * 100;
  record.width = width;
  record.height = height;
  return record;
}

function assetCollides(item) {
  return typeof item.collidable === "boolean" ? item.collidable : item.type === "obstacle";
}

function captureLayout() {
  const layout = designerLayouts[designerEditingDifficulty];
  getEditableAssets().forEach(function (asset) {
    if (asset.hidden || asset.offsetParent === null) return;
    getAssetRecord(asset);
  });
  landmarkElements.forEach(function (landmark) {
    getLandmarkRecord(landmark.element);
  });
  getPlayerRecord();
  return copyLayout(layout);
}

function copyDefaultLayout(difficulty) {
  return defaultLayout
    .filter(function (item) {
      if (item.type !== "obstacle") return true;
      const asset = baseEditableAssets.find(function (entry) {
        return getAssetLayoutId(entry) === item.id;
      });
      const formation = asset.closest(".obstacle-formation");
      return formation.dataset.difficulties.split(" ").includes(difficulty);
    })
    .map(function (item) {
      return { ...item };
    });
}

function cleanLayout(layout, difficulty) {
  if (Array.isArray(layout)) {
    if (layout.length > 200) return null;

    const seenIds = new Set();
    const clean = [];
    layout.forEach(function (item) {
      if (
        !item ||
        typeof item.id !== "string" ||
        item.id.length > 100 ||
        seenIds.has(item.id)
      ) {
        return;
      }

      const landmark = getLandmarkDefinition(item.id);
      if (item.type === "player") {
        const basePlayer = defaultLayout.find(function (entry) {
          return entry.id === "player-start" && entry.type === "player";
        });
        if (item.id !== "player-start" || !basePlayer) return;
        if (!Number.isFinite(item.left) || !Number.isFinite(item.top)) return;
        clean.push({
          id: "player-start",
          type: "player",
          left: Math.max(0, Math.min(100, item.left)),
          top: Math.max(0, Math.min(100, item.top))
        });
        seenIds.add(item.id);
        return;
      }

      if (item.type === "landmark") {
        const baseLandmark = defaultLayout.find(function (entry) {
          return entry.id === item.id && entry.type === "landmark";
        });
        if (!landmark || !baseLandmark || item.kind !== landmark.kind) return;
        if (!Number.isFinite(item.left) || !Number.isFinite(item.top)) return;

        const cleanLandmark = {
          id: landmark.id,
          type: "landmark",
          kind: landmark.kind,
          left: Math.max(0, Math.min(100, item.left)),
          top: Math.max(0, Math.min(100, item.top))
        };
        if (landmark.kind === "image") {
          if (!Number.isFinite(item.width)) return;
          const width = Math.max(2, Math.min(50, item.width));
          const height = baseLandmark.height * (width / baseLandmark.width);
          cleanLandmark.width = width;
          cleanLandmark.height = height;
          cleanLandmark.left = Math.max(0, Math.min(100 - width, item.left));
          cleanLandmark.top = Math.max(0, Math.min(100 - height, item.top));
        } else {
          if (!Number.isFinite(item.fontSize)) return;
          cleanLandmark.fontSize = Math.max(8, Math.min(28, item.fontSize));
        }
        clean.push(cleanLandmark);
        seenIds.add(item.id);
        return;
      }

      const source = assetLibrary.find(function (asset) {
        return asset.src === item.src;
      });
      const base = defaultLayout.find(function (entry) {
        return entry.id === item.id;
      });
      const isBaseAsset = Boolean(base);
      if (!source || (isBaseAsset && source.src !== base.src)) return;

      const type = source.obstacle ? "obstacle" : "scenery";
      if (item.type !== type) return;
      if (
        !Number.isFinite(item.left) ||
        !Number.isFinite(item.top) ||
        !Number.isFinite(item.width)
      ) {
        return;
      }

      const width = Math.max(2, Math.min(30, item.width));
      const originalHeight = base ? base.height : item.height;
      const originalWidth = base ? base.width : item.width;
      const height = Number.isFinite(item.height) && item.height > 0
        ? item.height * (width / originalWidth)
        : originalHeight * (width / originalWidth);

      clean.push({
        id: item.id,
        src: source.src,
        type,
        left: Math.max(0, Math.min(100 - width, item.left)),
        top: Math.max(0, Math.min(100 - height, item.top)),
        width,
        height,
        collidable: typeof item.collidable === "boolean" ? item.collidable : type === "obstacle"
      });
      seenIds.add(item.id);
    });
    defaultLayout.forEach(function (item) {
      if ((item.type === "landmark" || item.type === "player") && !seenIds.has(item.id)) {
        clean.push({ ...item });
      }
    });
    return clean;
  }

  if (!layout || typeof layout !== "object") return null;

  // Convert layouts saved by Designer Mode before it supported added instances.
  const migrated = [];
  Object.keys(layout).forEach(function (id) {
    const base = defaultLayout.find(function (item) {
      return item.id === id;
    });
    const item = layout[id];
    if (!base || !item) return;
    if (base.type === "obstacle") {
      const asset = baseEditableAssets.find(function (entry) {
        return getAssetLayoutId(entry) === base.id;
      });
      if (!asset.closest(".obstacle-formation").dataset.difficulties.split(" ").includes(difficulty)) {
        return;
      }
    }
    migrated.push({ ...base, ...item });
  });
  return cleanLayout(migrated);
}

function initializeDesignerLayouts() {
  if (designerLayouts) return;

  prepareLandmarkLabels();

  baseEditableAssets.forEach(function (asset) {
    if (!asset.dataset.layoutId) {
      const assetClass = Array.from(asset.classList).find(function (className) {
        return (
          className.startsWith("scenery-") &&
          className !== "scenery-item" &&
          !["scenery-tiny", "scenery-small", "scenery-medium", "scenery-large"].includes(className)
        ) ||
          (className.startsWith("obstacle-") && className !== "obstacle-tall");
      });
      if (!assetClass) {
        throw new Error("Every editable asset needs a stable layout identifier.");
      }
      asset.dataset.layoutId = assetClass;
    }
    asset.style.transform = "none";
  });

  const hiddenStates = Array.from(obstacleFormations, function (formation) {
    return formation.hidden;
  });
  obstacleFormations.forEach(function (formation) {
    formation.hidden = false;
  });
  baseEditableAssets.forEach(function (asset) {
    asset.hidden = false;
  });

  defaultLayout = baseEditableAssets.map(function (asset) {
    const parent = asset.offsetParent;
    const source = getAssetSource(asset);
    const type = asset.classList.contains("obstacle") ? "obstacle" : "scenery";
    return {
      id: getAssetLayoutId(asset),
      src: source,
      type,
      left: (asset.offsetLeft / parent.clientWidth) * 100,
      top: (asset.offsetTop / parent.clientHeight) * 100,
      width: (asset.offsetWidth / parent.clientWidth) * 100,
      height: (asset.offsetHeight / parent.clientHeight) * 100,
      collidable: type === "obstacle"
    };
  });
  landmarkElements.forEach(function (landmark) {
    const item = {
      id: landmark.id,
      type: "landmark",
      kind: landmark.kind,
      left: 0,
      top: 0
    };
    if (landmark.kind === "image") {
      item.width = 0;
      item.height = 0;
    } else {
      item.fontSize = Number.parseFloat(window.getComputedStyle(landmark.element).fontSize);
    }
    const boardRect = gameBoard.getBoundingClientRect();
    const rect = landmark.element.getBoundingClientRect();
    item.left = ((rect.left - boardRect.left - gameBoard.clientLeft) / gameBoard.clientWidth) * 100;
    item.top = ((rect.top - boardRect.top - gameBoard.clientTop) / gameBoard.clientHeight) * 100;
    if (landmark.kind === "image") {
      item.width = (rect.width / gameBoard.clientWidth) * 100;
      item.height = (rect.height / gameBoard.clientHeight) * 100;
    }
    defaultLayout.push(item);
  });
  player.dataset.layoutId = "player-start";
  defaultLayout.push({
    id: "player-start",
    type: "player",
    left: playerX,
    top: playerY
  });

  baseEditableAssets.forEach(function (asset) {
    asset.style.removeProperty("transform");
  });
  obstacleFormations.forEach(function (formation, index) {
    formation.hidden = hiddenStates[index];
  });

  designerLayouts = {
    easy: copyDefaultLayout("easy"),
    normal: copyDefaultLayout("normal"),
    hard: copyDefaultLayout("hard")
  };

  try {
    const savedLayouts = localStorage.getItem(layoutStorageKey);
    if (!savedLayouts) return;

    const parsedLayouts = JSON.parse(savedLayouts);
    layoutDifficultyNames.forEach(function (difficulty) {
      const clean = cleanLayout(parsedLayouts[difficulty], difficulty);
      if (clean) {
        designerLayouts[difficulty] = clean;
        savedDesignerLayouts[difficulty] = copyLayout(clean);
      }
    });
  } catch (error) {
    console.error("Could not load saved designer layouts.", error);
    designerLoadWarning = "Saved layouts could not be loaded. You can still edit and save a new layout.";
    designerStatus.textContent = designerLoadWarning;
  }
}

function createAssetElement(item, difficulty = designerEditingDifficulty) {
  const asset = item.type === "obstacle"
    ? document.createElement("div")
    : document.createElement("img");
  const image = item.type === "obstacle"
    ? document.createElement("img")
    : asset;

  asset.dataset.layoutId = item.id;
  asset.classList.add(item.type === "obstacle" ? "obstacle" : "scenery-item");
  asset.classList.add("designer-added-asset");
  if (item.type === "obstacle") {
    asset.classList.add("obstacle-library-item");
    image.className = "obstacle-image";
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    asset.appendChild(image);
  } else {
    asset.classList.add("scenery-library-item");
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
  }

  image.src = item.src;
  asset.style.left = `${item.left}%`;
  asset.style.top = `${item.top}%`;
  asset.style.width = `${item.width}%`;
  asset.style.height = "auto";

  const parent = item.type === "obstacle" ? gameBoard : sceneryLayer;
  parent.appendChild(asset);
  image.addEventListener("load", function () {
    const record = designerLayouts[difficulty].find(function (entry) {
      return entry.id === item.id;
    });
    if (record) {
      getAssetRecord(asset, difficulty);
      updateAssetLayout(asset, record, difficulty);
    }
  });
  addDesignerAssetHandlers(asset);
  return asset;
}

function applyLayout(difficulty) {
  if (!designerLayouts || !designerLayouts[difficulty]) return;

  gameBoard.querySelectorAll(".designer-added-asset").forEach(function (asset) {
    asset.remove();
  });
  baseEditableAssets.forEach(function (asset) {
    asset.hidden = true;
  });

  designerLayouts[difficulty].forEach(function (item) {
    if (item.type === "player") {
      updatePlayerPosition(item.left, item.top, item);
      return;
    }

    if (item.type === "landmark") {
      const landmark = getLandmarkDefinition(item.id);
      if (landmark) applyLandmarkLayout(landmark.element, item);
      return;
    }

    const baseAsset = baseEditableAssets.find(function (asset) {
      return getAssetLayoutId(asset) === item.id;
    });
    const asset = baseAsset || createAssetElement(item, difficulty);
    asset.hidden = false;
    asset.style.left = `${item.left}%`;
    asset.style.top = `${item.top}%`;
    asset.style.width = `${item.width}%`;
    asset.style.height = "auto";
  });
  setObstacleVisibility(difficulty);
}

function setObstacleVisibility(difficulty) {
  const layout = designerLayouts && designerLayouts[difficulty];
  obstacleFormations.forEach(function (formation) {
    const hasObstacle = layout && layout.some(function (item) {
      const asset = baseEditableAssets.find(function (entry) {
        return getAssetLayoutId(entry) === item.id;
      });
      return item.type === "obstacle" && asset && asset.closest(".obstacle-formation") === formation;
    });
    formation.hidden = !hasObstacle;
  });
}

function setSelectedAsset(asset) {
  if (selectedAsset) selectedAsset.classList.remove("designer-selected");

  selectedAsset = asset;
  const item = selectedAsset && designerLayouts[designerEditingDifficulty].find(function (entry) {
    return entry.id === getAssetLayoutId(selectedAsset);
  });
  const landmark = item && item.type === "landmark" ? getLandmarkDefinition(item.id) : null;
  const isPlayer = item && item.type === "player";
  designerDelete.disabled = !selectedAsset || Boolean(landmark) || Boolean(isPlayer);
  if (!selectedAsset) {
    designerSize.disabled = true;
    designerSizeValue.textContent = "Select an asset";
    designerFontSize.disabled = true;
    designerFontSizeValue.textContent = "Select a label";
    designerCollision.checked = false;
    designerCollision.disabled = true;
    designerCollisionControl.hidden = true;
    return;
  }

  selectedAsset.classList.add("designer-selected");
  if (!item) return;
  designerCollisionControl.hidden = false;
  const canEditCollision = item.type === "obstacle" || item.type === "scenery";
  designerCollision.disabled = !canEditCollision;
  designerCollision.checked = canEditCollision && assetCollides(item);
  if (isPlayer) {
    designerSize.disabled = true;
    designerSizeValue.textContent = "Player position only";
    designerFontSize.disabled = true;
    designerFontSizeValue.textContent = "Drag to reposition";
    return;
  }

  if (landmark && landmark.kind === "label") {
    designerSize.disabled = true;
    designerSizeValue.textContent = "Text label selected";
    designerFontSize.value = Math.max(8, Math.min(28, item.fontSize));
    designerFontSize.disabled = false;
    designerFontSizeValue.textContent = `${designerFontSize.value}px`;
    return;
  }

  designerFontSize.disabled = true;
  designerFontSizeValue.textContent = "Select a label";
  designerSize.min = "2";
  designerSize.max = item.type === "landmark" ? "50" : "30";
  designerSize.value = Math.max(2, Math.min(Number(designerSize.max), item.width));
  designerSize.disabled = false;
  designerSizeValue.textContent = `${Number(designerSize.value).toFixed(1)}% of board width`;
}

function applyLandmarkLayout(element, item) {
  element.style.position = "absolute";
  element.style.left = `${item.left}%`;
  element.style.top = `${item.top}%`;
  element.style.right = "auto";
  element.style.bottom = "auto";
  element.style.transform = "none";

  const landmark = getLandmarkDefinition(element);
  if (landmark.kind === "image") {
    element.style.width = `${item.width}%`;
    element.style.height = "auto";
  } else {
    element.style.fontSize = `${item.fontSize}px`;
  }
  constrainLandmark(element, item);
}

function constrainLandmark(element, item) {
  const rect = element.getBoundingClientRect();
  const maxLeft = Math.max(0, gameBoard.clientWidth - rect.width);
  const maxTop = Math.max(0, gameBoard.clientHeight - rect.height);
  const left = Math.max(0, Math.min(maxLeft, (item.left / 100) * gameBoard.clientWidth));
  const top = Math.max(0, Math.min(maxTop, (item.top / 100) * gameBoard.clientHeight));

  item.left = (left / gameBoard.clientWidth) * 100;
  item.top = (top / gameBoard.clientHeight) * 100;
  element.style.left = `${item.left}%`;
  element.style.top = `${item.top}%`;
}

function updateLandmarkLayout(element, changes, difficulty = designerEditingDifficulty) {
  const item = designerLayouts[difficulty].find(function (entry) {
    return entry.id === getAssetLayoutId(element);
  });
  const landmark = getLandmarkDefinition(element);
  if (!item || !landmark || !gameBoard.clientWidth || !gameBoard.clientHeight) return;

  if (landmark.kind === "image" && Number.isFinite(changes.width)) {
    const width = Math.max(2, Math.min(50, changes.width));
    item.width = width;
    element.style.width = `${width}%`;
    element.style.height = "auto";
  }
  if (landmark.kind === "label" && Number.isFinite(changes.fontSize)) {
    item.fontSize = Math.max(8, Math.min(28, changes.fontSize));
    element.style.fontSize = `${item.fontSize}px`;
  }
  if (Number.isFinite(changes.left)) item.left = changes.left;
  if (Number.isFinite(changes.top)) item.top = changes.top;
  constrainLandmark(element, item);

  if (element === selectedAsset) {
    if (landmark.kind === "label") {
      designerFontSize.value = item.fontSize;
      designerFontSizeValue.textContent = `${item.fontSize}px`;
    } else {
      designerSize.value = item.width;
      designerSizeValue.textContent = `${item.width.toFixed(1)}% of board width`;
    }
  }
}

function updatePlayerPosition(left, top, item) {
  const boardWidth = gameBoard.clientWidth;
  const boardHeight = gameBoard.clientHeight;
  if (!boardWidth || !boardHeight) return;

  const playerWidth = player.getBoundingClientRect().width;
  const playerHeight = player.getBoundingClientRect().height;
  const halfWidthPercent = (playerWidth / 2 / boardWidth) * 100;
  const halfHeightPercent = (playerHeight / 2 / boardHeight) * 100;
  playerX = Math.max(halfWidthPercent, Math.min(100 - halfWidthPercent, left));
  playerY = Math.max(halfHeightPercent, Math.min(100 - halfHeightPercent, top));
  player.style.left = `${playerX}%`;
  player.style.top = `${playerY}%`;

  if (item) {
    item.left = playerX;
    item.top = playerY;
  }
}

function updateAssetLayout(asset, nextLayout, difficulty = designerEditingDifficulty) {
  const parent = asset.offsetParent;
  if (!parent) return;

  const width = Math.max(2, Math.min(30, nextLayout.width));
  asset.style.width = `${width}%`;
  asset.style.height = "auto";

  const height = (asset.offsetHeight / parent.clientHeight) * 100;
  const item = designerLayouts[difficulty].find(function (entry) {
    return entry.id === getAssetLayoutId(asset);
  });
  if (!item) return;

  item.left = Math.max(0, Math.min(100 - width, nextLayout.left));
  item.top = Math.max(0, Math.min(100 - height, nextLayout.top));
  item.width = width;
  item.height = height;
  asset.style.left = `${item.left}%`;
  asset.style.top = `${item.top}%`;

  if (asset === selectedAsset) {
    designerSize.value = width;
    designerSizeValue.textContent = `${width.toFixed(1)}% of board width`;
  }
}

function addDesignerAssetHandlers(asset) {
  asset.addEventListener("pointerdown", function (event) {
    if (!designerMode || event.button > 0) return;

    event.preventDefault();
    setSelectedAsset(asset);
    const parent = asset.offsetParent;
    if (!parent) return;
    const item = designerLayouts[designerEditingDifficulty].find(function (entry) {
      return entry.id === getAssetLayoutId(asset);
    });
    dragState = {
      asset,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: item.left,
      top: item.top,
      parentWidth: parent.clientWidth,
      parentHeight: parent.clientHeight
    };
    asset.setPointerCapture(event.pointerId);
  });

  asset.addEventListener("pointermove", function (event) {
    if (!dragState || dragState.asset !== asset || dragState.pointerId !== event.pointerId) return;

    const item = designerLayouts[designerEditingDifficulty].find(function (entry) {
      return entry.id === getAssetLayoutId(asset);
    });
    updateAssetLayout(asset, {
      left: dragState.left + ((event.clientX - dragState.startX) / dragState.parentWidth) * 100,
      top: dragState.top + ((event.clientY - dragState.startY) / dragState.parentHeight) * 100,
      width: item.width
    });
  });

  function finishDragging(event) {
    if (!dragState || dragState.asset !== asset || dragState.pointerId !== event.pointerId) return;
    dragState = null;
  }
  asset.addEventListener("pointerup", finishDragging);
  asset.addEventListener("pointercancel", finishDragging);
}

function addLandmarkHandlers(element) {
  element.addEventListener("pointerdown", function (event) {
    if (!designerMode || event.button > 0) return;

    event.preventDefault();
    setSelectedAsset(element);
    const item = designerLayouts[designerEditingDifficulty].find(function (entry) {
      return entry.id === getAssetLayoutId(element);
    });
    dragState = {
      asset: element,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: item.left,
      top: item.top,
      parentWidth: gameBoard.clientWidth,
      parentHeight: gameBoard.clientHeight,
      landmark: true
    };
    element.setPointerCapture(event.pointerId);
  });

  element.addEventListener("pointermove", function (event) {
    if (!dragState || dragState.asset !== element || dragState.pointerId !== event.pointerId) return;

    const item = designerLayouts[designerEditingDifficulty].find(function (entry) {
      return entry.id === getAssetLayoutId(element);
    });
    updateLandmarkLayout(element, {
      left: dragState.left + ((event.clientX - dragState.startX) / dragState.parentWidth) * 100,
      top: dragState.top + ((event.clientY - dragState.startY) / dragState.parentHeight) * 100,
      width: item.width,
      fontSize: item.fontSize
    });
  });

  function finishDragging(event) {
    if (!dragState || dragState.asset !== element || dragState.pointerId !== event.pointerId) return;
    dragState = null;
  }
  element.addEventListener("pointerup", finishDragging);
  element.addEventListener("pointercancel", finishDragging);
}

function addPlayerDesignerHandler() {
  player.addEventListener("pointerdown", function (event) {
    if (!designerMode || event.button > 0) return;

    event.preventDefault();
    setSelectedAsset(player);
    dragState = {
      asset: player,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: playerX,
      top: playerY,
      parentWidth: gameBoard.clientWidth,
      parentHeight: gameBoard.clientHeight
    };
    player.setPointerCapture(event.pointerId);
  });

  player.addEventListener("pointermove", function (event) {
    if (!dragState || dragState.asset !== player || dragState.pointerId !== event.pointerId) return;

    const item = designerLayouts[designerEditingDifficulty].find(function (entry) {
      return entry.id === "player-start";
    });
    updatePlayerPosition(
      dragState.left + ((event.clientX - dragState.startX) / dragState.parentWidth) * 100,
      dragState.top + ((event.clientY - dragState.startY) / dragState.parentHeight) * 100,
      item
    );
  });

  function finishDragging(event) {
    if (!dragState || dragState.asset !== player || dragState.pointerId !== event.pointerId) return;
    dragState = null;
  }
  player.addEventListener("pointerup", finishDragging);
  player.addEventListener("pointercancel", finishDragging);
}

function saveDesignerLayouts() {
  designerLayouts[designerEditingDifficulty] = captureLayout();
  savedDesignerLayouts[designerEditingDifficulty] = copyLayout(
    designerLayouts[designerEditingDifficulty]
  );

  try {
    localStorage.setItem(layoutStorageKey, JSON.stringify(savedDesignerLayouts));
    designerLoadWarning = "";
    designerStatus.textContent = `${designerEditingDifficulty} layout saved on this device.`;
  } catch (error) {
    console.error("Could not save designer layouts.", error);
    designerStatus.textContent = "Layout could not be saved. Check browser storage availability and try again.";
  }
}

function addLibraryAsset(assetInfo) {
  const id = `added-${Date.now()}-${nextAssetId++}`;
  const item = {
    id,
    src: assetInfo.src,
    type: assetInfo.obstacle ? "obstacle" : "scenery",
    left: 42,
    top: 42,
    width: assetInfo.obstacle ? 14 : 9,
    height: 0,
    collidable: assetInfo.obstacle
  };
  designerLayouts[designerEditingDifficulty].push(item);
  const asset = createAssetElement(item, designerEditingDifficulty);
  setSelectedAsset(asset);
  designerStatus.textContent = `Added ${assetInfo.name}. Drag it to position it.`;
  const image = assetInfo.obstacle ? asset.querySelector("img") : asset;
  if (image.complete) getAssetRecord(asset);
}

function deleteSelectedAsset() {
  if (!selectedAsset) return;

  const id = getAssetLayoutId(selectedAsset);
  const selectedItem = designerLayouts[designerEditingDifficulty].find(function (item) {
    return item.id === id;
  });
  if (!selectedItem || selectedItem.type === "landmark" || selectedItem.type === "player") return;

  designerLayouts[designerEditingDifficulty] = designerLayouts[designerEditingDifficulty].filter(
    function (item) {
      return item.id !== id;
    }
  );
  selectedAsset.classList.remove("designer-selected");
  if (baseEditableAssets.includes(selectedAsset)) {
    selectedAsset.hidden = true;
  } else {
    selectedAsset.remove();
  }
  selectedAsset = null;
  designerDelete.disabled = true;
  designerSize.disabled = true;
  designerSizeValue.textContent = "Select an asset";
  designerFontSize.disabled = true;
  designerFontSizeValue.textContent = "Select a label";
  designerCollision.checked = false;
  designerCollision.disabled = true;
  designerCollisionControl.hidden = true;
  obstaclesInContact.clear();
  setObstacleVisibility(designerEditingDifficulty);
  designerStatus.textContent = "Selected asset removed from this difficulty layout.";
}

function initializeAssetLibrary() {
  assetLibrary.forEach(function (asset) {
    const button = document.createElement("button");
    const thumbnail = document.createElement("img");
    button.type = "button";
    button.className = "asset-library-item";
    button.setAttribute("aria-label", `Add ${asset.name}${asset.obstacle ? " obstacle" : " scenery"}`);
    thumbnail.src = asset.src;
    thumbnail.alt = "";
    thumbnail.loading = "lazy";
    button.appendChild(thumbnail);
    button.addEventListener("click", function () {
      if (!designerMode) return;
      addLibraryAsset(asset);
    });
    libraryCategories[asset.category].appendChild(button);
  });
}

function enterDesignerMode() {
  if (gameScreen.hidden || gameEnded || !gameOverlay.hidden) return;

  initializeDesignerLayouts();
  stopMovement();
  obstaclesInContact.clear();
  gamePaused = true;
  designerMode = true;
  designerDifficulty.value = activeDifficultyName;
  designerEditingDifficulty = activeDifficultyName;
  applyLayout(designerDifficulty.value);
  setObstacleVisibility(designerDifficulty.value);
  gameScreen.classList.add("designer-mode");
  movementButtons.forEach(function (button) {
    button.disabled = true;
  });
  gameBoard.classList.add("designer-active");
  designerPanel.hidden = false;
  designerToggle.disabled = true;
  designerToggle.textContent = "🎨 Designer Mode Active";
  designerStatus.textContent = designerLoadWarning || "Designer Mode is active — the game is paused.";
  setSelectedAsset(null);
}

function exitDesignerMode() {
  if (!designerMode) return;

  designerLayouts[designerEditingDifficulty] = captureLayout();
  designerMode = false;
  gamePaused = false;
  gameBoard.classList.remove("designer-active");
  gameScreen.classList.remove("designer-mode");
  movementButtons.forEach(function (button) {
    button.disabled = false;
  });
  designerPanel.hidden = true;
  designerToggle.disabled = false;
  designerToggle.textContent = "🎨 Edit Layout";
  setSelectedAsset(null);
  applyLayout(activeDifficultyName);
  setObstacleVisibility(activeDifficultyName);
  startTimer();
}

baseEditableAssets.forEach(addDesignerAssetHandlers);
landmarkElements.forEach(function (landmark) {
  addLandmarkHandlers(landmark.element);
});
addPlayerDesignerHandler();
initializeAssetLibrary();
designerDelete.addEventListener("click", deleteSelectedAsset);

designerToggle.addEventListener("click", enterDesignerMode);
designerExit.addEventListener("click", exitDesignerMode);

designerDifficulty.addEventListener("change", function (event) {
  const nextDifficulty = event.currentTarget.value;
  designerDifficulty.value = designerEditingDifficulty;
  designerLayouts[designerEditingDifficulty] = captureLayout();
  designerEditingDifficulty = nextDifficulty;
  designerDifficulty.value = nextDifficulty;
  setSelectedAsset(null);
  applyLayout(designerEditingDifficulty);
});

designerSize.addEventListener("input", function () {
  if (!selectedAsset) return;

  const landmark = getLandmarkDefinition(selectedAsset);
  if (landmark && landmark.kind === "image") {
    updateLandmarkLayout(selectedAsset, { width: Number(designerSize.value) });
    return;
  }

  const item = designerLayouts[designerEditingDifficulty].find(function (entry) {
    return entry.id === getAssetLayoutId(selectedAsset);
  });
  if (!item) return;
  updateAssetLayout(selectedAsset, {
    left: item.left,
    top: item.top,
    width: Number(designerSize.value)
  });
});

designerFontSize.addEventListener("input", function () {
  if (!selectedAsset) return;
  const landmark = getLandmarkDefinition(selectedAsset);
  if (!landmark || landmark.kind !== "label") return;

  updateLandmarkLayout(selectedAsset, { fontSize: Number(designerFontSize.value) });
});

designerCollision.addEventListener("change", function () {
  if (!selectedAsset) return;
  const item = designerLayouts[designerEditingDifficulty].find(function (entry) {
    return entry.id === getAssetLayoutId(selectedAsset);
  });
  if (!item || (item.type !== "obstacle" && item.type !== "scenery")) return;

  item.collidable = designerCollision.checked;
  obstaclesInContact.delete(selectedAsset);
});

designerSave.addEventListener("click", saveDesignerLayouts);

designerReset.addEventListener("click", function () {
  if (!window.confirm(`Reset the ${designerEditingDifficulty} layout to its original positions and sizes?`)) return;

  designerLayouts[designerEditingDifficulty] = copyDefaultLayout(designerEditingDifficulty);
  delete savedDesignerLayouts[designerEditingDifficulty];
  if (selectedAsset) setSelectedAsset(null);
  applyLayout(designerEditingDifficulty);

  try {
    localStorage.setItem(layoutStorageKey, JSON.stringify(savedDesignerLayouts));
    designerLoadWarning = "";
    designerStatus.textContent = `${designerEditingDifficulty} layout restored to its original positions.`;
  } catch (error) {
    console.error("Could not save the reset designer layout.", error);
    designerStatus.textContent = "Layout reset for this session, but the reset could not be saved to browser storage.";
  }
});

window.addEventListener("resize", function () {
  if (!designerLayouts || gameScreen.hidden) return;

  const difficulty = designerMode ? designerEditingDifficulty : activeDifficultyName;
  landmarkElements.forEach(function (landmark) {
    const item = designerLayouts[difficulty].find(function (entry) {
      return entry.id === landmark.id;
    });
    if (item) applyLandmarkLayout(landmark.element, item);
  });
  const playerStart = designerLayouts[difficulty].find(function (item) {
    return item.id === "player-start";
  });
  if (designerMode && playerStart) {
    updatePlayerPosition(playerX, playerY, playerStart);
  } else {
    updatePlayerPosition(playerX, playerY);
  }
});

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

  setObstacleVisibility(activeDifficultyName);

  const playerStart = designerLayouts && designerLayouts[activeDifficultyName].find(function (item) {
    return item.id === "player-start";
  });
  if (playerStart && gameBoard.clientWidth) {
    updatePlayerPosition(playerStart.left, playerStart.top, playerStart);
  } else {
    playerX = 75;
    playerY = 80;
    player.style.left = `${playerX}%`;
    player.style.top = `${playerY}%`;
    positionPlayerBesideCommunity();
  }
  player.classList.remove("is-full");

  updateTimerDisplay();
  deliveriesDisplay.textContent = deliveries;
  gameFeedback.textContent = "Collect water to begin your journey!";
  gameOverlay.hidden = true;
}

function positionPlayerBesideCommunity() {
  const communityArt = community.querySelector(".community-art");
  const boardRect = gameBoard.getBoundingClientRect();
  const communityRect = communityArt.getBoundingClientRect();
  const boardLeft = boardRect.left + gameBoard.clientLeft;
  const boardTop = boardRect.top + gameBoard.clientTop;
  const boardWidth = gameBoard.clientWidth;
  const boardHeight = gameBoard.clientHeight;

  if (!boardWidth || !boardHeight || !communityRect.width) return;

  const playerRect = player.getBoundingClientRect();
  const playerWidth = playerRect.width;
  const playerHeight = playerRect.height;
  const gap = 1;
  const preferredLeftCenter = communityRect.left - boardLeft - playerWidth / 2 - gap;
  const leftCenter = playerWidth / 2;
  const rightCenter = boardWidth - playerWidth / 2;
  const spawnCenterX = preferredLeftCenter >= leftCenter
    ? preferredLeftCenter
    : communityRect.right - boardLeft + playerWidth / 2 + gap;
  const spawnCenterY = communityRect.top - boardTop + communityRect.height / 2;
  playerX = (Math.max(leftCenter, Math.min(rightCenter, spawnCenterX)) / boardWidth) * 100;
  playerY = (Math.max(playerHeight / 2, Math.min(boardHeight - playerHeight / 2, spawnCenterY)) / boardHeight) * 100;
  player.style.left = `${playerX}%`;
  player.style.top = `${playerY}%`;
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
  const rect1 = player.getBoundingClientRect();
  const rect2 = getAssetCollisionBounds(obstacle);

  const padding = 2;

  return (
    rect1.left + padding < rect2.right - padding &&
    rect1.right - padding > rect2.left + padding &&
    rect1.top + padding < rect2.bottom - padding &&
    rect1.bottom - padding > rect2.top + padding
  );
}

function getAssetCollisionBounds(asset) {
  const image = asset.matches("img") ? asset : asset.querySelector("img");
  const rect = asset.getBoundingClientRect();
  const fileName = decodeURIComponent(image ? image.getAttribute("src").split("/").pop() : "")
    .toLowerCase();
  let insets = { left: 0.12, right: 0.12, top: 0.18, bottom: 0.14 };

  if (fileName.includes("fallen_tree_trunk")) {
    insets = { left: 0.08, right: 0.08, top: 0.28, bottom: 0.28 };
  } else if (
    fileName.includes("cactus") ||
    fileName.includes("agave") ||
    fileName.includes("prickly_pear")
  ) {
    insets = { left: 0.28, right: 0.28, top: 0.1, bottom: 0.08 };
  } else if (
    fileName.includes("shrub") ||
    fileName.includes("bush") ||
    fileName.includes("grass") ||
    fileName.includes("wildflowers")
  ) {
    insets = { left: 0.25, right: 0.25, top: 0.2, bottom: 0.16 };
  } else if (fileName.includes("pebbles") || fileName.includes("small_")) {
    insets = { left: 0.12, right: 0.12, top: 0.25, bottom: 0.2 };
  }

  return {
    left: rect.left + rect.width * insets.left,
    right: rect.right - rect.width * insets.right,
    top: rect.top + rect.height * insets.top,
    bottom: rect.bottom - rect.height * insets.bottom
  };
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

  if (isTouching(player, community.querySelector(".community-art"))) {
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

  const layout = designerLayouts && designerLayouts[activeDifficultyName];
  for (const obstacle of getEditableAssets()) {
    const item = layout && layout.find(function (entry) {
      return entry.id === getAssetLayoutId(obstacle);
    });
    const formation = obstacle.closest(".obstacle-formation");
    if (
      obstacle.hidden ||
      !item ||
      !assetCollides(item) ||
      (formation && formation.hidden)
    ) {
      continue;
    }

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

footerContinueButton.addEventListener("click", function () {
  gameOverlay.hidden = true;
  donationLink.focus();
});
