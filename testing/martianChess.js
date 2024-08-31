var MartianChess = Class.create(ScoringCombinatorialGame, {
    // Core object functions
    initialize: function() {
        // Set variables
        this.width = 8
        this.height = 4
        this.topScore = 0
        this.bottomScore = 0
        this.lastMove = false // Once a move is made it will be replaced with [fromX, fromY, toX, toY, crossesCanal, player]

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