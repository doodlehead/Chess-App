import React from 'react';
import { fabric } from 'fabric';
import update from 'immutability-helper';
import { STARTING_BOARD } from '../utils/constants';

//May not need this
const pieceToImgMap = {
  pawn: 'p',
  bishop: 'b',
  knight: 'n',
  rook: 'r',
  king: 'k',
  queen: 'q',
};

const turnMap = { 0: 'white', 1: 'black' };
const colorToTurnMap = { l: 'white', d: 'black' };

class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      board: STARTING_BOARD, //TODO: persist the board into localStorage
      turn: 'black',
      turnCount: -1,
      pieces: {
        white: [],
        black: []
      },
      moves: [], //valid moves
      highlights: [] //Make highlight deletion more efficient
    };
  }

  //Converts discrete square locations to actual x, y coordinates. Ex. (1,1) -> (80, 80)
  //Gives the center coordinate
  squareToCoord = (x, y) => {
    const { size } = this.props
    return { 
      x: x * size / 8 + size / 16, 
      y: y * size / 8 + size / 16
    };
  }
  //Reverse of squareToCoord
  coordToSquare = (x, y) => {
    let division = this.props.size / 8;
    return {
      x: Math.floor(x / division),
      y: Math.floor(y / division)
    };
  }

  componentDidMount() {
    //Instantiate the Fabric.js canvas
    const canvas = new fabric.Canvas('boardCanvas', {
      width: this.props.size,
      height: this.props.size,
      selection: false
    });
    this.canvas = canvas;

    this.drawBackground(canvas);
    this.drawPieces(canvas);

    //Show valid moves on click for pieces
    canvas.on('mouse:down', this.handleMouseDown);
    //Moving pieces
    canvas.on('mouse:up:before', this.handleBeforeMouseUp);
  }

  handleMouseDown = e => {
    if (e.target?.piece ) { //If an object/piece was clicked
      let squareCoords = this.coordToSquare(
        e.pointer.x - (e.transform?.offsetX ?? 0),
        e.pointer.y - (e.transform?.offsetY ?? 0)
      );

      //Get the valid moves and highlight
      this.setState({ moves: this.getValidMoves(squareCoords, e.target.pieceChars) }, () => {
        const { moves } = this.state;
        this.highlightSquares(this.canvas, moves);
      });
    }
  }

  handleBeforeMouseUp = e => {
    if (e.target?.piece && e.transform) { //If an object was clicked
      //Not the piece's turn
      if (this.state.turn !== colorToTurnMap[e.target.pieceChars[1]]) {
        console.error("It's not your turn!");
        return;
      }

      //Get the square coords of destination
      let squareCoords = this.coordToSquare(e.pointer.x - e.transform.offsetX, e.pointer.y - e.transform.offsetY);

      //Valid move
      if (this.state.moves.some(e => e.x === squareCoords.x && e.y === squareCoords.y)) {
        //Relay changes to the model (this.state.board)

        //Square coords of the origin
        let fromCoord = this.coordToSquare(e.transform.original.left, e.transform.original.top);

        let newBoard = this.clone2DArray(this.state.board);
        newBoard[fromCoord.y][fromCoord.x] = 'e'; //Set old spot to empty
        newBoard[squareCoords.y][squareCoords.x] = e.target.pieceChars; //Set new spot to occupied

        this.setState({ board: newBoard }); //Update the board state...
        
        //Center the piece relative to the square
        let corrected = this.squareToCoord(squareCoords.x, squareCoords.y);
        e.target.setOptions({
          left: corrected.x,
          top: corrected.y,
          selectable: false,
        });

        e.target.setCoords();

        //Next player's turn
        this.nextTurn();

      } else {
        //Invalid move
        console.log('invalid move!');
        //Move the object back to original square
        e.target.setOptions({
          left: e.transform.original.left,
          top: e.transform.original.top
        });
        e.target.setCoords();
      }
    }
    //Remove all highlighting
    this.removeHighlights(this.canvas);
  }

  //Lock the current pieces, unlock the next player's pieces
  nextTurn = () => {
    //Can't move current player's pieces when it's the next turn
    this.state.pieces[this.state.turn].forEach(piece => {
      piece.set({
        selectable: false,
        evented: false
      });
    });

    //Increment turn info and force it to be synchronous
    this.setState({turnCount: this.state.turnCount + 1}, () => 
      this.setState({turn: turnMap[(this.state.turnCount + 2) % 2]}, () => {
        //Next player's turn, set pieces selectable and evented
        this.state.pieces[this.state.turn].forEach(piece => {
          piece.set({
            selectable: true,
            evented: true
          });
        });
      }));
  }

  clone2DArray = array => {
    let clone = [];
    array.forEach(row => {
      clone.push(row.slice(0));
    });
    return clone;
  }

  addIfValid = (array, x, y) => {
    /*************************************
     * TODO: check for blocking and Check
     *************************************/
 
    if(x >= 0 && x <= 7 
      && y >= 0 && y <= 7 
      && this.state.board[y][x] === 'e') {
        array.push({x, y});
      }
  }

  /**
   * Helper method for getValidMoves()
   * @param {Array} array - The array to add the moves to.
   * @param {} coords - The starting coordinates: {x, y}
   * @param {} deltaX - The x-direction to check
   * @param {} deltaY - The y-direction to check
   */
  addMoves = (array, coords, deltaX, deltaY) => {
    let tempCoords = {};
    Object.assign(tempCoords, coords); //Clone object

    tempCoords.x += deltaX;
    tempCoords.y += deltaY;

    while (tempCoords.x >= 0 && tempCoords.x <= 7
      && tempCoords.y >= 0 && tempCoords.y <= 7) {
      
      //Keep going if the space is empty
      if (this.state.board[tempCoords.y][tempCoords.x] === 'e') {
        array.push({x: tempCoords.x, y: tempCoords.y});
        tempCoords.x += deltaX;
        tempCoords.y += deltaY;
    } else if (colorToTurnMap[this.state.board[tempCoords.y][tempCoords.x][1]] !== this.state.turn) {
        array.push({x: tempCoords.x, y: tempCoords.y});
        return;
      } else {
        return;
      }
    }
  }

  //Helper method for getValidMoves()
  addBishopMoves = (array, coords) => {
    this.addMoves(array, coords, 1, 1);
    this.addMoves(array, coords, 1, -1);
    this.addMoves(array, coords, -1, 1);
    this.addMoves(array, coords, -1, -1);
  }
  //Helper method for getValidMoves()
  addRookMoves = (array, coords) => {
    this.addMoves(array, coords, 1, 0);
    this.addMoves(array, coords, -1, 0);
    this.addMoves(array, coords, 0, 1);
    this.addMoves(array, coords, 0, -1);
  }

  /**
   * Get a list of valid moves for each piece type
   * @param {Object} coords - The coordinates of the piece to get moves for: {x, y}
   * @param {String} pieceChars - A String that represents the kind of piece it is
   */
  getValidMoves = (coords, pieceChars) => {
    let validMoves = [];
    if(pieceChars[0] === 'p') { //Pawn
      if(pieceChars[1] === 'd') { //Black pawn
        this.addIfValid(validMoves, coords.x, coords.y + 1); //down
        this.addIfValid(validMoves, coords.x + 1, coords.y + 1); //attack right
        this.addIfValid(validMoves, coords.x - 1, coords.y + 1); //attack left
      } else if(pieceChars[1] === 'l') { //White pawn
        this.addIfValid(validMoves, coords.x, coords.y - 1); //up
        this.addIfValid(validMoves, coords.x + 1, coords.y - 1); //attack right
        this.addIfValid(validMoves, coords.x - 1, coords.y - 1); //attack left
      }
    } else if(pieceChars[0] === 'n') { //Knight
      this.addIfValid(validMoves, coords.x + 1, coords.y + 2);
      this.addIfValid(validMoves, coords.x + 1, coords.y - 2);
      this.addIfValid(validMoves, coords.x - 1, coords.y + 2);
      this.addIfValid(validMoves, coords.x - 1, coords.y - 2);
      this.addIfValid(validMoves, coords.x + 2, coords.y + 1);
      this.addIfValid(validMoves, coords.x + 2, coords.y - 1);
      this.addIfValid(validMoves, coords.x - 2, coords.y + 1);
      this.addIfValid(validMoves, coords.x - 2, coords.y - 1);
    } else if(pieceChars[0] === 'b') { //Bishop
      this.addBishopMoves(validMoves, coords);
    } else if(pieceChars[0] === 'r') { //Rook
      this.addRookMoves(validMoves, coords);
    } else if(pieceChars[0] === 'q') { //Queen
      this.addBishopMoves(validMoves, coords);
      this.addRookMoves(validMoves, coords);
    } else if(pieceChars[0] === 'k') { //King
      this.addIfValid(validMoves, coords.x, coords.y + 1);
      this.addIfValid(validMoves, coords.x + 1, coords.y + 1);
      this.addIfValid(validMoves, coords.x + 1, coords.y);
      this.addIfValid(validMoves, coords.x + 1, coords.y - 1);
      this.addIfValid(validMoves, coords.x, coords.y - 1);
      this.addIfValid(validMoves, coords.x - 1, coords.y - 1);
      this.addIfValid(validMoves, coords.x - 1, coords.y);
      this.addIfValid(validMoves, coords.x - 1, coords.y + 1);
    } else {
      console.error('Error: Not a piece!');
      throw new Error('Error: Not a valid piece!');
    }

    return validMoves;
  }

  /**
   * Hightlight a list of squares on the board
   * @param {Object} canvas - Fabric.js canvas to draw on
   * @param {Array} squareList - A list of coordinates to highlight
   */
  highlightSquares = (canvas, squareList) => {
    const { size } = this.props;
    const highlights = [];

    squareList.forEach(coord => {
      const square = new fabric.Rect({
        opacity: 0.3,
        fill: "yellow",
        height: size / 8, 
        width:  size / 8,
        left: coord.x * size / 8,
        top: coord.y * size / 8,
        selectable: false
      });
      highlights.push(square);
      canvas.add(square);
    });

    this.setState({ highlights });
  }

  //Remove all highlights
  removeHighlights = canvas => {
    this.state.highlights.forEach(square => {
      canvas.remove(square);
    });
    this.setState({highlights: []});
  }

  /**
   * Draws the board's checker pattern on the Fabric.js canvas
   * @param {Object} canvas - The Fabric.js Canvas to draw the board squares on.
   */
  drawBackground = canvas => {
    const { size } = this.props
    //Draw the chessboard background
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if ((x + y) % 2 === 0) { //Omit some squares to create checkerboard pattern
          continue;
        }
        //Create the square object
        let square = new fabric.Rect({
          fill: "darkcyan",
          height: size / 8, 
          width: size / 8,
          left: x * size / 8,
          top: y * size / 8,
          selectable: false,
          hoverCursor: 'default'
        });
        canvas.add(square);
      }
    }
  }

  //Return Promise that returns a fabric.Image. 
  getPiecePromise = (pieceChars, coords) => {
    let actualCoords = this.squareToCoord(coords.x, coords.y);
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(require(`../assets/icons/Chess_${pieceChars}t60.png`), oImg => {
        if(oImg) {
          return resolve(oImg);
        } else {
          return reject("Can't create fabric Image");
        }
      }, {
        hasControls: false,
        originX: 'center',
        originY: 'center',
        left: actualCoords.x,
        top: actualCoords.y,
        hasBorders: false,
        pieceChars: pieceChars,
        squareX: coords.x,
        squareY: coords.y,
        type: 'piece',
        piece: true
      });
    });
  }

  //Draw the pieces on the board as represented by the "board" object
  //Use for instantiation only? Then use deltas to account for any changes...
  drawPieces = canvas => {
    //Render the pieces on the board
    let whitePieces = [];
    let blackPieces = [];

    let piecePromises = [];

    //Build the promises array
    for(let y = 0; y < 8; y++) {
      for(let x = 0; x < 8; x++) {
        //If it's not empty put a piece there
        if(this.state.board[y][x] !== 'e') {
          piecePromises.push(this.getPiecePromise(this.state.board[y][x], {x, y}));
        }
      }
    }

    //Wait for all the Promises to return
    Promise.all(piecePromises).then(values => {
      //Put all the pieces on the board
      values.forEach(img => {
        canvas.add(img);
        img.setCoords();

        if(img.pieceChars[1] === 'l') { //White
          whitePieces.push(img);
        } else if(img.pieceChars[1] === 'd') { //Black
          blackPieces.push(img);
        }
      });

      //Make it the next turn
      this.setState(
        {
          pieces: { white: whitePieces, black: blackPieces }
        }, 
        () => this.nextTurn()
      );
    });

  }

  render() {
    return <div style={{display: "flex", "flexFlow": "column", "alignItems": "center"}}>
      <div style={{display: "flex", width: `${this.props.size}px`}}>
        <h1>Turn count: {this.state.turnCount}</h1>
        <h1 style={{"marginLeft": "auto"}}>Turn: {this.state.turn}</h1>
      </div>
      <canvas id="boardCanvas" className="css-boardCanvas"></canvas>
    </div>
  }
}

export default Board;