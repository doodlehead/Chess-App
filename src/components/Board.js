import React from 'react';
import { fabric } from 'fabric';
import update from 'immutability-helper';
import { STARTING_BOARD, turnMap, colorToTurnMap, turns, pieceTypes } from '../utils/constants';
import { getValidMoves } from '../utils/methods';

class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      board: STARTING_BOARD, //TODO: persist the board into localStorage
      turn: turns.BLACK,
      turnCount: -1,
      pieces: {
        white: [],
        black: []
      },
      graveyard: {
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
    const { size } = this.props
    //Instantiate the Fabric.js canvas
    const canvas = new fabric.Canvas('boardCanvas', {
      width: size,
      height: size,
      selection: false
    });
    this.canvas = canvas;

    this.drawBackground();
    this.drawPieces();

    //Show valid moves on click for pieces
    canvas.on('mouse:down', this.handleMouseDown);
    //Moving pieces
    canvas.on('mouse:up:before', this.handleBeforeMouseUp);
  }

  getPieceFromCanvas = pieceChars => {
    return this.canvas.getObjects('piece').find(elem => elem.pieceChars === pieceChars)
  }

  handleMouseDown = e => {
    if (e.target?.piece ) { //If an object/piece was clicked
      const { board, turn } = this.state;
      let squareCoords = this.coordToSquare(
        e.pointer.x - (e.transform?.offsetX ?? 0),
        e.pointer.y - (e.transform?.offsetY ?? 0)
      );

      //If you click a piece that shouldn't exist
      if (board[squareCoords.y][squareCoords.x] !== e.target.pieceChars) {
        console.error(board);
        console.error(e.target.pieceChars);
        console.error(this.canvas);
        throw new Error("Fabric Canvas is out of sync with board state");
      }

      //Get the valid moves and highlight
      this.setState({ 
        moves: getValidMoves({
          board,
          coords: squareCoords,
          pieceChars: e.target.pieceChars,
          turn,
        })
      }, () => {
        this.highlightSquares(this.canvas, this.state.moves);
      });
    }
  }

  handleBeforeMouseUp = e => {
    if (e.target?.piece && e.transform) { //If an object was clicked
      const { turn, moves } = this.state;
      const { pieceChars } = e.target;
      //Not the piece's turn
      if (turn !== colorToTurnMap[pieceChars[1]]) {
        console.error("It's not your turn!");
        return;
      }

      //Get the square coords of destination
      const toCoords = this.coordToSquare(e.pointer.x - e.transform.offsetX, e.pointer.y - e.transform.offsetY);

      //Is the move in the valid move list?
      if (moves.some(e => e.x === toCoords.x && e.y === toCoords.y)) {
        //Square coords of the origin
        const fromCoords = this.coordToSquare(e.transform.original.left, e.transform.original.top);
        this.executeMove({ fromCoords, toCoords, target: e.target })
      } else {
        //Invalid move, move the object back to original square
        console.log('invalid move!');
        e.target.setOptions({
          left: e.transform.original.left,
          top: e.transform.original.top
        });
        e.target.setCoords();
      }
    }
    this.removeHighlights();
  }

  /**
   * Perform a valid chess move. Mutates board state and Fabric canvas.
   * @param {Object} fromCoords - the piece's original coordinates
   * @param {Object} toCoords - the piece's destination coordinates
   * @param {Object} target - the fabric object being moved
   */
  executeMove = ({ fromCoords, toCoords, target }) => {
    const { board } = this.state;
    const { pieceChars } = target;
  
    const newBoard = this.clone2DArray(board);
    newBoard[fromCoords.y][fromCoords.x] = pieceTypes.EMPTY; //Set old spot to empty
    //Take a piece
    if (newBoard[toCoords.y][toCoords.x] !== pieceTypes.EMPTY) {
      const graveyard = {...this.state.graveyard};
      graveyard[colorToTurnMap[pieceChars[1]]].push(newBoard[toCoords.y][toCoords.x]);
      this.setState({ graveyard });

      //Delete the Fabric Object from the Canvas
      this.canvas.remove(this.getPieceFromCanvas(newBoard[toCoords.y][toCoords.x]));
    }
    //Remove any 'special states' when a piece is moved. Eg. pawn first move, first castle.
    const newPieceChars = pieceChars.substring(0, 3);
    newBoard[toCoords.y][toCoords.x] = newPieceChars; //Set new spot to occupied

    this.setState({ board: newBoard }); //Update the board state...
    
    //Center the piece relative to the square
    let corrected = this.squareToCoord(toCoords.x, toCoords.y);
    target.setOptions({
      left: corrected.x,
      top: corrected.y,
      selectable: false,
      pieceChars: newPieceChars
    });

    target.setCoords();

    this.nextTurn();
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

  /**
   * Hightlight a list of squares on the board
   * @param {Object} canvas - Fabric.js canvas to draw on
   * @param {Array} squareList - A list of coordinates (valid moves) to highlight
   */
  highlightSquares = (canvas, squareList) => {
    const { size } = this.props;
    const { board } = this.state;
    const highlights = [];

    //TODO: Make highlighting prettier?

    squareList.forEach(coord => {
      const highlightColor = board[coord.y][coord.x] === pieceTypes.EMPTY ? 'yellow' : 'red';
      const square = new fabric.Rect({
        opacity: 0.3,
        fill: highlightColor,
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
  removeHighlights = () => {
    this.state.highlights.forEach(square => {
      this.canvas.remove(square);
    });
    this.setState({ highlights: [] });
  }

  /**
   * Draws the board's checker pattern on the Fabric.js canvas
   */
  drawBackground = () => {
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
        this.canvas.add(square);
      }
    }
  }

  //Return Promise that returns a fabric.Image. 
  getPiecePromise = (pieceChars, coords) => {
    let actualCoords = this.squareToCoord(coords.x, coords.y);
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(require(`../assets/icons/Chess_${pieceChars.substring(0, 2)}t60.png`), oImg => {
        if (oImg) {
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
  drawPieces = () => {
    const { board } = this.state;
    //Render the pieces on the board
    let whitePieces = [];
    let blackPieces = [];

    let piecePromises = [];

    //Build the promises array
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        //If it's not empty put a piece there
        if (board[y][x] !== pieceTypes.EMPTY) {
          piecePromises.push(this.getPiecePromise(board[y][x], {x, y}));
        }
      }
    }

    //Wait for all the Promises to return
    Promise.all(piecePromises).then(values => {
      //Put all the pieces on the board
      values.forEach(img => {
        this.canvas.add(img);
        img.setCoords();

        if (img.pieceChars[1] === 'l') { //White
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
    return (
      <div style={{display: "flex", "flexFlow": "column", "alignItems": "center"}}>
        <div style={{display: "flex", width: `${this.props.size}px`}}>
          <h1>Turn count: {this.state.turnCount}</h1>
          <h1 style={{"marginLeft": "auto"}}>Turn: {this.state.turn}</h1>
        </div>
        <canvas id="boardCanvas" className="css-boardCanvas"></canvas>
        <pre style={{ marginTop: 40, fontSize: 14 }}>{print2DArray(this.state.board)}</pre>
        <div>{JSON.stringify(this.state.graveyard)}</div>
      </div>
    )
  }
}

const print2DArray = arr => {
  let str = '';
  arr.forEach(row => str += JSON.stringify(row) + '\n');
  return str;
}

export default Board;