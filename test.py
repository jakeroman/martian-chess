from game.board import MartianChessBoard
from game.enum import PlayerID
from game.view import MartianChessView


board = MartianChessBoard()
view = MartianChessView()

player = PlayerID.TOP
while True:
    print(f"=== PLAYER {player.upper()} ===")

    view.redraw(board.board)
    options = board.get_player_options(player)

    print("What piece would you like to move? ", end="")
    str = input()
    values = str.split(" ")
    fromx = int(values[0])
    fromy = int(values[1])
    # hello is me

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

    if board.make_move(player, fromx, fromy, tox, toy):
        # Switch players
        if player == PlayerID.TOP:
            player = PlayerID.BOTTOM
        else:
            player = PlayerID.TOP
    else:
        # Invalid move
        print("Invalid move, try again.")

    # Check for game over
    winner = board.is_game_over()
    if winner:
        print(f"Game over! {winner.upper()} is victorious!")
        break