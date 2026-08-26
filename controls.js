const stockfishAi = new Stockfish();

let isDrag = false;
let isDown = false;
let isUp = true;

let possibleSqres = [];
let prevSqrIndex = null;
let draggedPiece = null;
let capturedPiece = 0;

let isStoreSqr = true;

// Click-Mode variables
let selectedPieceIndex = null;
let selectedPieceType = null;
let isClickMode = false;

sprite.onload = () => {
    board.init();
    update();
    drawBoard();

    function handleDown(e) {
        isDown = true;
        isUp = false;

        const rect = cvs.getBoundingClientRect();
        const mouseX = e.touches
            ? e.touches[0].clientX - rect.left
            : e.clientX - rect.left;
        const mouseY = e.touches
            ? e.touches[0].clientY - rect.top
            : e.clientY - rect.top;

        const boardIndex = getBoardIndex(mouseX, mouseY);
        const piece = board.boardArr[boardIndex];

        // Clicked on a piece
        if (
            piece !== 0 &&
            ((whiteTurn && piece.startsWith('w')) ||
                (!whiteTurn && piece.startsWith('b')))
        ) {
            if (selectedPieceIndex === null) {
                selectedPieceIndex = boardIndex;
                selectedPieceType = piece;
                possibleSqres = getPossibleMoves(piece, boardIndex);

                ctx.clearRect(0, 0, cvs.width, cvs.height);
                update();
                highlight(possibleSqres);

                isClickMode = true;
            } else if (selectedPieceIndex === boardIndex) {
                selectedPieceIndex = null;
                selectedPieceType = null;
                possibleSqres = [];

                ctx.clearRect(0, 0, cvs.width, cvs.height);
                update();

                isClickMode = false;
            } else {
                selectedPieceIndex = boardIndex;
                selectedPieceType = piece;
                possibleSqres = getPossibleMoves(piece, boardIndex);

                ctx.clearRect(0, 0, cvs.width, cvs.height);
                update();
                highlight(possibleSqres);
            }

            return;
        }

        // A piece is already selected → click destination
        if (selectedPieceIndex !== null) {
            handleClickMove(boardIndex);
            return;
        }

        // Drag mode
        if (
            piece !== 0 &&
            ((whiteTurn && piece.startsWith('w')) ||
                (!whiteTurn && piece.startsWith('b')))
        ) {
            board.boardArr[boardIndex] = 0;

            draggedPiece = piece;
            prevSqrIndex = boardIndex;
            isStoreSqr = false;

            possibleSqres = getPossibleMoves(piece, boardIndex);

            update();
            highlight(possibleSqres);
        }
    }

    function handleMove(e) {
        const rect = cvs.getBoundingClientRect();
        const mouseX = e.touches
            ? e.touches[0].clientX - rect.left
            : e.clientX - rect.left;
        const mouseY = e.touches
            ? e.touches[0].clientY - rect.top
            : e.clientY - rect.top;

        if (isDown && draggedPiece !== null) {
            ctx.clearRect(0, 0, cvs.width, cvs.height);

            update();
            highlight(possibleSqres);

            pieces.drawPiece(
                pieces.type[draggedPiece],
                [{
                    x: mouseX - pieces.pieceScale / 2,
                    y: mouseY - pieces.pieceScale / 2
                }]
            );
        }
    }

    function handleClickMove(destinationIndex) {
        if (selectedPieceIndex === null || selectedPieceType === null) {
            return;
        }

        prevSqrIndex = selectedPieceIndex;
        draggedPiece = selectedPieceType;

        whiteDangerSqrs = [];
        blackDangerSqrs = [];

        let castleMoveMade = false;

        if (canWhiteCastleRightSide(prevSqrIndex, draggedPiece, destinationIndex)) {
            isCastle = true;
            whiteRightSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = true;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }

        if (canWhiteCastleLeftSide(prevSqrIndex, draggedPiece, destinationIndex)) {
            isCastle = true;
            whiteLeftSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = true;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }

        if (canBlackCastleRightSide(prevSqrIndex, draggedPiece, destinationIndex)) {
            isCastle = true;
            blackRightSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = false;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }

        if (canBlackCastleLeftSide(prevSqrIndex, draggedPiece, destinationIndex)) {
            isCastle = true;
            blackLeftSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = false;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }

        if (
            !castleMoveMade &&
            draggedPiece !== null &&
            possibleSqres.length > 0 &&
            possibleSqres.includes(destinationIndex)
        ) {
            const isCapture = board.boardArr[destinationIndex] !== 0;

            capturedPiece =
                board.boardArr[destinationIndex] !== 0
                    ? board.boardArr[destinationIndex]
                    : 0;

            board.boardArr[destinationIndex] = draggedPiece;
            board.boardArr[prevSqrIndex] = 0;

            whiteTurn = !whiteTurn;

            halfMoveCount++;
            fullMoveCount = roundToWhole(halfMoveCount / 2);

            playStockFishMove = !whiteTurn;

            if (board.boardArr[destinationIndex][1] === 'P') {
                pawnsThatHaveMovedPastOnce.push(destinationIndex);
            }

            checkWhiteRightCastleLegality(prevSqrIndex, draggedPiece);
            checkWhiteLeftCastleLegality(prevSqrIndex, draggedPiece);
            checkBlackRightCastleLegality(prevSqrIndex, draggedPiece);
            checkBlackLeftCastleLegality(prevSqrIndex, draggedPiece);

            findWhiteDangerSqrs();
            findBlackDangerSqrs();

            if (!whiteTurn) {
                if (
                    getPossibleMoves(draggedPiece, destinationIndex)
                        .includes(board.boardArr.indexOf('bK'))
                ) {
                    isCheck = true;
                } else {
                    isCheck = false;
                }

                if (whiteDangerSqrs.includes(board.boardArr.indexOf('wK'))) {
                    board.boardArr[prevSqrIndex] = draggedPiece;
                    board.boardArr[destinationIndex] = capturedPiece;

                    whiteTurn = !whiteTurn;
                    halfMoveCount--;
                    fullMoveCount = roundToWhole(halfMoveCount / 2);
                }
            } else {
                playStockFishMove = false;

                if (blackDangerSqrs.includes(board.boardArr.indexOf('bK'))) {
                    board.boardArr[prevSqrIndex] = draggedPiece;
                    board.boardArr[destinationIndex] = capturedPiece;

                    whiteTurn = !whiteTurn;
                    halfMoveCount--;
                    fullMoveCount = roundToWhole(halfMoveCount / 2);
                }
            }

            if (isCheck) {
                audio.playAudio(audio.sound.check);
            } else if (isCapture) {
                audio.playAudio(audio.sound.capture);
            } else {
                audio.playAudio(audio.sound.move);
            }
        }

        selectedPieceIndex = null;
        selectedPieceType = null;
        possibleSqres = [];
        draggedPiece = null;
        prevSqrIndex = null;
        isClickMode = false;

        ctx.clearRect(0, 0, cvs.width, cvs.height);
        update();
    }

    function handleUp(e) {
        isDown = false;
        isUp = true;

        if (isClickMode) {
            return;
        }

        const rect = cvs.getBoundingClientRect();
        const mouseX = e.changedTouches
            ? e.changedTouches[0].clientX - rect.left
            : e.clientX - rect.left;
        const mouseY = e.changedTouches
            ? e.changedTouches[0].clientY - rect.top
            : e.clientY - rect.top;

        const boardIndex = getBoardIndex(mouseX, mouseY);

        function reverseMovement() {
            board.boardArr[prevSqrIndex] = draggedPiece;
            board.boardArr[boardIndex] = capturedPiece;

            whiteTurn = draggedPiece[0] === 'w';
            halfMoveCount--;
            fullMoveCount = roundToWhole(halfMoveCount / 2);
            playStockFishMove = false;
        }

        function resetMovement() {
            draggedPiece = null;
            possibleSqres = [];
        }

        whiteDangerSqrs = [];
        blackDangerSqrs = [];

        let castleMoveMade = false;

        if (canWhiteCastleRightSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            whiteRightSideCastle();
            resetMovement();

            whiteTurn = !whiteTurn;
            playStockFishMove = true;

            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }

        if (canWhiteCastleLeftSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            whiteLeftSideCastle();
            resetMovement();

            whiteTurn = !whiteTurn;
            playStockFishMove = true;

            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }

        if (canBlackCastleRightSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            blackRightSideCastle();
            resetMovement();

            whiteTurn = !whiteTurn;
            playStockFishMove = false;

            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }

        if (canBlackCastleLeftSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            blackLeftSideCastle();
            resetMovement();

            whiteTurn = !whiteTurn;
            playStockFishMove = false;

            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }

        if (
            !castleMoveMade &&
            draggedPiece !== null &&
            possibleSqres.length > 0
        ) {
            const isCapture = board.boardArr[boardIndex] !== 0;

            if (possibleSqres.includes(boardIndex)) {
                capturedPiece =
                    board.boardArr[boardIndex] !== 0
                        ? board.boardArr[boardIndex]
                        : 0;

                board.boardArr[boardIndex] = draggedPiece;
                board.boardArr[prevSqrIndex] = 0;

                whiteTurn = !whiteTurn;

                halfMoveCount++;
                fullMoveCount = roundToWhole(halfMoveCount / 2);

                playStockFishMove = !whiteTurn;

                if (board.boardArr[boardIndex][1] === 'P') {
                    pawnsThatHaveMovedPastOnce.push(boardIndex);
                }

                checkWhiteRightCastleLegality(prevSqrIndex, draggedPiece);
                checkWhiteLeftCastleLegality(prevSqrIndex, draggedPiece);
                checkBlackRightCastleLegality(prevSqrIndex, draggedPiece);
                checkBlackLeftCastleLegality(prevSqrIndex, draggedPiece);

                findWhiteDangerSqrs();
                findBlackDangerSqrs();

                if (!whiteTurn) {
                    if (
                        getPossibleMoves(draggedPiece, boardIndex)
                            .includes(board.boardArr.indexOf('bK'))
                    ) {
                        isCheck = true;
                    } else {
                        isCheck = false;
                    }

                    if (
                        whiteDangerSqrs.includes(
                            board.boardArr.indexOf('wK')
                        )
                    ) {
                        reverseMovement();
                    }
                } else {
                    playStockFishMove = false;

                    if (
                        blackDangerSqrs.includes(
                            board.boardArr.indexOf('bK')
                        )
                    ) {
                        reverseMovement();
                    }
                }

                if (isCheck) {
                    audio.playAudio(audio.sound.check);
                } else if (isCapture) {
                    audio.playAudio(audio.sound.capture);
                } else {
                    audio.playAudio(audio.sound.move);
                }
            } else {
                board.boardArr[prevSqrIndex] = draggedPiece;
            }

            resetMovement();
        } else if (draggedPiece !== null) {
            board.boardArr[prevSqrIndex] = draggedPiece;
            resetMovement();
        }

        ctx.clearRect(0, 0, cvs.width, cvs.height);
        update();
    }

    document.addEventListener('mousedown', handleDown);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);

    document.addEventListener('touchstart', handleDown);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleUp);
};
