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
        const point = e.touches?.[0] || e.changedTouches?.[0] || e;
        const x = point.clientX - rect.left;
        const y = point.clientY - rect.top;
        return getBoardIndex(x, y);
    }

    function drawSelection() {
        if (selectedPieceIndex === null) return;

        const row = Math.floor(selectedPieceIndex / 8);
        const col = selectedPieceIndex % 8;
        const squareSize = cvs.width / 8;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.95)';
        ctx.lineWidth = 5;
        ctx.strokeRect(
            col * squareSize + 2.5,
            row * squareSize + 2.5,
            squareSize - 5,
            squareSize - 5
        );
        ctx.restore();
    }

    function redrawSelection() {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        update();

        if (possibleSqres.length > 0) {
            highlight(possibleSqres);
        }

        drawSelection();
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

        redrawSelection();
        return true;
    }

    function moveSelectedPiece(destinationIndex) {
        if (selectedPieceIndex === null || selectedPieceType === null) return;

        const fromIndex = selectedPieceIndex;
        const piece = selectedPieceType;

        // Clicking another own piece changes the selection.
        if (!possibleSqres.includes(destinationIndex)) {
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

        if (selectedPieceIndex === null) {
            selectPiece(boardIndex);
            return;
        }

        if (boardIndex === selectedPieceIndex) {
            clearSelection();
            return;
        }

        moveSelectedPiece(boardIndex);
    }

    // One click handler works for both mouse and touch.
    // Do NOT also listen to touchend: mobile browsers fire a click after touchend,
    // which previously selected and immediately deselected the piece.
    cvs.addEventListener('click', handleClick);
};
