f1 = open("compile.js", 'r')
f2 = open("machine.js", 'r')

file_out = open("machine_week_6.js", 'w')

for line in f1.readlines():
    file_out.write(line);

for line in f2.readlines():
    file_out.write(line)

f1.close()
f2.close()
file_out.close()