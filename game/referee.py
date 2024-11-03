from copy import deepcopy
from game.board import MartianChessBoard
from game.enum import PlayerID
from game.view import MartianChessView
from players.base import BasePlayer


class MartianChessReferee:
    def __init__(self, top_player: BasePlayer, bottom_player: BasePlayer, display_board: bool = True, first_player: str | None = None, move_limit: int | None = None):
        self.game = MartianChessBoard()
        self.display_board = display_board
        if display_board:
            self.view = MartianChessView()
        self.top_player = top_player
        self.bottom_player = bottom_player
        self.first_player = first_player or PlayerID.BOTTOM
        self.move_limit = move_limit or 200


    def play_round(self):
        """Plays one game with the two players provided during referee creation. Returns the PlayerID of the winner"""
        # Reset board state
        self.game.reset_board()
        self.active_player_id = self.first_player

        # Game loop
        winner = False
        move_count = 0
        while not winner:
            if self.display_board:
                self.view.redraw(self.game.board) # Update view

            # Get options for player
            player_object = self._get_player_object(self.active_player_id)
            options = self.game.get_player_options(self.active_player_id)

            # Ask player to make move
            player_move = player_object.make_move(              # Kindly ask the player to make a move
                deepcopy(self.game.board),                      # Giving them the board state,
                options,                                        # Legal moves list,
                self.active_player_id,                          # Player ID,
                self._get_player_score(self.active_player_id)   # And current score.
            )
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
            
            # Limit max moves
            move_count += 1
            if move_count == self.move_limit:
                # They both lose
                other = self._get_other_player(self.active_player_id)
                self._get_player_object(self.active_player_id).game_over(False, -100)
                self._get_player_object(other).game_over(False, -100)
                return False, 0

        # Inform players of their result and final score
        if self.display_board:
            print(f"{winner.upper()} Player was victorious!")
        loser = self._get_other_player(winner)
        self._get_player_object(winner).game_over(True, self._get_player_score(winner))
        self._get_player_object(loser).game_over(False, self._get_player_score(loser))
        print("Moves:",move_count,"| ",end="") # TEMP printout
        return winner, self._get_player_score(PlayerID.TOP) - self._get_player_score(PlayerID.BOTTOM)


    def _get_other_player(self, player_id):
        """Returns the other player ID when the current player is provided"""
        if player_id == PlayerID.BOTTOM:
            return PlayerID.TOP
        else:
            return PlayerID.BOTTOM

    def _get_player_object(self, player_id):
        """Returns the player object associated with this player ID"""
        return self.bottom_player if player_id == PlayerID.BOTTOM else self.top_player
    
    def _get_player_score(self, player_id):
        """Returns the score of the player with a given ID"""
        return self.game.points[player_id]