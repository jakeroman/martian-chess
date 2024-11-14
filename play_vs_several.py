from game.enum import PlayerID
from game.referee import MartianChessReferee
from players import NeuralnetPlayer, RandomPlayer, DepthSearchPlayer, GreedyPlayer


opponents = [
    GreedyPlayer(),
    NeuralnetPlayer("network.pt", gamma=0.95, epsilon=0.03, learning_rate=0.0001, move_penalty=0.25, repeat_penalty=10, weights_save_freq=-1),
    RandomPlayer(),
]
opponent_play_count = [10000, 1000, 100]

ai_player = NeuralnetPlayer("network.pt", gamma=0.75, epsilon=0.05, epsilon_decay=0.99999, greedy=0.75, learning_rate=0.00001, move_penalty=0.00, repeat_penalty=10, weights_save_freq=100, final_reward_weight=0.1, win_lose_reward=10, static_loss_offset=0, time_penalty=0.0001, time_target=70)

# Automatically cycles between opponents
top_wins = 0
bottom_wins = 0
ctr = 0
while True:
    for id, opponent in enumerate(opponents):
        print(">> Playing vs " + str(opponent) + " for "+ str(opponent_play_count[id]) + " games.")
        referee = MartianChessReferee(ai_player, opponent, False)
        for i in range(opponent_play_count[id]):
            ctr += 1
            res, score = referee.play_round()
            drawstr = ""
            if res == False:
                print("\033[31m")
                drawstr = "[Draw]"
            elif res == PlayerID.TOP:
                print("\033[32m")
                top_wins += 1
            else:
                print()
                bottom_wins += 1
            print("["+str(id)+"] Game:", ctr, " | RL wins:", top_wins," | Opponent wins:",bottom_wins,"| Win %:",int((top_wins/ctr)*100),"| Score:", score, drawstr,"\033[0m",end="")