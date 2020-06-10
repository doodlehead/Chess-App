import { colorToTurnMap, pieceTypes, oppositeColor } from './constants';

/******************************
 *           Moves
 ******************************/

  /**
 * Get a list of valid moves for each piece type
 * @param {Array[]} board - 2D array representing the state of the board
 * @param {Object} coords - The coordinates of the piece to get moves for: {x, y}
 * @param {String} pieceChars - A String that represents the kind of piece it is
 * @param {String} turn - Who's turn it is (white/black)
 */
export const getValidMoves = ({ board, coords, pieceChars, turn }) => {
  let validMoves = [];
  if(pieceChars[0] === pieceTypes.PAWN) {
    if(pieceChars[1] === 'd') { //Black pawn
      addIfValid({ board, array: validMoves, x: coords.x, y: coords.y + 1 }); //down
      if (pieceChars[3] === 'f' && board[coords.y + 1][coords.x] === pieceTypes.EMPTY) {
        addIfValid({ board, array: validMoves, x: coords.x, y: coords.y + 2 });
      }
      (board[coords.y + 1]?.[coords.x + 1] !== pieceTypes.EMPTY) && addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y + 1, turn }); //attack right
      (board[coords.y + 1]?.[coords.x - 1] !== pieceTypes.EMPTY) && addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y + 1, turn }); //attack left
    } else if(pieceChars[1] === 'l') { //White pawn
      addIfValid({ board, array: validMoves, x: coords.x, y: coords.y - 1 }); //up
      if (pieceChars[3] === 'f' && board[coords.y - 1][coords.x] === pieceTypes.EMPTY) {
        addIfValid({ board, array: validMoves, x: coords.x, y: coords.y - 2 });
      }
      (board[coords.y - 1]?.[coords.x + 1] !== pieceTypes.EMPTY) && addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y - 1, turn }); //attack right
      (board[coords.y - 1]?.[coords.x - 1] !== pieceTypes.EMPTY) && addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y - 1, turn }); //attack left
    }
  } else if(pieceChars[0] === pieceTypes.KNIGHT) {
    addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y + 2, turn });
    addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y - 2, turn });
    addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y + 2, turn });
    addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y - 2, turn });
    addIfValid({ board, array: validMoves, x: coords.x + 2, y: coords.y + 1, turn });
    addIfValid({ board, array: validMoves, x: coords.x + 2, y: coords.y - 1, turn });
    addIfValid({ board, array: validMoves, x: coords.x - 2, y: coords.y + 1, turn});
    addIfValid({ board, array: validMoves, x: coords.x - 2, y: coords.y - 1, turn });
  } else if(pieceChars[0] === pieceTypes.BISHOP) {
    addBishopMoves({ board, array: validMoves, coords, turn });
  } else if(pieceChars[0] === pieceTypes.ROOK) {
    addRookMoves({ board, array: validMoves, coords, turn });
  } else if(pieceChars[0] === pieceTypes.QUEEN) {
    addBishopMoves({ board, array: validMoves, coords, turn });
    addRookMoves({ board, array: validMoves, coords, turn });
  } else if(pieceChars[0] === pieceTypes.KING) {
    //Start at top, go around clockwise
    addIfValid({ board, array: validMoves, x: coords.x, y: coords.y + 1, turn });
    addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y + 1, turn });
    addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y, turn });
    addIfValid({ board, array: validMoves, x: coords.x + 1, y: coords.y - 1, turn });
    addIfValid({ board, array: validMoves, x: coords.x, y: coords.y - 1, turn });
    addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y - 1, turn });
    addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y, turn });
    addIfValid({ board, array: validMoves, x: coords.x - 1, y: coords.y + 1, turn });
  } else {
    console.error('Error: Not a piece!');
    throw new Error('Error: Not a valid piece!');
  }

  return validMoves;
};

export const addIfValid = ({ board, array, x, y, turn }) => {
  /***********************************************
   * TODO: check for "Check" state
   **********************************************/
  if (x < 0 || x > 7 || y < 0 || y > 7) return;

  const pieceChars = board[y][x];
  if (pieceChars[0] === pieceTypes.EMPTY || (turn && getOppositeColor(pieceChars) === turn)) {
    array.push({x, y});
  }
};

//Helper method for getValidMoves()
export const addBishopMoves = ({ board, array, coords, turn }) => {
  addMoves({ board, array, coords, deltaX: 1, deltaY: 1, turn });
  addMoves({ board, array, coords, deltaX: 1, deltaY: -1, turn });
  addMoves({ board, array, coords, deltaX: -1, deltaY: 1, turn });
  addMoves({ board, array, coords, deltaX: -1, deltaY: -1, turn });
};

//Helper method for getValidMoves()
export const addRookMoves = ({ board, array, coords, turn }) => {
  addMoves({ board, array, coords, deltaX: 1, deltaY: 0, turn });
  addMoves({ board, array, coords, deltaX: -1, deltaY: 0, turn });
  addMoves({ board, array, coords, deltaX: 0, deltaY: 1, turn });
  addMoves({ board, array, coords, deltaX: 0, deltaY: -1, turn });
};

/**
* Helper method for addBishopMoves() and addRookMoves()
* @param {Array[]} board - 2D array representing the state of the board
* @param {Array} array - The array to add the moves to.
* @param {Object} coords - The starting coordinates: {x, y}
* @param {Number} deltaX - The x-direction to check: (-1, 0, 1)
* @param {Number} deltaY - The y-direction to check: (-1, 0, 1)
* @param {String} turn - Who's turn it is. If it's 'null' the piece can't attack there (pawn).
*/
export const addMoves = ({ board, array, coords, deltaX, deltaY, turn }) => {
  let { x, y } = coords;
  x += deltaX;
  y += deltaY;

  while (x >= 0 && x <= 7 && y >= 0 && y <= 7) {
    const pieceChars = board[y][x];

    //Keep going if the space is empty
    if (pieceChars === pieceTypes.EMPTY) {
      array.push({ x, y });
      x += deltaX;
      y += deltaY;
  } else if (getOppositeColor(pieceChars) === turn) {
      //Move that attacks an opponent's piece
      array.push({ x, y });
      return;
    } else {
      return; //No longer valid
    }
  }
};

export const getOppositeColor = pieceChars => {
  if (pieceChars === pieceTypes.EMPTY || !pieceChars) {
    console.error('Invalid piece chars');
    return ''; //Not a valid piece chars
  }

  return oppositeColor[colorToTurnMap[pieceChars[1]]];
};