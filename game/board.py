class MartianChessBoard:
    width: int      # The width of the board
    height: int     # The height of the board
    board: list     # Stores the current board state


    def __init__(
        self, 
        width: int | None = 4,  # Width of the board, defaults to 4
        height: int | None = 8, # Height of the board, defaults to 8
        default_setup: bool | None = True   # Whether or not to automatically place the default pieces for a 2 player game.
    ):
        # Set board parameters
        self.width = width
        self.height = height

        # Initialize board
        self.board = [[0 for y in range(height)] for x in range(width)]
        if default_setup:
            self._place_default_pieces()


    def place(self, piece, x, y):
        """Places the given piece at the requested XY coordinates. (0=none, 1=pawn, 2=drone, 3=queen)"""
        self.board[x][y] = piece


    def _place_default_pieces(self):
        """Manually places the pieces for the default game"""
        pieces_to_place = [(3,0,0),(3,1,0),(3,0,1),(2,2,0),(2,1,1),(2,0,2),(1,1,2),(1,2,2),(1,2,1)]
        # Place top left pieces
        for piece in pieces_to_place:
            self.place(piece[0],piece[1],piece[2])
        # Place bottom right pieces
        w,h = self.width-1, self.height-1
        for piece in pieces_to_place:
            self.place(piece[0],w-piece[1],h-piece[2])