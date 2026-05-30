import R from "./ramda.js";
import Battleship from "./battleship.js"

// ================BATTLESHIP OBJECT STRUCTURE REFERENCE===============
// -------------------- Cell values --------------------

// Every board cell stores one of these strings:
//
// "empty"  -> no ship, no shot
// "ship"   -> ship exists here
// "miss"   -> shot fired here and missed
// "hit"    -> shot fired here and hit a ship
// "sunk"   -> shot fired here and the ship is now sunk


// -------------------- Cell coordinate object --------------------

// Used whenever we refer to one board position.
//
// {
//   row: number,   // 0 to 9
//   col: number    // 0 to 9
// }

// -------------------- Board object --------------------

// A board is a 10x10 2D array.
//
// [
//   ["empty", "empty", "ship", ...],
//   ["empty", "miss",  "empty", ...],
//   ...
// ]
//
// Access format:
//
// board[row][col]


// -------------------- Ship type object --------------------

// Constant template for each ship type.
//
// {
//   name: string,
//   length: number
// }
//
// Example:
//
// {
//   name: "carrier",
//   length: 5
// }


// -------------------- Ship object --------------------

// Actual ship used in the game fleet.
//
// {
//   name: string,
//   length: number,
//   cells: [
//     { row: number, col: number },
//     { row: number, col: number },
//     ...
//   ],
//   sunk: boolean
// }
//
// Example after placement:
//
// {
//   name: "destroyer",
//   length: 2,
//   cells: [
//     { row: 3, col: 4 },
//     { row: 3, col: 5 }
//   ],
//   sunk: false
// }


// -------------------- Fleet object --------------------

// A fleet is an array of ship objects.
//
// [
//   carrierShip,
//   battleshipShip,
//   cruiserShip,
//   submarineShip,
//   destroyerShip
// ]


// -------------------- Shot result object --------------------

// Returned by Battleship.resolveShot().
//
// {
//   shotsBoard: string[][],
//   result: string,
//   ship: Object | null
// }
//
// result can be:
//
// "miss"
// "hit"
// "sunk"
// "alreadyShot"


// -------------------- Game state object --------------------

// This is the main object controlled by main.js.
//
// {
//   playerBoard: string[][],     // player ship board
//   computerBoard: string[][],   // computer ship board
//
//   playerFleet: Object[],       // player ships
//   computerFleet: Object[],     // computer ships
//
//   playerShots: string[][],     // shots player made against computer
//   computerShots: string[][],   // shots computer made against player
//
//   phase: string,               // "menu", "setup", "playing", "game_over"
//   turn: string,                // "player" or "computer"
//   winner: string | null        // "player", "computer", or null
// }


// -------------------- UI state variables --------------------

// These are not part of battleship.js.
// They only exist in main.js to control the frontend.
//
// let state
//   -> current full game state
//
// let selectedShipIndex
//   -> index of the ship currently being placed
//
// let orientation
//   -> "horizontal" or "vertical"
//
// DOM elements:
//
// playerBoardEl
// computerBoardEl
// statusEl
// randomPlaceBtn
// rotateBtn
// startBtn
// restartBtn


//------------ Initalisation of gamestate ----------
let state = Battleship.createInitialGameState();
let selectedShipIndex = 0;
let orientation = Battleship.ORIENTATION.HORIZONTAL;


//-------------------- DOM --------------------
const playerBoardEl = document.getElementById("player-board");
const computerBoardEl = document.getElementById("computer-board");
const statusEl = document.getElementById("status");

const randomPlaceBtn = document.getElementById("random-place-btn");
const rotateBtn = document.getElementById("rotate-btn");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");



//-------------------- EVENT HANDLER FUNCTION --------------------

/*
Update board (backend) with input placement by player 
*/
function handleSetupClick(row,col){
    if (state.phase !== Battleship.PHASE.SETUP){
        return
    }

    const selectedShip = state.playerFleet[selectedShipIndex]
    const result = Battleship.placeShip(
        state.playerBoard, 
        selectedShip, 
        { row: row, col: col }, 
        orientation)

    if (result === null){
        return
    }

    state.playerBoard=result.board
    state.playerFleet[selectedShip] = result.ship
    selectedShipIndex+=1

    render()
}

function handleRotateClick(){
    // if orientation is horizontal
    if (orientation === Battleship.ORIENTATION.HORIZONTAL){
        orientation = Battleship.ORIENTATION.VERTICAL
    } else{
        orientation = Battleship.ORIENTATION.HORIZONTAL
    }
    render()
}

function handleKeyDown(event){
    if (event.key === "r" || event.key === "R") {
        handleRotateClick();
    }
}

function handleRandomPlaceClick(){
    const result = Battleship.placeFleetRandomly(
        Battleship.createEmptyBoard(),
        Battleship.createInitialFleet())

    state.playerBoard = result.board
    state.playerFleet = result.placeFleetRandomly
    selectedShipIndex = state.playerFleet.length

    render()
}

function handleStartClick(){
    if (selectedShipIndex<state.playerFleet.length){
        return
    }

    state = Battleship.startGame(state)

    render()
}

function handleRestartClick(){
    state = Battleship.createInitialGameState()
    state.phase = Battleship.PHASE.SETUP

    selectedShipIndex = 0
    orientation = Battleship.ORIENTATION.HORIZONTAL
    render()
}



//-------------------- INITIAL RENDER --------------------

function renderBoard(container, board, mode) {
    container.innerHTML = "" // Clear the board

    for (let row=0; row<Battleship.BOARD_SIZE; row++){
        for (let col=0; col<Battleship.BOARD_SIZE; col++){
            const cell = document.createElement("button") //button element (HTML)
            cell.classList.add("cell") // Adding "cell" to the element class
            const property = board[row,col] // The property of that cell, e.g. "ship", "miss", "empty"
            cell.classList.add(property) // Adding the specific cell type class eg. "cell ship"
            cell.dataset.row = row // Adds button data, shows up as data-row = "3", data-col="5" ex.
            cell.dataset.col = col // Retrieve using (cell.dataset.row)

            cell.addEventListener("click", function(){
                const row = cell.dataset.row
                const col = cell.dataset.col

                handleSetupClick(row,col)
            })


            container.appendChild(cell) // Add to above container
        }
    }

      // 8. Add click listener.
      //    If mode is "setup", call handleSetupClick(row, col).
      //    If mode is "shoot", call handlePlayerShotClick(row, col).
      //    If mode is "none", do nothing.

      // 9. Append cell to container.
}




/*
    Redraws the visible game every time state changes
    Reads state --> Updates BOM
*/
