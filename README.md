# Alicante
This repository contains the code for our concurrent GC implementations. Here's a guide to our file organization:

In src:
1. `compile.js` contains the code for a Source -> SVML compiler.
2. `vm_*.js` files contain different VMs with various GC implementations.
3. `merge_files.py` is a Python script that can be run as 
`python merge_files.py vm_[vm_file]` to obtain a `compiled_vm_X.js` 
that contains the compiler and the respective VM. This is to facilitate
testing in Source Academy (the online IDE for Source). (Note about this later)

A guide to the VM files:
1. `vm_classic_stop_world.js`: A VM that runs instructions uninterrupted
until it runs out of memory. Upon running out of memory, it stops the 
world, collects garbage via mark-and-sweep, and then continues running
instructions.
2. `vm_aggro_stop_world.js`: A VM with aggressive stop-the-world garbage
collection. After running each instruction, it runs a complete mark-and-sweep
to collect garbage. We use this to establish lower bounds of memory usage for test programs.
3. `vm_dijkstra_gc.js`: A VM with the Dijkstra GC implementation

## Setup
To install the dependencies to run the testsuite locally, run the following:

```{0}
yarn install
```
Note that this might take a few minutes.

## Testing:
### For local testing
1. To target `vm_X.js`, create a test directory called `tests/vm_X`
2. In this test directory, add any tests in the form
```javascript
P = parse_and_compile(`
[YOUR TEST PROGRAM]
`);

const DESIRED_HEAP_MEMORY = {add what you want};
initialize_machine(DESIRED_HEAP_MEMORY);
run();
```
(For the concurrent GC, you might want to try running with a custom interleaving. Check out
the current test examples in `vm_dijkstra_gc` for an example of how to do that.)

3. After this, run
```
yarn test
```
which will run all tests in each test directory and print the outputs in test-outputs with the 
same test folder structure. The outputs are logs of memory operations such as usage at each step,
marking, appending, or stopping the world (as well as the actual output of the program).

### For remote testing

Sometimes, the REPL run on the local test may prematurely detect infinite loops or infinite recursion
and stop the program, even when there's no infinite loop. An alternative is to use 
[the Source Academy playground](https://sourceacademy.org/playground) - an online IDE for Source.
Choose Source 4 as the language.

Then, use `merge_files.py` with an argument of your VM of choice. This, as mentioned before, gives 
you a file `compiled_VM_x.js`. Copy the contents of that file to the online IDE. Then, at the end,
copy over the test code and run using the online IDE.

