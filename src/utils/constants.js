
export const STARTING_BOARD =  [['rd','nd','bd','qd','kd','bd','nd','rd'],
                              ['pd','pd','pd','pd','pd','pd','pd','pd'],
                              ['e','e','e','e','e','e','e','e'],
                              ['e','e','e','e','e','e','e','e'],
                              ['e','e','e','e','e','e','e','e'],
                              ['e','e','e','e','e','e','e','e'],
                              ['pl','pl','pl','pl','pl','pl','pl','pl'],
                              ['rl','nl','bl','ql','kl','bl','nl','rl']];

export const turns = { WHITE: 'white', BLACK: 'black' };
export const turnMap = { 0: turns.WHITE, 1: turns.BLACK };
export const colorToTurnMap = { l: turns.WHITE, d: turns.BLACK };
export const oppositeColor = { white: turns.BLACK, black: turns.white };
export const pieceTypes = {
  EMPTY: 'e',
  PAWN: 'p',
  ROOK: 'r',
  KNIGHT: 'n',
  BISHOP: 'b',
  QUEEN: 'q',
  KING: 'k'
};