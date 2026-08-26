const sqreScale = 60;
const boardScale = 8 * sqreScale;

const boardCont = document.querySelector('.board-cont');

cvs.width = boardScale;
cvs.height = boardScale;

const drawBoard = () => {
    boardCont.innerHTML = '';

    for (let row = 0; row < boardScale; row += sqreScale) {
        for (let col = 0; col < boardScale; col += sqreScale) {
            const newSqr = document.createElement('div');
            const isLight = ((row / sqreScale) + (col / sqreScale)) % 2 === 0;

            newSqr.style.left = `${col}px`;
            newSqr.style.top = `${row}px`;
            newSqr.style.width = `${sqreScale}px`;
            newSqr.style.height = `${sqreScale}px`;
            newSqr.style.boxSizing = 'border-box';

            if (isLight) {
                newSqr.style.background = `
                    linear-gradient(135deg,
                        rgba(255, 239, 194, 0.55),
                        rgba(214, 166, 101, 0.35) 45%,
                        rgba(255, 228, 171, 0.50)
                    ),
                    repeating-linear-gradient(8deg,
                        rgba(126, 76, 32, 0.10) 0px,
                        rgba(126, 76, 32, 0.10) 2px,
                        rgba(255, 244, 211, 0.08) 5px,
                        rgba(126, 76, 32, 0.06) 8px
                    ),
                    #d8a45f`;
            } else {
                newSqr.style.background = `
                    linear-gradient(135deg,
                        rgba(112, 57, 24, 0.28),
                        rgba(61, 29, 12, 0.16) 45%,
                        rgba(139, 74, 31, 0.28)
                    ),
                    repeating-linear-gradient(8deg,
                        rgba(39, 18, 7, 0.16) 0px,
                        rgba(39, 18, 7, 0.16) 2px,
                        rgba(181, 103, 46, 0.10) 5px,
                        rgba(39, 18, 7, 0.08) 8px
                    ),
                    #8a4f2b`;
            }

            newSqr.style.border = '1px solid rgba(70, 35, 15, 0.10)';
            newSqr.style.position = 'absolute';

            boardCont.appendChild(newSqr);
        }
    }

    boardCont.style.boxShadow =
        '0 10px 30px rgba(0, 0, 0, 0.55), inset 0 0 0 5px rgba(72, 35, 13, 0.65)';
}
