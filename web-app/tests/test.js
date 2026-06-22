import assert from "node:assert/strict";
import Battleship from "../battleship.js";

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

  it("returns the ship that was hit", function () {
    const game = createDestroyerAtTopLeft();

    const shot = Battleship.resolveShot(
      game.board,
      game.fleet,
      game.shots,
      { row: 0, col: 1 }
    );

    assert.equal(
      shot.ship.name,
      Battleship.SHIP_TYPE.DESTROYER.name,
      "the result should identify the destroyer at the target"
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
