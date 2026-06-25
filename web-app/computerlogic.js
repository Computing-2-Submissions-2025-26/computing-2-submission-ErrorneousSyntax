import Battleship from "./battleship.js";

/**
 * computer logic for picking where to shoot
 *
 * this file picks the cell, battleship.js actually shoots it
 *
 * @namespace ComputerLogic
 */
const ComputerLogic = {};

//----------------------- RANDOM COMPUTER -----------------------

/**
 * finds every cell the computer can still shoot
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard board with the computers old shots
 * @returns {Array<{row: number, col: number}>} cells still free to shoot
 */
ComputerLogic.getAvailableShots = function (shotsBoard) {
  const availableShots = [];

  for (let row = 0; row < shotsBoard.length; row++) {
    for (let col = 0; col < shotsBoard[row].length; col++) {
      if (shotsBoard[row][col] === Battleship.CELL.EMPTY) {
        availableShots.push({ row: row, col: col });
      }
    }
  }

  return availableShots;
};

/**
 * chooses a random shot from the cells still free
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard board with the computers old shots
 * @returns {{row: number, col: number}|null} chosen cell, or null if none left
 */
ComputerLogic.chooseRandomShot = function (shotsBoard) {
  const availableShots = ComputerLogic.getAvailableShots(shotsBoard);

  if (availableShots.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * availableShots.length);
  return availableShots[index];
};

//----------------------- HUNT/TARGET FSM -----------------------

/**
 * finds hit cells which have not turned into sunk cells yet
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard board with the computers old shots
 * @returns {Array<{row: number, col: number}>} hit cells to look around
 */
ComputerLogic.getHitCells = function (shotsBoard) {
  const hitCells = [];

  for (let row = 0; row < shotsBoard.length; row++) {
    for (let col = 0; col < shotsBoard[row].length; col++) {
      if (shotsBoard[row][col] === Battleship.CELL.HIT) {
        hitCells.push({ row: row, col: col });
      }
    }
  }

  return hitCells;
};

/**
 * checks if the computer is allowed to shoot this cell
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard board with the computers old shots
 * @param {{row: number, col: number}} cell cell to check
 * @returns {boolean} true if the cell is empty on the shots board
 */
ComputerLogic.canShootCell = function (shotsBoard, cell) {
  return shotsBoard[cell.row][cell.col] === Battleship.CELL.EMPTY;
};

/**
 * finds empty cells beside the hits the computer already has
 *
 * target mode uses this to try around a hit before going random again
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard board with the computers old shots
 * @returns {Array<{row: number, col: number}>} possible cells beside hits
 */
ComputerLogic.getTargetShots = function (shotsBoard) {
  const hitCells = ComputerLogic.getHitCells(shotsBoard);
  const targetShots = [];

  for (let hitCell of hitCells) {
    const adjacentCells = Battleship.getAdjacentCells(hitCell);

    for (let adjacentCell of adjacentCells) {
      const alreadyAdded = targetShots.some(function (targetCell) {
        return targetCell.row === adjacentCell.row
          && targetCell.col === adjacentCell.col;
      });

      if (
        ComputerLogic.canShootCell(shotsBoard, adjacentCell)
        && alreadyAdded !== true
      ) {
        targetShots.push(adjacentCell);
      }
    }
  }

  return targetShots;
};

/**
 * chooses the hunt/target shot
 *
 * hunt means random shots
 * target means shoot around a hit from getTrgetShots
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard board with the computers old shots
 * @returns {{row: number, col: number}|null} chosen cell, or null if none left
 */
ComputerLogic.chooseHuntTargetShot = function (shotsBoard) {
  const targetShots = ComputerLogic.getTargetShots(shotsBoard);

  if (targetShots.length > 0) {
    const index = Math.floor(Math.random() * targetShots.length);
    return targetShots[index];
  }

  return ComputerLogic.chooseRandomShot(shotsBoard);
};

export default ComputerLogic;
