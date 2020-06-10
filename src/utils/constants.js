
export const STARTING_BOARD =  [['rd1','nd1','bd1','qd1','kd1','bd2','nd2','rd2'],
                              ['pd1f','pd2f','pd3f','pd4f','pd5f','pd6f','pd7f','pd8f'],
                              ['e','e','e','e','e','e','e','e'],
                              ['e','e','e','e','e','e','e','e'],
                              ['e','e','e','e','e','e','e','e'],
                              ['e','e','e','e','e','e','e','e'],
                              ['pl1f','pl2f','pl3f','pl4f','pl5f','pl6f','pl7f','pl8f'],
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