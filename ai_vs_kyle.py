from game.referee import MartianChessReferee
from players import NeuralnetPlayer, DepthSearchPlayer


ai_player = NeuralnetPlayer("network.pt", gamma=0.95, epsilon=0.1, learning_rate=0.001, move_penalty=0.5, repeat_penalty=10)
dfs_player = DepthSearchPlayer()

referee = MartianChessReferee(dfs_player, ai_player)
referee.play_round()