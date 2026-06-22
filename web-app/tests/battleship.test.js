import assert from "node:assert/strict";
import Battleship from "../battleship.js";
import ComputerLogic from "../computerlogic.js";

describe("Battleship shot behaviour", function () {
  function createDestroyerAtTopLeft() {
    const board = Battleship.createEmptyBoard();
    const ship = Battleship.createShip(Battleship.SHIP_TYPE.DESTROYER);
    const placement = Battleship.placeShip(
      board,
      ship,
      { row: 0, col: 0 },
      Battleship.ORIENTATION.HORIZONTAL
    );

    return {
      board: placement.board,
      fleet: [placement.ship],
      shots: Battleship.createEmptyBoard()
    };
  }

  it("records a miss when the player fires at empty water", function () {
    const game = createDestroyerAtTopLeft();

    const shot = Battleship.resolveShot(
      game.board,
      game.fleet,
      game.shots,
      { row: 4, col: 4 }
    );

    assert.equal(shot.result, "miss", "an empty target should report a miss");
    assert.equal(
      shot.shotsBoard[4][4],
      Battleship.CELL.MISS,
      "the targeted cell should be marked as a miss"
    );
  });

  it("records a hit but does not sink a ship that still has an unhit cell", function () {
    const game = createDestroyerAtTopLeft();

    const shot = Battleship.resolveShot(
      game.board,
      game.fleet,
      game.shots,
      { row: 0, col: 0 }
    );

    assert.equal(shot.result, "hit", "the first destroyer cell should report a hit");
    assert.equal(shot.shotsBoard[0][0], Battleship.CELL.HIT);
    assert.equal(
      shot.shotsBoard[0][1],
      Battleship.CELL.EMPTY,
      "the unhit half of the destroyer should remain unmarked"
    );
  });

  it("rejects a repeated shot without changing its previous result", function () {
    const game = createDestroyerAtTopLeft();
    const firstShot = Battleship.resolveShot(
      game.board,
      game.fleet,
      game.shots,
      { row: 4, col: 4 }
    );

    const repeatedShot = Battleship.resolveShot(
      game.board,
      game.fleet,
      firstShot.shotsBoard,
      { row: 4, col: 4 }
    );

    assert.equal(repeatedShot.result, "alreadyShot");
    assert.equal(
      repeatedShot.shotsBoard[4][4],
      Battleship.CELL.MISS,
      "a repeated shot should preserve the original miss marker"
    );
  });

  it("reports a sunk ship and marks all of its cells as sunk", function () {
    const game = createDestroyerAtTopLeft();
    const firstShot = Battleship.resolveShot(
      game.board,
      game.fleet,
      game.shots,
      { row: 0, col: 0 }
    );

    const finalShot = Battleship.resolveShot(
      game.board,
      game.fleet,
      firstShot.shotsBoard,
      { row: 0, col: 1 }
    );

    assert.equal(finalShot.result, "sunk");
    assert.equal(finalShot.shotsBoard[0][0], Battleship.CELL.SUNK);
    assert.equal(finalShot.shotsBoard[0][1], Battleship.CELL.SUNK);
  });

  it("switches to the computer after a valid non-winning player shot", function () {
    const game = createDestroyerAtTopLeft();
    const state = {
      ...Battleship.createInitialGameState(),
      playerBoard: game.board,
      playerFleet: game.fleet,
      computerBoard: game.board,
      computerFleet: game.fleet,
      playerShots: game.shots,
      phase: Battleship.PHASE.PLAYING,
      turn: "player"
    };

    const nextState = Battleship.handlePlayerShot(state, { row: 4, col: 4 });

    assert.equal(nextState.playerShots[4][4], Battleship.CELL.MISS);
    assert.equal(
      nextState.turn,
      "computer",
      "the computer should receive the turn after the player's shot"
    );
  });

  it("ends the game with the player as winner when the final enemy ship is sunk", function () {
    const game = createDestroyerAtTopLeft();
    const firstShot = Battleship.resolveShot(
      game.board,
      game.fleet,
      game.shots,
      { row: 0, col: 0 }
    );
    const state = {
      ...Battleship.createInitialGameState(),
      computerBoard: game.board,
      computerFleet: game.fleet,
      playerShots: firstShot.shotsBoard,
      phase: Battleship.PHASE.PLAYING,
      turn: "player"
    };

    const finalState = Battleship.handlePlayerShot(state, { row: 0, col: 1 });

    assert.equal(finalState.phase, Battleship.PHASE.GAME_OVER);
    assert.equal(finalState.winner, "player");
    assert.equal(
      finalState.turn,
      "player",
      "the turn should not advance after the winning shot"
    );
  });
});

describe("Battleship board and setup behaviour", function () {
  it("rejects a ship placement that would not fit in the board", function () {
    const board = Battleship.createEmptyBoard();
    const carrier = Battleship.createShip(Battleship.SHIP_TYPE.CARRIER);

    const placement = Battleship.placeShip(
      board,
      carrier,
      { row: 0, col: 8 },
      Battleship.ORIENTATION.HORIZONTAL
    );

    assert.equal(placement, null);
    assert.equal(board[0][8], Battleship.CELL.EMPTY);
  });

  it("rejects a ship placement that overlaps another ship", function () {
    const board = Battleship.createEmptyBoard();
    const destroyer = Battleship.createShip(Battleship.SHIP_TYPE.DESTROYER);
    const firstPlacement = Battleship.placeShip(
      board,
      destroyer,
      { row: 3, col: 3 },
      Battleship.ORIENTATION.HORIZONTAL
    );
    const submarine = Battleship.createShip(Battleship.SHIP_TYPE.SUBMARINE);

    const overlappingPlacement = Battleship.placeShip(
      firstPlacement.board,
      submarine,
      { row: 2, col: 3 },
      Battleship.ORIENTATION.VERTICAL
    );

    assert.equal(overlappingPlacement, null);
  });

  it("randomly places every ship without overlapping any cells", function () {
    const placement = Battleship.placeFleetRandomly(
      Battleship.createEmptyBoard(),
      Battleship.createInitialFleet()
    );
    const occupiedCells = placement.fleet.flatMap(function (ship) {
      return ship.cells.map(function (cell) {
        return `${cell.row},${cell.col}`;
      });
    });
    const uniqueCells = new Set(occupiedCells);

    assert.equal(placement.fleet.length, 5);
    assert.equal(occupiedCells.length, 17, "the full fleet occupies 17 cells");
    assert.equal(uniqueCells.size, 17, "no two ships should share a cell");
    placement.fleet.forEach(function (ship) {
      assert.equal(ship.cells.length, ship.length);
    });
  });
});

describe("Battleship game flow", function () {
  it("starts the game with a placed computer fleet and the player going first", function () {
    const initialState = Battleship.createInitialGameState();

    const startedState = Battleship.startGame(initialState);

    assert.equal(startedState.phase, Battleship.PHASE.PLAYING);
    assert.equal(startedState.turn, "player");
    assert.equal(startedState.computerFleet.length, 5);
    startedState.computerFleet.forEach(function (ship) {
      assert.equal(ship.cells.length, ship.length);
    });
  });

  it("lets the computer fire at the only available cell and returns the turn", function () {
    const board = Battleship.createEmptyBoard();
    const destroyer = Battleship.createShip(Battleship.SHIP_TYPE.DESTROYER);
    const placement = Battleship.placeShip(
      board,
      destroyer,
      { row: 0, col: 0 },
      Battleship.ORIENTATION.HORIZONTAL
    );
    const almostFullShotsBoard = Battleship.createEmptyBoard().map(
      function (row, rowIndex) {
        return row.map(function (cell, colIndex) {
          if (rowIndex === 9 && colIndex === 9) {
            return cell;
          }
          return Battleship.CELL.MISS;
        });
      }
    );
    const state = {
      ...Battleship.createInitialGameState(),
      playerBoard: placement.board,
      playerFleet: [placement.ship],
      computerBoard: placement.board,
      computerFleet: [placement.ship],
      computerShots: almostFullShotsBoard,
      phase: Battleship.PHASE.PLAYING,
      turn: "computer"
    };

    const computerTarget = ComputerLogic.chooseRandomShot(
      state.computerShots
    );
    const nextState = Battleship.handleComputerTurn(state, computerTarget);

    assert.equal(nextState.computerShots[9][9], Battleship.CELL.MISS);
    assert.equal(nextState.turn, "player");
    assert.equal(nextState.phase, Battleship.PHASE.PLAYING);
  });

});

describe("Random computer logic", function () {
  it("only returns cells which have not already been shot", function () {
    const shotsBoard = Battleship.createEmptyBoard();
    const updatedShots = Battleship.setCell(
      shotsBoard,
      0,
      0,
      Battleship.CELL.MISS
    );

    const availableShots = ComputerLogic.getAvailableShots(updatedShots);

    assert.equal(availableShots.length, 99);
    assert.equal(
      availableShots.some(function (cell) {
        return cell.row === 0 && cell.col === 0;
      }),
      false
    );
  });
});
