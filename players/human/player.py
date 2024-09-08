from players.base import BasePlayer


class HumanPlayer(BasePlayer):
    def make_move(self, board, options, player):
        print(f"=== HUMAN PLAYER: {player.upper()} ===")
        while True:
            print("What piece would you like to move? ", end="")
            str = input()

            values = str.split(" ")
            fromx = int(values[0])
            fromy = int(values[1])

            print("Options: ", end="")
            piece_options = 0
            for opt in options:
                if opt[0] == fromx and opt[1] == fromy:
                    print(f"({opt[2],opt[3]}), ", end="")
                    piece_options += 1
            if piece_options == 0:
                print("None")
                continue
            print()

            print("Where would you like to move it? ", end="")
            str = input()
            values = str.split(" ")
            tox = int(values[0])
            toy = int(values[1])

            option_index = False
            for index, option in enumerate(options):
                if (option[0] == fromx and option[1] == fromy and option[2] == tox and option[3] == toy):
                    option_index = index
                    break

            if option_index:
                return option_index
            else:
                print("Invalid move, try again.")