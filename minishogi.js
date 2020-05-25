import { pieceAt, board, activePiece, movePiece, setActive, legalMoves, checkCheckmate } from './board.js';
import { getName } from './piece.js';

const canvas = document.getElementById('game');

canvas.width = 640 * window.devicePixelRatio;
canvas.height = 480 * window.devicePixelRatio;

canvas.style.width = "640px";
canvas.style.height = '480px';

const ctx = canvas.getContext('2d');

const canvasWidth = canvas.width, canvasHeight = canvas.height;
const boardSize = canvasHeight * 3 / 4;
const boardX = (canvasWidth - boardSize) / 2, boardY = (canvasHeight - boardSize) / 2;
const boardMargin = boardSize / 18;
const boardSpacing = (boardSize - boardMargin * 2) / board.N;
const lineWidth = boardSize / 180;
let pieceSize = boardSpacing * 3 / 4;

let boardImg = new Image();
boardImg.src = 'board.jpg';
boardImg.onload = render;

let pieceImg = new Image();
pieceImg.src = 'piece.jpg';
pieceImg.onload = render;

let font = new FontFace('Shogi', 'url(fonts/hkgyoprokk.ttf)');
font.load().then(render);

let cursiveFont = new FontFace('Shogi Cursive', 'url(fonts/hksoukk.ttf)');
cursiveFont.load().then(render);

function render() {
    console.log("rendering")

    ctx.fillStyle = '#E6E6EA';
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

    for (let y = 0; y < board.N; y++) {
        for (let x = 0; x < board.N; x++) {
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
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(-pieceSize / 2, pieceSize / 2);
            ctx.lineTo(pieceSize / 2, pieceSize / 2);
            ctx.lineTo(pieceSize * 5 / 12, -pieceSize / 3);
            ctx.lineTo(0, -pieceSize / 2);
            ctx.lineTo(-pieceSize * 5 / 12, -pieceSize / 3);
            ctx.closePath();
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = lineWidth;
            ctx.shadowOffsetY = lineWidth;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Piece
            ctx.save();
            ctx.fillStyle = '#F5F5DC';
            ctx.lineJoin = 'round';
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

    // Legal moves
    if (activePiece(board)) {
        for (let [legalX, legalY] of legalMoves(board, board.activePiece.x, board.activePiece.y)) {
            let originX = boardX + boardMargin + legalX * boardSpacing + boardSpacing / 2;
            let originY = boardY + boardMargin + legalY * boardSpacing + boardSpacing / 2;

            ctx.translate(originX, originY);

            ctx.globalAlpha = 0.5;
            if (pieceAt(board, legalX, legalY) != 0) {
                ctx.fillStyle = '#800000';
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

    if (board.gameOver) {
        ctx.globalAlpha = 0.75;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.globalAlpha = 1.0;

        let originX = canvasWidth / 2;
        let originY = canvasHeight / 2;

        ctx.translate(originX, originY);

        ctx.shadowColor = 'gray';
        ctx.shadowBlur = 20;

        ctx.drawImage(pieceImg, -boardSize * 3 / 8, -boardSize / 4, boardSize * 3 / 4, boardSize / 2);

        ctx.shadowBlur = 0;

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${boardSize / 4}px 'Shogi'`;
        ctx.fillText('つみ', 0, 0);

        ctx.translate(-originX, -originY);
    }
}

canvas.onmousemove = (event) => {
    let canvasX = (event.pageX - canvas.offsetLeft - canvas.clientLeft) * window.devicePixelRatio;
    let canvasY = (event.pageY - canvas.offsetTop - canvas.clientTop) * window.devicePixelRatio;
    let pieceX = Math.floor((canvasX - boardX - boardMargin) / boardSpacing);
    let pieceY = Math.floor((canvasY - boardY - boardMargin) / boardSpacing);
    let x = (canvasX - boardX - boardMargin) % boardSpacing - boardSpacing / 2;
    let y = (canvasY - boardY - boardMargin) % boardSpacing - boardSpacing / 2;
    if (pieceX >= 0 && pieceX < board.N && pieceY >= 0 && pieceY < board.N) {
        if (x >= -pieceSize / 2 && x < pieceSize / 2 && y >= -pieceSize / 2 && y < pieceSize / 2) {
            if (!board.gameOver) {
                if (pieceAt(board, pieceX, pieceY) !== 0 || (activePiece(board) && legalMoves(board, board.activePiece.x, board.activePiece.y).some((move) => move[0] === pieceX && move[1] === pieceY))) {
                    canvas.style.cursor = 'pointer';
                    return;
                }
            }
        }
    }
    canvas.style.cursor = 'default';
}

canvas.onclick = (event) => {
    let canvasX = (event.pageX - canvas.offsetLeft - canvas.clientLeft) * window.devicePixelRatio;
    let canvasY = (event.pageY - canvas.offsetTop - canvas.clientTop) * window.devicePixelRatio;
    let pieceX = Math.floor((canvasX - boardX - boardMargin) / boardSpacing);
    let pieceY = Math.floor((canvasY - boardY - boardMargin) / boardSpacing);
    let x = (canvasX - boardX - boardMargin) % boardSpacing - boardSpacing / 2;
    let y = (canvasY - boardY - boardMargin) % boardSpacing - boardSpacing / 2;
    if (pieceX >= 0 && pieceX < board.N && pieceY >= 0 && pieceY < board.N) {
        if (x >= -pieceSize / 2 && x < pieceSize / 2 && y >= -pieceSize / 2 && y < pieceSize / 2) {
            if (!board.gameOver) {
                if (activePiece(board) && legalMoves(board, board.activePiece.x, board.activePiece.y).some((move) => move[0] === pieceX && move[1] === pieceY)) {
                    let startX = board.activePiece.x, startY = board.activePiece.y;
                    setActive(board, board.activePiece.x, board.activePiece.y);
                    movePiece(board, startX, startY, pieceX, pieceY);
                    checkCheckmate(board);
                    render();
                    return;
                }
                if (pieceAt(board, pieceX, pieceY) !== 0) {
                    setActive(board, pieceX, pieceY);
                    render();
                    return;
                }
            }
        }
    }
}