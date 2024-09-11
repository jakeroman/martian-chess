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
        return this.bottomScore - this.topScore
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
    
    getOptionsForPlayer: function(playerId) {
        // Returns a list of all moves a player can currently make in format [x, y, toX, toY]
        playerPieces = this.getControlledPieces(playerId)
        var options = []
        for (var pieceId = 0; pieceId < playerPieces.length; pieceId++) {
            var pieceType = playerPieces[pieceId][0]
            var x = playerPieces[pieceId][1] 
            var y = playerPieces[pieceId][2]
            pieceOptions = this.getOptionsForPiece(playerId, pieceType, x, y)
            var numOptions = pieceOptions.length
            for (var optionId = 0; optionId < numOptions; optionId++) {
                pieceOption = pieceOptions[optionId]

                // Clone the board and make the move
                option = this.clone()
                console.log(pieceOption)
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
        return [focus_x1, focus_y1, focus_x2, focus_y2]
    },

    canPlayerTake: function(playerId, x, y) {
        // Returns true if the provided player is able to take a specific piece on the board
        if (this.getSpace(x, y) < 0) {
            return false // Out of bounds
        }
        else if (this.checkSpaceOwnership(playerId, x, y)) {
            return false // Can't take own piece
        }
        return true // All good
    },

    canFieldPromote: function(playerId, x, y, toX, toY) {
        // Checks if the player can perform a field promoting by moving piece x,y to toX,toY
        if (!this.checkSpaceOwnership(playerId, x, y) || !this.checkSpaceOwnership(playerId, toX, toY)) {
            return false // If player doesn't own both pieces field promotion cannot continue
        }

        pieceA = this.getSpace(piece_x, piece_y)
        pieceB = this.getSpace(to_x, to_y)
        if ((pieceA == 1 && pieceB == 2) || (pieceA == 2 && pieceB == 1)) {
            // Field promotion to queen possible
            return 3
        }
        else if (pieceA == 1 && pieceB == 1) {
            // Field promotion to drone possible
            return 2
        }
    },

    checkSpaceOwnership: function(playerId, x, y) {
        // Returns true if the player has control over the square at X,Y
        var control_area = this.getControlArea(playerId)
        return (x >= control_area[0] && x <= control_area[2] && y >= control_area[1] && y <= control_area[4])
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
                    moves.push((cx, cy)) // Add this move as potentially available
                    if (this.getSpace(cx, cy) > 0) {
                        // There's a piece here so let's not go any further
                        break
                    }
                }
            }
        }
        else if (pieceType == 2) {
            // Queen
            var directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [-1, -1], [-1, 1], [1, -1], [1, 1]]

            for (var i = 0; i < directions.length; i++) {
                // Start moving in a direction
                var dir = directions[i]
                var cx, cy = x, y
                while (true) { // Queen can move as far as they want
                    cx = cx + dir[0]
                    cy = cy + dir[1]
                    if (this.getSpace(cx, cy) < 0) {
                        break // Out of bounds, stop now
                    }
                    moves.append((cx, cy)) // Add this move as potentially available
                    if (this.get_space(cx, cy) > 0) {
                        // There's a piece here so let's not go any further
                        break
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
            if (this.lastMove && this.lastMove[5] == true && this.lastMove[0] == cx && this.lastMove[1] == cy && this.lastMove[2] == x && this.lastMove[3] == y) {
                continue // Skip to next move
            }

            // Allow legal moves
            if (this.getSpace(cx, cy) == 0) { // Move to empty space
                options.push([cx, cy])
            }
            else if (this.canPlayerTake(playerId, x, y)) { // Take enemy piece
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
        pieces = []
        control_area = this.getControlArea(playerId)
        var control_x1 = control_area[0]
        var control_y1 = control_area[1]
        var control_x2 = control_area[2]
        var control_y2 = control_area[3]
        for (var x = control_x1; x <= control_x2; x++) {
            for (var y = control_y1; y <= control_y2; y++) {
                piece = this.getSpace(x, y)
                if (piece > 0) {
                    pieces.push([piece, x, y])
                }
            }
        }
        return pieces
    },

    // --- Supporting functions for makeMove function ---

    place: function(piece, x, y) {
        // Place a piece at a given position on the board
        this.board[x][y] = piece
    },

    getPlayerScore: function(playerId) {
        // Return the individual score of a player
        if(this.playerId = "Left") {
            return this.topScore
        }
        else {
            return this.bottomScore
        }
    },

    // --- End of supporting functions for makeMove ---

    makeMove: function(playerId, x, y, toX, toY) {
        // Moves a selected piece to chosen position if possible
        console.log("Make move was indeed called: "+ playerId+","+x+","+y+","+toX+","+toY)
        var pieceType = this.getSpace(x, y)
        var options = this.getOptionsForPiece(playerId, pieceType, x, y)

        if(!(toX, toY) in options) {
            // Illegal move
            return false
        }
        
        // Perform Legal moves
        if(this.getSpace(toX, toY) == 0) {
            // Move to an empty space
            console.log("We moved to an empty space")
            this.place(0, x, y)
            this.place(pieceType, toX, toY)
        }
        else if(this.canPlayerTake(playerId, toX, toY)) {
            // Space occupied by enemy piece that will be taken
            console.log("We took an enemy piece")
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
        else if(this.canFieldPromote(playerId, x, y, toX, toY)) {
            // Give piece a field promotion
            console.log("We did a field promotion")
            var promoteTo = this.canFieldPromote(playerId, x, y, toX, toY)
            this.place(0, x, y)
            this.place(promoteTo, toX, toY)
        }

        // Update the last move
        var crossesCanal = !this.checkSpaceOwnership(playerId, toX, toY)
        this.lastMove = {"player": playerId, "fromX": x, "fromY": y, "toX": toX, "toY": toY, "crosses": crossesCanal} // Dont know if this is how this works in JavaScript
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
    var leftRadio = getRadioPlayerOptions(CombinatorialGame.prototype.LEFT);
    leftPlayerElement.appendChild(leftRadio);
    container.appendChild(createGameOptionDiv("Top:", leftPlayerElement));

    var rightRadio = getRadioPlayerOptions(CombinatorialGame.prototype.RIGHT);
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
 * The start game function which fires up a new round of Martian Chess.
 */
function newMartianChessGame() {
    var viewFactory = new MartianChessViewFactory();
    var playDelay = 1000;
    var controlForm = $('gameOptions');
    var leftPlayer = eval(getSelectedRadioValue(controlForm.elements['leftPlayer']));
    var rightPlayer =  eval(getSelectedRadioValue(controlForm.elements['rightPlayer']));
    const players = [leftPlayer, rightPlayer];
    var game = new MartianChess();
    var ref = new Referee(game, players, viewFactory, "MainGameBoard", $('messageBox'), controlForm);
}

const MartianChessView = Class.create({
    initialize: function(position) {
        this.position = position;
        this.selectedTile = undefined;
    },

    draw(containerElement, listener) {
        // Clear out the children of containerElement
        while (containerElement.hasChildNodes()) {
            containerElement.removeChild(containerElement.firstChild);
        }
        var svgNS = "http://www.w3.org/2000/svg";
        var boardSvg = document.createElementNS(svgNS, "svg");
        // Now add the new board to the container
        containerElement.appendChild(boardSvg);
        boardSvg.setAttributeNS(null, "width", 10 + this.position.width * 100);
        boardSvg.setAttributeNS(null, "height", 10 + this.position.height * 100);

        // Draw the Martian Chess board
        for (var i = 0; i < this.position.width; i++) {
            for (var j = 0; j < this.position.height; j++) {
                // Draw the tile
                var parityString = "Even";
                if ((i+j) % 2 == 1) {
                    parityString = "Odd";
                }
                var checkerTile = document.createElementNS(svgNS,"rect");
                checkerTile.setAttributeNS(null, "x", (i * 100) + "");
                checkerTile.setAttributeNS(null, "y", (j * 100) + "");
                checkerTile.setAttributeNS(null, "height", "100");
                checkerTile.setAttributeNS(null, "width", "100");
                checkerTile.setAttributeNS(null, "class", "martianChess" + parityString + "Tile");
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
        dividingLine.setAttributeNS(null, "y", ((this.position.height/2) * 100) - 4 + "");
        dividingLine.setAttributeNS(null, "height", "8");
        dividingLine.setAttributeNS(null, "width", new String(this.position.width * 100));
        dividingLine.setAttributeNS(null, "class", "martianChessDivide");
        boardSvg.appendChild(dividingLine);

        // Draw pieces (TODO: Rework this to draw the martian chess pieces)
        for (var i = 0; i < this.position.width; i++) {
            for (var j = 0; j < this.position.height; j++) {
                // Draw the piece if it exists
                piece = this.position.getSpace(i,j)
                if (piece > 0) {
                    // Determine size
                    var size = 0
                    if (piece == 1) {
                        size = 30 // Pawn
                    }
                    else if (piece == 2) {
                        size = 55 // Drone
                    }
                    else if (piece == 3) {
                        size = 80 // Queen
                    }

                    // Draw piece
                    var checkerTile = document.createElementNS(svgNS,"rect");
                    checkerTile.setAttributeNS(null, "x", (i * 100) + ((100-size)/2) + "");
                    checkerTile.setAttributeNS(null, "y", (j * 100) + ((100-size)/2) + "");
                    checkerTile.setAttributeNS(null, "height", new String(size));
                    checkerTile.setAttributeNS(null, "width", new String(size));
                    checkerTile.setAttributeNS(null, "class", "martianChessPiece");
                    boardSvg.appendChild(checkerTile);
                    if (listener != undefined) {
                        var player = listener;
                        checkerTile.onclick = function(event) {player.handleClick(event);}
                    }
                }
            }
        }


        // for (var playerId = 0; playerId < 2; playerId++) {
        //     for (var i =0; i < this.position.dominoes[playerId].length; i++) {
        //         var domino = this.position.dominoes[playerId][i];
        //         var column = domino[0];
        //         var row = domino[1];
        //         var dominoRect = document.createElementNS(svgNS, "rect");
        //         dominoRect.setAttributeNS(null, "x", new String(10 + column * 100));
        //         dominoRect.setAttributeNS(null, "y", new String(10 + row * 100));
        //         //these two lines round the corners
        //         dominoRect.setAttributeNS(null, "rx", "10");
        //         dominoRect.setAttributeNS(null, "ry", "10");
        //         dominoRect.setAttributeNS(null, "width", new String(100 * (1 + playerId) - 20));
        //         dominoRect.setAttributeNS(null, "height", new String(100 * (2 - playerId) - 20));
        //         dominoRect.setAttributeNS(null, "class", "domino");
        //         boardSvg.appendChild(dominoRect);
        //     }
        // }

        // // Draw the blocked spaces
        // for (var i = 0; i < this.position.blockedSpaces.length; i++) {
        //     // console.log("Adding the block: " + this.position.blockedSpaces[i]);
        //     var block = this.position.blockedSpaces[i];
        //     var column = block[0];
        //     var row = block[1];
        //     var blockRect = document.createElementNS(svgNS, "rect");
        //     blockRect.setAttributeNS(null, "x", new String(5 + column * 100));
        //     blockRect.setAttributeNS(null, "y", new String(5 + row * 100));
        //     blockRect.setAttributeNS(null, "width", "90");
        //     blockRect.setAttributeNS(null, "height", "90");
        //     blockRect.setAttributeNS(null, "class", "domino");
        //     boardSvg.appendChild(blockRect);
        // }
    },

    redraw(boardState) { // gets rid of board contents -cam
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild)
        
        }
        // Draw board again
        for (let x = 0; x < boardState.length; x++) {
            const col = boardState[x]
            for (let y = 0; y < col.length; y++) {
                const boardVal = col[y]
    
                var imgElement = document.createElement('img') // creates new HTML image object
                imgElement.src = this.images[boardVal].src // sets source of new image obj to the appropriate image for the piece necessary
    
                // Now we need to put the element somewhere, perferably its correct spot
                var cell = document.createElement('div') // creates div element 
    
                // Position the div correctly on the board
                cell.style.gridRowStart = y
                cell.style.gridColStart = x
    
                // Display image in the div
                cell.appendChild(imgElement)
                
                this.container.appendChild(cell) // Add the div to the HTML container as a child
            }
    
        }
    }
});

const MartianChessViewFactory = Class.create({ // MartianChess ViewFactory

    initialize: function() {
    },

    getInteractiveBoard: function(position) {
        return new MartianChessView(position);
    },

    getView: function(position) {
        return this.getInteractiveBoard(position);
    },

});