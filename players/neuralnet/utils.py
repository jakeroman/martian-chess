import numpy as np
from game.board import MartianChessBoard


class NeuralPlayerUtils:
    @staticmethod
    def get_all_possible_moves(board_width, board_height):
        """Return a list of all possible move coordinates on the given board size in a list of format (from_x, from_y, to_x, to_y)"""
        # Setup an empty board
        board = MartianChessBoard(board_width, board_height, False)
        width = board.width
        height = board.height

        # Gather all moves by iterating piece types in every location
        all_moves = []
        for x in range(width):
            for y in range(height):
                for piece in range(3):
                    board.place(piece+1, x, y) # Place this type of piece at X/Y
                    for player in board.players:
                        all_moves.extend(board.get_player_options(player)) # Add all moves for this player
                    board.place(0, x, y) # Remove the piece we placed

        # Gather unique elements from that huge list
        unique_moves = list(set(all_moves))
        return unique_moves
    
    @staticmethod
    def flat_one_hot_encode_board(board):
        """Takes the given board and turns it into a 3 dimensional representation (x, y, piece type) of one hot encoded values"""
        board_array = np.array(board)
    
        # Split each piece type into its own 2D board, where 1 represents the existence of that piece.
        pawns_board = (board_array == 1).astype(float)
        drones_board = (board_array == 2).astype(float)
        queens_board = (board_array == 3).astype(float)
        
        # Combine each piece's board into a 3D representation
        one_hot_board = np.stack([pawns_board, drones_board, queens_board], axis=0)
        return one_hot_board
    
    @staticmethod
    def generate_move_mask(move_space, options):
        """Creates a mask of 1s and 0s representing which moves in the move space are legal options at this time"""
        options_set = set(options) # Convert options to a set for faster access
        mask = [1 if move in options_set else 0 for move in move_space]
        return np.array(mask)