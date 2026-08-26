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

// Click-Mode variables
let selectedPieceIndex = null;
let selectedPieceType = null;
let isClickMode = false;

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

        // Check if user clicked on a piece
        if (board.boardArr[boardIndex] !== 0 && (whiteTurn && board.boardArr[boardIndex].startsWith('w')) || (whiteTurn == false && board.boardArr[boardIndex].startsWith('b'))) {
            // Click-Mode: First click on piece
            if (selectedPieceIndex === null) {
                selectedPieceIndex = boardIndex;
                selectedPieceType = board.boardArr[boardIndex];
                possibleSqres = getPossibleMoves(selectedPieceType, selectedPieceIndex);
                
                ctx.clearRect(0, 0, cvs.width, cvs.height);
                update();
                highlight(possibleSqres);
                isClickMode = true;
            } else if (selectedPieceIndex === boardIndex) {
                // Click on same piece again = deselect
                selectedPieceIndex = null;
                selectedPieceType = null;
                possibleSqres = [];
                ctx.clearRect(0, 0, cvs.width, cvs.height);
                update();
                isClickMode = false;
            } else {
                // Click on different piece = select new piece
                selectedPieceIndex = boardIndex;
                selectedPieceType = board.boardArr[boardIndex];
                possibleSqres = getPossibleMoves(selectedPieceType, selectedPieceIndex);
                
                ctx.clearRect(0, 0, cvs.width, cvs.height);
                update();
                highlight(possibleSqres);
            }
            return;
        }

        // If a piece is already selected, this click is a destination
        if (selectedPieceIndex !== null) {
            handleClickMove(boardIndex);
            return;
        }

        // Drag-Mode logic
        board.boardArr.forEach((sqr, i) => {
            if (sqr !== 0 && i == boardIndex) {

                if ((whiteTurn && sqr.startsWith('w')) || (whiteTurn == false && sqr.startsWith('b'))) {
                    board.boardArr[i] = 0;
                    draggedPiece = sqr;
                    prevSqrIndex = i;

                    isStoreSqr = false;
                    possibleSqres = getPossibleMoves(sqr, i);

                    update();
                    highlight(possibleSqres);
                }
            }
        })
    }

    function handleMove(e) {
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

        if (isDown && draggedPiece !== null) {
            ctx.clearRect(0, 0, cvs.width, cvs.height);
            update();
            highlight(possibleSqres);
            pieces.drawPiece(pieces.type[draggedPiece], [{ x: mouseX - pieces.pieceScale / 2, y: mouseY - pieces.pieceScale / 2 }]);
        }
    }

    function handleClickMove(destinationIndex) {
        if (selectedPieceIndex === null || selectedPieceType === null) {
            return;
        }

        let boardIndex = destinationIndex;
        prevSqrIndex = selectedPieceIndex;
        draggedPiece = selectedPieceType;

        whiteDangerSqrs = [];
        blackDangerSqrs = [];

        let castleMoveMade = false;

        // check for castling movement and if it is, allow castling
        if (canWhiteCastleRightSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            whiteRightSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = true;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }
        if (canWhiteCastleLeftSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            whiteLeftSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = true;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }
        if (canBlackCastleRightSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            blackRightSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = false;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }
        if (canBlackCastleLeftSide(prevSqrIndex, draggedPiece, boardIndex)) {
            isCastle = true;
            blackLeftSideCastle();
            whiteTurn = !whiteTurn;
            playStockFishMove = false;
            audio.playAudio(audio.sound.move);
            castleMoveMade = true;
        }

        if (!castleMoveMade && draggedPiece !== null && possibleSqres.length > 0) {
            let isCapture = board.boardArr[boardIndex] == 0 ? false : true;
            
            if (possibleSqres.includes(boardIndex)) {
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
                    
                    if (whiteDangerSqrs.includes(board.boardArr.indexOf('wK'))) {
                        board.boardArr[prevSqrIndex] = draggedPiece;
                        board.boardArr[boardIndex] = capturedPiece;
                        whiteTurn = !whiteTurn;
                        halfMoveCount--;
                        fullMoveCount = roundToWhole(halfMoveCount / 2);
                    }
                } else {
                    playStockFishMove = false;
                    if (blackDangerSqrs.includes(board.boardArr.indexOf('bK'))) {
                        board.boardArr[prevSqrIndex] = draggedPiece;
                        board.boardArr[boardIndex] = capturedPiece;
                        whiteTurn = !whiteTurn;
                        halfMoveCount--;
                        fullMoveCount = roundToWhole(halfMoveCount / 2);
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

        // Reset click mode
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
            return; // Click mode handles moves differently
        }

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

        let castleMoveMade = false;

        // check for castling movement and if it is, allow castling
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
        // -------------------------------------------------------- //

        // once we release our piece we want to get its new location and chage it
        // update the boardArr data and update the game
        if (!castleMoveMade && draggedPiece !== null && possibleSqres.length > 0) {
            let isCapture = board.boardArr[boardIndex] == 0 ? false : true;
            for (let i = 0; i < possibleSqres.length; i++) {
                if (boardIndex == possibleSqres[i]) {
                    capturedPiece = board.boardArr[boardIndex] !== 0 ? board.boardArr[boardIndex] : 0; // if we captured a piece
                    board.boardArr[boardIndex] = draggedPiece;
                    board.boardArr[prevSqrIndex] = 0;
             
                    whiteTurn = !whiteTurn; // switch turns
                    halfMoveCount++;
                    fullMoveCount = roundToWhole(halfMoveCount / 2);


                    if (whiteTurn == false) playStockFishMove = true;
                    else playStockFishMove = false;

                    if (board.boardArr[boardIndex][1] == 'P') { // if it's a pawn
                        pawnsThatHaveMovedPastOnce.push(boardIndex); // add it to the list of pawns moved more than once
                    }
                    // check for castling legality with every king or rook movement!
                    checkWhiteRightCastleLegality(prevSqrIndex, draggedPiece);
                    checkWhiteLeftCastleLegality(prevSqrIndex, draggedPiece);
                    checkBlackRightCastleLegality(prevSqrIndex, draggedPiece);
                    checkBlackLeftCastleLegality(prevSqrIndex, draggedPiece);

                    // check if the king is on check
                    findWhiteDangerSqrs();
                    findBlackDangerSqrs();

                    if (whiteTurn == false) {
                         // find out if the move the human made is a check
                        if(getPossibleMoves(draggedPiece, boardIndex).includes(board.boardArr.indexOf('bK'))) {
                            if(isCheck == false) isCheck = true;
                        } else {
                            isCheck = false;
                        }
                        //
                        if (whiteDangerSqrs.includes(board.boardArr.indexOf('wK'))) { // if the current square of the wK is among the danger squares
                            reverseMovement(); // reverse the movement until they have resolved the check
                        }
                    } else {
                        playStockFishMove = false;
                        if (blackDangerSqrs.includes(board.boardArr.indexOf('bK'))) { // if the current square of the bK is among the danger squares
                            reverseMovement(); // reverse the movement until they have resolved the check
                        }
                    }

                    // play the right audios
                    if(isCheck == false) {
                        if (isCapture) audio.playAudio(audio.sound.capture);
                        else audio.playAudio(audio.sound.move);
                    } else {
                        audio.playAudio(audio.sound.check);
                    }
                }
            }
            // if the square were trying to move to isnt part of the possibleMoves
            // we move back to the prev square
            if (!possibleSqres.includes(boardIndex)) {
                board.boardArr[prevSqrIndex] = draggedPiece;
            }
            resetMovement();
        } else if (draggedPiece !== null && possibleSqres.length <= 0) { // if there are no squares to move to
            board.boardArr[prevSqrIndex] = draggedPiece;
            resetMovement();
        }
        ctx.clearRect(0, 0, cvs.width, cvs.height);
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

