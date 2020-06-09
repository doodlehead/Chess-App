
export const STARTING_BOARD =  [['rd1','nd1','bd1','qd1','kd1','bd2','nd2','rd2'],
                              ['pd1','pd2','pd3','pd4','pd5','pd6','pd7','pd8'],
                              ['e','e','e','e','e','e','e','e'],
                              ['e','e','e','e','e','e','e','e'],
                              ['e','e','e','e','e','e','e','e'],
                              ['e','e','e','e','e','e','e','e'],
                              ['pl1','pl2','pl3','pl4','pl5','pl6','pl7','pl8'],
                              ['rl1','nl1','bl1','ql1','kl1','bl2','nl2','rl2']];

export const turns = { WHITE: 'white', BLACK: 'black' };
export const turnMap = { 0: turns.WHITE, 1: turns.BLACK };
export const colorToTurnMap = { l: turns.WHITE, d: turns.BLACK };
export const oppositeColor = { white: turns.BLACK, black: turns.WHITE };
export const pieceTypes = {
  EMPTY: 'e',
  PAWN: 'p',
  ROOK: 'r',
  KNIGHT: 'n',
  BISHOP: 'b',
  QUEEN: 'q',
  KING: 'k'
};