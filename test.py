from game.board import MartianChessBoard
from game.view import MartianChessView


board = MartianChessBoard()
view = MartianChessView()
view.redraw(board.board)
input() # halt to keep board view open