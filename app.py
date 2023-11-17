import matplotlib.pyplot as plt
import numpy as np

# Defining the function g(t, c)
def g(t, c):
    return c / (t + 1)**2

# Generating a range of t values
t_values = np.linspace(1, 10, 400)  # t from 1 to 10

# Constant c value
c = 5

# Calculating y values using the function g(t, c)
y_values = g(t_values, c)

# Plotting the curve
plt.figure(figsize=(8, 6))
plt.plot(t_values, y_values, label=f'g(t, {c})')
plt.xlabel('t')
plt.ylabel('g(t, c)')
plt.title('Graph of a Decreasing and Convex Function g(t, c)')
plt.legend()
plt.grid(True)
plt.show()