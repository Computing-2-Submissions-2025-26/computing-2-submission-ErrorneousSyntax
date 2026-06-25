import Battleship from "./battleship.js";

/**
 * Computer logic.
 *
 * This module only chooses where the computer should shoot.
 * Battleship.js is still responsible for applying the shot.
 *
 * @namespace ComputerLogic
 */
const ComputerLogic = {};

//----------------------- RANDOM AI -----------------------

/**
 * Finds every board cell which has not already been shot.
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard Board containing the computer's previous shots.
 * @returns {Array<{row: number, col: number}>} Cells which can still be targeted.
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
 * Randomly chooses one cell which has not already been shot.
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard Board containing the computer's previous shots.
 * @returns {{row: number, col: number}|null} Chosen cell, or null if none remain.
 */
ComputerLogic.chooseRandomShot = function (shotsBoard) {
  const availableShots = ComputerLogic.getAvailableShots(shotsBoard);

  if (availableShots.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * availableShots.length);
  return availableShots[index];
};

//----------------------- HUNT/TARGET FSM -------------

/**
 * Finds cells where the computer has hit a ship but has not sunk it yet.
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard Board containing the computer's previous shots.
 * @returns {Array<{row: number, col: number}>} Hit cells still being followed up.
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
 * Checks if a cell has not already been shot.
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard Board containing the computer's previous shots.
 * @param {{row: number, col: number}} cell Cell to check.
 * @returns {boolean} True if the computer can shoot this cell.
 */
ComputerLogic.canShootCell = function (shotsBoard, cell) {
  return shotsBoard[cell.row][cell.col] === Battleship.CELL.EMPTY;
};

/**
 * Finds empty cells beside the hits the computer already has
 *
 * only for Target mode: finding cells around hit cells that are AVAILABLE <==== means it cannot be already a shot/miss cell
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard Board containing the computer's previous shots.
 * @returns {Array<{row: number, col: number}>} Possible target cells.
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
 * Shoots around hit targetss
 *
 * HUNT: chooses random cell
 * TARGET: choose an empty cell next to a hit cell
 *
 * @memberof ComputerLogic
 * @param {string[][]} shotsBoard Board containing the computer's previous shots.
 * @returns {{row: number, col: number}|null} Chosen cell, or null if none remain.
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
