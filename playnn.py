from game.referee import MartianChessReferee
from players import HumanPlayer, NeuralnetPlayer, RandomPlayer


human_player = RandomPlayer()
neural_player = NeuralnetPlayer()

referee = MartianChessReferee(neural_player, human_player)
referee.play_round()