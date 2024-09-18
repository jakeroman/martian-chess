import pdb

import numpy as np
from players.base import BasePlayer
from players.neuralnet.utils import NeuralPlayerUtils
import torch
import torch.nn as nn
from scipy.special import softmax

class NeuralnetPlayer(BasePlayer):
    def __init__(
        self, 
        board_width: int | None = 4, 
        board_height: int | None = 8,
        num_piece_types: int | None = 3,
    ):
        # Set player parameters
        self.board_width = board_width
        self.board_height = board_height
        self.memory = [] # For storing moves during the game to be used for learning later

        # Generate move space
        self.move_space = NeuralPlayerUtils.get_all_possible_moves(board_width, board_height)
        board_spaces = board_width * board_height
        input_size = board_spaces * num_piece_types

        # Prepare PyTorch network
        self.network = nn.Sequential(
            nn.Linear(input_size, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, len(self.move_space)),
            nn.Softmax(dim=-1)
        )
        self.optimizer = torch.optim.Adam(self.network.parameters(), lr=0.001)


    def forward(self, flat_board_state):
        # Perform a forward pass through the network
        return self.network(flat_board_state)


    def make_move(self, board, options, player, score):
        # Run the board state through the current network
        one_hot_board = NeuralPlayerUtils.flat_one_hot_encode_board(board) # Use one hot encoding on the board, splitting each piece type into it's own layer
        flat_board = one_hot_board.flatten() # Flatten this new representation of the board for the purpose of feeding into the neural network

        board_tensor = torch.FloatTensor(flat_board)
        output_tensor = self.forward(board_tensor)

        decision_array = output_tensor.detach().numpy()  # Move the tensor back to the CPU and convert it to a numpy array
        softmax_decision_array = softmax(decision_array) # Take the softmax of the decision array

        # Mask off any illegal moves from the decision array
        move_mask = NeuralPlayerUtils.generate_move_mask(self.move_space, options) # Generate a mask of legal moves (1 = legal, 0 = not legal)
        softmax_decision_array = softmax_decision_array * move_mask # Apply the mask to the decision array by multiplying the two arrays

        # Make the move with the highest confidence value
        decision_move = self.move_space[np.argmax(softmax_decision_array)]
        decision_option_id = options.index(decision_move)

        return decision_option_id


    def game_over(self, winner, score):
        """This method will be called at the end of each game, with a boolean representing if you won, and score being a number
        which indicates the final score of the game, where higher numbers are better."""
        pass