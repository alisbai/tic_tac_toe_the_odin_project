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


const gameController = (function() {
    // gets the player name and invokes the appropriate function to create a new player object
    function getNameInput(e) {
        let name = e.target.previousElementSibling.value;
        if(name) {
            DOMController.hideModal();
            players.humanPlayer = players.playerFactory(name, 'X');
            players.AI = AI.AIFactory('AI', 'O');
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
            const playerSign = players.humanPlayer.getSign();
            gameBoard.setCell(cellIndex,playerSign);
            players.humanPlayer.setPlayedCell(cellIndex);
            DOMController.setDOMCell(e.target, playerSign);
            gameRules.addOneTurn();
            evaluateGameState(players.humanPlayer);
            
            if(!gameRules.checkForWinner(players.humanPlayer) && gameBoard.getEmptyCells().length) {
                const AICellIndex = players.AI.play();
                const AIDOMCell = document.querySelector(`button[data-mapping='${AICellIndex}']`);
                const AISign = players.AI.getSign();
                gameBoard.setCell(AICellIndex, AISign);
                players.AI.setPlayedCell(AICellIndex);
                DOMController.setDOMCell(AIDOMCell, AISign);
                gameRules.addOneTurn();
                evaluateGameState(players.AI)
            }
            
        }
        else { 
            console.log('Oops, you can\'t play now!');
            return;
        }
    };
    //This function checks if the one of the players has won the game and it invokes the necessary function to end the game.
    function evaluateGameState(player) {
        if(gameRules.checkForWinner(player)) {
            gameRules.finishGameStatus();
            alert('Game Over!')
        }
        
    }
    
    function restartGame() {
        // alert('restart');
        for(let i = 0; i < 9; i++) {
            if(gameBoard.getCell(i)) {
                gameBoard.setCell(i, undefined);
            }
        }
        DOMController.restartGame();
        gameRules.restartNumOfTurns();
        players.humanPlayer.resetPlayedCells();
        players.AI.resetPlayedCells();
        gameRules.resetGameStatus();
    }

    function changeDifficultyLevel(e) {
        let difficultyLevel = e.target.value;
        alert('set Difficulty to ' + difficultyLevel);
        players.AI.setLevel(difficultyLevel);
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
    
    difficultyLevel.addEventListener('change', gameController.changeDifficultyLevel);
    
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
        // alert('restart dom')
    }
    return {hideModal, changeSignButtonColor, restartGame, setDOMCell}
}) ();

let players = (function() {
    let cells = [];
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
            cells.push(cell);
        }
        function getPlayedCells() {
            return cells;
        }
        function resetPlayedCells() {
            cells = [];
        }
        return {getSign, setSign, getName, setName, setPlayedCell, getPlayedCells, resetPlayedCells}
    })();
// player factory function
function playerFactory(name, sign) {
        let player = Object.assign(Object.create(myPrototype), {name, sign});
        return player;
    }

    return {playerFactory}
    
}) ()

// This object will keep track of all the rules for the game: Defined a draw, winning combinations, who should play...
let gameRules = (function() {
    let numOfTurns = 0;
    let isGameOver = false;
    
    function finishGameStatus() {
        isGameOver = true;
    }

    function resetGameStatus() {
        isGameOver = false;
    }

    let winningCombinations = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    // This function hasn't been tested yet.
    function checkForWinner(player) {
        // cells occupied by the player.
        let occupiedCells = player.getPlayedCells();
        let i = 0;
        let isAWinner = false;
        while(!isAWinner && i < winningCombinations.length) {
            let combination = winningCombinations[i]
            isAWinner = combination.every((value) => {
                return occupiedCells.includes(value);
            })
            i++;
        }
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
    return {whoseTurn, isGameOver, addOneTurn, getNumOfTurns, restartNumOfTurns, checkForWinner, finishGameStatus, resetGameStatus}
}) ();

let AI = (function() {
    let level = 'Easy';
    let cells = [];
    let proto = (function() {
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
            cells.push(cell);
        }
        function getPlayedCells() {
            return cells;
        }
        function resetPlayedCells() {
            cells = [];
        }
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
            console.log(randomCell)
            return randomCell;
        };

        function play() {
            // alert('AI is going to play now');
            if(level === 'Easy') {
                return easyPlay();
            }
            else if(level === 'Medium') {
                mediumPlay();
            }
            else if(level === 'Hard') {
                hardPlay();
            }
            else {
                unbeatablePlay();
            }
        }
        // the following functions will be added later once I learn the minimax algorithm. For now, we will only focus on making the AI do some random move.
        function mediumPlay(){
            alert('I\'m still working on this difficulty level, please choose easy for now')
        };
        function hardPlay(){
            alert('I\'m still working on this difficulty level, please choose easy for now')
        };
        function unbeatablePlay(){
            alert('I\'m still working on this difficulty level, please choose easy for now')
        };
        return {play, getLevel, setLevel, getSign, setSign, getName, setName, getPlayedCells,setPlayedCell, resetPlayedCells}
    })();
    function AIFactory(name, sign) {
        const AI = Object.assign(Object.create(proto), {name, sign});
        return AI;
    }
    return {AIFactory};
}) ()








