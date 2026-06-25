
/**
 * battleship game logic.
 *
 * holds the board, ships, shots and turn changes.
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
 * creates a new empty board
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
 * makes a ship object from the ship type
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
 * makes the full fleet
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
 * creates the starting game state.
 *
 * this has both boards, both fleets, shots, phase and winner.
 * @memberof Battleship
 * @returns {Object} starting game state
 */
Battleship.createInitialGameState = function(){
  return {
    playerBoard: Battleship.createEmptyBoard(),
    computerBoard: Battleship.createEmptyBoard(),

    playerFleet: Battleship.createInitialFleet(),
    computerFleet: Battleship.createInitialFleet(),

    /* boards used to show shots */
    playerShots: Battleship.createEmptyBoard(),
    computerShots: Battleship.createEmptyBoard(),

    phase: Battleship.PHASE.MENU,
    turn: "player",
    winner: null
  }
}

//----------------------- HELPER FUNCTIONS -----------------------


/**
 * checks if the row and col are inside the board
 * @memberof Battleship
 * @param {number} row row index
 * @param {number} col column index
 * @returns {boolean} true if the position is inside the board
 */
Battleship.cellIsInisideBoard = function(row, col){
  return (row>=0 && row<Battleship.BOARD_SIZE && col >=0 && col < Battleship.BOARD_SIZE)
}

/**
 * gets the value at a board position, or null if outside board
 * @memberof Battleship
 * @param {string[][]} board board to read from
 * @param {number} row row index
 * @param {number} col column index
 * @returns {string|null} cell value, or null if outside the board
 */
Battleship.getCell = function(board, row, col){
  if (Battleship.cellIsInisideBoard(row,col) != true){
    return null
  }
  return board[row][col]
}

/**
 * sets one cell on the board to a new value
 * @memberof Battleship
 * @param {string[][]} board board to update
 * @param {number} row row index
 * @param {number} col column index
 * @param {string} value value to put in the cell
 * @returns {string[][]} new board with the cell changed
 */
Battleship.setCell = function(board,row,col,value){
  if (Battleship.cellIsInisideBoard(row,col) != true){
    return board
  }
  // using map so the old board is not changed directly
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
 * gets every cell coordinate on the board.
 * @memberof Battleship
 * @param {string[][]} board board to inspect
 * @returns {Array<{row: number, col: number}>} board coordinates */
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
 * finds the adjacent cells
 * @memberof Battleship
 * @param {{ row: number, col: number }} cellPosition the centre cell
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
 * finds the cells a ship would take up.
 *
 * this only works out the positions, it doesnt place the ship.
 * @memberof Battleship
 * @param {{ row: number, col: number }} cellPosition starting cell of the ship
 * @param {{ name: string, length: number }} ship ship with its length
 * @param {string} orientation horizontal or vertical
 * @returns {Array<{row: number, col: number}>} cells the ship would use
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
 * checks if a ship can be placed on that cell
 * @memberof Battleship
 * @param {string[][]} board the current board
 * @param {{ name: string, length: number }} ship ship to check
 * @param {{ row: number, col: number }} startCell starting cell
 * 
 * @returns {boolean} if the ship can be placed or not
 */
Battleship.canPlaceShip = function(board, ship, startCell, orientation){
  // first find where the ship would go
  const shipCells = Battleship.getShipCells(startCell,ship,orientation)

  // check each cell is free and in the board
  for (const cell of shipCells){
    if (!Battleship.cellIsInisideBoard(cell.row, cell.col) 
      || Battleship.getCell(board,cell.row,cell.col) !== Battleship.CELL.EMPTY){
      return false
    }
  }
  return true
}

/**
 * places a ship if the position is valid.
 * returns the new board and updated ship
 * @memberof Battleship
 * @param {string[][]} board  board current
 * @param {Object} ship  ship object to place.
 * @param {{ row: number, col: number }} startCell starting cell
 * @param {string} orientation  horizontal or vertical
 * @returns {{ board: string[][], ship: Object } | null} new board and ship, or null
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
 * randomly places a full fleet on the board
 * @memberof Battleship
 * @param {string[][]} board current board
 * @param {Object} fleet fleet of ships
 * @returns {{ board: string[][], fleet: Object[] }} updated board and fleet
 */
Battleship.placeFleetRandomly = function(board, fleet){
  // keep track of the board as each ship is added
  let newBoard=board
  const placedFleet = [];

  // try random positions until each ship fits
  for (const ship of fleet){
    let allPlaced = false
    while (allPlaced != true){
      // random starting cell:
      const row = Math.floor(Math.random() * Battleship.BOARD_SIZE);
      const col = Math.floor(Math.random() * Battleship.BOARD_SIZE);
      const startCell = {row, col}

      // random orientation
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
 * checks if this cell has already been shot
 * @memberof Battleship
 * @param {string[][]} shotsBoard board tracking shots
 * @param {{ row: number, col: number }} cell targeted cell
 * @returns {Boolean} true if it has been shot
 */
Battleship.hasAlreadyBeenShot = function(shotsBoard, cell){
  if (shotsBoard[cell.row][cell.col] === Battleship.CELL.EMPTY){
    return false
  }
  return true 
}
/**
 * finds the ship at the target cell
 * @memberof Battleship
 * @param {Object[]} fleet array of ship objects
 * @param {{ row: number, col: number }} cell targeted cell
 * @returns {Object[] | undefined} ship found at the cell
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
 * checks if a ship uses this cell
 * @memberof Battleship
 * @param {Object[]} ship ship being checked
 * @param {{ row: number, col: number }} cell targeted cell
 * @returns {boolean} true if the cell is part of the ship
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
 * marks a shot on the shots board
 * @memberof Battleship
 * @param {string[][]} shotsBoard board tracking previous shots
 * @param {{ row: number, col: number }} cell targeted cell
 * @param {string} result shot result: miss, hit, or sunk
 * @returns {string[][]} updated shots board
 */
Battleship.markShot = function(shotsBoard, cell, result){
  return Battleship.setCell(shotsBoard,cell.row,cell.col,result)
}

/**
 * checks if a ship is fully sunk
 * @memberof Battleship
 * @param {Object[]} ship ship being checked
 * @param {string[][]} shotsBoard the current shot board
 * @returns {boolean} true if all ship cells are hit or sunk
 */
Battleship.isShipSunk = function(ship,shotsBoard){
  // count how many ship cells have been hit
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
 * checks if all ships in a fleet are sunk
 * @memberof Battleship
 * @param {Object[]} fleet the entire fleet
 * @param {string[][]} shotsBoard the current shot board
 * @returns {boolean} true if the whole fleet is sunk
 */
Battleship.areAllShipsSunk = function(fleet,shotsBoard){
  // let count = 0
  // for (let ship of fleet){
  //   if (Battleship.isShipSunk(ship,shotsBoard)){
  //     count+=1
  //   }
  // }
  // return count === fleet.length

  // every ship needs to be sunk
  return fleet.every(function(ship){
    return Battleship.isShipSunk (ship,shotsBoard)
  })
}


/**
 * works out what happens when a shot is fired.
 *
 * returns miss, hit, sunk or alreadyShot with the updated shots board
 * 
 * @memberof Battleship
 *
 * @param {string[][]} targetBoard board with the opponents ships
 * @param {Object[]} targetFleet opponent fleet
 * @param {string[][]} shotsBoard board tracking previous shots
 * @param {{ row: number, col: number }} cell target cell
 * @returns {Object} shot result data
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
  const targetCell = Battleship.getCell(targetBoard,cell.row,cell.col) // whats on the target board

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
 * switches the active turn between player and computer
 * @memberof Battleship
 * @param {Object} state current game state
 * @returns {Object} updated game state
 */
Battleship.switchTurn = function (state) {
  // copy the state and just change turn
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
 * checks whether either player has lost all ships.
 *
 * if a fleet is sunk, the game goes to GAME_OVER.
 * @memberof Battleship
 * @param {Object} state current game state
 * @returns {Object} updated game state
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
 * handles the players shot against the computer.
 *
 * @memberof Battleship
 * @param {Object} state current game state
 * @param {{ row: number, col: number }} cell cell being fired at
 * @returns {Object} updated game state
 */
Battleship.handlePlayerShot = function(state, cell){
  //check if its the players turn
  if (state.turn === "player"){
    // resolve the shot
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
 * handles the computers shot against the player.
 *
 * @memberof Battleship
 * @param {Object} state current game state
 * @param {{row: number, col: number}} cell cell picked by computer logic
 * @returns {Object} updated game state
 */
Battleship.handleComputerTurn = function(state, cell){
  //check if its the computer turn
  if (state.turn === "computer" && cell){
    // resolve the shot
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
 * starts the game after the players fleet is placed.
 *
 * the computer fleet gets placed randomly and the player goes first.
 *
 * @memberof Battleship
 * @param {Object} state game state after player setup
 * @returns {Object} state ready for play
 */
Battleship.startGame = function (state) {
  // randomly place computer fleet on computerBoard
  const computerSide = Battleship.placeFleetRandomly(state.computerBoard,state.computerFleet)
  return {
    ...state,
    computerBoard: computerSide.board,
    computerFleet: computerSide.fleet,

    phase: Battleship.PHASE.PLAYING,
    turn: "player"
  }
};

export default Battleship;
