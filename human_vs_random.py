from game.referee import MartianChessReferee
from players import HumanPlayer, RandomPlayer


human_player = HumanPlayer()
random_player = RandomPlayer()

referee = MartianChessReferee(random_player, human_player)
referee.play_round()