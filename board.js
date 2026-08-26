class Board {
    constructor() {
        this.boardArr = new Array(64).fill(0);
        this.init();
        this.pieceMap = {
            'wP': 'P', 'wR': 'R', 'wN': 'N', 'wB': 'B', 'wQ': 'Q', 'wK': 'K',
            'bP': 'p', 'bR': 'r', 'bN': 'n', 'bB': 'b', 'bQ': 'q', 'bK': 'k'
        };
    }

    init() {
        this.boardArr[0] = 'bR'; this.boardArr[1] = 'bN'; this.boardArr[2] = 'bB'; this.boardArr[3] = 'bQ';
        this.boardArr[4] = 'bK'; this.boardArr[5] = 'bB'; this.boardArr[6] = 'bN'; this.boardArr[7] = 'bR';
        for (let i = 8; i < 16; i++) this.boardArr[i] = 'bP';
        for (let i = 48; i < 56; i++) this.boardArr[i] = 'wP';
        this.boardArr[56] = 'wR'; this.boardArr[57] = 'wN'; this.boardArr[58] = 'wB'; this.boardArr[59] = 'wQ';
        this.boardArr[60] = 'wK'; this.boardArr[61] = 'wB'; this.boardArr[62] = 'wN'; this.boardArr[63] = 'wR';
    }

    convertBoardToFEN() {
        let fenString = '';
        for (let i = 0; i < 64; i += 8) {
            let emptyCount = 0;
            for (let j = 0; j < 8; j++) {
                const piece = this.boardArr[i + j];
                if (piece === 0) emptyCount++;
                else {
                    if (emptyCount > 0) { fenString += emptyCount; emptyCount = 0; }
                    fenString += this.pieceMap[piece];
                }
            }
            if (emptyCount > 0) fenString += emptyCount;
            if (i < 56) fenString += '/';
        }

        const activeColor = whiteTurn ? 'w' : 'b';
        const bCastleK = isBlackRightCastleLegal ? 'k' : '';
        const bCastleQ = isBlackLeftCastleLegal ? 'q' : '';
        const wCastleK = isWhiteRightCastleLegal ? 'K' : '';
        const wCastleQ = isWhiteLeftCastleLegal ? 'Q' : '';
        const castlingRights = `${wCastleK}${wCastleQ}${bCastleK}${bCastleQ}` || '-';

        return `${fenString} ${activeColor} ${castlingRights} - ${halfMoveCount} ${fullMoveCount}`;
    }

    applyMove(move) {
        if (!move || move.length < 4) return false;

        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        const promotion = move.length >= 5 ? move[4].toLowerCase() : null;
        const fromIndex = this.algebraicToIndex(from);
        const toIndex = this.algebraicToIndex(to);
        const piece = this.boardArr[fromIndex];
        const capturedPiece = this.boardArr[toIndex];

        if (!piece || !piece.startsWith('b')) return false;

        this.boardArr[fromIndex] = 0;
        this.boardArr[toIndex] = piece;

        if (promotion && piece === 'bP') {
            const promotionMap = { q: 'bQ', r: 'bR', b: 'bB', n: 'bN' };
            if (promotionMap[promotion]) this.boardArr[toIndex] = promotionMap[promotion];
        }

        if (piece === 'bP') pawnsThatHaveMovedPastOnce.push(toIndex);

        checkWhiteRightCastleLegality(fromIndex, piece);
        checkWhiteLeftCastleLegality(fromIndex, piece);
        checkBlackRightCastleLegality(fromIndex, piece);
        checkBlackLeftCastleLegality(fromIndex, piece);

        if (piece[1] === 'P' || capturedPiece !== 0) halfMoveCount = 0;
        else halfMoveCount++;

        if (!whiteTurn) fullMoveCount++;
        whiteTurn = true;

        findWhiteDangerSqrs();
        findBlackDangerSqrs();

        const whiteKingIndex = this.boardArr.indexOf('wK');
        isCheck = whiteKingIndex !== -1 && blackDangerSqrs.includes(whiteKingIndex);

        if (isCheck) audio.playAudio(audio.sound.check);
        else if (capturedPiece !== 0) audio.playAudio(audio.sound.capture);
        else audio.playAudio(audio.sound.move);

        return true;
    }

    algebraicToIndex(algebraic) {
        const file = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = 8 - parseInt(algebraic[1], 10);
        return rank * 8 + file;
    }
}

board = new Board();
