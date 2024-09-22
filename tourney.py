from game.enum import PlayerID
from game.referee import MartianChessReferee
from players import RandomPlayer, NeuralnetPlayer


random_player = RandomPlayer()
ai_player = NeuralnetPlayer("network.pt", gamma=0.9, learning_rate=0.005)

referee = MartianChessReferee(ai_player, random_player, False)

top_wins = 0
bottom_wins = 0
ctr = 0
while True:
    ctr += 1
    print("Game:", ctr, " | RL wins:", top_wins," | Random wins:",bottom_wins,"| Win %:",int((top_wins/ctr)*100))
    res = referee.play_round()
    if res == False:
        print("Draw")
    elif res == PlayerID.TOP:
        top_wins += 1
    else:
        bottom_wins += 1

print("TOURNAMENT RESULTS")
print(top_wins)
print(bottom_wins)