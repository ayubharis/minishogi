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

export function pieceSelected(board) {
    return board.activePiece.x >= 0 && board.activePiece.x < board.N && board.activePiece.y >= 0 && board.activePiece.y < board.N;
}

export function dropSelected(board) {
    return board.activePiece.x >= board.N;
}

export function dropPiece(board) {
    return new Piece(board.pieceNames[board.activePiece.y % board.pieceNames.length], board.activePiece.y >= board.pieceNames.length ? 'w' : 'b');
}

export function activePiece(board) {
    return pieceAt(board, board.activePiece.x, board.activePiece.y);
}

export function promote(board, prompt = true, promoted = true) {
    let piece = activePiece(board);
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

export function moveDropPiece(board, piece, x, y) {
    board.inHand[piece.color][piece.type]--;
    setPiece(board, x, y, piece);
    checkCheckmate(board);
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
    if (!pieceSelected(board) && !dropSelected(board)) {
        board.activePiece = { x: x, y: y };
        if (x < board.N) {
            pieceAt(board, x, y).active = true;
        }
    } else if (board.activePiece.x === x && board.activePiece.y === y) {
        board.activePiece = { x: -1, y: -1 };
        if (x < board.N) {
            pieceAt(board, x, y).active = false;
        }
    } else {
        if (board.activePiece.x < board.N) {
            activePiece(board).active = false;
        }
        board.activePiece = { x: x, y: y };
        if (x < board.N) {
            pieceAt(board, x, y).active = true;
        }
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

export function legalDrops(board, piece) {
    let drops = [];

    for (let x = 0; x < board.N; x++) {
        if (piece.type === 'p') {
            let pawnFound = false;
            for (let y = 0; y < board.N; y++) {
                if (pieceAt(board, x, y).type === 'p') {
                    pawnFound = true;
                }
            }
            if (pawnFound) {
                continue;
            }
        }
        for (let y = 0; y < board.N; y++) {
            if (pieceAt(board, x, y) !== 0) {
                continue;
            }
            if (piece.type === 'p') {
                if (piece.color === 'b' && y === 0) {
                    continue;
                }
                if (piece.color === 'w' && y === 4) {
                    continue;
                }
                let dropBoard = JSON.parse(JSON.stringify(board));
                moveDropPiece(dropBoard, piece, x, y, true);
                if (dropBoard.gameOver) {
                    continue;
                }
            }
            drops.push([x, y]);
        }
    }

    let legalDrops = [];
    for (let [x, y] of drops) {
        let dropBoard = JSON.parse(JSON.stringify(board));
        moveDropPiece(dropBoard, piece, x, y);
        if (!inCheck(dropBoard, piece.color)) {
            legalDrops.push([x, y]);
        }
    }

    return legalDrops;
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
    let legalMoves = [];
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
        this.pieceNames = ['p', 's', 'g', 'b', 'r'];
        this.inHand = {
            'b': {
                'p': 0,
                's': 0,
                'g': 0,
                'b': 0,
                'r': 0
            },
            'w': {
                'p': 0,
                's': 0,
                'g': 0,
                'b': 0,
                'r': 0
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