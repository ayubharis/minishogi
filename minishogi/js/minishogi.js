import { pieceAt, board, pieceSelected, movePiece, setActive, legalMoves, legalDrops, promote, dropPiece, activePiece, dropSelected, moveDropPiece } from './board.js';
import { getName, Piece } from './piece.js';

const canvas = document.getElementById('game');
const body = document.getElementById('body');

let canvasWidth = 1280, canvasHeight = 640;

canvas.style.width = `${canvasWidth}px`;
canvas.style.height = `${canvasHeight}px`;

canvasWidth *= window.devicePixelRatio;
canvasHeight *= window.devicePixelRatio;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

const ctx = canvas.getContext('2d');
const boardSize = canvasHeight * 3 / 4;
const boardX = (canvasWidth - boardSize) / 2, boardY = (canvasHeight - boardSize) / 2;
const boardMargin = boardSize / 18;
const boardSpacing = (boardSize - boardMargin * 2) / board.N;
const lineWidth = boardSize / 180;
const inHandX = boardX + boardSize, inHandY = boardY;
let pieceSize = boardSpacing * 3 / 4;

let boardImg = new Image();
boardImg.src = '/img/board.jpg';
boardImg.onload = render;

let pieceImg = new Image();
pieceImg.src = '/img/piece.jpg';
pieceImg.onload = render;

let font = new FontFace('Shogi', 'url(/font/hkgyoprokk.ttf)');
font.load().then(render);

let cursiveFont = new FontFace('Shogi Cursive', 'url(/font/hksoukk.ttf)');
cursiveFont.load().then(render);

let dismissed = false;

function render() {
    // background
    ctx.fillStyle = '#FFFFFF';
    body.style.backgroundColor = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // board
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = lineWidth;
    ctx.shadowOffsetY = lineWidth;
    ctx.drawImage(boardImg, boardX, boardY, boardSize, boardSize);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = lineWidth;
    for (let r = 0; r <= board.N; r++) {
        // horizontal
        ctx.beginPath();
        ctx.moveTo(boardX + boardMargin - lineWidth / 2, boardY + boardMargin + r * boardSpacing);
        ctx.lineTo(boardX + boardSize - boardMargin + lineWidth / 2, boardY + boardMargin + r * boardSpacing);
        ctx.stroke();
    }
    for (let c = 0; c <= board.N; c++) {
        // vertical
        ctx.beginPath();
        ctx.moveTo(boardX + boardMargin + c * boardSpacing, boardY + boardMargin - lineWidth / 2);
        ctx.lineTo(boardX + boardMargin + c * boardSpacing, boardY + boardSize - boardMargin + lineWidth / 2);
        ctx.stroke();
    }

    // in hand
    for (let color of ['b', 'w']) {
        for (let y = 0; y < board.pieceNames.length; y++) {
            let pieceInHand = new Piece(board.pieceNames[y], color);
            for (let x = 0; x < board.inHand[color][board.pieceNames[y]]; x++) {
                if (color === 'w') {
                    ctx.translate(canvasWidth / 2, canvasHeight / 2);
                    ctx.rotate(Math.PI);
                    ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
                }

                let originX = inHandX + boardMargin + x * boardSpacing + boardSpacing / 2;
                let originY = inHandY + boardMargin + y * boardSpacing + boardSpacing / 2;

                ctx.translate(originX, originY);

                if (x + board.N === board.activePiece.x &&
                    ((color === 'b' && y === board.activePiece.y) ||
                        (color === 'w' && y + board.pieceNames.length === board.activePiece.y))) {
                    pieceSize = boardSpacing * 7 / 8;
                }

                // Piece shadow
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.moveTo(-pieceSize / 2, pieceSize / 2);
                ctx.lineTo(pieceSize / 2, pieceSize / 2);
                ctx.lineTo(pieceSize * 5 / 12, -pieceSize / 3);
                ctx.lineTo(0, -pieceSize / 2);
                ctx.lineTo(-pieceSize * 5 / 12, -pieceSize / 3);
                ctx.closePath();
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = lineWidth;
                ctx.shadowOffsetY = lineWidth;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Piece
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(-pieceSize / 2, pieceSize / 2);
                ctx.lineTo(pieceSize / 2, pieceSize / 2);
                ctx.lineTo(pieceSize * 5 / 12, -pieceSize / 3);
                ctx.lineTo(0, -pieceSize / 2);
                ctx.lineTo(-pieceSize * 5 / 12, -pieceSize / 3);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(pieceImg, -pieceSize / 2, -pieceSize / 2, pieceSize, pieceSize);
                ctx.restore();

                // Label
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `${pieceSize * 5 / 8}px 'Shogi'`;
                ctx.fillStyle = '#000000';
                ctx.fillText(getName(pieceInHand), 0, pieceSize / 12);

                if (x + board.N === board.activePiece.x &&
                    ((color === 'b' && y === board.activePiece.y) ||
                        (color === 'w' && y + board.pieceNames.length === board.activePiece.y))) {
                    pieceSize = boardSpacing * 3 / 4;
                }

                ctx.translate(-originX, -originY);

                if (color === 'w') {
                    ctx.translate(canvasWidth / 2, canvasHeight / 2);
                    ctx.rotate(-Math.PI);
                    ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
                }
            }
        }
    }

    for (let y = 0; y < board.N; y++) {
        for (let x = 0; x < board.N; x++) {
            if (board.promoteWait && board.activePiece.x === x && board.activePiece.y === y) {
                continue;
            }

            if (pieceAt(board, x, y) === 0) {
                continue;
            }

            let originX = boardX + boardMargin + x * boardSpacing + boardSpacing / 2;
            let originY = boardY + boardMargin + y * boardSpacing + boardSpacing / 2;

            ctx.translate(originX, originY);

            if (pieceAt(board, x, y).color === 'w') {
                ctx.rotate(Math.PI);
            }

            if (pieceAt(board, x, y).active) {
                pieceSize = boardSpacing * 7 / 8;
            }

            // Piece shadow
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(-pieceSize / 2, pieceSize / 2);
            ctx.lineTo(pieceSize / 2, pieceSize / 2);
            ctx.lineTo(pieceSize * 5 / 12, -pieceSize / 3);
            ctx.lineTo(0, -pieceSize / 2);
            ctx.lineTo(-pieceSize * 5 / 12, -pieceSize / 3);
            ctx.closePath();
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = lineWidth;
            ctx.shadowOffsetY = lineWidth;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Piece
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(-pieceSize / 2, pieceSize / 2);
            ctx.lineTo(pieceSize / 2, pieceSize / 2);
            ctx.lineTo(pieceSize * 5 / 12, -pieceSize / 3);
            ctx.lineTo(0, -pieceSize / 2);
            ctx.lineTo(-pieceSize * 5 / 12, -pieceSize / 3);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(pieceImg, -pieceSize / 2, -pieceSize / 2, pieceSize, pieceSize);
            ctx.restore();

            // Label
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (pieceAt(board, x, y).promoted) {
                ctx.font = `${pieceSize * 5 / 8}px 'Shogi Cursive'`;
                ctx.fillStyle = '#FF0000';
            } else {
                ctx.font = `${pieceSize * 5 / 8}px 'Shogi'`;
                ctx.fillStyle = '#000000';
            }
            ctx.fillText(getName(pieceAt(board, x, y)), 0, pieceSize / 12);

            if (pieceAt(board, x, y).active) {
                pieceSize = boardSpacing * 3 / 4;
            }

            if (pieceAt(board, x, y).color === 'w') {
                ctx.rotate(-Math.PI);
            }

            ctx.translate(-originX, -originY);
        }
    }

    if (board.promoteWait) {
        let promotePiece = activePiece(board);

        ctx.globalAlpha = 0.5;

        ctx.fillStyle = '#000000';
        body.style.backgroundColor = '#808080';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.globalAlpha = 1.0;

        let originX = boardX + boardMargin + board.activePiece.x * boardSpacing + boardSpacing / 2;
        let originY = boardY + boardMargin + board.activePiece.y * boardSpacing + boardSpacing / 2;

        ctx.translate(originX, originY);

        if (promotePiece.color === 'w') {
            ctx.rotate(Math.PI);
        }

        // Piece shadow
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = lineWidth;
        ctx.shadowOffsetY = lineWidth;
        ctx.beginPath();
        ctx.moveTo(-pieceSize / 2, pieceSize / 2);
        ctx.lineTo(pieceSize / 2, pieceSize / 2);
        ctx.lineTo(pieceSize * 5 / 12, -pieceSize / 3);
        ctx.lineTo(0, -pieceSize / 2);
        ctx.lineTo(-pieceSize * 5 / 12, -pieceSize / 3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Piece
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-pieceSize / 2, pieceSize / 2);
        ctx.lineTo(pieceSize / 2, pieceSize / 2);
        ctx.lineTo(pieceSize * 5 / 12, -pieceSize / 3);
        ctx.lineTo(0, -pieceSize / 2);
        ctx.lineTo(-pieceSize * 5 / 12, -pieceSize / 3);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(pieceImg, -pieceSize / 2, -pieceSize / 2, pieceSize, pieceSize);
        ctx.restore();

        // Label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${pieceSize * 5 / 8}px 'Shogi'`;
        ctx.fillStyle = '#000000';
        ctx.fillText(getName(promotePiece), 0, pieceSize / 12);

        promotePiece.promoted = true;
        ctx.translate(0, -boardSpacing);

        // Promoted piece shadow
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = lineWidth;
        ctx.shadowOffsetY = lineWidth;
        ctx.beginPath();
        ctx.moveTo(-pieceSize / 2, pieceSize / 2);
        ctx.lineTo(pieceSize / 2, pieceSize / 2);
        ctx.lineTo(pieceSize * 5 / 12, -pieceSize / 3);
        ctx.lineTo(0, -pieceSize / 2);
        ctx.lineTo(-pieceSize * 5 / 12, -pieceSize / 3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Promoted piece
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-pieceSize / 2, pieceSize / 2);
        ctx.lineTo(pieceSize / 2, pieceSize / 2);
        ctx.lineTo(pieceSize * 5 / 12, -pieceSize / 3);
        ctx.lineTo(0, -pieceSize / 2);
        ctx.lineTo(-pieceSize * 5 / 12, -pieceSize / 3);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(pieceImg, -pieceSize / 2, -pieceSize / 2, pieceSize, pieceSize);
        ctx.restore();

        // Promoted label
        ctx.font = `${pieceSize * 5 / 8}px 'Shogi Cursive'`;
        ctx.fillStyle = '#FF0000';
        ctx.fillText(getName(promotePiece), 0, pieceSize / 12);

        ctx.translate(0, boardSpacing);
        promotePiece.promoted = false;

        if (promotePiece.color === 'w') {
            ctx.rotate(-Math.PI);
        }

        ctx.translate(-originX, -originY);
    }

    // Legal moves
    if (dropSelected(board)) {
        for (let [legalX, legalY] of legalDrops(board, dropPiece(board))) {
            let originX = boardX + boardMargin + legalX * boardSpacing + boardSpacing / 2;
            let originY = boardY + boardMargin + legalY * boardSpacing + boardSpacing / 2;

            ctx.translate(originX, originY);

            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, boardSpacing / 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            ctx.translate(-originX, -originY);
        }
    } else if (pieceSelected(board) && !board.promoteWait) {
        for (let [legalX, legalY] of legalMoves(board, board.activePiece.x, board.activePiece.y)) {
            let originX = boardX + boardMargin + legalX * boardSpacing + boardSpacing / 2;
            let originY = boardY + boardMargin + legalY * boardSpacing + boardSpacing / 2;

            ctx.translate(originX, originY);

            ctx.globalAlpha = 0.5;
            if (pieceAt(board, legalX, legalY) != 0) {
                ctx.fillStyle = '#000000';
                ctx.fillRect(-boardSpacing / 2, -boardSpacing / 2, boardSpacing, boardSpacing);
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(0, 0, boardSpacing / 8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            ctx.translate(-originX, -originY);
        }
    }

    if (board.gameOver && !dismissed) {
        ctx.globalAlpha = 0.5;

        ctx.fillStyle = '#000000';
        body.style.backgroundColor = '#808080';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.globalAlpha = 1.0;

        let originX = canvasWidth / 2;
        let originY = canvasHeight / 2;

        ctx.translate(originX, originY);

        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = lineWidth;
        ctx.shadowOffsetY = lineWidth;
        ctx.drawImage(pieceImg, -boardSize * 3 / 8, -boardSize / 4, boardSize * 3 / 4, boardSize / 2);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${boardSize / 4}px 'Shogi'`;
        ctx.fillText('つみ', 0, 0);

        ctx.translate(-originX, -originY);
    }
}

function updateCursor(event) {
    if (dismissed) {
        canvas.style.cursor = 'default';
        return;
    }
    let canvasX = (event.pageX - canvas.offsetLeft - canvas.clientLeft) * window.devicePixelRatio;
    let canvasY = (event.pageY - canvas.offsetTop - canvas.clientTop) * window.devicePixelRatio;
    let pieceX = Math.floor((canvasX - boardX - boardMargin) / boardSpacing);
    let pieceY = Math.floor((canvasY - boardY - boardMargin) / boardSpacing);
    let x = (canvasX - boardX - boardMargin + boardSpacing) % boardSpacing - boardSpacing / 2;
    let y = (canvasY - boardY - boardMargin + boardSpacing) % boardSpacing - boardSpacing / 2;
    let color = 'b';
    if (canvasX < canvasWidth / 2) {
        canvasX = canvasWidth - canvasX;
        canvasY = canvasHeight - canvasY;
        color = 'w';
    }
    let dropInPieceX = Math.floor((canvasX - inHandX - boardMargin) / boardSpacing);
    let dropInPieceY = Math.floor((canvasY - inHandY - boardMargin) / boardSpacing);
    let dropInX = ((canvasX - inHandX - boardMargin) % boardSpacing + boardSpacing) % boardSpacing - boardSpacing / 2;
    let dropInY = ((canvasY - inHandY - boardMargin) % boardSpacing + boardSpacing) % boardSpacing - boardSpacing / 2;
    if (board.gameOver) {
        if (canvasX >= boardX + boardSize / 8 && canvasX < boardX + boardSize * 7 / 8 &&
            canvasY >= boardY + boardSize / 4 && canvasY < boardY + boardSize * 3 / 4) {
            canvas.style.cursor = 'pointer';
            return;
        }
    } else if (dropInPieceX >= 0 && dropInPieceY >= 0 && dropInPieceY < board.pieceNames.length &&
        dropInX >= -pieceSize / 2 && dropInX < pieceSize / 2 && dropInY >= -pieceSize / 2 && dropInY < pieceSize / 2) {
        if (dropInPieceX < board.inHand[color][board.pieceNames[dropInPieceY]]) {
            canvas.style.cursor = 'pointer';
            return;
        }
    } else if (x >= -pieceSize / 2 && x < pieceSize / 2 && y >= -pieceSize / 2 && y < pieceSize / 2) {
        if (board.promoteWait) {
            let direction = activePiece(board).color === 'b' ? -1 : 1;
            if (board.activePiece.x === pieceX && (board.activePiece.y === pieceY || board.activePiece.y + direction === pieceY)) {
                canvas.style.cursor = 'pointer';
                return;
            }
        } else if (pieceX >= 0 && pieceX < board.N && pieceY >= 0 && pieceY < board.N) {
            if (pieceAt(board, pieceX, pieceY) !== 0
            || (dropSelected(board) && legalDrops(board, dropPiece(board)).some((move) => move[0] === pieceX && move[1] === pieceY))
            || (pieceSelected(board) && legalMoves(board, board.activePiece.x, board.activePiece.y).some((move) => move[0] === pieceX && move[1] === pieceY))) {
                canvas.style.cursor = 'pointer';
                return;
            }
        }
    }
    canvas.style.cursor = 'default';
}

function handleClick(event) {
    if (dismissed) {
        return;
    }
    let canvasX = (event.pageX - canvas.offsetLeft - canvas.clientLeft) * window.devicePixelRatio;
    let canvasY = (event.pageY - canvas.offsetTop - canvas.clientTop) * window.devicePixelRatio;
    let pieceX = Math.floor((canvasX - boardX - boardMargin) / boardSpacing);
    let pieceY = Math.floor((canvasY - boardY - boardMargin) / boardSpacing);
    let x = ((canvasX - boardX - boardMargin) % boardSpacing + boardSpacing) % boardSpacing - boardSpacing / 2;
    let y = ((canvasY - boardY - boardMargin) % boardSpacing + boardSpacing) % boardSpacing - boardSpacing / 2;
    let color = 'b';
    if (canvasX < canvasWidth / 2) {
        canvasX = canvasWidth - canvasX;
        canvasY = canvasHeight - canvasY;
        color = 'w';
    }
    let dropInPieceX = Math.floor((canvasX - inHandX - boardMargin) / boardSpacing);
    let dropInPieceY = Math.floor((canvasY - inHandY - boardMargin) / boardSpacing);
    let dropInX = ((canvasX - inHandX - boardMargin) % boardSpacing + boardSpacing) % boardSpacing - boardSpacing / 2;
    let dropInY = ((canvasY - inHandY - boardMargin) % boardSpacing + boardSpacing) % boardSpacing - boardSpacing / 2;
    if (board.gameOver) {
        if (canvasX >= boardX + boardSize / 8 && canvasX < boardX + boardSize * 7 / 8 &&
            canvasY >= boardY + boardSize / 4 && canvasY < boardY + boardSize * 3 / 4) {
            dismissed = true;
            render();
            updateCursor(event);
            return;
        }
    } else if (dropInPieceX >= 0 && dropInPieceY >= 0 && dropInPieceY < board.pieceNames.length &&
        dropInX >= -pieceSize / 2 && dropInX < pieceSize / 2 && dropInY >= -pieceSize / 2 && dropInY < pieceSize / 2) {
        if (dropInPieceX < board.inHand[color][board.pieceNames[dropInPieceY]]) {
            // Set drop piece active (render legal drops)
            if (color === 'b') {
                setActive(board, dropInPieceX + board.N, dropInPieceY);
            } else {
                setActive(board, dropInPieceX + board.N, dropInPieceY + board.pieceNames.length);
            }
            render();
            return;
        }
    } else if (x >= -pieceSize / 2 && x < pieceSize / 2 && y >= -pieceSize / 2 && y < pieceSize / 2) {
        if (board.promoteWait) {
            let direction = activePiece(board).color === 'b' ? -1 : 1;
            if (board.activePiece.x === pieceX) {
                if (board.activePiece.y === pieceY) {
                    promote(board, false, false);
                    render();
                    updateCursor(event);
                    return;
                } else if (board.activePiece.y + direction === pieceY) {
                    promote(board, false);
                    render();
                    updateCursor(event);
                    return;
                }
            }
        } else if (pieceX >= 0 && pieceX < board.N && pieceY >= 0 && pieceY < board.N) {
            if (dropSelected(board) && legalDrops(board, dropPiece(board)).some((move) => move[0] === pieceX && move[1] === pieceY)) {
                let drop = dropPiece(board);
                setActive(board, board.activePiece.x, board.activePiece.y);
                moveDropPiece(board, drop, pieceX, pieceY);
                render();
                updateCursor(event);
                return;
            }
            if (pieceSelected(board) && legalMoves(board, board.activePiece.x, board.activePiece.y).some((move) => move[0] === pieceX && move[1] === pieceY)) {
                let startX = board.activePiece.x, startY = board.activePiece.y;
                setActive(board, startX, startY);
                movePiece(board, startX, startY, pieceX, pieceY);
                render();
                updateCursor(event);
                return;
            }
            if (pieceAt(board, pieceX, pieceY) !== 0) {
                setActive(board, pieceX, pieceY);
                render();
                updateCursor(event);
                return;
            }
        }
    }
}

canvas.onmousemove = updateCursor;

canvas.onclick = handleClick;