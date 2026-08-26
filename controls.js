const stockfishAi = new StockfishAi();

let possibleSqres = [];
let selectedPieceIndex = null;
let selectedPieceType = null;

sprite.onload = () => {
    board.init();
    update();
    drawBoard();

    function getClickedSquare(e) {
        const rect = cvs.getBoundingClientRect();
        const point = e.changedTouches?.[0] || e.touches?.[0] || e;
        const x = point.clientX - rect.left;
        const y = point.clientY - rect.top;
        return getBoardIndex(x, y);
    }

    function clearSelection() {
        selectedPieceIndex = null;
        selectedPieceType = null;
        possibleSqres = [];
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        update();
    }

    function selectPiece(index) {
        const piece = board.boardArr[index];
        if (piece === 0) return false;

        const isOwnPiece = whiteTurn
            ? piece.startsWith('w')
            : piece.startsWith('b');

        if (!isOwnPiece) return false;

        selectedPieceIndex = index;
        selectedPieceType = piece;
        possibleSqres = getPossibleMoves(piece, index);

        ctx.clearRect(0, 0, cvs.width, cvs.height);
        update();
        highlight(possibleSqres);
        return true;
    }

    function moveSelectedPiece(destinationIndex) {
        if (selectedPieceIndex === null || selectedPieceType === null) return;

        const fromIndex = selectedPieceIndex;
        const piece = selectedPieceType;

        if (!possibleSqres.includes(destinationIndex)) {
            // Clicking another own piece changes the selection.
            if (selectPiece(destinationIndex)) return;
            return;
        }

        let castleMoveMade = false;

        whiteDangerSqrs = [];
        blackDangerSqrs = [];

        if (canWhiteCastleRightSide(fromIndex, piece, destinationIndex)) {
            isCastle = true;
            whiteRightSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = true;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        } else if (canWhiteCastleLeftSide(fromIndex, piece, destinationIndex)) {
            isCastle = true;
            whiteLeftSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = true;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        } else if (canBlackCastleRightSide(fromIndex, piece, destinationIndex)) {
            isCastle = true;
            blackRightSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = false;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        } else if (canBlackCastleLeftSide(fromIndex, piece, destinationIndex)) {
            isCastle = true;
            blackLeftSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = false;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }

        if (!castleMoveMade) {
            const capturedPiece = board.boardArr[destinationIndex] || 0;
            const isCapture = capturedPiece !== 0;

            board.boardArr[destinationIndex] = piece;
            board.boardArr[fromIndex] = 0;

            whiteTurn = !whiteTurn;
            halfMoveCount++;
            fullMoveCount = roundToWhole(halfMoveCount / 2);
            playStockFishMove = !whiteTurn;

            if (piece[1] === 'P') {
                pawnsThatHaveMovedPastOnce.push(destinationIndex);
            }

            checkWhiteRightCastleLegality(fromIndex, piece);
            checkWhiteLeftCastleLegality(fromIndex, piece);
            checkBlackRightCastleLegality(fromIndex, piece);
            checkBlackLeftCastleLegality(fromIndex, piece);

            findWhiteDangerSqrs();
            findBlackDangerSqrs();

            if (!whiteTurn) {
                isCheck = getPossibleMoves(piece, destinationIndex)
                    .includes(board.boardArr.indexOf('bK'));

                if (whiteDangerSqrs.includes(board.boardArr.indexOf('wK'))) {
                    board.boardArr[fromIndex] = piece;
                    board.boardArr[destinationIndex] = capturedPiece;
                    whiteTurn = !whiteTurn;
                    halfMoveCount--;
                    fullMoveCount = roundToWhole(halfMoveCount / 2);
                    playStockFishMove = false;
                    isCheck = false;
                }
            } else if (blackDangerSqrs.includes(board.boardArr.indexOf('bK'))) {
                board.boardArr[fromIndex] = piece;
                board.boardArr[destinationIndex] = capturedPiece;
                whiteTurn = !whiteTurn;
                halfMoveCount--;
                fullMoveCount = roundToWhole(halfMoveCount / 2);
                playStockFishMove = false;
                isCheck = false;
            }

            if (isCheck) {
                audio.playAudio(audio.sound.check);
            } else if (isCapture) {
                audio.playAudio(audio.sound.capture);
            } else {
                audio.playAudio(audio.sound.move);
            }
        }

        clearSelection();
    }

    function handleClick(e) {
        e.preventDefault();
        const boardIndex = getClickedSquare(e);
        if (boardIndex < 0 || boardIndex >= board.boardArr.length) return;

        // No piece selected: select one.
        if (selectedPieceIndex === null) {
            selectPiece(boardIndex);
            return;
        }

        // Same piece: deselect it.
        if (boardIndex === selectedPieceIndex) {
            clearSelection();
            return;
        }

        // A piece is selected: click a destination square.
        moveSelectedPiece(boardIndex);
    }

    cvs.addEventListener('click', handleClick);
    cvs.addEventListener('touchend', handleClick, { passive: false });
};
