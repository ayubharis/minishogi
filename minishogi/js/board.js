import { Piece, canPromote } from './piece.js';

const kingMoveset = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const dragonMoveset = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const horseMoveset = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const blackGoldMoveset = [[1, 0], [1, -1], [0, 1], [-1, -1], [-1, 0], [0, -1]];
const whiteGoldMoveset = [[1, 0], [0, 1], [-1, 0], [-1, 1], [0, -1], [1, 1]];
const blackSilverMoveset = [[1, 1], [0, -1], [-1, 1], [-1, -1], [1, -1]];
const whiteSilverMoveset = [[1, 1], [-1, 1], [-1, -1], [0, 1], [1, -1]];
const blackPawnMoveset = [[0, -1]];
const whitePawnMoveset = [[0, 1]];

export function pieceAt(board, x, y) {
    return board.pieces[y][x];
}

function setPiece(board, x, y, piece) {
    board.pieces[y][x] = piece;
}

export function activePiece(board) {
    return board.activePiece.x !== -1 || board.activePiece.y !== -1;
}

export function promote(board, prompt = true, promoted = true) {
    let piece = pieceAt(board, board.activePiece.x, board.activePiece.y);
    if (!prompt || piece.type === 'p') {
        piece.promoted = promoted;
        board.promoteWait = false;
        setActive(board, board.activePiece.x, board.activePiece.y);
        checkCheckmate(board);
    } else if (canPromote(piece)) {
        board.promoteWait = true;
    }
}

export function movePiece(board, pieceX, pieceY, x, y, test = false) {
    let piece = pieceAt(board, pieceX, pieceY);
    let capturedPiece = pieceAt(board, x, y);
    if (capturedPiece !== 0) {
        board.inHand[piece.color][capturedPiece.type]++;
    }
    setPiece(board, x, y, piece);
    setPiece(board, pieceX, pieceY, 0);
    if (!test) {
        if (!piece.promoted && (y === (piece.color === 'b' ? 0 : 4) || pieceY === (piece.color === 'b' ? 0 : 4))) {
            setActive(board, x, y);
            promote(board);
        } else {
            checkCheckmate(board);
        }
    }
}

export function checkCheckmate(board) {
    if (inCheckmate(board, 'b')) {
        board.gameOver = true;
        board.winner = 'w';
    }
    if (inCheckmate(board, 'w')) {
        board.gameOver = true;
        board.winner = 'b';
    }
}

export function setActive(board, x, y) {
    if (!activePiece(board)) {
        board.activePiece = { x: x, y: y };
        pieceAt(board, x, y).active = true;
    } else if (board.activePiece.x === x && board.activePiece.y === y) {
        board.activePiece = { x: -1, y: -1 };
        pieceAt(board, x, y).active = false;
    } else {
        pieceAt(board, board.activePiece.x, board.activePiece.y).active = false;
        board.activePiece = { x: x, y: y };
        pieceAt(board, x, y).active = true;
    }
}

function inCheck(board, color) {
    for (let y = 0; y < board.N; y++) {
        for (let x = 0; x < board.N; x++) {
            if (pieceAt(board, x, y) !== 0 && pieceAt(board, x, y).color !== color) {
                // Enemy
                for (let [legalX, legalY] of legalMoves(board, x, y, false)) {
                    if (pieceAt(board, legalX, legalY) !== 0 && pieceAt(board, legalX, legalY).type === 'k' && pieceAt(board, legalX, legalY).color === color) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function inCheckmate(board, color) {
    for (let y = 0; y < board.N; y++) {
        for (let x = 0; x < board.N; x++) {
            if (pieceAt(board, x, y) !== 0 && pieceAt(board, x, y).color === color) {
                // Ally
                if (legalMoves(board, x, y).length !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

export function legalMoves(board, pieceX, pieceY, strict = true) {
    let piece = pieceAt(board, pieceX, pieceY);

    // Select movesets
    let moveset = [];
    let slidingMoveset = [];
    switch (piece.type) {
        case 'k':
            moveset = kingMoveset;
            break;
        case 'r':
            slidingMoveset = horseMoveset;
            if (piece.promoted) {
                moveset = dragonMoveset;
            }
            break;
        case 'b':
            slidingMoveset = dragonMoveset;
            if (piece.promoted) {
                moveset = horseMoveset;
            }
            break;
        case 'g':
            moveset = piece.color === 'b' ? blackGoldMoveset : whiteGoldMoveset;
            break;
        case 's':
            moveset = piece.color === 'b' ? blackSilverMoveset : whiteSilverMoveset;
            if (piece.promoted) {
                moveset = piece.color === 'b' ? blackGoldMoveset : whiteGoldMoveset;
            }
            break;
        case 'p':
            moveset = piece.color === 'b' ? blackPawnMoveset : whitePawnMoveset;
            if (piece.promoted) {
                moveset = piece.color === 'b' ? blackGoldMoveset : whiteGoldMoveset;
            }
            break;
    }

    // Accumulate pseudo-legal moves
    let moves = [];
    for (let [x, y] of moveset) {
        if (pieceX + x >= 0 && pieceX + x < board.N && pieceY + y >= 0 && pieceY + y < board.N) {
            if (pieceAt(board, pieceX + x, pieceY + y) === 0 || pieceAt(board, pieceX + x, pieceY + y).color !== piece.color) {
                moves.push([pieceX + x, pieceY + y]);
            }
        }
    }
    for (let [incX, incY] of slidingMoveset) {
        for (let x = pieceX + incX, y = pieceY + incY; x != -1 && y != -1 && x != board.N && y != board.N; x += incX, y += incY) {
            if (pieceAt(board, x, y) !== 0) {
                if (pieceAt(board, x, y).color !== piece.color) {
                    moves.push([x, y]);
                }
                break;
            }
            moves.push([x, y]);
        }
    }

    if (!strict) {
        return moves;
    }

    // Filter out non-legal moves
    let legalMoves = []
    for (let [x, y] of moves) {
        let moveBoard = JSON.parse(JSON.stringify(board));
        movePiece(moveBoard, pieceX, pieceY, x, y, true);
        if (!inCheck(moveBoard, piece.color)) {
            legalMoves.push([x, y]);
        }
    }

    return legalMoves;
}

class Board {
    constructor() {
        this.N = 5;
        this.pieces = [
            [new Piece('r', 'w'), new Piece('b', 'w'), new Piece('s', 'w'), new Piece('g', 'w'), new Piece('k', 'w')],
            [0, 0, 0, 0, new Piece('p', 'w')],
            [0, 0, 0, 0, 0],
            [new Piece('p', 'b'), 0, 0, 0, 0],
            [new Piece('k', 'b'), new Piece('g', 'b'), new Piece('s', 'b'), new Piece('b', 'b'), new Piece('r', 'b')]
        ];
        this.inHand = {
            'b': {
                'k': 0,
                'r': 0,
                'b': 0,
                'g': 0,
                's': 0,
                'p': 0
            },
            'w': {
                'k': 0,
                'r': 0,
                'b': 0,
                'g': 0,
                's': 0,
                'p': 0
            }
        };
        this.activePiece = { x: -1, y: -1 };
        this.gameOver = false;
        this.promoteWait = false;
        this.winner = '';
    }
}

let board = new Board();
export { board };