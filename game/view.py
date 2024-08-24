import tkinter as tk

class MartianChessView:
    def __init__(self):
        self.window = tk.Tk()
        self.images = []
        for img in ["empty.png","pawn.png","drone.png","queen.png"]:
            image = tk.PhotoImage(file=f'game/images/{img}')
            self.images.append(image)


    def redraw(self, board_state):
        # Clear window
        for widget in self.window.winfo_children():
            widget.destroy()

        # Draw board state
        for x, column in enumerate(board_state):
            for y, value in enumerate(column):
                label = tk.Label(
                    self.window,
                    image=self.images[value]
                )
                label.grid(row=y, column=x)  # Place the label in a grid

        self.window.update()