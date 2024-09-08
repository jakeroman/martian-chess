from game.board import MartianChessBoard
from game.enum import PlayerID
from game.view import MartianChessView
from players.base import BasePlayer


class MartianChessReferee:
    def __init__(self, top_player: BasePlayer, bottom_player: BasePlayer, first_player: str | None = None):
        self.game = MartianChessBoard()
        self.view = MartianChessView()
        self.top_player = top_player
        self.bottom_player = bottom_player
        self.first_player = first_player or PlayerID.BOTTOM


    def play_round(self):
        """Plays one game with the two players provided during referee creation. Returns the PlayerID of the winner"""
        # Reset board state
        self.game.reset_board()
        self.active_player_id = self.first_player

        # Game loop
        winner = False
        while not winner:
            self.view.redraw(self.game.board) # Update view

            # Get options for player
            player_object = self.bottom_player if self.active_player_id == PlayerID.BOTTOM else self.top_player
            options = self.game.get_player_options(self.active_player_id)

            # Ask player to make move
            player_move = player_object.make_move(self.game.board, options, self.active_player_id)
            if not (isinstance(player_move, int) and player_move >= 0 and player_move < len(options)):
                print(f"{self.active_player_id.upper()} Player made move out of possible range. They forfeit")
                winner = self._get_other_player(self.active_player_id)
                break

            # Make the move
            move = options[player_move]
            success = self.game.make_move(self.active_player_id, move[0], move[1], move[2], move[3])
            if not success:
                raise Exception(f"Supposedly legal move was not able to be made: {move}. Active player: {self.active_player_id}")
            
            # Check for game over
            game_over = self.game.is_game_over()
            if game_over:
                winner = game_over
                break

            # Switch players
            self.active_player_id = self._get_other_player(self.active_player_id)

        # Game loop complete!
        print(f"{winner.upper()} Player was victorious!")
        return winner


    def _get_other_player(self, player_id):
        """Returns the other player ID when the current player is provided"""
        if player_id == PlayerID.BOTTOM:
            return PlayerID.TOP
        else:
            return PlayerID.BOTTOM