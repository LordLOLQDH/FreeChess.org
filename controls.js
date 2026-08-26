// controls
const stockfishAi = new Stockfish();

let isDrag = false;
let isDown = false;
let isUp = true;


let possibleSqres = [];
let prevSqrIndex = null;
let draggedPiece = null;
let capturedPiece = 0; // it's 0 not null cause it will be applied to board.boardArr

let isStoreSqr = true;



sprite.onload = () => {
    board.init();
    update();
    drawBoard();

    // Unified handler for both mouse and touch
    function handleDown(e) {
        isDown = true;
        isUp = false;

        const rect = cvs.getBoundingClientRect();
        let mouseX, mouseY;

        if (e.touches) {
            // Touch event
            mouseX = e.touches[0].clientX - rect.left;
            mouseY = e.touches[0].clientY - rect.top;
        } else {
            // Mouse event
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        }

        let boardIndex = getBoardIndex(mouseX, mouseY);

        board.boardArr.forEach((sqr, i) => {
            if (sqr !== 0 && i == boardIndex) {

                if ((whiteTurn && sqr.startsWith('w')) || (whiteTurn == false && sqr.startsWith('b'))) {
                    board.boardArr[i] = 0;
                    draggedPiece = sqr;
                    prevSqrIndex = i;// store prev square index of piece

                    isStoreSqr = false;
                    possibleSqres = getPossibleMoves(sqr, i); // store all possible squares to move

                    highlight(possibleSqres); // highlight squares

                }
            }
        })
        update()
        drawBoard()
    }

    function handleMove(e) {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        update();

        const rect = cvs.getBoundingClientRect();
        let mouseX, mouseY;

        if (e.touches) {
            // Touch event
            mouseX = e.touches[0].clientX - rect.left;
            mouseY = e.touches[0].clientY - rect.top;
        } else {
            // Mouse event
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        }

        if (isDown) {
            if (draggedPiece !== null) {
                pieces.drawPiece(pieces.type[draggedPiece], [{ x: mouseX - pieces.pieceScale / 2, y: mouseY - pieces.pieceScale / 2 }]);
            }
        }
    }

    function handleUp(e) {
        isDown = false;
        isUp = true;

        const rect = cvs.getBoundingClientRect();
        let mouseX, mouseY;

        if (e.changedTouches) {
            // Touch event
            mouseX = e.changedTouches[0].clientX - rect.left;
            mouseY = e.changedTouches[0].clientY - rect.top;
        } else {
            // Mouse event
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        }

        let boardIndex = getBoardIndex(mouseX, mouseY);

        // ---- utility functions ----- //
        function reverseMovement() {
            board.boardArr[prevSqrIndex] = draggedPiece;
            board.boardArr[boardIndex] = capturedPiece;
            whiteTurn = draggedPiece[0] == 'w' ? true : false;
            halfMoveCount--;
            fullMoveCount = roundToWhole(halfMoveCount / 2);
            playStockFishMove = false;
        }

        function resetMovement() {
            draggedPiece = null;
            possibleSqres = [];
        }
        // --------------------------- //

        whiteDangerSqrs = [];
        blackDangerSqrs = [];

        if (canWhiteCastleRightSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            whiteRightSideCastle();
            resetMovement();
            whiteTurn = !whiteTurn;
            playStockFishMove = true;
            audio.playAudio(audio.sound.move);
        }
        if (canWhiteCastleLeftSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            whiteLeftSideCastle();
            resetMovement();
            whiteTurn = !whiteTurn;
            playStockFishMove = true;
            audio.playAudio(audio.sound.move);
        }
        if (canBlackCastleRightSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            blackRightSideCastle();
            resetMovement();
            whiteTurn = !whiteTurn;
            playStockFishMove = false;
            audio.playAudio(audio.sound.move);
        }
        if (canBlackCastleLeftSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            blackLeftSideCastle();
            resetMovement();
            whiteTurn = !whiteTurn;
            playStockFishMove = false;
            audio.playAudio(audio.sound.move);
        }

        else if (draggedPiece !== null && possibleSqres.length > 0) {
            let isCapture = board.boardArr[boardIndex] == 0 ? false : true;
            for (let i = 0; i < possibleSqres.length; i++) {
                if (boardIndex == possibleSqres[i]) {
                    capturedPiece = board.boardArr[boardIndex] !== 0 ? board.boardArr[boardIndex] : 0;
                    board.boardArr[boardIndex] = draggedPiece;
                    board.boardArr[prevSqrIndex] = 0;
             
                    whiteTurn = !whiteTurn;
                    halfMoveCount++;
                    fullMoveCount = roundToWhole(halfMoveCount / 2);


                    if (whiteTurn == false) playStockFishMove = true;
                    else playStockFishMove = false;

                    if (board.boardArr[boardIndex][1] == 'P') {
                        pawnsThatHaveMovedPastOnce.push(boardIndex);
                    }
                    checkWhiteRightCastleLegality(prevSqrIndex, draggedPiece);
                    checkWhiteLeftCastleLegality(prevSqrIndex, draggedPiece);
                    checkBlackRightCastleLegality(prevSqrIndex, draggedPiece);
                    checkBlackLeftCastleLegality(prevSqrIndex, draggedPiece);

                    findWhiteDangerSqrs();
                    findBlackDangerSqrs();

                    if (whiteTurn == false) {
                         if(getPossibleMoves(draggedPiece, boardIndex).includes(board.boardArr.indexOf('bK'))) {
                            if(isCheck == false) isCheck = true;
                        } else {
                            isCheck = false;
                        }
                        //
                        if (whiteDangerSqrs.includes(board.boardArr.indexOf('wK'))) {
                            reverseMovement();
                        }
                    } else {
                        playStockFishMove = false;
                        if (blackDangerSqrs.includes(board.boardArr.indexOf('bK'))) {
                            reverseMovement();
                        }
                    }

                    if(isCheck == false) {
                        if (isCapture) audio.playAudio(audio.sound.capture);
                        else audio.playAudio(audio.sound.move);
                    } else {
                        audio.playAudio(audio.sound.check);
                    }
                }
            }
            if (!possibleSqres.includes(boardIndex)) {
                board.boardArr[prevSqrIndex] = draggedPiece;
            }
            resetMovement();
        } else if (draggedPiece !== null && possibleSqres.length <= 0) {
            board.boardArr[prevSqrIndex] = draggedPiece;
            resetMovement();
        }
        update();
    }

    // Mouse events
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);

    // Touch events
    document.addEventListener('touchstart', handleDown);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleUp);
}

