import sys

try:
    MACHINE_FILE = sys.argv[1]
except:
    raise Exception("No input file given. Try `python merge_files.py NAME_OF_VM_FILE`")

f1 = open("compile.js", "r")
f2 = open(MACHINE_FILE, "r")

file_out = open("compiled_" + MACHINE_FILE, "w")

for line in f1.readlines():
    file_out.write(line)

for line in f2.readlines():
    file_out.write(line)

f1.close()
f2.close()
file_out.close()
