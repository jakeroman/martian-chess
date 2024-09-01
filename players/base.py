# Player base model, a foundational class for an actual player to be built upon.
class BasePlayer:
    def __init__():
        """This is called once when the object is created for initialization purposes."""

    def make_move(board, options):
        """The heart of any player, this will be called with the current board state and a list of legal moves that the player can make. 
        Return the options list index of the move you would like to make and the game will do it."""

    def game_over(winner, score):
        """This method will be called at the end of each game, with a boolean representing if you won, and score being a number
        which indicates the final score of the game, where higher numbers are better."""