export function getName(piece) {
    switch (piece.type) {
        case 'k':
            return piece.color === 'b' ? '玉' : '王';
        case 'r':
            return piece.promoted ? '王' : '飛';
        case 'b':
            return piece.promoted ? '馬' : '角';
        case 'g':
            return '金';
        case 's':
            return piece.promoted ? '全' : '銀';
        case 'p':
            return piece.promoted ? 'と' : '歩';
    }
}

export function canPromote(piece) {
    switch (piece.type) {
        case 'k':
            return false;
        case 'r':
            return true;
        case 'b':
            return true;
        case 'g':
            return false;
        case 's':
            return true;
        case 'p':
            return true;
    }
}

export class Piece {
    constructor(type, color) {
        this.type = type;
        this.color = color;
        this.promoted = false;
        this.active = false;
    }
}