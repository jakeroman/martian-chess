from game.referee import MartianChessReferee
from players import RandomPlayer, HumanPlayer, DepthSearchPlayer


human_player = RandomPlayer()
dfs_player = DepthSearchPlayer()

referee = MartianChessReferee(dfs_player, human_player)
referee.play_round()