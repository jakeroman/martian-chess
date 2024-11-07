# Player base model, a foundational class for an actual player to be built upon.
from copy import deepcopy
from game.board import MartianChessBoard
from game.enum import PlayerID
from players.base import BasePlayer


class GreedyPlayer(BasePlayer):
    def __init__(self, board_width: int = 4, board_height: int = 8, max_depth: int = 3):
        self.board_width = board_width
        self.board_height = board_height
        self.max_depth = max_depth
        
    def make_move(self, board, options, player, score):
        """The heart of any player, this will be called with the current board state, list of legal moves that the player can make, your player ID, and current score. 
        Return the options list index of the move you would like to make and the game will do it."""
        greediest_option = None
        greediest_score = -1
        for id, option in enumerate(options):
            position = self.get_position_from_board(board, player)
            position.make_move(player, option[0], option[1], option[2], option[3])
            score = position.points[player]
            if score > greediest_score:
                greediest_option = id
                greediest_score = score
        
        return greediest_option

    def get_other_player(self, player_id):
        """Returns the other player ID when the current player is provided"""
        if player_id == PlayerID.BOTTOM:
            return PlayerID.TOP
        else:
            return PlayerID.BOTTOM
        
    def get_position_from_board(self, board, player):
        """Turn a board state into a MartianChessBoard object"""
        mcb = MartianChessBoard(self.board_width, self.board_height)
        mcb.board = deepcopy(board)
        mcb.last_move = {"player": self.get_other_player(player)}
        return mcb