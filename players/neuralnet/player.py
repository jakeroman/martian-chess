import os

import numpy as np
from players.base import BasePlayer
from players.neuralnet.utils import NeuralPlayerUtils
import torch
import torch.nn as nn

class NeuralnetPlayer(BasePlayer):
    def __init__(
        self, 
        weights_file: str | None = None,    # Optionally, provide a file to load/save weights.
        gamma: float = 0.99,                # High values prioritize future reward over short term reward.
        learning_rate: float = 0.001,       # How quickly the model adjusts weights
        move_penalty: float = 0.1,          # How much to subtract from reward for not doing anything
        board_width: int = 4,               # Optional parameter for nonstandard board width
        board_height: int = 8,              # Optional parameter for nonstandard board height
        num_piece_types: int = 3,           # Special parameter for adapting player to other games
        weights_save_freq: int = 100,       # How often to save weights to file in number of games
    ):
        # Set player parameters
        self.weights_file = weights_file
        self.weights_save_freq = weights_save_freq
        self.weights_save_counter = weights_save_freq

        self.gamma = gamma
        self.learning_rate = learning_rate
        self.move_penalty = move_penalty

        self.board_width = board_width
        self.board_height = board_height

        self.game_memory = [] # For storing moves during the game to be used for learning later
        self.last_score = 0 # Keep track of the last score so that reward can only reward change in score
        self.last_decision_move_id = None # For storing the last move we made

        # Generate move space
        self.move_space = NeuralPlayerUtils.get_all_possible_moves(board_width, board_height)
        board_spaces = board_width * board_height
        input_size = board_spaces * num_piece_types

        # Prepare PyTorch network
        self.network = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.Sigmoid(),
            nn.Linear(256, 256),
            nn.Sigmoid(),
            nn.Linear(256, 128),
            nn.Sigmoid(),
            nn.Linear(128, len(self.move_space)),
            nn.Softmax(dim=-1)
        )
        self.optimizer = torch.optim.Adam(self.network.parameters(), lr=0.0001)

        # Load network weights from file if provided
        if weights_file:
            if os.path.exists(weights_file):
                weights = torch.load(weights_file, weights_only=True)
                self.network.load_state_dict(weights)
            else:
                print(f"Warning: Could not find weights file: {weights_file}, starting with random network.")


    def forward(self, board, auto_convert: bool = False):
        # Perform a forward pass through the network
        if auto_convert: # If specified, handle conversion to tensor automatically
            board = torch.FloatTensor(board)
        output = self.network(board)
        if auto_convert: # If specified, handle conversion back from tensor automatically
            output = output.detach().numpy()  # Move the tensor back to the CPU and convert it to a numpy array
        return output
    
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
            state_tensor = torch.FloatTensor(state) # Convert board state to a tensor
            predicted_q_values = self.forward(state_tensor) # Perform forward pass on current board state to get Q values
            predicted_q_value = predicted_q_values[action]

            # Compute the target Q-value
            with torch.no_grad():
                next_state_tensor = torch.FloatTensor(next_state) # Convert the next board state into a tensor
                next_q_values = self.forward(next_state_tensor) # Run the next board state through the network
                max_next_q_value = torch.max(next_q_values) # Take the highest value from the next Q tensor
                target_q_value = reward + (self.gamma * max_next_q_value)

            # Calculate loss
            loss = loss_fn(predicted_q_value, target_q_value)

            # Update network
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()

        self.game_memory.clear() # Clear memory to prepare for next game


    def make_move(self, board, options, player, score):
        # Run the board state through the current network
        one_hot_board = NeuralPlayerUtils.flat_one_hot_encode_board(board) # Use one hot encoding on the board, splitting each piece type into it's own layer
        flat_board = one_hot_board.flatten() # Flatten this new representation of the board for the purpose of feeding into the neural network

        decision_array = self.forward(flat_board, auto_convert=True) # Perform a forward pass of the board state through the network

        # Mask off any illegal moves from the decision array
        move_mask = NeuralPlayerUtils.generate_move_mask(self.move_space, options) # Generate a mask of legal moves (1 = legal, 0 = not legal)
        masked_decision_array = decision_array * move_mask # Apply the mask to the decision array by multiplying the two arrays

        # Choose the move with the highest confidence value
        decision_move_id = np.argmax(masked_decision_array)
        decision_move = self.move_space[decision_move_id]
        decision_option_id = options.index(decision_move)

        # Add information from last move to player memory
        reward = score - self.last_score - self.move_penalty
        self.last_score = score
        if self.last_decision_move_id is not None: # Now that we have the reward from our last move, we can update that
            self.game_memory.append((self.last_flat_board, self.last_decision_move_id, reward, flat_board))
            self.last_flat_board = flat_board
            self.last_decision_move_id = decision_move_id

        # Finally, make the move
        return decision_option_id


    def game_over(self, winner, score):
        # Update the network with a final reward for this game
        reward = (50 if winner else -25)
        self.learn(reward)

        self.last_score = 0 # Reset last score counter
        self.last_decision_move_id = None # Reset last move record
        self.last_flat_board = None # Reset last flat board record

        # If weight persistence is enabled, consider saving weights
        if self.weights_file:
            self.weights_save_counter -= 1 # Decrement save counter
            if self.weights_save_counter <= 0:
                # Save weights
                self.weights_save_counter = self.weights_save_freq # Reset counter
                torch.save(self.network.state_dict(), self.weights_file)
                print("Network weights saved.")