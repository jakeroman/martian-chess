var MartianChess = Class.create(ScoringCombinatorialGame, {
    // Core object functions
    initialize: function() {
        // Set variables
        this.width = 4
        this.height = 8
        this.topScore = 0
        this.bottomScore = 0
        this.lastMove = false // Once a move is made it will be replaced with [fromX, fromY, toX, toY, crossesCanal, player]
        this.playerNames = ["Top", "Bottom"]

        // Create standard martian chess board
        this.board = []
        for (let x = 0; x < this.width; x++) {
            this.board[x] = []
            for (let y = 0; y < this.height; y++) {
                this.board[x][y] = 0
            }
        }

        // Default pieces to place
        var piecesToPlace = [[3,0,0],[3,1,0],[3,0,1],[2,2,0],[2,1,1],[2,0,2],[1,1,2],[1,2,2],[1,2,1]]
        for (let i = 0; i < piecesToPlace.length; i++) {
            var piece = piecesToPlace[i]
            this.board[piece[1]][piece[2]] = piece[0] // Place top left pieces
            this.board[(this.width-1)-piece[1]][(this.height-1)-piece[2]] = piece[0] // Place bottom right pieces
        }
    },

    getScore: function() {
        // Top player is the left, and bottom player is the right on the number line
        return this.topScore - this.bottomScore
    },

    clone: function() {
        var clone = new MartianChess()
        // Bring all the variables along
        clone.width = this.width
        clone.height = this.height
        clone.topScore = this.topScore
        clone.bottomScore = this.bottomScore

        // Deep copy board
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                clone.board[x][y] = this.board[x][y]
            }
        }

        return clone
    },

    equals: function(other) {
        // Check variables
        if (!(other.width == this.width && other.height == this.height && other.topScore == this.topScore && other.bottomScore == this.bottomScore)) {
            return false // The boards have different variables
        } 

        // Check board state
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (other.board[x][y] != this.board[x][y]) {
                    return false // Mismatch in board state
                }
            }
        }

        // Woohoo they match
        return true
    },

    getWidth: function() {
        return this.width;
    },
    
    getHeight: function() {
        return this.height;
    },

    getPlayerName: function(playerIndex) {
        return this.playerNames[playerIndex];
    },
    
    getOptionsForPlayer: function(playerId, ignoreEnemyPieceCheck = false) {
        // First check if the game is over
        var enemyPieces = this.getControlledPieces(1-playerId)
        if (enemyPieces.length == 0 && (!ignoreEnemyPieceCheck)) {
            // The game is already over
            return []
        }

        // Returns a list of all moves a player can currently make in format [x, y, toX, toY]
        var playerPieces = this.getControlledPieces(playerId)
        var options = []
        for (var pieceId = 0; pieceId < playerPieces.length; pieceId++) {
            var pieceType = playerPieces[pieceId][0]
            var x = playerPieces[pieceId][1] 
            var y = playerPieces[pieceId][2]
            var pieceOptions = this.getOptionsForPiece(playerId, pieceType, x, y)
            for (var optionId = 0; optionId < pieceOptions.length; optionId++) {
                var pieceOption = pieceOptions[optionId]

                // Clone the board and make the move
                var option = this.clone()
                option.makeMove(playerId, x, y, pieceOption[0], pieceOption[1])
                options.push(option)
            }
        }
        return options
    },

    // Supporting functions
    getSpace: function(x, y) {
        // Gets the piece at this space
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
            return this.board[x][y]
        }
        else {
            return -1 // Out of bounds
        }
    },

    getControlArea: function(playerId) {
        // Returns the [x1,y1,x2,y2] area that a specific player has control over
        var focus_x1 = 0 
        var focus_y1 = 0
        var focus_x2 = this.width-1
        var focus_y2 = this.height-1
        if (playerId == CombinatorialGame.prototype.LEFT) {
            // Top player
            focus_y2 = Math.floor((this.height/2)-1)
        }
        else if (playerId == CombinatorialGame.prototype.RIGHT) {
            // Bottom player
            focus_y1 = Math.floor(this.height/2)
            focus_y2 = Math.floor(this.height-1)
        }
        else {
            console.log("Warning, unknown player: " + playerId)
        }
        return [focus_x1, focus_y1, focus_x2, focus_y2]
    },

    canPlayerTake: function(playerId, x, y) {
        // Returns true if the provided player is able to take a specific piece on the board
        var playerOwns = this.checkSpaceOwnership(playerId, x, y)
        if (this.getSpace(x, y) < 0) {
            return false // Out of bounds
        }
        else if (playerOwns) {
            return false // Can't take own piece
        }
        return true // All good
    },

    canFieldPromote: function(playerId, x, y, toX, toY) {
        // Checks if the player can perform a field promoting by moving piece x,y to toX,toY
        if (!this.checkSpaceOwnership(playerId, x, y) || !this.checkSpaceOwnership(playerId, toX, toY)) {
            return false // If player doesn't own both pieces field promotion cannot continue
        }

        var pieceA = this.getSpace(x, y)
        var pieceB = this.getSpace(toX, toY)
        if ((pieceA == 1 && pieceB == 2) || (pieceA == 2 && pieceB == 1)) {
            // Field promotion to queen possible
            return 3
        }
        else if (pieceA == 1 && pieceB == 1) {
            // Field promotion to drone possible
            return 2
        }
        else {
            // Field promotion not possible
            return false
        }
    },

    checkSpaceOwnership: function(playerId, x, y) {
        // Returns true if the player has control over the square at X,Y
        var control_area = this.getControlArea(playerId)
        var area_x1 = control_area[0]
        var area_y1 = control_area[1]
        var area_x2 = control_area[2]
        var area_y2 = control_area[3]

        var playerOwns = (x >= area_x1 && x <= area_x2 && y >= area_y1 && y <= area_y2)
        // console.log("Checking ownership for player",this.playerNames[playerId],"of piece",x,y," Area:",area_x1,area_y1,area_x2,area_y2," Owns?",playerOwns)
        return playerOwns
    },

    getOptionsForPiece: function(playerId, pieceType, x, y) {
        // Gets available moves for a piece
        var moves = []

        if (pieceType == 1) {
            // Pawn
            var offsets = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            for (var i = 0; i < offsets.length; i++) {
                var offset = offsets[i]
                moves.push([x + offset[0], y + offset[1]])
            }
        }
        else if (pieceType == 2) {
            // Drone
            var directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]

            for (var i = 0; i < directions.length; i++) {
                // Start moving in a direction
                var dir = directions[i]
                var cx = x
                var cy = y
                for (var d = 0; d < 2; d++) { // Up to 2 spaces away
                    cx = cx + dir[0]
                    cy = cy + dir[1]
                    if (this.getSpace(cx, cy) < 0) {
                        break // Out of bounds, stop now
                    }
                    moves.push([cx, cy]) // Add this move as potentially available
                    if (this.getSpace(cx, cy) > 0) {
                        break // There's a piece here so let's not go any further
                    }
                }
            }
        }
        else if (pieceType == 3) {
            // Queen
            var directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [-1, -1], [-1, 1], [1, -1], [1, 1]]

            for (var i = 0; i < directions.length; i++) {
                // Start moving in a direction
                var dir = directions[i]
                var cx = x
                var cy = y
                while (true) { // Queen can move as far as they want
                    cx = cx + dir[0]
                    cy = cy + dir[1]
                    if (this.getSpace(cx, cy) < 0) {
                        break // Out of bounds, stop now
                    }
                    moves.push([cx, cy]) // Add this move as potentially available
                    if (this.getSpace(cx, cy) > 0) {
                        break // There's a piece here so let's not go any further
                    }
                }
            }
        }

        // Check legality of potential moves
        var options = []
        for (var i = 0; i < moves.length; i++) { 
            var cx = moves[i][0]
            var cy = moves[i][1]

            // Prevent move rejection (undoing the last player's move)
            if (this.lastMove && this.lastMove[1] == cx && this.lastMove[2] == cy && this.lastMove[3] == x && this.lastMove[4] == y && this.lastMove[0] != playerId) {
                continue // Skip to next move
            }

            // Allow legal moves
            if (this.getSpace(cx, cy) == 0) { // Move to empty space
                options.push([cx, cy])
            }
            else if (this.canPlayerTake(playerId, cx, cy)) { // Take enemy piece
                options.push([cx, cy])
            }
            else if (this.canFieldPromote(playerId, x, y, cx, cy)) {
                options.push([cx, cy])
            }
        }

        // Return all legal moves
        return options
    },

    getControlledPieces: function(playerId) {
        // Returns a list of pieces that the player has control over in a list formatted as [pieceType, x, y]
        var pieces = []
        var control_area = this.getControlArea(playerId)
        var control_x1 = control_area[0]
        var control_y1 = control_area[1]
        var control_x2 = control_area[2]
        var control_y2 = control_area[3]
        for (var x = control_x1; x <= control_x2; x++) {
            for (var y = control_y1; y <= control_y2; y++) {
                var piece = this.getSpace(x, y)
                if (piece > 0) {
                    pieces.push([piece, x, y])
                }
            }
        }
        return pieces
    },

    place: function(piece, x, y) {
        // Place a piece at a given position on the board
        this.board[x][y] = piece;
    },

    getPlayerScore: function(playerId) {
        // Return the individual score of a player
        if(this.playerId = "Left") {
            return this.topScore;
        }
        else {
            return this.bottomScore;
        }
    },

    makeMove: function(playerId, x, y, toX, toY) {
        // Moves a selected piece to chosen position if possible
        var pieceType = this.getSpace(x, y)
        var options = this.getOptionsForPiece(playerId, pieceType, x, y)

        // Check for legal move
        var legal = false
        for (let i = 0; i < options.length; i++) {
            if (options[i][0] == toX && options[i][1] == toY) {
                legal = true
            }
        }
        if (!legal) {
            // Illegal move
            return false
        }
        
        // Perform Legal moves
        if (this.getSpace(toX, toY) == 0) {
            // Move to an empty space
            this.place(0, x, y)
            this.place(pieceType, toX, toY)
        }
        else if (this.canPlayerTake(playerId, toX, toY)) {
            // Space occupied by enemy piece that will be taken
            var pointsEarned = this.getSpace(toX, toY)
            if (playerId == 0) { // Top player
                this.topScore += pointsEarned
            }
            else if (playerId == 1) { // Bottom player
                this.bottomScore += pointsEarned
            }
            this.place(0, x, y)
            this.place(pieceType, toX, toY)
        }
        else if (this.canFieldPromote(playerId, x, y, toX, toY)) {
            // Give piece a field promotion
            var promoteTo = this.canFieldPromote(playerId, x, y, toX, toY)
            this.place(0, x, y)
            this.place(promoteTo, toX, toY)
        }

        // Update the last move
        var crossesCanal = !(this.checkSpaceOwnership(playerId, toX, toY))
        this.lastMove = [playerId, x, y, toX, toY, crossesCanal]

        return true
    },
});

/**
 * Gets an HTML Element containing the basic game options for a 2-dimensional grid.
 */
function createBasicGridGameOptionsForMartianChess() {
    //do some normalization for games with only one size parameter (e.g. Atropos)
    var container = document.createElement("div");
    var leftPlayerElement = document.createDocumentFragment();
    leftPlayerElement.appendChild(document.createTextNode("(Top plays first.)"));
    leftPlayerElement.appendChild(document.createElement("br"));
    var leftRadio = getMartianChessRadioPlayerOptions(CombinatorialGame.prototype.LEFT);
    leftPlayerElement.appendChild(leftRadio);
    container.appendChild(createGameOptionDiv("Top:", leftPlayerElement));

    var rightRadio = getMartianChessRadioPlayerOptions(CombinatorialGame.prototype.RIGHT);
    container.appendChild(createGameOptionDiv("Bottom:", rightRadio));

    var startButton = document.createElement("input");
    startButton.type = "button";
    startButton.id = "starter";
    startButton.value = "Start Game";
    startButton.onclick = newGame;
    container.appendChild(startButton);

    return container;
}

/**
 * Modified radio player options function to include our AI
 */
function getMartianChessRadioPlayerOptions(playerId, namesAndPlayerOptions, defaultId) {
    namesAndPlayerOptions = namesAndPlayerOptions || ["Human", "Random", "Very Easy AI", "Easy AI", "Medium AI", "MCTS Player", "Greedy Player","Neuralnet Player ✨"];
    var playerName;
    var defaultIndex = defaultId;
    if (playerId == CombinatorialGame.prototype.LEFT) {
        playerName = "left";
        if (defaultId == undefined) {
            defaultIndex = 0;
        }
    } else if (playerId == CombinatorialGame.prototype.RIGHT) {
        playerName = "right";
        if (defaultId == undefined) {
            defaultIndex = 0;
        }
    } else {
        console.log("getRadioPlayerOptions got an incorrect playerId");
    }
    var playerNames;
    var players = [];
    //let's fix the playerOptions if they're broken
    if (typeof namesAndPlayerOptions[0] == 'string') {
        playerNames = namesAndPlayerOptions;
        for (var i = 0; i < playerNames.length; i++) {
            const name = playerNames[i];
            if (name == "Human") {
                players.push("new HumanPlayer(viewFactory)"); 
            } else if (name == "Random") {
                players.push("new RandomPlayer(1000)");
            } else if (name == "Very Easy AI") {
                players.push("new DepthSearchPlayer(1000, 1)");
            } else if (name == "Easy AI") {
                players.push("new DepthSearchPlayer(1000, 2)");
            } else if (name == "Medium AI") {
                players.push("new DepthSearchPlayer(1000, 3)");
            } else if (name.startsWith("MCTS Player")) {
                players.push("new MCTSPlayer(30, 1000)");
            } else if (name.startsWith("Greedy Player")) {
                players.push("new MartianChessGreedyPlayer()");
            } else if (name.startsWith("Neuralnet Player")) {
                players.push("new MartianChessNeuralPlayer()");
            } else {
                console.log("Didn't see an appropriate player name!!!");
                players.push("monkey");
            }
        }
    } else {
        //it's a list
        playerNames = [];
        //console.log("Splitting the player list.");
        for (var i = 0; i < namesAndPlayerOptions.length; i++) {
            playerNames.push(namesAndPlayerOptions[i][0]);
            players.push(namesAndPlayerOptions[i][1]);
        }
        //console.log(players);
    }
    return createRadioGroup(playerName + "Player",  playerNames, defaultIndex, players); // "Professional (hangs your browser)"
}

/**
 * The start game function which fires up a new round of Martian Chess.
 */
function newMartianChessGame() {
    var viewFactory = new InteractiveMartianChessViewFactory();
    var playDelay = 1000;
    var controlForm = $('gameOptions');
    var leftPlayer = eval(getSelectedRadioValue(controlForm.elements['leftPlayer']));
    var rightPlayer =  eval(getSelectedRadioValue(controlForm.elements['rightPlayer']));
    leftPlayer.delayMilliseconds = 10
    rightPlayer.delayMilliseconds = 10
    const players = [leftPlayer, rightPlayer];
    var game = new MartianChess();
    var ref = new ScoringReferee(game, players, viewFactory, "MainGameBoard", $('messageBox'), controlForm);
}

const InteractiveMartianChessView = Class.create({
    initialize: function(position) {
        this.position = position;
        this.selectedTile = undefined;
        this.handleClick = function(event, currentPlayerX, currentPlayerY, containerElement) {
            var nextPosition = this.view.getNextPositionFromClick(event)
            console.log(this.view)
        }
    },

    draw(containerElement, listener) {
        // Clear out the children of containerElement
        while (containerElement.hasChildNodes()) {
            containerElement.removeChild(containerElement.firstChild);
        }
        var svgNS = "http://www.w3.org/2000/svg";
        var boardSvg = document.createElementNS(svgNS, "svg");

        // Selected tile potential moves
        var options = []
        if (this.selectedX != undefined) {
            var pieceType = this.position.getSpace(this.selectedX, this.selectedY)
            options = this.position.getOptionsForPiece(this.drawPlayerIndex, pieceType, this.selectedX, this.selectedY)
        }

        this.containerElementCache = containerElement
        this.listenerCache = listener

        // Calculate board scale
        var boardWidth = Math.min(getAvailableHorizontalPixels(containerElement), window.innerWidth - 200);
        var boardPixelSize = Math.min(window.innerHeight, boardWidth) / 10;

        // Now add the new board to the container
        containerElement.appendChild(boardSvg);
        boardSvg.setAttributeNS(null, "width", 10 + (this.position.width + 4) * boardPixelSize);
        boardSvg.setAttributeNS(null, "height", 10 + this.position.height * boardPixelSize);

        // Draw the Martian Chess board
        for (var i = 0; i < this.position.width; i++) {
            for (var j = 0; j < this.position.height; j++) {
                // Draw the tile
                var parityString = "Even";
                if ((i+j) % 2 == 1) {
                    parityString = "Odd";
                }
                var checkerTile = document.createElementNS(svgNS,"rect");
                checkerTile.setAttributeNS(null, "x", (i * boardPixelSize) + "");
                checkerTile.setAttributeNS(null, "y", (j * boardPixelSize) + "");
                checkerTile.setAttributeNS(null, "posX", new String(i));
                checkerTile.setAttributeNS(null, "posY", new String(j));
                checkerTile.setAttributeNS(null, "height", boardPixelSize + "");
                checkerTile.setAttributeNS(null, "width", boardPixelSize + "");

                // Check if this tile is around moved piece
                var potentialMove = false
                for (var optionId = 0; optionId < options.length; optionId++) {
                    if (options[optionId][0] === i && options[optionId][1] === j) {
                        potentialMove = true
                    }
                }

                if (potentialMove === true) {
                    checkerTile.setAttributeNS(null, "class", "martianChessPotentialMove");
                }
                else if (this.selectedX === i && this.selectedY === j) {
                    checkerTile.setAttributeNS(null, "class", "martianChessSelectedTile");
                }
                else {
                    checkerTile.setAttributeNS(null, "class", "martianChess" + parityString + "Tile");
                }

                boardSvg.appendChild(checkerTile);

                if (listener != undefined) {
                    var player = listener;
                    checkerTile.onclick = function(event) {player.handleClick(event);}
                }
            }
        }

        // Draw the dividing line
        var dividingLine = document.createElementNS(svgNS,"rect");
        dividingLine.setAttributeNS(null, "x", "0");
        dividingLine.setAttributeNS(null, "y", ((this.position.height/2) * boardPixelSize) - 4 + "");
        dividingLine.setAttributeNS(null, "height", "8");
        dividingLine.setAttributeNS(null, "width", new String(this.position.width * boardPixelSize));
        dividingLine.setAttributeNS(null, "class", "martianChessDivide");
        boardSvg.appendChild(dividingLine);

        // Draw pieces
        for (var i = 0; i < this.position.width; i++) {
            for (var j = 0; j < this.position.height; j++) {
                // Draw the piece if it exists
                piece = this.position.getSpace(i,j)
                if (piece > 0) {
                    // Determine size
                    var pieceSize = 0
                    if (piece == 1) {
                        pieceSize = .30 * boardPixelSize // Pawn
                    }
                    else if (piece == 2) {
                        pieceSize = .55 * boardPixelSize // Drone
                    }
                    else if (piece == 3) {
                        pieceSize = .80 * boardPixelSize // Queen
                    }

                    // Draw piece
                    var pieceTile = document.createElementNS(svgNS,"rect");
                    pieceTile.setAttributeNS(null, "x", (i * boardPixelSize) + ((boardPixelSize-pieceSize)/2) + "");
                    pieceTile.setAttributeNS(null, "y", (j * boardPixelSize) + ((boardPixelSize-pieceSize)/2) + "");
                    pieceTile.setAttributeNS(null, "height", new String(pieceSize));
                    pieceTile.setAttributeNS(null, "width", new String(pieceSize));
                    pieceTile.setAttributeNS(null, "posX", new String(i));
                    pieceTile.setAttributeNS(null, "posY", new String(j));
                    if (this.position.lastMove !== undefined && i == this.position.lastMove[3] && j == this.position.lastMove[4]) {
                        pieceTile.setAttributeNS(null, "class", "martianChessHighlightPiece");
                    }
                    else {
                        pieceTile.setAttributeNS(null, "class", "martianChessPiece");
                    }
                    boardSvg.appendChild(pieceTile);
                    if (listener != undefined) {
                        var player = listener;
                        pieceTile.onclick = function(event) {player.handleClick(event);}
                    }
                }
            }
        }

        // Display top score
        var topScoreDisplay = document.createElementNS(svgNS, "text");
        topScoreDisplay.textContent = "TOP SCORE: " + this.position.topScore;
        topScoreDisplay.setAttributeNS(null, "x", boardPixelSize*0.1 + this.position.width * boardPixelSize + boardPixelSize*0.1);
        topScoreDisplay.setAttributeNS(null, "y", boardPixelSize*0.4); // Set the y position, adjust as needed
        topScoreDisplay.setAttributeNS(null, "font-size", boardPixelSize*0.4);
        topScoreDisplay.setAttributeNS(null, "fill", "black");
        topScoreDisplay.setAttributeNS(null, "overflow", "visible");
        boardSvg.appendChild(topScoreDisplay);

        // Display bottom score
        var bottomScoreDisplay = document.createElementNS(svgNS, "text");
        bottomScoreDisplay.textContent = "BOTTOM SCORE: " + this.position.bottomScore;
        bottomScoreDisplay.setAttributeNS(null, "x", boardPixelSize*0.1 + this.position.width * boardPixelSize + boardPixelSize*.2);
        bottomScoreDisplay.setAttributeNS(null, "y", this.position.height * boardPixelSize); // Set the y position, adjust as needed
        bottomScoreDisplay.setAttributeNS(null, "font-size", boardPixelSize*0.4);
        bottomScoreDisplay.setAttributeNS(null, "fill", "black");
        bottomScoreDisplay.setAttributeNS(null, "overflow", "visible");
        boardSvg.appendChild(bottomScoreDisplay);
    },

    // Check adjacency
    isAdjacent(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1
    },

    // Beginning of Interactivity

    getNextPositionFromClick: function(event, playerIndex) {
        var clickedTile = event.target;
        var clickX = Number(clickedTile.getAttribute('posX'));
        var clickY = Number(clickedTile.getAttribute('posY'));
        this.drawPlayerIndex = playerIndex;

        // Make sure there is a piece to select
        if (this.position.getSpace(clickX,clickY) === 0 && this.selectedTile === undefined) {
            return null;
        }

        // Make sure we have ownership of the clicked space
        if (!this.position.checkSpaceOwnership(playerIndex,clickX,clickY) && this.selectedTile === undefined) {
            return null;
        }
    
        // Determine the piece the player wants to move
        if (this.selectedTile === undefined) { // No piece selected
            this.selectedX = clickX;
            this.selectedY = clickY;
            this.selectTile(clickedTile);
            this.draw(this.containerElementCache, this.listenerCache); // Redraw
            return null;
        }
        else { // Piece is selected
            // Deselect tile if we clicked on the same one
            if (this.selectedX === clickX && this.selectedY === clickY) {
                this.selectedX = undefined;
                this.selectedY = undefined;
                this.deselectTile();
                this.draw(this.containerElementCache, this.listenerCache); // Redraw
                return null;
            }

            this.selectedTile = undefined;
            const clone = this.position.clone();
            success = clone.makeMove(playerIndex,this.selectedX,this.selectedY,clickX,clickY);
            this.deselectTile();
            this.draw(this.containerElementCache, this.listenerCache); // Redraw
            return clone;
        }
    },
    
    selectTile: function(tile) {
        this.selectedTile = tile;
    },
    
    deselectTile: function() {
        this.selectedTile = undefined;
        this.selectedX = undefined;
        this.selectedY = undefined;
    },
    
    selectMoveTile: function(tile) {
        this.selectedMove = tile;
        // Apply visual changes to indicate move selection
    },
    
    deselectMoveTile: function() {
        this.selectedMove = undefined;
    }

});

const InteractiveMartianChessViewFactory = Class.create({ // MartianChess ViewFactory
    initialize: function() {
    },

    getInteractiveBoard: function(position) {
        return new InteractiveMartianChessView(position);
    },

    getView: function(position) {
        return this.getInteractiveBoard(position);
    },
});

const MartianChessNeuralPlayer = Class.create(ComputerPlayer, {
    initialize: function() {
        this.trainedModelPath = 'converted_network/model.json'; // Path on the webserver where trained model is stored
    },

    givePosition: function(playerIndex, position, referee) {
        // Return the best move
        let playerObject = this
        window.setTimeout(async function(){
            // Load model if this is the first time
            if (playerObject.model === undefined) {
                playerObject.model = await tf.loadLayersModel(playerObject.trainedModelPath);
            }

            // Get options for the player
            let optionStates = position.getOptionsForPlayer(playerIndex);
            let options = playerObject.getOptionsAsList(position, playerIndex, false);

            // Flip board and options if we aren't top player
            let board = position.board;
            if (playerIndex !== CombinatorialGame.prototype.LEFT) {
                board = playerObject.rotateBoard(board);
                options = playerObject.rotateOptions(options,position.width,position.height)
                for (let i = 0; i < optionStates.length; i++) {
                    let lm = optionStates[i].lastMove
                    let rotated_move = playerObject.rotateOptions([[lm[1],lm[2],lm[3],lm[4]]],position.width,position.height)[0]
                    optionStates[i].lastMove = [optionStates[i][0],rotated_move[0],rotated_move[1],rotated_move[2],rotated_move[3],optionStates[i][5]]
                }
            }
    
            // Encode & flatten board state
            let encodedBoard = playerObject.oneHotEncodeBoard(board);
            let flattenedBoard = encodedBoard.flat(2);
    
            // Perform forward pass through network
            let inputTensor = tf.tensor(flattenedBoard).reshape([1,96]);
            let outputTensor = playerObject.model.predict(inputTensor);
            let confidences = await outputTensor.data();

            // Generate mask of legal moves
            let moveSpace = playerObject.getAllPossibleMoves();
            let moveMask = [];
            for (let i = 0; i < moveSpace.length; i++) {
                let move = moveSpace[i];
                let legalMove = 0;
                for (let j = 0; j < optionStates.length; j++) {
                    let option = optionStates[j].lastMove;
                    if (move[0] === option[1] && move[1] === option[2] && move[2] == option[3] && move[3] == option[4]) {
                        legalMove = 1;
                    }
                    // if (playerObject.previousMove !== undefined && option[1] == playerObject.previousMove[1] && option[2] == playerObject.previousMove[0] && option[3] == playerObject.previousMove[3] && option[4] == playerObject.previousMove[2]) {
                    //     legalMove = 0; // Override to prevent repeated moves
                    //     console.log("Move reject:" + option)
                    // }
                }
                moveMask.push(legalMove);
            }

            // Apply move mask to network output
            let maskedConfidences = []
            for (let i = 0; i < moveMask.length; i++) {
                maskedConfidences.push(confidences[i] * moveMask[i])
            }

            // Make random choice using probability distribution
            let totalWeight = 0;
            let cumulativeWeights = [];
            for (let i = 0; i < maskedConfidences.length; i++) {
                let weight = maskedConfidences[i];
                totalWeight += weight;
                cumulativeWeights.push(totalWeight);
            }
            let randomValue = Math.random() * totalWeight;
            let weightedProbabilityMove = 0;
            for (let i = 0; i < cumulativeWeights.length; i++) {
                if (randomValue < cumulativeWeights[i]) {
                    weightedProbabilityMove = i;
                    break;
                }
            }

            // Use maximum confidence option to make move
            let greedyMove = maskedConfidences.reduce((maxIndex, currentValue, currentIndex, maskedConfidences) =>
                currentValue > maskedConfidences[maxIndex] ? currentIndex : maxIndex, 0);

            let selectedMove = greedyMove; // Control logic for move making

            // Turn move choice into a position
            mv = moveSpace[selectedMove];
            let moveOption = false;
            for (let i = 0; i < optionStates.length; i++) {
                let option = optionStates[i]
                if (option.lastMove[1] == mv[0] && option.lastMove[2] == mv[1] && option.lastMove[3] == mv[2] && option.lastMove[4] == mv[3]) {
                    moveOption = option;
                }
            }
            
            // Handle invalid move
            if (moveOption === false) {
                moveOption = optionStates[Math.floor(Math.random()*optionStates.length)];
                console.log("RL fallback option chosen.");
            }
    
            // Make that move
            playerObject.previousMove = mv
            referee.moveTo(moveOption);
        }, this.delayMilliseconds);
    },

    oneHotEncodeBoard: function(board) {
        const boardArray = board.map(row => row.slice());

        // Create a one hot encoded board for each piece type (1 means that specific piece is there)
        const pawnsBoard = boardArray.map(row => row.map(cell => (cell === 1 ? 1 : 0)));
        const dronesBoard = boardArray.map(row => row.map(cell => (cell === 2 ? 1 : 0)));
        const queensBoard = boardArray.map(row => row.map(cell => (cell === 3 ? 1 : 0)));

        // Stack the boards on top of eachother
        const oneHotBoard = [pawnsBoard, dronesBoard, queensBoard];
        return oneHotBoard;
    },

    getAllPossibleMoves: function() {
        // Initialize the board as in the Python version
        let board = new MartianChess();
        let width = board.width;
        let height = board.height;

        // Zero out board
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                board.place(0,x,y);
            }
        }
    
        // Try permutations
        let allMoves = [];
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                for (let piece = 1; piece < 4; piece++) {
                    board.place(piece, x, y); // Place this type of piece at X/Y
                    let posOptions = this.getOptionsAsList(board, CombinatorialGame.prototype.LEFT, true);
                    allMoves = allMoves.concat(posOptions); // Add all moves for this player
                    board.place(0, x, y); // Remove the piece we placed
                }
            }
        }
    
        // Avoid premature deduplication: Keep all unique moves exactly as Python
        // To accurately collect unique moves, convert each move into a string format and re-convert it to an array format
        let uniqueMoves = allMoves.filter(
            (move, index, self) => index === self.findIndex((m) => JSON.stringify(m) === JSON.stringify(move))
        );
    
        return uniqueMoves;
    },    

    getOptionsAsList: function(position, playerIndex, ignoreLastMove) {
        if (ignoreLastMove) {
            position.lastMove = false
        }
        let optionPositions = position.getOptionsForPlayer(playerIndex, true);
        let options = [];
        for (let i = 0; i < optionPositions.length; i++) {
            let opt = optionPositions[i].lastMove;
            options.push([opt[1],opt[2],opt[3],opt[4]]); // Reformat option as (fromX, fromY, toX, toY)
        }
        return options;
    },

    rotateBoard: function(board) {
        const rotatedBoard = board.map(row => [...row]); // Copy board
        rotatedBoard.reverse(); // Flip X Axis
        for (let i = 0; i < rotatedBoard.length; i++) { // For each row
            rotatedBoard[i].reverse(); // Flip Y Axis
        }
        return rotatedBoard;
    },

    rotateOptions: function(options, width, height) {
        let w = width - 1;
        let h = height - 1;
        let rotated_options = [];
        for (let i = 0; i < options.length; i++) {
            let from_x = options[i][0];
            let from_y = options[i][1];
            let to_x = options[i][2];
            let to_y = options[i][3];
            rotated_options.push([w - from_x, h - from_y, w - to_x, h - to_y])
        }
        return rotated_options
    }
})

const MartianChessGreedyPlayer = Class.create(ComputerPlayer, {
    initialize: function() {
    },

    givePosition: function(playerIndex, position, referee) {
        // Return the best move
        options = position.getOptionsForPlayer(playerIndex);

        let greediest_option = null;
        let greediest_score = -999;
        for (let i = 0; i < options.length; i++) {
            let clone = position.clone();
            let opt = options[i].lastMove;
            clone.makeMove(playerIndex,opt[1],opt[2],opt[3],opt[4]);

            let score = clone.getScore();
            if (playerIndex == CombinatorialGame.prototype.RIGHT) {
                score = -score; // Flip score if we are playing on the bottom
            }
            if (score > greediest_score) {
                greediest_score = score;
                greediest_option = i;
            }
        }

        window.setTimeout(function(){referee.moveTo(options[greediest_option]);}, this.delayMilliseconds);
    },
})