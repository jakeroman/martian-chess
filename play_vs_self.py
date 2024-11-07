from game.enum import PlayerID
from game.referee import MartianChessReferee
from players import NeuralnetPlayer


opponent = NeuralnetPlayer("network.pt", gamma=0.95, epsilon=0.03, learning_rate=0.00002, move_penalty=0.7, repeat_penalty=2, weights_save_freq = -1)
ai_player = NeuralnetPlayer("network.pt", gamma=0.95, epsilon=0.03, learning_rate=0.0002, move_penalty=0.25, repeat_penalty=2, capture_reward_weight=4)

referee = MartianChessReferee(ai_player, opponent, False, move_limit=500)

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
    print("Game:", ctr, " | RL wins:", top_wins," | Opponent wins:",bottom_wins,"| Win %:",int((top_wins/ctr)*100),"| Score:", score, drawstr)

print("TOURNAMENT RESULTS")
print(top_wins)
print(bottom_wins)