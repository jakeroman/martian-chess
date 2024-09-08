import random
from players.base import BasePlayer


class RandomPlayer(BasePlayer):
    def make_move(self, board, options, player):
        choice = random.randrange(0, len(options))
        return choice