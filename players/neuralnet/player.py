import os
import pdb
import random
import time

import numpy as np
import scipy
import torch
import torch.nn as nn

from players.base import BasePlayer
from players.neuralnet.utils import NeuralPlayerUtils
from game.enum import PlayerID

class NeuralnetPlayer(BasePlayer):
    def __init__(
        self, 
        weights_file: str | None = None,    # Optionally, provide a file to load/save weights.
        gamma: float = 0.9,                 # High values prioritize future reward over short term reward.
        epsilon: float = 0.01,              # Chance that the player will make a random move
        epsilon_decay: float = 0.995,       # Rate at which the epsilon value decays
        greedy: float = 0.8,                # Probability that the player will take the argmax move
        learning_rate: float = 0.001,       # How quickly the model adjusts weights
        move_penalty: float = 0.05,         # How much to subtract from reward for not doing anything
        repeat_penalty: float = 1,          # How much to subtract from reward for returning to previous position
        time_target: int = 50,              # The target for how many moves we would like to finish a game in
        time_penalty: float = 0.001,        # Penalty for surpassing time target to encourage short games
        consec_loss_penalty: float = 0.05,  # Scaling factor that punishes repeated losses
        win_lose_reward: float = 10,        # How much to punish/reward player for winning or losing
        final_reward_weight: float = 0.5,   # How heavily to weigh the final reward in the loss function
        static_loss_offset: float = 0.1,    # This value is added to the loss before scaling to improve stability
        board_width: int = 4,               # Optional parameter for nonstandard board width
        board_height: int = 8,              # Optional parameter for nonstandard board height
        num_piece_types: int = 3,           # Special parameter for adapting player to other games
        weights_save_freq: int = 100,       # How often to save weights to file in number of games
        logging_enabled: bool = True,       # Whether or not the player will create a training log file (Requires weight persistence)
    ):
        # Set player parameters
        self.weights_file = weights_file
        self.weights_save_freq = weights_save_freq
        self.weights_save_counter = weights_save_freq
        self.logging_enabled = logging_enabled

        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.greedy = greedy
        self.learning_rate = learning_rate
        self.move_penalty = move_penalty
        self.repeat_penalty = repeat_penalty
        self.consecutive_loss_penalty = consec_loss_penalty
        self.time_target = time_target
        self.time_penalty = time_penalty
        self.win_lose_reward = win_lose_reward
        self.final_reward_weight = final_reward_weight
        self.static_loss_offset = static_loss_offset

        self.board_width = board_width
        self.board_height = board_height

        self.game_memory = [] # For storing moves during the game to be used for learning later
        self.last_score = 0 # Keep track of the last score so that reward can only reward change in score
        self.last_decision_move_id = None # For storing the last move we made
        self.last_position = (0,0,0,0) # For storing the position of the last piece we moved
        self.move_count = 0 # For keeping track of how many moves we are into this game
        self.training_log = "" # For caching training information to be written to the log file
        self.consecutive_losses = 0 # Reset consecutive loss counter

        # Generate move space
        self.move_space = NeuralPlayerUtils.get_all_possible_moves(board_width, board_height)
        board_spaces = board_width * board_height
        input_size = board_spaces * num_piece_types

        # Prepare PyTorch network
        self.network = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.LeakyReLU(),
            nn.Linear(256, 256),
            nn.LeakyReLU(),
            nn.Linear(256, 256),
            nn.LeakyReLU(),
            nn.Linear(256, len(self.move_space)),
        )
        self.optimizer = torch.optim.NAdam(self.network.parameters(), lr=learning_rate, betas=(0.8, 0.99))

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
    
    def learn(self, game_final_reward):
        # Learn from the results of a game
        loss_fn = nn.MSELoss()
        loss = 0

        # Normalize final reward
        final_reward = game_final_reward

        # Replay memory
        for id, memory in enumerate(self.game_memory):
            (state, action, reward, next_state, next_move_mask) = memory # Unpack memory

            # Predict Q values of action taken
            state_tensor = torch.FloatTensor(state) # Convert board state to a tensor
            predicted_q_values = self.forward(state_tensor) # Perform forward pass on current board state to get Q values
            predicted_q_value = predicted_q_values[action]

            final_memory = 1 if (id == len(self.game_memory) - 1) else 0

            # Compute the target Q-value
            with torch.no_grad():
                next_state_tensor = torch.FloatTensor(next_state) # Convert the next board state into a tensor
                next_q_values = self.forward(next_state_tensor) # Run the next board state through the network
                masked_next_q_values = next_q_values * torch.FloatTensor(next_move_mask) # Mask future rewards with legal moves
                max_next_q_value = torch.max(masked_next_q_values) # Take the highest value from the next Q tensor
                target_q_value = reward + (self.gamma * max_next_q_value * (1-final_memory)) # Calculate target Q value from state reward and future reward
                target_q_value = torch.clamp(target_q_value, min=0.02, max=0.98) # Clamp target Q value for stability

            # Calculate loss
            # print(predicted_q_value, target_q_value)
            base_loss = loss_fn(predicted_q_value, target_q_value)
            loss = (base_loss) * (1 - (final_reward * self.final_reward_weight))

            # if (id == len(self.game_memory)-1):
                # print("Reward:",int((final_reward*200)-100),"%",end="")

            # Update network
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()

        self.game_memory.clear() # Clear memory to prepare for next game
        return float(loss)


    def compute_entropy(self, probs):
        entropy = -torch.sum(probs * torch.log(probs + 1e-10))  # Add a tiny value to prevent taking the log of zero
        return entropy


    def make_move(self, board, options, player, score):
        # If we are not the top player, rotate the board and options
        if player != PlayerID.TOP:
            board = NeuralPlayerUtils.rotate_board(board)
            options = NeuralPlayerUtils.rotate_options(options, self.board_width, self.board_height)

        # Run the board state through the current network
        one_hot_board = NeuralPlayerUtils.flat_one_hot_encode_board(board) # Use one hot encoding on the board, splitting each piece type into it's own layer
        flat_board = one_hot_board.flatten() # Flatten this new representation of the board for the purpose of feeding into the neural network

        decision_array = self.forward(flat_board, auto_convert=True) # Perform a forward pass of the board state through the network

        # Mask off any illegal moves from the decision array
        move_mask = NeuralPlayerUtils.generate_move_mask(self.move_space, options) # Generate a mask of legal moves (1 = legal, 0 = not legal)
        masked_decision_array = decision_array * move_mask # Apply the mask to the decision array by multiplying the two arrays

        # Choose according to probability distribution
        number_list = list(range(len(masked_decision_array)))
        if sum(masked_decision_array) <= 0:
            # In the unlikely event that there are no legal moves with a confidence above zero, make a random move
            probability_dist_decision_move_id = 0
            random_move = True
        else:
            # Make a move based on probability
            positive_weights_only = [max(0, w) for w in masked_decision_array]
            probability_dist_decision_move_id = random.choices(number_list, weights = positive_weights_only, k=1)[0]

        # Calculate greedy move
        random_move = random.random() < self.epsilon
        greedy_move = random.random() < self.greedy
        argmax_decision_move_id = np.argmax(masked_decision_array)

        # Chose which move we are using
        if greedy_move:
            chosen_decision_move_id = argmax_decision_move_id
        else:
            chosen_decision_move_id = probability_dist_decision_move_id

        # Turn that decision into a move for the game
        decision_move = self.move_space[chosen_decision_move_id]
        try:
            decision_option_id = options.index(decision_move)
        except:
            random_move = True # If the desired option was not valid
        
        if random_move:
            decision_option_id = random.randint(0, len(options)-1)

        # Calculate state reward
        reward = score - self.last_score
        self.last_score = score
        if reward <= 0: # If score didn't increase, apply move penalty
            reward -= self.move_penalty
        if (options[decision_option_id][0],options[decision_option_id][1]) == self.last_position:
            reward -= self.repeat_penalty

        reward = reward
        self.last_position = (options[decision_option_id][2],options[decision_option_id][3])
        
        # print("Reward:",reward,"Score:",score)

        # Add information from last move to player memory
        if self.last_decision_move_id is not None: # Now that we have the reward from our last move, we can update that
            self.game_memory.append((self.last_flat_board, self.last_decision_move_id, reward, flat_board, move_mask))
        self.last_flat_board = flat_board
        self.last_decision_move_id = chosen_decision_move_id

        # Finally, make the move
        self.move_count += 1 # Increment move counter
        return decision_option_id


    def game_over(self, winner, score):
        # Update the network with a final reward for this game
        final_reward = score

        # Apply win/lose reward
        if winner:
            self.consecutive_losses = 0
            final_reward += self.win_lose_reward * 3
        else:
            final_reward -= self.win_lose_reward #* (1 + self.consecutive_loss_penalty * self.consecutive_losses)
            if self.consecutive_losses < 50:
                self.consecutive_losses += 1

        # # Apply time penalty if applicable
        # if self.move_count > self.time_target:
        #     final_reward -= self.time_penalty * (self.move_count - self.time_target)

        # Learn from rewards
        final_loss = self.learn(final_reward/30) # Divide by 30 to bring it more into a -1 to 1 range

        self.epsilon *= self.epsilon_decay
        self.epsilon = max(self.epsilon, 0.01)

        # Log training if enabled
        if self.logging_enabled:
            winner_str = "win" if winner else ("draw" if score == -100 else "loss")
            self.training_log += f"{winner_str},{score},{self.move_count},{final_loss}\n"

        # Reset game specific counters
        self.last_score = 0 # Reset last score counter
        self.last_decision_move_id = None # Reset last move record
        self.last_flat_board = None # Reset last flat board record
        self.move_count = 0 # Reset move counter

        # If weight persistence is enabled, consider saving weights
        if self.weights_file:
            self.weights_save_counter -= 1 # Decrement save counter
            if self.weights_save_counter == 0:
                # Save weights
                self.weights_save_counter = self.weights_save_freq # Reset counter
                torch.save(self.network.state_dict(), self.weights_file)
                print(f"Network weights saved to {self.weights_file}")

                # Log training if enabled
                if self.logging_enabled:
                    logfile = self.weights_file.split(".")[0] + ".log"
                    with open(logfile, "a") as log:
                        log.write(self.training_log)
                    self.training_log = ""