import { colorToTurnMap } from './constants';

/******************************
 *           Moves
 ******************************/

  /**
 * Get a list of valid moves for each piece type
 * @param {Array[]} board - 2D array representing the state of the board
 * @param {Object} coords - The coordinates of the piece to get moves for: {x, y}
 * @param {String} pieceChars - A String that represents the kind of piece it is
 * @param {String} turn - Who's turn it is
 */
export const getValidMoves = ({ board, coords, pieceChars, turn }) => {
  let validMoves = [];
  if(pieceChars[0] === 'p') { //Pawn
    if(pieceChars[1] === 'd') { //Black pawn
      addIfValid({ board, array: validMoves, x: coords.x, y: coords.y + 1 }); //down
      addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y + 1 }); //attack right
      addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y + 1 }); //attack left
    } else if(pieceChars[1] === 'l') { //White pawn
      addIfValid({ board, array: validMoves, x: coords.x, y: coords.y - 1 }); //up
      addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y - 1 }); //attack right
      addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y - 1 }); //attack left
    }
  } else if(pieceChars[0] === 'n') { //Knight
    addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y + 2 });
    addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y - 2 });
    addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y + 2 });
    addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y - 2 });
    addIfValid({ board, array: validMoves, x: coords.x + 2, y: coords.y + 1 });
    addIfValid({ board, array: validMoves, x: coords.x + 2, y: coords.y - 1 });
    addIfValid({ board, array: validMoves, x: coords.x - 2, y: coords.y + 1 });
    addIfValid({ board, array: validMoves, x: coords.x - 2, y: coords.y - 1 });
  } else if(pieceChars[0] === 'b') { //Bishop
    addBishopMoves({ board, array: validMoves, coords, turn });
  } else if(pieceChars[0] === 'r') { //Rook
    addRookMoves({ board, array: validMoves, coords, turn });
  } else if(pieceChars[0] === 'q') { //Queen
    addBishopMoves({ board, array: validMoves, coords, turn });
    addRookMoves({ board, array: validMoves, coords, turn });
  } else if(pieceChars[0] === 'k') { //King
    //Start at top, go around clockwise
    addIfValid({ board, array: validMoves, x: coords.x, y: coords.y + 1 });
    addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y + 1 });
    addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y });
    addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y - 1 });
    addIfValid({ board, array: validMoves, x: coords.x, y: coords.y - 1 });
    addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y - 1 });
    addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y });
    addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y + 1 });
  } else {
    console.error('Error: Not a piece!');
    throw new Error('Error: Not a valid piece!');
  }

  return validMoves;
}

export const addIfValid = ({ board, array, x, y }) => {
  /*************************************
   * TODO: check for blocking and Check
   *************************************/

  if (x >= 0 && x <= 7 
    && y >= 0 && y <= 7 
    && board[y][x] === 'e') {
      array.push({x, y});
    }
}

//Helper method for getValidMoves()
export const addBishopMoves = ({ board, array, coords, turn }) => {
  addMoves({ board, array, coords, deltaX: 1, deltaY: 1, turn });
  addMoves({ board, array, coords, deltaX: 1, deltaY: -1, turn });
  addMoves({ board, array, coords, deltaX: -1, deltaY: 1, turn });
  addMoves({ board, array, coords, deltaX: -1, deltaY: -1, turn });
}

//Helper method for getValidMoves()
export const addRookMoves = ({ board, array, coords, turn }) => {
  addMoves({ board, array, coords, deltaX: 1, deltaY: 0, turn });
  addMoves({ board, array, coords, deltaX: -1, deltaY: 0, turn });
  addMoves({ board, array, coords, deltaX: 0, deltaY: 1, turn });
  addMoves({ board, array, coords, deltaX: 0, deltaY: -1, turn });
}

/**
* Helper method for getValidMoves()
* @param {Array[]} board - 2D array representing the state of the board
* @param {Array} array - The array to add the moves to.
* @param {Object} coords - The starting coordinates: {x, y}
* @param {Number} deltaX - The x-direction to check: (-1, 0, 1)
* @param {Number} deltaY - The y-direction to check: (-1, 0, 1)
* @param {String} turn - Who's turn it is
*/
export const addMoves = ({ board, array, coords, deltaX, deltaY, turn }) => {
  let tempCoords = {};
  Object.assign(tempCoords, coords); //Clone object

  tempCoords.x += deltaX;
  tempCoords.y += deltaY;

  while (tempCoords.x >= 0 && tempCoords.x <= 7
    && tempCoords.y >= 0 && tempCoords.y <= 7) {
    
    //Keep going if the space is empty
    if (board[tempCoords.y][tempCoords.x] === 'e') {
      array.push({x: tempCoords.x, y: tempCoords.y});
      tempCoords.x += deltaX;
      tempCoords.y += deltaY;
  } else if (colorToTurnMap[board[tempCoords.y][tempCoords.x][1]] !== turn) {
      //Move that attacks an opponent's piece
      array.push({x: tempCoords.x, y: tempCoords.y});
      return;
    } else {
      return;
    }
  }
}