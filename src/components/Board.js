import React from 'react';
import { fabric } from 'fabric';
import update from 'immutability-helper';
import { STARTING_BOARD, turnMap, colorToTurnMap, turns } from '../utils/constants';
import { getValidMoves } from '../utils/methods';

//May not need this
const pieceToImgMap = {
  pawn: 'p',
  bishop: 'b',
  knight: 'n',
  rook: 'r',
  king: 'k',
  queen: 'q',
};

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

  handleMouseDown = e => {
    if (e.target?.piece ) { //If an object/piece was clicked
      const { board, turn } = this.state;
      let squareCoords = this.coordToSquare(
        e.pointer.x - (e.transform?.offsetX ?? 0),
        e.pointer.y - (e.transform?.offsetY ?? 0)
      );

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
    this.removeHighlights();
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
   * @param {Array} squareList - A list of coordinates to highlight
   */
  highlightSquares = (canvas, squareList) => {
    const { size } = this.props;
    const { turn } = this.state;
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
  removeHighlights = () => {
    this.state.highlights.forEach(square => {
      this.canvas.remove(square);
    });
    this.setState({highlights: []});
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
      fabric.Image.fromURL(require(`../assets/icons/Chess_${pieceChars}t60.png`), oImg => {
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
    //Render the pieces on the board
    let whitePieces = [];
    let blackPieces = [];

    let piecePromises = [];

    //Build the promises array
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        //If it's not empty put a piece there
        if (this.state.board[y][x] !== 'e') {
          piecePromises.push(this.getPiecePromise(this.state.board[y][x], {x, y}));
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