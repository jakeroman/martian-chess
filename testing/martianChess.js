var MartianChess = Class.create(ScoringCombinatorialGame, {
    initialize: function() {
        // Set variables
        this.width = 8
        this.height = 4
        this.topScore = 0
        this.bottomScore = 0

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
        for (let i = 0; i < length(piecesToPlace); i++) {
            var piece = piecesToPlace[i]
            this.board[piece[1]][piece[2]] = piece[0] // Place top left pieces
            this.board[this.width-piece[1]][this.height-piece[2]] = piece[0] // Place bottom right pieces
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

    getOptionsForPlayer: function(playerId) {
        // Tune in next week on Martian Chess!
        return true
    }
});

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