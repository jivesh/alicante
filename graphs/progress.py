from matplotlib import pyplot as plt

f_prog = open("progress")

prog = list(map(str.strip, f_prog.readlines()))

f_prog.close()

x_data = [0]

count = 0
for ele in prog:
    print(ele)
    if ele == "P":
        count += 1
    x_data.append(count)

plt.plot(range(len(x_data)), x_data)
plt.ylabel("Progress")
plt.xlabel("Time")
plt.show()
