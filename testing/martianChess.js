var MartianChess = Class.create(ScoringCombinatorialGame, {
    // Core object functions
    initialize: function() {
        // Set variables
        this.width = 8
        this.height = 4
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
        playerPieces = self.getControlledPieces(playerId)
        options = []
        for (var pieceId = 0; pieceId < playerPieces.length; pieceId++) {
            pieceType, x, y = playerPieces[pieceId][0],playerPieces[pieceId][1],playerPieces[pieceId][2]
            pieceOptions = self.getOptionsForPiece(playerId, pieceType, x, y)
            for (var optionId = 0; optionId < pieceOptions.length; optionId++) {
                pieceOption = pieceOptions[optionId]
                options.push([x, y, pieceOption[0], pieceOption[1]])
            }
        }
        return options
    },

    // Supporting functions
    getSpace: function(x, y) {
        // Gets the piece at this space
        if (x >= 0 && y >= 0 && x < self.width && y < self.height) {
            return self.board[x][y]
        }
        else {
            return -1 // Out of bounds
        }
    },

    getControlArea: function(playerId) {
        // Returns the [x1,y1,x2,y2] area that a specific player has control over
        focus_x1, focus_y1, focus_x2, focus_y2 = 0,0,self.width-1,self.height-1
        if (playerId == CombinatorialGame.prototype.LEFT) {
            // Top player
            focus_y2 = Math.floor((self.height/2)-1)
        }
        else if (playerId == CombinatorialGame.prototype.RIGHT) {
            // Bottom player
            focus_y1 = Math.floor(self.height/2)
            focus_y2 = Math.floor(self.height-1)
        }
        return [focus_x1, focus_y1, focus_x2, focus_y2]
    },

    canPlayerTake: function(playerId, x, y) {
        // Returns true if the provided player is able to take a specific piece on the board
        if (self.getSpace(x, y) < 0) {
            return false // Out of bounds
        }
        else if (self.checkSpaceOwnership(playerId, x, y)) {
            return false // Can't take own piece
        }
        return true // All good
    },

    canFieldPromote: function(playerId, x, y, toX, toY) {
        // Checks if the player can perform a field promoting by moving piece x,y to toX,toY
        if (!self.checkSpaceOwnership(playerId, x, y) || !self.checkSpaceOwnership(playerId, toX, toY)) {
            return false // If player doesn't own both pieces field promotion cannot continue
        }

        pieceA = self.getSpace(piece_x, piece_y)
        pieceB = self.getSpace(to_x, to_y)
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
        control_area = self.getControlArea(playerId)
        return (x >= control_area[0] && x <= control_area[2] && y >= control_area[1] && y <= control_area[4])
    },

    getOptionsForPiece: function(playerId, pieceType, x, y) {
        // Gets available moves for a piece
        moves = []

        if (pieceType == 1) {
            // Pawn
            offsets = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            for (var i = 0; i < offsets.length; i++) {
                offset = offsets[i]
                moves.push([x + offset[0], y + offset[1]])
            }
        }
        else if (pieceType == 2) {
            // Drone
            directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]

            for (var i = 0; i < directions.length; i++) {
                // Start moving in a direction
                dir = directions[i]
                cx, cy = x, y
                for (var d = 0; d < 2; d++) { // Up to 2 spaces away
                    cx = cx + dir[0]
                    cy = cy + dir[1]
                    if (self.getSpace(cx, cy) < 0) {
                        break // Out of bounds, stop now
                    }
                    moves.append((cx, cy)) // Add this move as potentially available
                    if (self.getSpace(cx, cy) > 0) {
                        // There's a piece here so let's not go any further
                        break
                    }
                }
            }
        }
        else if (pieceType == 2) {
            // Queen
            directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [-1, -1], [-1, 1], [1, -1], [1, 1]]

            for (var i = 0; i < directions.length; i++) {
                // Start moving in a direction
                dir = directions[i]
                cx, cy = x, y
                while (true) { // Queen can move as far as they want
                    cx = cx + dir[0]
                    cy = cy + dir[1]
                    if (self.getSpace(cx, cy) < 0) {
                        break // Out of bounds, stop now
                    }
                    moves.append((cx, cy)) // Add this move as potentially available
                    if (self.get_space(cx, cy) > 0) {
                        // There's a piece here so let's not go any further
                        break
                    }
                }
            }
        }

        // Check legality of potential moves
        options = []
        for (var i = 0; i < moves.length; i++) { 
            cx, cy = moves[i][0], moves[i][1]

            // Prevent move rejection (undoing the last player's move)
            if (this.lastMove && this.lastMove[5] == true && this.lastMove[0] == cx && this.lastMove[1] == cy && this.lastMove[2] == x && this.lastMove[3] == y) {
                continue // Skip to next move
            }

            // Allow legal moves
            if (self.get_space(cx, cy) == 0) { // Move to empty space
                options.push([cx, cy])
            }
            else if (self.canPlayerTake(playerId, x, y)) { // Take enemy piece
                options.push([cx, cy])
            }
            else if (self.canFieldPromote(playerId, x, y, cx, cy)) {
                options.push([cx, cy])
            }
        }

        // Return all legal moves
        return options
    },

    getControlledPieces: function(playerId) {
        // Returns a list of pieces that the player has control over in a list formatted as [pieceType, x, y]
        pieces = []
        control_area = self.getControlArea(playerId)
        control_x1, control_y1, control_x2, control_y2 = control_area[0],control_area[1],control_area[2],control_area[3]
        for (var x = control_x1; x <= control_x2; x++) {
            for (var y = control_y1; y <= control_y2; y++) {
                piece = self.getSpace(x, y)
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
        self.board[x][y] = piece
    },

    getPlayerScore: function(playerId) {
        // Return the individual score of a player
        if(self.playerId = "Left") {
            return this.topScore
        }
        else {
            return this.bottomScore
        }
    },

    // --- End of supporting functions for makeMove ---

    makeMove: function(playerId, x, y, toX, toY) {
        // Moves a selected piece to chosen position if possible
        pieceType = self.getSpace(x, y)
        options = self.getOptionsForPiece(playerId, pieceType, x, y)

        if(!(toX, toY) in options) {
            // Illegal move
            return false
        }
        
        // Perform Legal moves
        if(self.getSpace(toX, toY) == 0) {
            // Move to an empty space
            self.place(0, x, y)
            self.place(pieceType, toX, toY)
        }
        else if(self.canPlayerTake(playerId, toX, toY)) {
            // Space occupied by enemy piece that will be taken
            self.getPlayerScore(playerId) += self.getSpace(toX, toY)
            self.place(0, x, y)
            self.place(pieceType, toX, toY)
        }
        else if(self.canFieldPromote(playerId, x, y, toX, toY)) {
            // Give piece a field promotion
            promoteTo = self.canFieldPromote(playerId, x, y, toX, toY)
            self.place(0, x, y)
            self.place(promoteTo, toX, toY)
        }

        // Update the last move
        crossesCanal = !self.checkSpaceOwnership(playerId, toX, toY)
        self.lastMove = {"player": playerId, "fromX": x, "fromY": y, "toX": toX, "toY": toY, "crosses": crossesCanal} // Dont know if this is how this works in JavaScript
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
    var viewFactory = new GridDistanceGameInteractiveViewFactory(); // TODO: Once we have a view, plug it's factory in here.
    var playDelay = 1000;
    var controlForm = $('gameOptions');
    var leftPlayer = eval(getSelectedRadioValue(controlForm.elements['leftPlayer']));
    var rightPlayer =  eval(getSelectedRadioValue(controlForm.elements['rightPlayer']));
    const players = [leftPlayer, rightPlayer];
    var game = new MartianChess();
    var ref = new Referee(game, players, viewFactory, "MainGameBoard", $('messageBox'), controlForm);
    
};

class MartianChessView { // view class -cam
    constructor() {
        this.container = document.getElementById('chess-board') // Make container element witht this -cam
        this.images = []

        // Now we have to load the images and store them
        var imageFiles = ["empty.png", "pawn.png", "drone.png", "queen.png"]

        for (let img of imageFiles) {
            var image = new Image()
            image.src = 'game/images/${img}'
            this.images.push(image)
        }
    }

    redraw(boardState) { // gets rid of board contents -cam
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild)
        
        }
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

var MartianChessViewFactory = Class.create({ // MartianChess ViewFactory

    initialize: function() {
    },

    getInteractiveBoard: function(position) {
        return new MartianChessView(position);
    },

    getView: function(position) {
        return this.getInteractiveBoard(position);
    },

});

    //     constructor(position) { // Position constructor (makes the position that's passed in, the new object's position data member and starts the tile and the move as undefined) 
    //         this.position = position; 
    //         this.selectedTile = undefined;
    //         this.selectedMove = undefined;
        
    
    //     draw: function(containerElement, listener) {
            
    //         this.selectedTile = undefined;
    //         // writing out the board
    //         const contents = [];
    //         const width = this.position.getWidth();
    //         const height = this.position.getHeight();
    //         for (var col = 0; col < width; col++) { // width or this.position.size for condition? -cam
    //             const column = [];
    //             for (var row = 0; row < height; row++) { // height or this.position.size?
    //                 column.push("");
    //             }
    //             contents.push(column);
    //         }
    
    //         //clear out the other children of the container element
    //         while (containerElement.hasChildNodes()) {
    //             containerElement.removeChild(containerElement.firstChild);
    //         }
    //         var svgNS = "http://www.w3.org/2000/svg";
    //         var boardSvg = document.createElementNS(svgNS, "svg");
    //         //now add the new board to the container
    //         containerElement.appendChild(boardSvg);
    //         var boardWidth = Math.min(getAvailableHorizontalPixels(containerElement), window.innerWidth - 200);
    //         var boardPixelSize = Math.min(window.innerHeight, boardWidth);
    //         //var boardPixelSize = 10 + (this.position.sideLength + 4) * 100
    //         boardSvg.setAttributeNS(null, "width", boardPixelSize);
    //         boardSvg.setAttributeNS(null, "height", boardPixelSize);
            
    //         //get some dimensions based on the canvas size
    //         var maxCircleWidth = (boardPixelSize - 10) / width;
    //         var maxCircleHeight = (boardPixelSize - 10) / (height + 2);
    //         var maxDiameter = Math.min(maxCircleWidth, maxCircleHeight);
    //         var padPercentage = .2;
    //         var boxSide = maxDiameter;
    //         var nodeRadius = Math.floor(.5 * maxDiameter * (1-padPercentage));
    //         var nodePadding = Math.floor(maxDiameter * padPercentage);
            
    //         //draw a gray frame around everything
    //         var frame = document.createElementNS(svgNS, "rect");
    //         frame.setAttributeNS(null, "x", 5);
    //         frame.setAttributeNS(null, "y", 5);
    //         frame.setAttributeNS(null, "width", width * boxSide);
    //         frame.setAttributeNS(null, "height", height * boxSide);
    //         frame.style.strokeWidth = 4;
    //         frame.style.stroke = "gray";
    //         boardSvg.appendChild(frame);
            
    //         //draw the board
    //         for (var colIndex = 0; colIndex < width; colIndex++) {
    //             //draw the boxes in this column
    //             for (var rowIndex = 0; rowIndex < height; rowIndex ++) {
    //                 var text = "";
    //                 var square = document.createElementNS(svgNS, "rect");
    //                 var x = 5 + Math.floor((colIndex) * boxSide);
    //                 var y = 5 + Math.floor((rowIndex) * boxSide);
    //                 square.setAttributeNS(null, "x", x);
    //                 square.setAttributeNS(null, "y", y);
    //                 square.setAttributeNS(null, "width", boxSide+1);
    //                 square.setAttributeNS(null, "height", boxSide+1);
    //                 square.style.stroke = "black";
    //                 square.style.strokeWidth = 2;
    //                 square.style.fill = "white";
    //                 var content = this.position.board[colIndex][rowIndex];
    //                 if (content.includes("stone")) {
    //                     square.style.fill = "gray";
    //                 }
                    
    //                 const textColor = (content.includes("blue")) ? "blue" : "red";
                    
    //                 if (listener != undefined) {
    //                     var player = listener;
    //                     square.popType = "single";
    //                     square.column = colIndex;
    //                     square.row = rowIndex;
    //                     square.box = square; // so the text and this can both refer to the square itself
    //                     square.onclick = function(event) {player.handleClick(event);}
    //                     square.text = text;
    //                     square.color = textColor;
    //                 }
    //                 boardSvg.appendChild(square);
                    
    //                 if (text != "") {
    //                     const textBuffer = Math.ceil(.17 * boxSide);
    //                     const textElement = document.createElementNS(svgNS, "text");
    //                     textElement.setAttributeNS(null, "x", x + textBuffer);//+ 20);
    //                     textElement.setAttributeNS(null, "y", y + boxSide - textBuffer );//+ 20);
    //                     const textSize = Math.ceil(.8 * boxSide);
    //                     textElement.setAttributeNS(null, "font-size",  textSize);
    //                     //textElement.setAttributeNS(null, "color", textColor);
    //                     textElement.style.fill = textColor;
                            
    //                     textElement.textContent = text;
    //                     textElement.column = colIndex;
    //                     textElement.row = rowIndex;
    //                     textElement.box = square;
    //                     if (listener != undefined) {
    //                         var player = listener;
    //                         square.popType = "single";
    //                         square.column = colIndex;
    //                         square.row = rowIndex;
    //                         square.box = square; // so the text and this can both refer to the square itself
    //                         square.onclick = function(event) {player.handleClick(event);}
    //                         textElement.onclick = function(event) {player.handleClick(event);}
    //                     }
    //                     boardSvg.appendChild(textElement);
    //                 }
    //             }
    //         }
    //         this.graphics = boardSvg;
    //     }
    
    //     selectTile: function(tile) {
    //         this.selectedTile = tile;
    //         //this.selectedTile.oldColor = this.selectedTile.style.fill;
    //         //this.selectedTile.style.fill = "yellow";
    //         this.addXs(this.selectedTile.box.column, this.selectedTile.box.row);
    //     }
    
    //     deselectTile: function() {
    //         //this.selectedTile.style.fill = this.selectedTile.oldColor;
    //         this.selectedTile = undefined;
    //         this.removeXs();
    //     }
    
    //     selectMoveTile: function(tile) {
    //         this.removeXs();
    //         this.selectedMove = tile;
    //         //this.selectedMove.oldColor = this.selectedMove.style.fill;
    //         //this.selectedMove.style.fill = "yellow";
    //         this.addXs(this.selectedMove.box.column, this.selectedMove.box.row);
    //     }
    
    //     deselectMoveTile: function(tile) {
    //         //this.selectedMove.style.fill = this.selectedMove.oldColor;
    //         this.selectedMove = undefined;
    //         this.removeXs();
    //     }
    
    //     addXs: function(col, row) {
    //         this.stoneOptionXs = [];
    //         const boardPixelWidth = this.graphics.getAttributeNS(null, "width");
    //         const boardPixelHeight = this.graphics.getAttributeNS(null, "height");
    //         const width = this.position.getWidth();
    //         const height = this.position.getHeight();
    //         var maxCircleWidth = (boardPixelWidth - 10) / width;
    //         var maxCircleHeight = (boardPixelHeight - 10) / (height + 2);
    //         var maxDiameter = Math.min(maxCircleWidth, maxCircleHeight);
    //         const boxSide = maxDiameter;
    //         //const boxSide = boardPixelWidth / width;
    //         var svgNS = "http://www.w3.org/2000/svg";
    //         //console.log("boardPixelSize: " + boardPixelSize);
    //         const piecePlcmnt = [col, row];
    //         const prevPiecePlcmnt = [this.selectedTile.column, this.selectedTile.row];
    //         const locations = this.position.movableTiles(piecePlcmnt, this.position.getBoard(), prevPiecePlcmnt);
    
    //         for (var i = 0; i < locations.length; i++) {
    //             const location = locations[i];
    
    //             const x = 5 + Math.floor(location[0] * boxSide);
    //             const y = 5 + Math.floor(location[1] * boxSide);
    //             const topLeft = [x, y];
    //             const topRight = [x + boxSide, y];
    //             const bottomLeft = [x, y + boxSide];
    //             const bottomRight = [x + boxSide, y + boxSide];
    //             const textPadding = 10;
    //             const line1 = document.createElementNS(svgNS, "line");
    //             line1.setAttributeNS(null, "x1", topLeft[0]);
    //             line1.setAttributeNS(null, "y1", topLeft[1]);
    //             line1.setAttributeNS(null, "x2", bottomRight[0]);
    //             line1.setAttributeNS(null, "y2", bottomRight[1]);
    //             line1.style.stroke = "black";
    //             line1.style.strokeWidth = "2";
    //             line1.height = "" + boxSide;
    //             line1.width = "" + boxSide;
    //             this.graphics.appendChild(line1);
    //             this.stoneOptionXs.push(line1);
    //             const line2 = document.createElementNS(svgNS, "line");
    //             line2.setAttributeNS(null, "x1", topRight[0]);
    //             line2.setAttributeNS(null, "y1", topRight[1]);
    //             line2.setAttributeNS(null, "x2", bottomLeft[0]);
    //             line2.setAttributeNS(null, "y2", bottomLeft[1]);
    //             line2.style.stroke = "black";
    //             line2.style.strokeWidth = "2";
    //             line2.height = "" + boxSide;
    //             line2.width = "" + boxSide;
    //             this.graphics.appendChild(line2);
    //             this.stoneOptionXs.push(line2);
    
    //         }
    //     }
    
    //     removeXs: function() {
    //         for (var i = 0; i < this.stoneOptionXs.length; i++) {
    //             this.graphics.removeChild(this.stoneOptionXs[i]);
    //         }
    //         this.stoneOptionXs = [];
    //     }
    
    //     getNextPositionFromClick: function(event, currentPlayer, containerElement) {
    //         var clickedTile = event.target.box;
    //         // Determine the pawn, drone, or queen the player wants to move
    //         if (this.selectedTile === undefined) {
    //             //console.log("First case!");
    //             const text = clickedTile.text;
    //             const piecePlayer = clickedTile.color === "blue" ? 0 : 1;
    //             if (text === "A" && piecePlayer === currentPlayer) {
    //                 this.selectTile(clickedTile);
    //             }
    //             return null;
    //         }
    //         // Determine where the player wants to move the piece
    //         else if (this.selectedMove === undefined) {
    //             // Takesies-backsies
    //             if (clickedTile === this.selectedTile) {
    //                 this.deselectTile();
    //                 return null;
    //             }
    //             const text = clickedTile.text;
    //             const piecePlcmnt = [this.selectedTile.column, this.selectedTile.row];
    //             const selectedMoveTile = [clickedTile.column, clickedTile.row];
    
    //             const board = this.position.getBoard();
    //             const possibleMovements = this.position.movableTiles(piecePlcmnt, board);
                
    //             var flag = false;
    //             for(var i = 0; i < possibleMovements.length; i++) {
    //                 const possibleMove = possibleMovements[i];
    
    //                 if (text != "stone" && this.position.coordinatesEquals(selectedMoveTile, possibleMove)) {
    //                     flag = true;
    //                     break;
    //                 }
    //             }
    
    //             if (flag) {
    //                 this.selectMoveTile(clickedTile);
    //             }
    //         }
    //         // Determine which tile the player wants to capture
    //         else {
    //             const text = clickedTile.text;
    //             const prevPiecePlcmnt = [this.selectedTile.column, this.selectedTile.row];
    //             const piecePlcmnt = [this.selectedMove.column, this.selectedMove.row];
    //             const capturedTile = [clickedTile.column, clickedTile.row];
    
    //             if (clickedTile === this.selectedMove) { // changed some == to === for strict equality -cam
    //                 this.deselectMoveTile();
    //                 this.selectTile(this.selectedTile);
    //                 return null;
    //             }
    
    //             const board = this.position.getBoard();
    
    //             possibleTiles = this.position.movableTiles(piecePlcmnt, board, prevPiecePlcmnt);
    
    //             for (var i = 0; i < possibleTiles.length; i++) {
    //                 const possibleTile = possibleTiles[i];
    
    //                 if (text != "stone" && this.position.coordinatesEquals(capturedTile, possibleTile)) {
    //                     flag = true;
    //                     break;
    //                 }
    //             }
    
    //             if (flag) {
    //                 const occupiedTile = [this.selectedTile.column, this.selectedTile.row];
    //                 const moveTile = [this.selectedMove.column, this.selectedMove.row];
    
    //                 const option = this.position.getOptionFromMove(occupiedTile, moveTile, capturedTile);
    
    //                 this.deselectTile();
    //                 this.deselectMoveTile();
    //                 return option;
    //             }
    //         }
    //     }
    // }};