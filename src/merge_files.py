import sys

MACHINE_FILE = sys.argv[1]

f1 = open("compile.js", 'r')
f2 = open(MACHINE_FILE, 'r')

file_out = open("machine_out.js", 'w')

for line in f1.readlines():
    file_out.write(line)

for line in f2.readlines():
    file_out.write(line)

f1.close()
f2.close()
file_out.close()