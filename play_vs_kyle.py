from game.enum import PlayerID
from game.referee import MartianChessReferee
from players import RandomPlayer, NeuralnetPlayer, DepthSearchPlayer, HumanPlayer


random_player = DepthSearchPlayer()
ai_player = NeuralnetPlayer("network.pt", gamma=0.95, epsilon=0.01, learning_rate=0.001, move_penalty=0.1, repeat_penalty=10, weights_save_freq=5)

referee = MartianChessReferee(ai_player, random_player, True)

top_wins = 0
bottom_wins = 0
ctr = 0
while True:
    ctr += 1
    res, score = referee.play_round()
    drawstr = ""
    if res == False:
        drawstr = "[Draw]"
    elif res == PlayerID.TOP:
        top_wins += 1
    else:
        bottom_wins += 1
    print("Game:", ctr, " | RL wins:", top_wins," | Kyle wins:",bottom_wins,"| Win %:",int((top_wins/ctr)*100),"| Score:", score, drawstr)

print("TOURNAMENT RESULTS")
print(top_wins)
print(bottom_wins)