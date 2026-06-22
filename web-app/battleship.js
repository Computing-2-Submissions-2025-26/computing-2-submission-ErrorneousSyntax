
/**
 * Core Battleship game logic.
 *
 * Contains board creation, ship placement, shot resolution,
 * turn handling, game-over checks, and random computer AI.
 *
 * @namespace Battleship
 */
const Battleship = {}

//----------------------- CONSTANTS -----------------------

Battleship.BOARD_SIZE = 10;

Battleship.CELL = {
  EMPTY: "empty",
  SHIP: "ship",
  MISS: "miss",
  HIT: "hit",
  SUNK: "sunk"
};

Battleship.SHIP_TYPE = {
  CARRIER: { name: "carrier", length: 5 },
  BATTLESHIP: { name: "battleship", length: 4 },
  CRUISER: { name: "cruiser", length: 3 },
  SUBMARINE: { name: "submarine", length: 3 },
  DESTROYER: { name: "destroyer", length: 2 }
};

Battleship.ORIENTATION = {
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal"
};

Battleship.PHASE = {
  MENU: "menu",
  SETUP: "setup",
  PLAYING: "playing",
  GAME_OVER: "game_over"
};

Battleship.PLAYER_TYPE = {
  RANDOM: "random",
  HUNT: "hunt"
};


//----------------------- INITIALISING GAME -----------------------


/**
 * Creates a new empty grid of size board_size x board_size
 * @memberof Battleship
 * @returns {string[][]} new grid
 */
Battleship.createEmptyBoard = function (){
  const board=[];
  for (let row=0;row<Battleship.BOARD_SIZE;row++){
    const currentRow=[]
    for (let col=0;col<Battleship.BOARD_SIZE;col++){
      currentRow.push(Battleship.CELL.EMPTY)
    }
    board.push(currentRow)
  }
  return board
}

/**
 * Defines the name, length and initialises cells and hit cells for 
 * each ship in a fleet 
 * @memberof Battleship
 * @param {Object} shipType
 * @returns {Object} ship
 */
Battleship.createShip = function (shipType){
  return{
    name:shipType.name,
    length:shipType.length,
    cells:[],
    sunk:false
  }
}

/**
 * Initialises the fleet, with consideration for every ship on the board
 * @returns {Array} fleet
 * @memberof Battleship
 */
Battleship.createInitialFleet = function(){
  return [
    Battleship.createShip(Battleship.SHIP_TYPE.CARRIER),
    Battleship.createShip(Battleship.SHIP_TYPE.BATTLESHIP),
    Battleship.createShip(Battleship.SHIP_TYPE.CRUISER),
    Battleship.createShip(Battleship.SHIP_TYPE.SUBMARINE),
    Battleship.createShip(Battleship.SHIP_TYPE.DESTROYER)
  ]
}


/**
 * Creates the full initial state for a new Battleship game.
 *
 * The state object should contain all data needed to run the game:
 * player boards, computer boards, fleets, shot-tracking boards,
 * current phase, current turn, winner, and AI memory.
 * @memberof Battleship
 * @returns {Object} Initial game state.
 */
Battleship.createInitialGameState = function(){
  return {
    playerBoard: Battleship.createEmptyBoard(),
    computerBoard: Battleship.createEmptyBoard(),

    playerFleet: Battleship.createInitialFleet(),
    computerFleet: Battleship.createInitialFleet(),

    /* Grid for shots visualisation */
    playerShots: Battleship.createEmptyBoard(),
    computerShots: Battleship.createEmptyBoard(),

    phase: Battleship.PHASE.MENU,
    turn: "player",
    winner: null
  }
}

//----------------------- HELPER FUNCTIONS -----------------------


/**
 * Checks that selected row and colum is within the boundaries
 * @memberof Battleship
 * @param {number} row  Row index.
 * @param {number} col  Column index.
 * @returns {boolean} True if the position is inside the board.
 */
Battleship.cellIsInisideBoard = function(row, col){
  return (row>=0 && row<Battleship.BOARD_SIZE && col >=0 && col < Battleship.BOARD_SIZE)
}

/**
 * Gets the value stored at a specific board position, and returns
 * null instead of crash if the cell does not exist
 * @memberof Battleship
 * @param {string[][]} board  The board to read from.
 * @param {number} row Row index.
 * @param {number} col  Column index.
 * @returns {string|null} Cell value if inside board, otherwise null.
 */
Battleship.getCell = function(board, row, col){
  if (Battleship.cellIsInisideBoard(row,col) != true){
    return null
  }
  return board[row][col]
}

/**
 * Sets specific cell on the board to a certain value
 * @memberof Battleship
 * @param {string[][]} board  The board to read from.
 * @param {number} row Row index.
 * @param {number} col  Column index.
 * @param {string} Cell value to be set to 
 * @returns {string[][]} board New board that has been set.
 */
Battleship.setCell = function(board,row,col,value){
  if (Battleship.cellIsInisideBoard(row,col) != true){
    return board
  }
  // Ensuring functional programming paradigms 
  // ------------------ check w freddie ------------------
  return board.map(function(currentRow,r){
    return currentRow.map(function(currentCell, c){
      if (r === row && c == col){
        return value
      }
      return currentCell
    })
  })
}

/**
 * Returns every cell coordinate on the board.
 * @memberof Battleship
 * @param {string[][]} board  Board to inspect.
 * @returns {Array<{row: number, col: number}>} Array of board coordinates. */
Battleship.getAllCells = function (board) {
  const arr = []
  // loop through every row
  for (let row=0; row<board.length; row++){
    for (let col=0; col<board[row].length; col++){
      arr.push({"row": row,"col":col})
    }
  }
  return arr

}

/**
 * Finds the cell id of adjacant cells
 * @memberof Battleship
 * @param {{ row: number, col: number }} cellPosition  The centre cell.
 */
Battleship.getAdjacentCells = function(cellPosition){
  const possibleCells = [
    { row: cellPosition.row - 1, col: cellPosition.col }, 
    { row: cellPosition.row + 1, col: cellPosition.col }, 
    { row: cellPosition.row, col: cellPosition.col - 1 }, 
    { row: cellPosition.row, col: cellPosition.col + 1 }  
  ]


  return possibleCells.filter(function(cell){
    return Battleship.cellIsInisideBoard(cell.row,cell.col)
  })
}


//----------------------- SHIP PLACEMENT -----------------------


/**
 * Finds the board cells occupied by a ship from a starting position.
 *
 * This function does not modify the board. It only returns the coordinates
 * the ship would occupy based on its length and orientation.
 * @memberof Battleship
 * @param {{ row: number, col: number }} cellPosition  Starting cell of the ship.
 * @param {{ name: string, length: number }} ship  Ship object containing length.
 * @param {string} orientation  Ship orientation: horizontal or vertical.
 * @returns {Array<{row: number, col: number}>} Array of cells occupied by the ship.
 */
Battleship.getShipCells = function(cellPosition, ship, orientation){
  const cells = [];

  for (let i=0; i<ship.length; i++){
    if (orientation === Battleship.ORIENTATION.HORIZONTAL){
      cells.push({"row":cellPosition.row, "col": cellPosition.col+i})
    }
    else if (orientation === Battleship.ORIENTATION.VERTICAL){
      cells.push({"row":cellPosition.row+i, "col": cellPosition.col})
    }
  }
  return cells
}

/**
 * Returns true or false on if a ship can be placed on that cel
 * @memberof Battleship
 * @param {string[][]} board the current board
 * @param {{ name: string, length: number }} ship  Ship object containing length.
 * @param {{ row: number, col: number }} Cell 
 * 
 * @returns {boolean} if the ship can be placed or not
 */
Battleship.canPlaceShip = function(board, ship, startCell, orientation){
  // find the cells the ship would occupy
  const shipCells = Battleship.getShipCells(startCell,ship,orientation)

  //check each cell 
  for (const cell of shipCells){
    if (!Battleship.cellIsInisideBoard(cell.row, cell.col) 
      || Battleship.getCell(board,cell.row,cell.col) !== Battleship.CELL.EMPTY){
      return false
    }
  }
  return true
}

/**
 * Places a ship on the board if the placement is valid.
 * returns a new board and an updated ship object
 * @memberof Battleship
 * @param {string[][]} board  board current
 * @param {Object} ship  ship object to place.
 * @param {{ row: number, col: number }} startCell starting cell
 * @param {string} orientation  horizontal or vertical
 * @returns {{ board: string[][], ship: Object } | null} Updated board and ship, or null if invalid.
 */
Battleship.placeShip = function (board, ship, startCell, orientation) {
  if (!Battleship.canPlaceShip(board, ship, startCell, orientation)){
    return null
  }
  const shipCells = Battleship.getShipCells(startCell, ship, orientation)

  let newBoard = board
  
  for (const cell of shipCells){
    newBoard = Battleship.setCell(newBoard, cell.row,cell.col,Battleship.CELL.SHIP)
  }

  const updatedShip = {
    name: ship.name,
    length: ship.length,
    hits: ship.hits,
    sunk: ship.sunk,
    cells:shipCells
  }

  return {board: newBoard, ship:updatedShip}
}

/**
 * Randomly place fleet on the board
 * @memberof Battleship
 * @param {string[][]} board current board
 * @param {Object} fleet Fleet of ships
 * @returns {{ board: string[][], fleet: Object[] }} updated board and fleet
 */
Battleship.placeFleetRandomly = function(board, fleet){
  // Assign a new board variable and new placedFleet variable
  let newBoard=board
  const placedFleet = [];

  // Use Math.random to find a starting cell 
  for (const ship of fleet){
    let allPlaced = false
    while (allPlaced != true){
      //Random starting cell:
      const row = Math.floor(Math.random() * Battleship.BOARD_SIZE);
      const col = Math.floor(Math.random() * Battleship.BOARD_SIZE);
      const startCell = {row, col}

      //Random orientation
      const getRandomOrientation = () => {
        const randomNumber = Math.round(Math.random());

        if (randomNumber === 1) {
          return Battleship.ORIENTATION.HORIZONTAL;
        } else {
          return Battleship.ORIENTATION.VERTICAL;
        }
      }

      const orientation = getRandomOrientation();

      const result = Battleship.placeShip(newBoard,ship,startCell,orientation)

      if (result !== null) {
        newBoard = result.board;
        placedFleet.push(result.ship);
        allPlaced = true;
      }
    }
  }

  return {
    board: newBoard,
    fleet: placedFleet
  };
};



//----------------------- SHOT LOGIC -----------------------

/**
 * Returns true or false on if the ship at the specified cell has been shot
 * @memberof Battleship
 * @param {string[][]} shotsBoard board tracking shots
 * @param {{ row: number, col: number }} cell Targetted cell
 * @returns {Boolean} True if it has been shot
 */
Battleship.hasAlreadyBeenShot = function(shotsBoard, cell){
  if (shotsBoard[cell.row][cell.col] === Battleship.CELL.EMPTY){
    return false
  }
  return true 
}
/**
 * Determines the class of ship at the target cell
 * @memberof Battleship
 * @param {Object[]} fleet Array of ship objects 
 * @param {{ row: number, col: number }} cell Targetted cell
 * @returns {Object[] | undefined} Class of ship
 */
Battleship.findShipAtCell = function (fleet, cell){
  for (let ship of fleet){
    for (let cel of ship.cells){
      if (cel.row===cell.row && cel.col === cell.col){
        return ship
      }
    }
  }
  return undefined 
}


/**
 * Checks if a specific ship is hit
 * @memberof Battleship
 * @param {Object[]} ship Ship being compared
 * @param {{ row: number, col: number }} cell Targetted cell
 * @returns {boolean} True if shots hits the ship 
 */
Battleship.isShipHit = function(ship, cell){
  for (let pos of ship.cells){
    if (pos.row === cell.row && pos.col === cell.col){
      return true 
    }
  }
  return false
}

/**
 * updates shotBoard object to mark cell
 * @memberof Battleship
 * @param {string[][]} shotsBoard  Board tracking previous shots.
 * @param {{ row: number, col: number }} cell  Targetted cell.
 * @param {string} result  Shot result: miss, hit, or sunk.
 * @returns {string[][]} Updated shots board.
 */
Battleship.markShot = function(shotsBoard, cell, result){
  return Battleship.setCell(shotsBoard,cell.row,cell.col,result)
}

/**
 * Checks if a specific ship is entirely sunk
 * @memberof Battleship
 * @param {Object[]} ship Ship being compared
 * @param {string[][]} shotsBoard the current shot board
 * @returns {boolean} True if all cells of the ship are "HIT"
 */
Battleship.isShipSunk = function(ship,shotsBoard){
  // ***** USE A REDUCE -------------------------------------
  let count = 0
  for (let pos of ship.cells){
    if (shotsBoard[pos.row][pos.col]===Battleship.CELL.HIT
      || shotsBoard[pos.row][pos.col]===Battleship.CELL.SUNK
    ){
      count += 1
    }
  }
  return count === ship.cells.length
}


/**
 * Checks all ships to see if you still in da game 
 * @memberof Battleship
 * @param {Object[]} fleet The entire fleet
 * @param {string[][]} shotsBoard the current shot board
 * @returns {boolean} True if all cells of the ship are "HIT"
 */
Battleship.areAllShipsSunk = function(fleet,shotsBoard){
  // let count = 0
  // for (let ship of fleet){
  //   if (Battleship.isShipSunk(ship,shotsBoard)){
  //     count+=1
  //   }
  // }
  // return count === fleet.length

  // using .every
  return fleet.every(function(ship){
    return Battleship.isShipSunk (ship,shotsBoard)
  })
}


/**
 * Processes a shot against a target board and fleet.
 *
 * Determines whether the shot is a miss, hit, or sunk
 * Returns updated shot board data and information about the result
 * 
 * @memberof Battleship
 *
 * @param {string[][]} targetBoard  Board containing the opponent's ships.
 * @param {Object[]} targetFleet  Opponent fleet.
 * @param {string[][]} shotsBoard  Board tracking previous shots.
 * @param {{ row: number, col: number }} cell - Target cell.
 * @returns {Object} Shot result data. [shotsBoard][result][ship]
 */
Battleship.resolveShot = function(targetBoard, targetFleet, shotsBoard, cell) {
  // already shot case
  if (Battleship.hasAlreadyBeenShot(shotsBoard,cell)){
    return {
      shotsBoard:shotsBoard,
      result: "alreadyShot",
      ship:null
    }
  }
  const targetCell = Battleship.getCell(targetBoard,cell.row,cell.col) // state of the cell

  if (targetCell === Battleship.CELL.EMPTY){
    return {
      shotsBoard:Battleship.markShot(shotsBoard, cell, Battleship.CELL.MISS),
      result: "miss",
      ship:null
    }
  }
  

  if (targetCell === Battleship.CELL.SHIP){
    const shipAtCell = Battleship.findShipAtCell(targetFleet,cell)
    let tempBoard=Battleship.markShot(shotsBoard,cell,Battleship.CELL.HIT)

    if (Battleship.isShipSunk(shipAtCell,tempBoard)){
      for (let shipCell of shipAtCell.cells){
        tempBoard = Battleship.markShot(
          tempBoard,
          shipCell,
          Battleship.CELL.SUNK
        )
      }
      return {
        shotsBoard:tempBoard,
        result: "sunk",
        ship:shipAtCell
      }
    }
    return{
      shotsBoard:tempBoard,
      result: "hit",
      ship:shipAtCell
    }
  }
};


//----------------------- GAME LOGIC -----------------------

/**
 * Switches the active turn between player and computer
 * @memberof Battleship
 * @param {Object} state  Current game state.
 * @returns {Object} Updated game state.
 */
Battleship.switchTurn = function (state) {
  // Using ... notation to copy everything before
  if (state.turn === "computer") {
    return {
      ...state,
      turn: "player"
    };
  }
  if (state.turn === "player") {
    return {
      ...state,
      turn: "computer"
    };
  }
};





/**         
 * Checks whether either player has lost all ships.
 *
 * If all ships in a fleet are sunk, returns a new state with
 * the winner set and the phase changed to GAME_OVER.
 * @memberof Battleship
 * @param {Object} state Current game state.
 * @returns {Object} Updated game state.
 */
Battleship.checkGameOver = function(state){
  const compFleet = state.computerFleet
  if (Battleship.areAllShipsSunk(state.computerFleet, state.playerShots)){
    return {
      ...state,
      winner:"player",
      phase: Battleship.PHASE.GAME_OVER
    }
  }
  if (Battleship.areAllShipsSunk(state.playerFleet, state.computerShots)){
    return {
      ...state,
      winner:"computer",
      phase: Battleship.PHASE.GAME_OVER
    }
  }
  return{
    ...state
  }
}

/**
 * Handles the player's shot against the computer.
 *
 * @memberof Battleship
 * @param {Object} state  Current game state.
 * @param {{ row: number, col: number }} cell  Cell being fired at.
 * @returns {Object} Updated game state.
 */
Battleship.handlePlayerShot = function(state, cell){
  //check if its the players turn
  if (state.turn === "player"){
    //call resolve shot
    const res= Battleship.resolveShot(
      state.computerBoard,
      state.computerFleet,
      state.playerShots,
      cell)
    
    let newState = {
      ...state,
      playerShots: res.shotsBoard,
    }
    newState = Battleship.checkGameOver(newState);
    if (newState.phase !== Battleship.PHASE.GAME_OVER){
      return{
        ...newState,
        turn: "computer"
      }
    }
    return newState
  }
  return state
}


/**
 * Handles the computers shot against the player.
 *
 * @memberof Battleship
 * @param {Object} state  Current game state.
 * @param {{row: number, col: number}} cell Cell selected by the computer logic.
 * @returns {Object} Updated game state.
 */
Battleship.handleComputerTurn = function(state, cell){
  //check if its the computer turn
  if (state.turn === "computer" && cell){
    //call resolve shot
    const res= Battleship.resolveShot(
      state.playerBoard,
      state.playerFleet,
      state.computerShots,
      cell)
    
    let newState = {
      ...state,
      computerShots: res.shotsBoard,
    }
    newState = Battleship.checkGameOver(newState);
    if (newState.phase !== Battleship.PHASE.GAME_OVER){
      return{
        ...newState,
        turn: "player"
      }
    }
    return newState
  }
  return state
}

/**
 * Starts the game after the player has placed their fleet.
 *
 * Randomly places the computer fleet, sets the phase to PLAYING,
 * and gives the first turn to the player.
 *
 * @memberof Battleship
 * @param {Object} state  Current game state after player setup.
 * @returns {Object} Updated game state ready for play.
 */
Battleship.startGame = function (state) {
  // randomly place computer fleet on computerBoard
  const computerSide = Battleship.placeFleetRandomly(state.computerBoard,state.computerFleet)
  /*
  return new state with:
  computerBoard updated
  computerFleet updated
  phase set to PLAYING
  turn set to player
  winner set to null
  */
  return {
    ...state,
    computerBoard: computerSide.board,
    computerFleet: computerSide.fleet,

    phase: Battleship.PHASE.PLAYING,
    turn: "player"
  }
};

//----------------------- EXPORT FUNCTIONS -----------------------


// export functions needed by main.js / UI layer
export default Battleship;
