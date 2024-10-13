from copy import deepcopy
import random
from game.board import MartianChessBoard
from game.enum import PlayerID
from players.base import BasePlayer


class DepthSearchPlayer(BasePlayer):
    def __init__(self, board_width: int = 4, board_height: int = 4, max_depth: int = 3):
        self.board_width = board_width
        self.board_height = board_height
        self.max_depth = max_depth

    def make_move(self, board, options, player, score):
        """Makes a move using recursive depth search algorithm"""
        self.active_player = player
        position = self.get_position_from_board(board, player)
        best_move = self.get_best_move(player, position, self.max_depth)
        try:
            return options.index(best_move["move"])
        except:
            return random.randint(0,len(options)-1)

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
        mcb.last_move = {"player": player}
        return mcb
    
    def get_position_value(self, position: MartianChessBoard):
        """Value a position based on who won it"""
        winner = position.is_game_over()
        if winner:
            return (1 if winner == self.active_player else -1)
        else:
            return 0

    def get_best_move(self, player, position: MartianChessBoard, depth: int):
        """Recursively determine best move for this player"""
        if depth <= 0 or position.is_game_over():
            return {"move": None, "score": self.get_position_value(position)}

        # Explore options
        best_score = -float('inf') if player == self.active_player else float('inf')
        best_move = None
        options = position.get_player_options(player)
        random.shuffle(options)

        for option in options:
            # Simulate option
            mcb = self.get_position_from_board(position.board, player)
            assert mcb.make_move(player, option[0], option[1], option[2], option[3])

            # Recursively get best move for other player
            result = self.get_best_move(self.get_other_player(player), mcb, depth - 1)

            # Evaluate outcome
            if player == self.active_player: # Playing as AI
                if result["score"] > best_score: # This one is the new most beneficial to the AI
                    best_score = result["score"]
                    best_move = option
            else: # Playing as opponent
                if result["score"] < best_score: # This one is the new most beneficial to the opponent
                    best_score = result["score"]
                    best_move = option

        return {"move": best_move, "score": best_score}