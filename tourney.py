from game.enum import PlayerID
from game.referee import MartianChessReferee
from players import RandomPlayer, NeuralnetPlayer


random_player = RandomPlayer()
ai_player = NeuralnetPlayer("network.pt")

referee = MartianChessReferee(ai_player, random_player)

top_wins = 0
bottom_wins = 0
for i in range(100):
    print(f"GAME: {i}")
    if referee.play_round() == PlayerID.TOP:
        top_wins += 1
    else:
        bottom_wins += 1

print("TOURNAMENT RESULTS")
print(top_wins)
print(bottom_wins)