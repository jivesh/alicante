from matplotlib import pyplot as plt

f_mem = open("memory_usage")

mems = list(map(int, f_mem.readlines()))

f_mem.close()

plt.plot(range(len(mems)), mems)
plt.ylabel("Heap memory used")
plt.xlabel("Time")
plt.show()
