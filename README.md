# lab-assignment-week-6
This repository contains the templates for the CS4215 lab assignment in Week 6

Modify the source file under `src/machine_week_6.js` with
your solutions. 

You are _strongly_ encouraged to write comprehensive tests to verify
the functionality of your implementation.

## Tasks

1. Change the machine so that Cheney's garbage collection is used. 

   Make sure that your algorithm (like the given copying garbage
   collector) does not make use of the runtime stack of the underlying
   system that is running your virtual machine (in our case the
   JavaScript engine).

   Do not include any example programs. Your solution should end with
   the run function.

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
