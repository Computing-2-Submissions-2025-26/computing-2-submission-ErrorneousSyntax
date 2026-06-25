import Battleship from "./battleship.js";
import ComputerLogic from "./computerlogic.js";

//-------------------- UI STATE --------------------

// battleship.js handles the rules, this file is mostly the screen stuff
let state = Battleship.createInitialGameState();
let selectedShipIndex = 0;
let orientation = Battleship.ORIENTATION.HORIZONTAL;
let roundNumber = 1;
let uiMessage = "";
// stores the last shots so only that square animates
let animatedPlayerShot = null;
let animatedComputerShot = null;
let computerTurnTimer = null;

//-------------------- HTML ELEMENTS --------------------

const playerBoardEl = document.getElementById("player-board");
const computerBoardEl = document.getElementById("computer-board");
const defenceBoardEl = document.getElementById("defence-board");
const statusEl = document.getElementById("status");
const setupErrorEl = document.getElementById("setup-error");
const battleStatusEl = document.getElementById("battle-status");
const roundNumberEl = document.getElementById("round-number");
const friendlyFleetEl = document.getElementById("friendly-fleet");
const oppositionFleetEl = document.getElementById("opposition-fleet");
const randomPlaceBtn = document.getElementById("random-place-btn");
const rotateBtn = document.getElementById("rotate-btn");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

//-------------------- SMALL HELPER FUNCTIONS --------------------

function findNextUnplacedShip(fleet) {
    // findIndex gives -1 if it cant find an unplaced ship
    return fleet.findIndex(function (ship) {
        return ship.cells.length === 0;
    });
}

function cellName(cell) {
    // 65 is the character code for A, so col 0 becomes A etc.
    const columnLetter = String.fromCharCode(65 + cell.col);
    return `${columnLetter}${cell.row + 1}`;
}

function showScreen(screenId) {
    // hide every screen then show the one needed
    document.querySelectorAll(".screen").forEach(function (screen) {
        screen.classList.remove("active");
    });
    document.getElementById(screenId).classList.add("active");
}

function clearComputerTimer() {
    // keep the timer id so restart can cancel it
    if (computerTurnTimer !== null) {
        window.clearTimeout(computerTurnTimer);
        computerTurnTimer = null;
    }
}

function getPlayerDisplayBoard() {
    // mixes the players ships with the computers shots
    return state.playerBoard.map(function (row, rowIndex) {
        return row.map(function (cell, colIndex) {
            const shotCell = state.computerShots[rowIndex][colIndex];
            if (shotCell === Battleship.CELL.EMPTY) {
                return cell;
            } else {
                return shotCell;
            }
        });
    });
}

function shotMessage(shotsBoard, fleet, cell, shooter) {
    // builds the message shown after a shot
    const result = shotsBoard[cell.row][cell.col];
    const position = cellName(cell);

    if (result === Battleship.CELL.MISS) {
        return `${shooter} fired at ${position}: miss.`;
    }

    const ship = Battleship.findShipAtCell(fleet, cell);
    if (result === Battleship.CELL.SUNK && ship) {
        return `${shooter} fired at ${position} and sunk the ${ship.name}!`;
    }

    return `${shooter} fired at ${position}: hit!`;
}

function findNewShot(previousBoard, nextBoard) {
    // finds the new computer shot by comparing boards
    for (let row = 0; row < Battleship.BOARD_SIZE; row++) {
        for (let col = 0; col < Battleship.BOARD_SIZE; col++) {
            if (previousBoard[row][col] === Battleship.CELL.EMPTY &&
                nextBoard[row][col] !== Battleship.CELL.EMPTY) {
                return { row: row, col: col };
            }
        }
    }
    return null;
}

//-------------------- SETUP CONTROLS --------------------

function placeSelectedShip(row, col) {
    if (state.phase !== Battleship.PHASE.SETUP || selectedShipIndex < 0) {
        return;
    }

    const selectedShip = state.playerFleet[selectedShipIndex];
    const result = Battleship.placeShip(
        state.playerBoard,
        selectedShip,
        { row: row, col: col },
        orientation
    );

    if (result === null) {
        uiMessage = "That ship does not fit there.";
        render();
        return;
    }

    const updatedFleet = state.playerFleet.map(function (ship, index) {
        // only change the ship that was just placed
        if (index === selectedShipIndex) {
            return result.ship;
        } else {
            return ship;
        }
    });

    // copy state but replace the board and fleet
    state = {
        ...state,
        playerBoard: result.board,
        playerFleet: updatedFleet
    };
    selectedShipIndex = findNextUnplacedShip(updatedFleet);
    uiMessage = "";
    render();
}

function handleRotateClick() {
    if (orientation === Battleship.ORIENTATION.HORIZONTAL) {
        orientation = Battleship.ORIENTATION.VERTICAL;
    } else {
        orientation = Battleship.ORIENTATION.HORIZONTAL;
    }
    render();
}

function handleRandomPlaceClick() {
    const result = Battleship.placeFleetRandomly(
        Battleship.createEmptyBoard(),
        Battleship.createInitialFleet()
    );

    state = {
        // keep the other state values but replace the players fleet
        ...state,
        playerBoard: result.board,
        playerFleet: result.fleet
    };
    selectedShipIndex = -1;
    uiMessage = "";
    render();
}

function handleStartClick() {
    if (findNextUnplacedShip(state.playerFleet) !== -1) {
        uiMessage = "Place every ship before starting.";
        render();
        return;
    }

    state = Battleship.startGame(state);
    roundNumber = 1;
    uiMessage = "Your turn. Choose a target.";
    animatedPlayerShot = null;
    animatedComputerShot = null;
    render();
}

function resetToSetup() {
    // stops a delayed computer shot from happening after restart
    clearComputerTimer();
    const selectedMode = state.mode || "random";
    // || uses random as a fallback if a mode hasnt been saved
    state = {
        ...Battleship.createInitialGameState(),
        phase: Battleship.PHASE.SETUP,
        mode: selectedMode
    };
    selectedShipIndex = 0;
    orientation = Battleship.ORIENTATION.HORIZONTAL;
    roundNumber = 1;
    uiMessage = "";
    animatedPlayerShot = null;
    animatedComputerShot = null;
    render();
}

//-------------------- PLAYING A TURN --------------------

function handlePlayerShot(row, col) {
    if (state.phase !== Battleship.PHASE.PLAYING || state.turn !== "player") {
        return;
    }

    const target = { row: row, col: col };
    if (Battleship.hasAlreadyBeenShot(state.playerShots, target)) {
        uiMessage = `You already fired at ${cellName(target)}.`;
        render();
        return;
    }

    state = Battleship.handlePlayerShot(state, target);
    animatedPlayerShot = target;
    animatedComputerShot = null;
    uiMessage = shotMessage(
        state.playerShots,
        state.computerFleet,
        target,
        "You"
    );
    render();

    if (state.phase === Battleship.PHASE.GAME_OVER) {
        return;
    }

    // small delay so the computers shot is actually visible
    computerTurnTimer = window.setTimeout(function () {
        const previousShots = state.computerShots;
        let target = ComputerLogic.chooseRandomShot(state.computerShots);

        if (state.mode === Battleship.PLAYER_TYPE.HUNT) {
            target = ComputerLogic.chooseHuntTargetShot(state.computerShots);
        }

        state = Battleship.handleComputerTurn(state, target);

        // clear the players animation before showing the computers shot
        animatedPlayerShot = null;
        animatedComputerShot = findNewShot(previousShots, state.computerShots);

        if (animatedComputerShot) {
            const computerMessage = shotMessage(
                state.computerShots,
                state.playerFleet,
                animatedComputerShot,
                "Computer"
            );
            if (state.phase === Battleship.PHASE.GAME_OVER) {
                uiMessage = computerMessage;
            } else {
                uiMessage = `${computerMessage} Your turn.`;
            }
        }

        roundNumber += 1;
        computerTurnTimer = null;
        render();
    }, 650);
}

//-------------------- PLACEMENT PREVIEW --------------------

function previewShip(row, col) {
    clearPreview();
    const ship = state.playerFleet[selectedShipIndex];
    if (!ship) {
        return;
    }

    const canPlace = Battleship.canPlaceShip(
        state.playerBoard,
        ship,
        { row: row, col: col },
        orientation
    );
    const cells = Battleship.getShipCells(
        { row: row, col: col },
        ship,
        orientation
    );

    cells.forEach(function (cell) {
        // get the matching button on the board
        const selector = `[data-row="${cell.row}"][data-col="${cell.col}"]`;
        const cellEl = playerBoardEl.querySelector(selector);
        if (cellEl) {
            if (canPlace) {
                cellEl.classList.add("preview-valid");
            } else {
                cellEl.classList.add("preview-invalid");
            }
        }
    });
}

function clearPreview() {
    document.querySelectorAll(".preview-valid, .preview-invalid")
        .forEach(function (cell) {
            cell.classList.remove("preview-valid", "preview-invalid");
        });
}

//-------------------- DRAWING THE UI --------------------

function renderBoard(container, board, mode) {
    // redraw board from state each time
    container.innerHTML = "";

    for (let row = 0; row < Battleship.BOARD_SIZE; row++) {
        for (let col = 0; col < Battleship.BOARD_SIZE; col++) {
            const cell = document.createElement("button");
            const property = board[row][col];
            const position = cellName({ row: row, col: col });

            cell.type = "button";
            cell.classList.add("cell", property);
            // store row and col on the button
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (mode === "shoot") {
                cell.setAttribute("aria-label", `Fire at ${position}`);
                cell.title = `Fire at ${position}`;
                cell.disabled = state.turn !== "player" ||
                    property !== Battleship.CELL.EMPTY;
            } else if (mode === "setup") {
                cell.setAttribute("aria-label", `Place ship at ${position}`);
                cell.title = `Place ship at ${position}`;
            } else {
                cell.setAttribute("aria-label", `${position}: ${property}`);
                cell.disabled = true;
            }

            let animatedShot;
            if (mode === "shoot") {
                animatedShot = animatedPlayerShot;
            } else {
                animatedShot = animatedComputerShot;
            }
            // mode decides which last shot should animate
            if (animatedShot &&
                animatedShot.row === row &&
                animatedShot.col === col) {
                cell.classList.add("recent-shot");
            }

            cell.addEventListener("click", function () {
                if (mode === "setup") {
                    placeSelectedShip(row, col);
                } else if (mode === "shoot") {
                    handlePlayerShot(row, col);
                }
            });

            cell.addEventListener("mouseenter", function () {
                if (mode === "setup") {
                    previewShip(row, col);
                }
            });

            cell.addEventListener("mouseleave", function () {
                if (mode === "setup") {
                    clearPreview();
                }
            });

            cell.addEventListener("dragover", function (event) {
                if (mode === "setup" && selectedShipIndex >= 0) {
                    // allow dropping ships onto the grid
                    event.preventDefault();
                    previewShip(row, col);
                }
            });

            cell.addEventListener("drop", function (event) {
                if (mode === "setup") {
                    event.preventDefault();
                    clearPreview();
                    placeSelectedShip(row, col);
                }
            });

            container.appendChild(cell);
            // add the button to the grid
        }
    }
}

function renderShipDock() {
    document.querySelectorAll(".ship-row").forEach(function (row) {
        const index = Number(row.dataset.shipIndex);
        const ship = state.playerFleet[index];
        const shipShape = row.querySelector(".ship");
        const isPlaced = ship.cells.length > 0;

        // toggle keeps placed and selected classes up to date
        row.classList.toggle("placed", isPlaced);
        row.classList.toggle("selected", index === selectedShipIndex);
        shipShape.draggable = !isPlaced;
        // placed ships should not be tabbed to again
        if (isPlaced) {
            shipShape.tabIndex = -1;
            shipShape.setAttribute("aria-label", `${ship.name} placed`);
        } else {
            shipShape.tabIndex = 0;
            shipShape.setAttribute(
                "aria-label",
                `Select or drag ${ship.name}`
            );
        }
    });
}

function countShipHits(ship, shotsBoard) {
    // count the ship cells already hit
    return ship.cells.filter(function (cell) {
        const value = shotsBoard[cell.row][cell.col];
        return value === Battleship.CELL.HIT ||
            value === Battleship.CELL.SUNK;
    }).length;
}

function renderFleetPanel(container, fleet, shotsBoard) {
    // fleet rows change as ships get hit
    container.innerHTML = "";

    fleet.forEach(function (ship) {
        const hits = countShipHits(ship, shotsBoard);
        const isSunk = Battleship.isShipSunk(ship, shotsBoard);
        const remaining = ship.length - hits;
        const row = document.createElement("div");
        const name = document.createElement("span");
        const value = document.createElement("span");
        const health = document.createElement("div");
        const healthFill = document.createElement("span");

        if (isSunk) {
            row.className = "fleet-row sunk";
        } else {
            row.className = "fleet-row";
        }
        name.textContent = ship.name;
        if (isSunk) {
            value.textContent = "SUNK";
        } else {
            value.textContent = `${remaining}/${ship.length}`;
        }
        health.className = "fleet-health";
        // each ship needs a different health bar width
        healthFill.style.width = `${(remaining / ship.length) * 100}%`;

        health.appendChild(healthFill);
        row.appendChild(name);
        row.appendChild(value);
        row.appendChild(health);
        container.appendChild(row);
    });
}

function render() {
    // draw the screen for the current phase
    restartBtn.classList.toggle(
        "visible",
        state.phase === Battleship.PHASE.SETUP ||
        state.phase === Battleship.PHASE.PLAYING
    );

    if (state.phase === Battleship.PHASE.MENU) {
        showScreen("menu");
        return;
    }

    if (state.phase === Battleship.PHASE.SETUP) {
        showScreen("setup");
        renderBoard(playerBoardEl, getPlayerDisplayBoard(), "setup");
        renderShipDock();

        const selectedShip = state.playerFleet[selectedShipIndex];
        const allShipsPlaced = findNextUnplacedShip(state.playerFleet) === -1;

        if (selectedShip) {
            statusEl.textContent =
                `Place ${selectedShip.name} (${selectedShip.length} cells).`;
        } else {
            statusEl.textContent = "All ships placed. Start game.";
        }
        setupErrorEl.textContent = uiMessage;
        rotateBtn.textContent = `ROTATE: ${orientation}`;
        startBtn.disabled = !allShipsPlaced;
        return;
    }

    if (state.phase === Battleship.PHASE.PLAYING) {
        showScreen("playing");
        renderBoard(defenceBoardEl, getPlayerDisplayBoard(), "defend");
        renderBoard(computerBoardEl, state.playerShots, "shoot");
        renderFleetPanel(
            friendlyFleetEl,
            state.playerFleet,
            state.computerShots
        );
        renderFleetPanel(
            oppositionFleetEl,
            state.computerFleet,
            state.playerShots
        );

        roundNumberEl.textContent = roundNumber;
        if (state.turn === "computer") {
            battleStatusEl.textContent =
                `${uiMessage} Computer is choosing a target...`;
        } else {
            battleStatusEl.textContent = uiMessage;
        }
        return;
    }

    if (state.phase === Battleship.PHASE.GAME_OVER) {
        showScreen("game-over");
        if (state.winner === "player") {
            document.getElementById("winner-text").textContent = "YOU WIN";
        } else {
            document.getElementById("winner-text").textContent = "YOU LOSE";
        }
    }
}

//-------------------- EVENT LISTENERS --------------------

document.addEventListener("keydown", function (event) {
    const isTyping = event.target.matches("input, textarea");
    // matches checks if the event came from either kind of text box
    if (!isTyping &&
        state.phase === Battleship.PHASE.SETUP &&
        (event.key === "r" || event.key === "R")) {
        handleRotateClick();
    }
});

rotateBtn.addEventListener("click", handleRotateClick);
randomPlaceBtn.addEventListener("click", handleRandomPlaceClick);
startBtn.addEventListener("click", handleStartClick);
restartBtn.addEventListener("click", resetToSetup);

document.getElementById("exit-btn").addEventListener("click", function () {
    clearComputerTimer();
    state = Battleship.createInitialGameState();
    selectedShipIndex = 0;
    orientation = Battleship.ORIENTATION.HORIZONTAL;
    uiMessage = "";
    render();
});

document.getElementById("game-over-menu-btn")
    .addEventListener("click", function () {
        clearComputerTimer();
        state = Battleship.createInitialGameState();
        selectedShipIndex = 0;
        orientation = Battleship.ORIENTATION.HORIZONTAL;
        uiMessage = "";
        animatedPlayerShot = null;
        animatedComputerShot = null;
        render();
    });

document.querySelectorAll(".ship-row").forEach(function (row) {
    const shipShape = row.querySelector(".ship");

    function selectShip() {
        const index = Number(row.dataset.shipIndex);
        if (state.playerFleet[index].cells.length === 0) {
            selectedShipIndex = index;
            uiMessage = "";
            render();
        }
    }

    shipShape.addEventListener("click", selectShip);
    shipShape.addEventListener("keydown", function (event) {
        // make the ship div work like a button on keyboard
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectShip();
        }
    });
    shipShape.addEventListener("dragstart", function (event) {
        selectShip();
        // drag needs some data, even though selection does the real work
        event.dataTransfer.setData("text/plain", row.dataset.shipIndex);
    });
});

document.querySelectorAll(".menu-btn:not(:disabled)")
    .forEach(function (button) {
        // only active menu buttons should start a game
        button.addEventListener("click", function () {
            state = {
                ...Battleship.createInitialGameState(),
                mode: button.dataset.mode,
                phase: Battleship.PHASE.SETUP
            };
            selectedShipIndex = 0;
            orientation = Battleship.ORIENTATION.HORIZONTAL;
            uiMessage = "";
            render();
        });
    });

// first draw of the page
state.phase = Battleship.PHASE.MENU;
render();
