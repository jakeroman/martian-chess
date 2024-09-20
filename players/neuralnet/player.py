from copy import deepcopy
import os
import pdb

import numpy as np
from game.board import MartianChessBoard
from players.base import BasePlayer
from players.neuralnet.utils import NeuralPlayerUtils
import torch
import torch.nn as nn
from scipy.special import softmax

class NeuralnetPlayer(BasePlayer):
    def __init__(
        self, 
        weights_file: str | None = None,    # Optionally, provide a file to load/save weights.
        gamma: float = 0.99,                # High values prioritize future reward over short term reward.
        learning_rate: float = 0.001,       # How quickly the model adjusts weights
        board_width: int = 4,               # Optional parameter for nonstandard board width
        board_height: int = 8,              # Optional parameter for nonstandard board height
        num_piece_types: int = 3,           # Special parameter for adapting player to other games
        weights_save_freq: int = 20,        # How often to save weights to file in number of games
    ):
        # Set player parameters
        self.weights_file = weights_file
        self.weights_save_freq = weights_save_freq
        self.weights_save_counter = weights_save_freq

        self.gamma = gamma
        self.learning_rate = learning_rate

        self.board_width = board_width
        self.board_height = board_height
        self.game_memory = [] # For storing moves during the game to be used for learning later

        # Generate move space
        self.move_space = NeuralPlayerUtils.get_all_possible_moves(board_width, board_height)
        board_spaces = board_width * board_height
        input_size = board_spaces * num_piece_types

        # Prepare PyTorch network
        self.network = nn.Sequential(
            nn.Linear(input_size, 128),
            nn.Sigmoid(),
            nn.Linear(128, 128),
            nn.Sigmoid(),
            nn.Linear(128, len(self.move_space)),
            nn.Softmax(dim=-1)
        )
        self.optimizer = torch.optim.Adam(self.network.parameters(), lr=0.001)

        # Load network weights from file if provided
        if weights_file:
            if os.path.exists(weights_file):
                weights = torch.load(weights_file, weights_only=True)
                self.network.load_state_dict(weights)
            else:
                print(f"Warning: Could not find weights file: {weights_file}, starting with random network.")


    def forward(self, flat_board_state):
        # Perform a forward pass through the network
        board_tensor = torch.FloatTensor(flat_board_state)
        output_tensor = self.network(board_tensor)
        decision_array = output_tensor.detach().numpy()  # Move the tensor back to the CPU and convert it to a numpy array
        return decision_array
    
    
    def learn(self, final_reward):
        # Learn from the results of a game
        loss_fn = nn.MSELoss()
        for id, memory in enumerate(self.game_memory):
            (state, action, reward, next_state) = memory # Unpack memory
            
            # Reward
            if id == len(self.game_memory) - 1:
                # For the last memory entry, use the final reward instead
                reward = final_reward

            # Predict Q values of action taken
            predicted_q_values = self.forward(state)
            predicted_q_value = predicted_q_values[action]

            # Compute the target Q-value
            with torch.no_grad():
                next_q_values = self.forward(next_state)
                max_next_q_value = np.max(next_q_values)
                target_q_value = reward + (self.gamma * max_next_q_value)

            # Calculate loss
            predicted_value_tensor = torch.tensor([predicted_q_value], dtype=torch.float32, requires_grad=True)
            target_value_tensor = torch.tensor([target_q_value], dtype=torch.float32, requires_grad=True)
            loss = loss_fn(predicted_value_tensor, target_value_tensor)

            if id == len(self.game_memory) - 1:
                print(f"Loss: {loss.item()}")

            # Update network
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()

        self.game_memory.clear() # Clear memory to prepare for next game


    def make_move(self, board, options, player, score):
        # Run the board state through the current network
        one_hot_board = NeuralPlayerUtils.flat_one_hot_encode_board(board) # Use one hot encoding on the board, splitting each piece type into it's own layer
        flat_board = one_hot_board.flatten() # Flatten this new representation of the board for the purpose of feeding into the neural network

        decision_array = self.forward(flat_board) # Perform a forward pass of the board state through the network
        softmax_decision_array = softmax(decision_array) # Take the softmax of the decision array

        # Mask off any illegal moves from the decision array
        move_mask = NeuralPlayerUtils.generate_move_mask(self.move_space, options) # Generate a mask of legal moves (1 = legal, 0 = not legal)
        softmax_decision_array = softmax_decision_array * move_mask # Apply the mask to the decision array by multiplying the two arrays

        # Choose the move with the highest confidence value
        decision_move_id = np.argmax(softmax_decision_array)
        decision_move = self.move_space[decision_move_id]
        decision_option_id = options.index(decision_move)

        # Simulate move on virtual board
        virtual_board = MartianChessBoard(self.board_width, self.board_height, False)
        virtual_board.board = deepcopy(board) # Make a copy of our game board and apply that to our virtual board
        success = virtual_board.make_move(player, decision_move[0], decision_move[1], decision_move[2], decision_move[3])
        assert success, "Failed to make move on virtual board! Did you rotate the input board without changing the player?"

        # Add information from this move to player memory
        new_board_state = NeuralPlayerUtils.flat_one_hot_encode_board(virtual_board.board).flatten()
        self.game_memory.append((flat_board, decision_move_id, score, new_board_state))

        # Finally, make the move
        return decision_option_id


    def game_over(self, winner, score):
        # Update the network with a final reward for this game
        reward = (50 if winner else -50) + score*2
        self.learn(reward)

        # If weight persistence is enabled, consider saving weights
        if self.weights_file:
            self.weights_save_counter -= 1 # Decrement save counter
            if self.weights_save_counter <= 0:
                # Save weights
                self.weights_save_counter = self.weights_save_freq # Reset counter
                torch.save(self.network.state_dict(), self.weights_file)
                print("Network weights saved.")