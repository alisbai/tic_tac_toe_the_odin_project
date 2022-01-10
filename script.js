const gameBoard = (function() {
    let _board = new Array(9);
    
    function getCell(cellIndex) {
        return _board[cellIndex]
    }
    
    function setCell(cellIndex, value) {
        _board[cellIndex] = value;
    }
    
    function getEmptyCells() {
        let emptyCells = [];
        for(let i = 0 ; i < _board.length; i++) {
            let cell = _board[i];
          if(cell === undefined) {
              emptyCells.push(i);
            }
        }
        return emptyCells;
    }
    // this function returns true or false depending on weather a specific cell if empty or not
    function isCellEmpty(cellIndex, emptyCells) {
        return emptyCells.includes(cellIndex);
    }
    
    return {setCell, getCell, getEmptyCells, isCellEmpty};
}) ();

let AIStrategies = (function() {
    let level = 'easy';
    function setLevel(difficulty) {
        level = difficulty;
    }
    function getLevel() {
        return level;
    }
    function easyPlay(){
        let emptyCells = gameBoard.getEmptyCells();
        let randomIndex = Math.floor(Math.random() * emptyCells.length);
        let randomCell = emptyCells[randomIndex];
        return randomCell;
    };
    function play() {
        alert('AI is going to play now');
    }
    // the following functions will be added later once I learn the minimax algorithm. For now, we will only focus on making the AI do some random move.
    // function mediumPlay(){};
    // function hardPlay(){};
    // function unbeatablePlay(){};
    return {play}
})();

const gameController = (function() {
    // gets the player name and invokes the appropriate function to create a new player object
    function getNameInput(e) {
        let name = e.target.previousElementSibling.value;
        if(name) {
            DOMController.hideModal();
            players.humanPlayer = players.playerFactory(name, 'X');
            players.AI = players.playerFactory('AI', 'O');
            players.AI.AIStrategies = AIStrategies;
        }
        else alert('Oops! You haven\'t entered any name.')
    };
    //This function changes the sign for both players.
    function changeSign(e) {
        let sign = e.target.innerText;
        if(players.humanPlayer.getSign() === sign) {
            console.log('sign is already selected')
        }
        else {
            restartGame()
            players.humanPlayer.setSign(sign);
            if(players.humanPlayer.getSign() === "X") {
                players.AI.setSign('O');
            }
            else players.AI.setSign('X');
            DOMController.changeSignButtonColor(e.target);
        }
    }
    // Figure out what to do depending on the game rules.
    function manageCellClick(e) {
        const cellIndex = parseInt(e.target.getAttribute('data-mapping'));
        const emptyCells = gameBoard.getEmptyCells();

        if(gameBoard.isCellEmpty(cellIndex, emptyCells) && !gameRules.isGameOver && gameRules.whoseTurn() === players.humanPlayer.getName()) {
            console.log('the cell is empty, the game is not over yet, and it\'s the player/s turn.')
            let playerSign = players.humanPlayer.getSign();
            gameBoard.setCell(cellIndex,playerSign);
            players.humanPlayer.setPlayedCell(cellIndex);
            DOMController.setDOMCell(e.target, playerSign);
            gameRules.addOneTurn();
            if(!gameRules.checkForWinner(players.humanPlayer) && gameBoard.getEmptyCells().length) {
                players.AI.AIStrategies.play();
            }
            
        }
        else { 
            console.log('Oops, you can\'t play now!');
            return;
        }
    };

    function restartGame() {
        alert('restart');
        for(let i = 0; i < 9; i++) {
            if(gameBoard.getCell(i)) {
                gameBoard.setCell(i, undefined);
            }
        }
        DOMController.restartGame();
        gameRules.restartNumOfTurns();
    }

    function changeDifficultyLevel(e) {
        let difficultyLevel = e.target.value;
        alert('set Difficulty to ' + difficultyLevel);
        restartGame();
    }
    return {manageCellClick, getNameInput, changeSign, changeDifficultyLevel, restartGame}
}) ();


// This object is for manipulating the DOM only. However, it does communicate with other object to make necessary changes that are not in the DOM.
const DOMController = (function() {

    const gameCells = document.querySelectorAll('#board button');
    const restartButton = document.getElementById('restart');
    const difficultyLevel = document.getElementById('difficulty');
    const modal = document.querySelector('.modal');
    const nameButton = document.getElementById('enterName');
    const signButtons = document.querySelectorAll('#signs button');

    gameCells.forEach(cell => cell.addEventListener('click', gameController.manageCellClick));

    nameButton.addEventListener('click', gameController.getNameInput)

    signButtons.forEach(button => button.addEventListener('click', gameController.changeSign));
    
    difficultyLevel.addEventListener('change', gameController.changeDifficultyLevel)
   
    restartButton.addEventListener('click', gameController.restartGame)

    function hideModal() {
        modal.style.display = 'none';
        modal.classList.add = 'hidden';
    };

    function changeSignButtonColor(clickedButton) {
        signButtons.forEach(button => {
            if(button === clickedButton) {
                button.classList.add('greenColor');
                button.classList.add('selected');
            }
            else {
                button.classList.remove('greenColor');
                button.classList.remove('selected');
            }
        })
    };

    // Add a sign to the cell in the dom
    function setDOMCell(cell, sign) {
        cell.innerText = sign;
    }

    function restartGame() {
        gameCells.forEach(cell => cell.innerText = '');
        alert('restart dom')
    }
    return {hideModal, changeSignButtonColor, restartGame, setDOMCell}
}) ();

let players = (function() {
    // players prototype.
    const myPrototype = (function(){
        function getSign() {
            return this.sign
        };
        function setSign(newSign) {
            this.sign = newSign;
        };
        function getName() {
            return this.name;
        };
        function setName(newName) {
            this.name = newName;
        };
        function setPlayedCell(cell) {
            this.cells.push(cell);
        }
        function getPlayedCells() {
            return this.cells;
        }
        return {getSign, setSign, getName, setName, setPlayedCell, getPlayedCells}
    })();
// player factory function
    function playerFactory(name, sign) {
        let cells = [];
        let player = Object.assign(Object.create(myPrototype), {name, sign, cells});
        return player;
    }

    return {playerFactory}

}) ()

// This object will keep track of all the rules for the game: Defined a draw, winning combinations, who should play...
let gameRules = (function() {
    let numOfTurns = 0;
    let isGameOver = false;
    let winner = null;
    let winningCombinations = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    // This function hasn't been tested yet.
    function checkForWinner(player) {
        // cells occupied by the player.
        let occupiedCells = player.getPlayedCells();
        let i = 0;
        let isAWinner = false;
        while(!isAWinner && i < winningCombinations.length) {
            let combination = winningCombinations[i]
            isAWinning = combination.every((value) => {
                occupiedCells.includes(value);
            })
            i++;
        }
        console.log(isAWinner);
        return isAWinner;
    }
    function addOneTurn() {
        numOfTurns++;
        console.log('Turn number ' + numOfTurns);
    }
    function getNumOfTurns() {
        return numOfTurns;
    }

    function restartNumOfTurns() {
        numOfTurns = 0;
        console.log('Num of turns = 0')
    }
    function whoseTurn() {
        if(isGameOver) {
            console.log('Game Over!');
            return null;
        }
        else if(numOfTurns % 2) {
            return players.AI.getName();
        }
        else return players.humanPlayer.getName();
    }
    return {whoseTurn, isGameOver, addOneTurn, getNumOfTurns, restartNumOfTurns, checkForWinner}
}) ();








