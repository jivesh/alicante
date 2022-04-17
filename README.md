# Alicante
This repository contains the code for our concurrent GC implementations. Here's a guide to our file organization:

In src:
1. `compile.js` contains the code for a Source -> SVML compiler.
2. `vm_*.js` files contain different VMs with various GC implementations.
3. `merge_files.py` is a Python script that can be run as 
`python merge_files.py vm_[vm_file]` to obtain a `machine_out.js` 
that contains the compiler and the respective VM. This is to facilitate
testing in Source Academy (the online IDE for Source).

A guide to the VM files:
1. `vm_classic_stop_world.js`: A VM that runs instructions uninterrupted
until it runs out of memory. Upon running out of memory, it stops the 
world, collects garbage via mark-and-sweep, and then continues running
instructions.
2. `vm_aggro_stop_world.js`: A VM with aggressive stop-the-world garbage
collection. After running each instruction, it runs a complete mark-and-sweep
to collect garbage.
3. `vm_dijkstra_gc.js`: A VM with the Dijkstra GC implementation

## How to run a program using a particular VM
Here are the instructions to run Source programs on any VM:
1. To run a program on `vm_X.js`, create a test directory called `tests/vm_X`
2. In this test directory, add any tests in the form
```javascript
P = parse_and_compile(`
[YOUR TEST PROGRAM]
`);

const DESIRED_HEAP_MEMORY = {add what you want};
initialize_machine(DESIRED_HEAP_MEMORY);
run();
```
3. Then you can run `yarn test` which will execute tests in all test directories with the appropriate 
VMs.

## Setup
To install the dependencies to run the testsuite locally, run the following:

```{0}
yarn install
```
Note that this might take a few minutes.


## Testing Locally
To run tests locally, run the following:
```{0}
yarn test
```
