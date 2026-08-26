class Stockfish {
    constructor() {
        this.isThinking = false;
    }

    async getBestMove(fen) {
        if (this.isThinking) return null;
        this.isThinking = true;
        try {
            const endpoint = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=8`;
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Stockfish API HTTP error: ${response.status}`);
            const data = await response.json();

            if (data.mate == -1) {
                playerLost = true; playerWon = false; draw = false;
            } else if (data.mate == 1) {
                playerWon = true; playerLost = false; draw = false;
            } else if (data.mate == 0) {
                playerLost = false; playerWon = false; draw = true;
            }

            if (!data.success || typeof data.bestmove !== 'string') {
                console.error('Stockfish API error:', data.data || data);
                return null;
            }
            return data.bestmove;
        } catch (error) {
            console.error('Stockfish error:', error);
            return null;
        } finally {
            this.isThinking = false;
        }
    }

    extractBestMove(moveString) {
        if (!moveString || typeof moveString !== 'string') return null;
        const match = moveString.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
        return match ? match[1] : null;
    }

    async playStockfishMove() {
        if (this.isThinking) return;

        const response = await this.getBestMove(board.convertBoardToFEN());
        const move = this.extractBestMove(response);

        if (!move) {
            console.error('No valid move received from Stockfish.');
            promptUser('Something went wrong :( Please check your connection');
            return;
        }

        const fromIndex = board.algebraicToIndex(move.substring(0, 2));
        const piece = board.boardArr[fromIndex];

        if (!piece || !piece.startsWith('b')) {
            console.error('Invalid Stockfish move:', move);
            return;
        }

        if (!board.applyMove(move)) {
            console.error('Could not apply Stockfish move:', move);
            return;
        }

        update();

        if (playerLost) promptUser('Stockfish: You suck at chess lol... wanna play again?');
        else if (playerWon) promptUser("Stockfish: There's no way in hell you just beat me!!");
        else if (draw) promptUser('Drawing with Stockfish is just wild!!');
    }
}
