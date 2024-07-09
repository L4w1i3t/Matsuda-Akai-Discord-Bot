import numpy as np
import random

learning_rate = 0.1
discount_factor = 0.9
exploration_rate = 1.0
exploration_decay = 0.995
min_exploration_rate = 0.01
human_error_rate = 0.1

Q_table = {}

def choose_action(state, possible_actions):
    if state not in Q_table:
        Q_table[state] = np.zeros(len(possible_actions))

    if random.uniform(0, 1) < exploration_rate or random.uniform(0, 1) < human_error_rate:
        return random.choice(possible_actions)
    else:
        return possible_actions[np.argmax(Q_table[state])]

def update_Q_table(state, action, reward, next_state, done):
    if state not in Q_table:
        Q_table[state] = np.zeros(9)

    if next_state not in Q_table:
        Q_table[next_state] = np.zeros(9)

    best_next_action = np.argmax(Q_table[next_state])
    td_target = reward + discount_factor * Q_table[next_state][best_next_action] * (1 - done)
    td_error = td_target - Q_table[state][action]
    Q_table[state][action] += learning_rate * td_error

def get_state(board):
    return ''.join([''.join(row) for row in board])
