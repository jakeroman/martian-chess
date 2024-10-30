import csv
import argparse
import matplotlib.pyplot as plt
import numpy as np

# Function to compute moving average
def moving_average(data, window_size):
    return np.convolve(data, np.ones(window_size) / window_size, mode='valid')

# Function to analyze the log file and plot the moving averages
def analyze_and_plot_log(file_path, window_size):
    # Initialize variables to store statistics
    total_games = 0
    win_count = 0
    losses = []
    moves = []
    wins = []

    win_percentage_over_time = []
    average_loss_over_time = []
    average_moves_over_time = []
    game_indices = []

    # Open the log file and process each row
    with open(file_path, "r") as file:
        reader = csv.reader(file)
        
        for row in reader:
            if len(row) != 4:
                continue  # Skip any malformed lines
            
            result, score, move_count, final_loss = row
            score = int(score)
            move_count = int(move_count)
            final_loss = float(final_loss) * 4 # Scaling factor to make it more visible

            # Update game count
            total_games += 1
            
            # Update counts based on result
            if result == 'win':
                win_count += 1
                wins.append(1)
            else:
                wins.append(0)

            # Track losses and moves
            losses.append(final_loss)
            moves.append(move_count)

            # Track game indices (x-axis)
            game_indices.append(total_games)

    # Calculate moving averages
    if total_games >= window_size:
        win_percentage_ma = moving_average([w * 100 for w in wins], window_size)
        average_loss_ma = moving_average(losses, window_size)
        average_moves_ma = moving_average(moves, window_size)

        # Adjust game indices for moving average
        game_indices_ma = game_indices[window_size - 1:]
    else:
        print(f"Not enough games to calculate a moving average for window size {window_size}.")
        return

    # Plot the results
    plt.figure(figsize=(10, 6))
    plt.plot(game_indices_ma, win_percentage_ma, label="Win Percentage (Moving Average)", color="blue")
    plt.plot(game_indices_ma, average_loss_ma, label="Average Loss (Moving Average)", color="red")
    plt.plot(game_indices_ma, average_moves_ma, label="Average Moves (Moving Average)", color="green")

    # Labels and Title
    plt.xlabel("Game Number")
    plt.ylabel("Metric Value")
    plt.title(f"Moving Averages Over Last {window_size} Games")
    plt.grid(True)
    plt.legend(loc="lower right")

    # Show the plot
    plt.show()

# Main function to handle argument parsing
if __name__ == "__main__":
    # Setup command-line argument parser
    parser = argparse.ArgumentParser(description="Analyze AI training log file and plot moving averages of win percentage, loss, and moves.")
    parser.add_argument("logfile", type=str, help="Path to the log file.")
    parser.add_argument("--window", type=int, default=10000, help="Window size for moving average (default: 10000 games).")
    
    # Parse the arguments
    args = parser.parse_args()
    
    # Analyze the log file and plot results
    analyze_and_plot_log(args.logfile, args.window)
