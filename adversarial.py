from game.enum import PlayerID
from game.referee import MartianChessReferee
from players import RandomPlayer, NeuralnetPlayer, HumanPlayer


top = NeuralnetPlayer("adv_top_network.pt", gamma=0.95, epsilon=0.05, learning_rate=0.001, move_penalty=0.1, repeat_penalty=10, time_penalty=0.5)
bottom = NeuralnetPlayer("adv_bottom_network.pt", gamma=0.95, epsilon=0.05, learning_rate=0.001, move_penalty=0.1, repeat_penalty=10, time_penalty=0.5)

referee = MartianChessReferee(top, bottom, False)

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
    print(f"Game: {ctr} | T Wins: {top_wins} ({int((top_wins/ctr)*100)}%) | B Wins: {bottom_wins} ({int((bottom_wins/ctr)*100)}%) | Score: {score} {drawstr}")

print("TOURNAMENT RESULTS")
print(top_wins)
print(bottom_wins)