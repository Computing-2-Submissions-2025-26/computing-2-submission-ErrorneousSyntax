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

export default ComputerLogic;
