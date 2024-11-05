from game.enum import PlayerID
from game.referee import MartianChessReferee
from players import HumanPlayer, NeuralnetPlayer


random_player = HumanPlayer()
ai_player = NeuralnetPlayer("network.pt", learning_rate=0, epsilon=0)

referee = MartianChessReferee(ai_player, random_player, True, first_player=PlayerID.TOP)

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
    print("Game:", ctr, " | RL wins:", top_wins," | Random wins:",bottom_wins,"| Win %:",int((top_wins/ctr)*100),"| Score:", score, drawstr)

print("TOURNAMENT RESULTS")
print(top_wins)
print(bottom_wins)