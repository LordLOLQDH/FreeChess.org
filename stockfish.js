class StockfishAi {
    constructor() {
        this.engine = null;
        this.engineReady = this.initEngine();
        this.isThinking = false;
    }

    async initEngine() {
        if (typeof Stockfish !== 'function') {
            console.error('Stockfish WASM is not loaded.');
            return false;
        }
        try {
            this.engine = await Stockfish();
            if (this.engine.ready) await this.engine.ready;
            this.engine.postMessage('uci');
            this.engine.postMessage('setoption name Threads value 1');
            this.engine.postMessage('setoption name Hash value 16');
            this.engine.postMessage('isready');
            return true;
        } catch (error) {
            console.error('Stockfish initialization failed:', error);
            this.engine = null;
            return false;
        }
    }

    async getBestMove(fen) {
        if (this.isThinking) return null;
        if (!(await this.engineReady) || !this.engine) return null;

        this.isThinking = true;

        return new Promise((resolve) => {
            let done = false;
            const finish = (move) => {
                if (done) return;
                done = true;
                clearTimeout(timeout);
                if (this.engine.removeMessageListener) {
                    this.engine.removeMessageListener(listener);
                }
                this.isThinking = false;
                resolve(move);
            };

            const timeout = setTimeout(() => {
                console.error('Stockfish timed out.');
                finish(null);
            }, 15000);

            const listener = (line) => {
                if (typeof line !== 'string') return;
                const match = line.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
                if (match) finish(match[1]);
            };

            this.engine.addMessageListener(listener);
            this.engine.postMessage('stop');
            this.engine.postMessage(`position fen ${fen}`);
            this.engine.postMessage('go depth 10');
        });
    }

    async playStockfishMove() {
        if (this.isThinking) return;

        const fen = board.convertBoardToFEN();
        const move = await this.getBestMove(fen);

        if (!move) {
            console.error('Stockfish did not return a move.');
            return;
        }

        console.log('Stockfish move:', move);

        if (!board.applyMove(move)) {
            console.error('Invalid Stockfish move:', move);
            return;
        }

        update();

        if (playerLost) promptUser('Stockfish: You suck at chess lol... wanna play again?');
        else if (playerWon) promptUser("Stockfish: There's no way in hell you just beat me!!");
        else if (draw) promptUser('Drawing with Stockfish is just wild!!');
    }
}
