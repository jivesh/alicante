// VIRTUAL MACHINE

// "registers" are the global variables of our machine.
// These contain primitive values (numbers or boolean
// values) or arrays of primitive values

// P is an array that contains an SVML machine program:
// the op-codes of instructions and their arguments
let P = [];
// PC is program counter: index of the next instruction
let PC = 0;
// HEAP is array containing all dynamically allocated data structures
let ENV = -Infinity;
// OS is address of current operand stack in HEAP; initially a dummy value
let OS = -Infinity;
// temporary value, used by PUSH and POP; initially a dummy value
let RES = -Infinity;

// RTS: runtime stack
let RTS = [];
let TOP_RTS = -1;

// boolean that says whether machine is running
let RUNNING = NaN;

// exit state: NORMAL, DIV_ERROR, OUT_OF_MEMORY_ERROR, etc
let STATE = NaN;

// //////////////////////////////
// some general-purpose registers
// //////////////////////////////

let A = 0;
let B = 0;
let C = 0;
let D = 0;
let E = 0;
let F = 0;
let G = 0;
let H = 0;
let I = 0;
let J = 0;
let K = 0;
let L = 0;
let N = 0;

function show_executing(s) {
    display("", "--- RUN ---" + s);
    display(PC, "PC :");
    display(get_name(P[PC]), "instr:");
}

// for debugging: show all registers
function show_registers(s) {
    show_executing(s);
    display("", "--- REGISTERS ---");
    display(RES, "RES:");
    display(A, "A  :");
    display(B, "B  :");
    display(C, "C  :");
    display(D, "D  :");
    display(E, "E  :");
    display(F, "F  :");
    display(G, "G  :");
    display(H, "H  :");
    display(I, "I  :");
    display(J, "J  :");
    display(K, "K  :");
    display(L, "L  :");
    display(N, "N  :");
    display(OS, "OS :");
    display(ENV, "ENV:");
    display(RTS, "RTS:");
    display(TOP_RTS, "TOP_RTS:");
}

// HEAP is array containing all dynamically allocated data structures
let HEAP = NaN;
// next free slot in heap
let FREE = -Infinity;
// the size of the heap is fixed
let HEAP_SIZE = -Infinity;
// temporary root
let TEMP_ROOT = -Infinity;

// general node layout
const TAG_SLOT = 0;
const SIZE_SLOT = 1;
const FIRST_CHILD_SLOT = 2;
const LAST_CHILD_SLOT = 3;

// ///////////////////////////////////
// MEMORY MANAGEMENT
// ///////////////////////////////////

function initialize_machine(heapsize) {
    display(heapsize, "\nRunning VM with heap size:");
    HEAP = [];
    HEAP_SIZE = heapsize;
    FREE = 0;
    RUNNING = true;
    STATE = NORMAL;
    PC = 0;
}

// NEW expects tag in A and size in B
// changes A, B, C, D, J, K
function NEW() {
    J = A;
    K = B;
    if (FREE + K >= HEAP_SIZE) {
        STATE = OUT_OF_MEMORY_ERROR;
        RUNNING = false;
    } else {
    }
    HEAP[FREE + TAG_SLOT] = J;
    HEAP[FREE + SIZE_SLOT] = K;
    RES = FREE;
    FREE = FREE + K;
}

// machine states

const NORMAL = 0;
const DIV_ERROR = 1;
const OUT_OF_MEMORY_ERROR = 2;

// number nodes layout
//
// 0: tag  = -100
// 1: size = 5
// 2: offset of first child from the tag: 6 (no children)
// 3: offset of last child from the tag: 5 (must be less than first)
// 4: value

const NUMBER_TAG = -100;
const NUMBER_SIZE = 5;
const NUMBER_VALUE_SLOT = 4;

// expects number in A
// changes A, B, C, D, E, J, K
function NEW_NUMBER() {
    E = A;
    A = NUMBER_TAG;
    B = NUMBER_SIZE;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = 6;
    HEAP[RES + LAST_CHILD_SLOT] = 5; // no children
    HEAP[RES + NUMBER_VALUE_SLOT] = E;
}

// bool nodes layout
//
// 0: tag  = -101
// 1: size = 5
// 2: offset of first child from the tag: 6 (no children)
// 3: offset of last child from the tag: 5 (must be less than first)
// 4: value

const BOOL_TAG = -101;
const BOOL_SIZE = 5;
const BOOL_VALUE_SLOT = 4;

// expects boolean in A
// changes A, B, C, D, E, J, K
function NEW_BOOL() {
    E = A;
    A = BOOL_TAG;
    B = BOOL_SIZE;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = 6;
    HEAP[RES + LAST_CHILD_SLOT] = 5; // no children
    HEAP[RES + BOOL_VALUE_SLOT] = E;
}

// undefined nodes layout
//
// 0: tag  = -106
// 1: size = 4
// 2: offset of first child from the tag: 5 (no children)
// 3: offset of last child from the tag: 4 (must be less than first)

const UNDEFINED_TAG = -106;
const UNDEFINED_SIZE = 4;

// changes A, B, C, D, J, K
function NEW_UNDEFINED() {
    A = UNDEFINED_TAG;
    B = UNDEFINED_SIZE;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = 5;
    HEAP[RES + LAST_CHILD_SLOT] = 4; // no children
}

// operandstack nodes layout
//
// 0: tag  = -105
// 1: size = maximal number of entries + 4
// 2: first child slot = 4
// 3: last child slot = current top of stack; initially 3 (empty stack)
// 4: first entry
// 5: second entry
// ...

const OS_TAG = -105;

// expects max size in A
// changes A, B, C, D, E, J, K
function NEW_OS() {
    E = A;
    A = OS_TAG;
    B = E + 4;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = 4;
    // operand stack initially empty
    HEAP[RES + LAST_CHILD_SLOT] = 3;
}

// PUSH and POP are convenient subroutines that operate on
// the operand stack OS

// expects its argument in A
// changes A, B
function PUSH_OS() {
    B = HEAP[OS + LAST_CHILD_SLOT]; // address of current top of OS
    B = B + 1;
    HEAP[OS + LAST_CHILD_SLOT] = B; // update address of current top of OS
    HEAP[OS + B] = A;
}

// POP puts the top-most value into RES
// changes B
function POP_OS() {
    B = HEAP[OS + LAST_CHILD_SLOT]; // address of current top of OS
    HEAP[OS + LAST_CHILD_SLOT] = B - 1; // update address of current top of OS
    RES = HEAP[OS + B];
}

// closure nodes layout
//
// 0: tag  = -103
// 1: size = 8
// 2: offset of first child from the tag: 6 (only environment)
// 3: offset of last child from the tag: 6
// 4: stack size = max stack size needed for executing function body
// 5: address = address of function
// 6: environment
// 7: extension count = number of entries by which to extend env

const CLOSURE_TAG = -103;
const CLOSURE_SIZE = 8;
const CLOSURE_OS_SIZE_SLOT = 4;
const CLOSURE_ADDRESS_SLOT = 5;
const CLOSURE_ENV_SLOT = 6;
const CLOSURE_ENV_EXTENSION_COUNT_SLOT = 7;

// expects stack size in A, P address in B, environment extension count in C
// changes A, B, C, D, E, F, J, K
function NEW_CLOSURE() {
    D = A;
    E = B;
    F = C;
    A = CLOSURE_TAG;
    B = CLOSURE_SIZE;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = CLOSURE_ENV_SLOT;
    HEAP[RES + LAST_CHILD_SLOT] = CLOSURE_ENV_SLOT;
    HEAP[RES + CLOSURE_OS_SIZE_SLOT] = D;
    HEAP[RES + CLOSURE_ADDRESS_SLOT] = E;
    HEAP[RES + CLOSURE_ENV_SLOT] = ENV;
    HEAP[RES + CLOSURE_ENV_EXTENSION_COUNT_SLOT] = F;
}

// expects closure in A, environment in B
function SET_CLOSURE_ENV() {
    HEAP[A + CLOSURE_ENV_SLOT] = B;
}

// stackframe nodes layout
//
// 0: tag  = -104
// 1: size = 7
// 2: offset of first child from the tag: 5 (environment)
// 3: offset of last child from the tag: 6 (operand stack)
// 4: program counter = return address
// 5: environment
// 6: operand stack

const RTS_FRAME_TAG = -104;
const RTS_FRAME_SIZE = 7;
const RTS_FRAME_PC_SLOT = 4;
const RTS_FRAME_ENV_SLOT = 5;
const RTS_FRAME_OS_SLOT = 6;

// expects current PC, ENV, OS in their registers
// changes A, B, C, D, J, K
function NEW_RTS_FRAME() {
    A = RTS_FRAME_TAG;
    B = RTS_FRAME_SIZE;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = RTS_FRAME_ENV_SLOT;
    HEAP[RES + LAST_CHILD_SLOT] = RTS_FRAME_OS_SLOT;
    HEAP[RES + RTS_FRAME_PC_SLOT] = PC + 2; // next instruction!
    HEAP[RES + RTS_FRAME_ENV_SLOT] = ENV;
    HEAP[RES + RTS_FRAME_OS_SLOT] = OS;
}

// expects stack frame in A
function PUSH_RTS() {
    TOP_RTS = TOP_RTS + 1;
    RTS[TOP_RTS] = A;
}

// places stack frame into RES
function POP_RTS() {
    RES = RTS[TOP_RTS];
    TOP_RTS = TOP_RTS - 1;
}

// environment nodes layout
//
// 0: tag  = -102
// 1: size = number of entries + 4
// 2: first child = 4
// 3: last child
// 4: first entry
// 5: second entry
// ...

const ENV_TAG = -102;

// expects number of env entries in A
// changes A, B, C, D, J, K
function NEW_ENVIRONMENT() {
    D = A;
    A = ENV_TAG;
    B = D + 4;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = 4;
    HEAP[RES + LAST_CHILD_SLOT] = 3 + D;
}

// expects env in A, by-how-many in B
// changes A, B, C, D
// Using TEMP_ROOT to make sure the
// origin on copying is updated when
// garbage collection happens in NEW_ENVIRONMENT
function EXTEND() {
    TEMP_ROOT = A;
    A = HEAP[A + SIZE_SLOT] - 4 + B;
    NEW_ENVIRONMENT();
    for (
        B = HEAP[TEMP_ROOT + FIRST_CHILD_SLOT];
        B <= HEAP[TEMP_ROOT + LAST_CHILD_SLOT];
        B = B + 1
    ) {
        HEAP[RES + B] = HEAP[TEMP_ROOT + B];
    }
    TEMP_ROOT = -1;
}

// debugging: show current heap
function is_node_tag(x) {
    return x !== undefined && x <= -100 && x >= -110;
}
function node_kind(x) {
    return x === NUMBER_TAG
        ? "number"
        : x === BOOL_TAG
        ? "bool"
        : x === CLOSURE_TAG
        ? "closure"
        : x === RTS_FRAME_TAG
        ? "RTS frame"
        : x === OS_TAG
        ? "OS"
        : x === ENV_TAG
        ? "environment"
        : x === UNDEFINED_TAG
        ? "undefined"
        : " (unknown node kind)";
}
function show_heap(s) {
    const len = array_length(HEAP);
    let i = 0;
    display("", "--- HEAP --- " + s);
    while (i < len) {
        display(
            "",
            stringify(i) +
                ": " +
                stringify(HEAP[i]) +
                (is_number(HEAP[i]) && is_node_tag(HEAP[i])
                    ? " (" + node_kind(HEAP[i]) + ")"
                    : "")
        );
        i = i + 1;
    }
}

function show_heap_value(address) {
    display(
        "",
        "result: heap node of type = " +
            node_kind(HEAP[address]) +
            ", value = " +
            stringify(HEAP[address + NUMBER_VALUE_SLOT])
    );
}

// SVMLa implementation

// We implement our machine with an array M that
// contains subroutines. Each subroutine implements
// a machine instruction, using a nullary function.
// The machine can then index into M using the op-codes
// of the machine instructions. To be implementable on
// common hardware, the subroutines have the
// following structure:
// * they have no parameters
// * they do not return any results
// * they do not have local variables
// * they do not call other functions except the
//   subroutines PUSH and POP
// * each line is very simple, for example an array access
// Ideally, each line can be implemented directly with a
// machine instruction of a real computer. In that case,
// the subroutines could become machine language macros,
// and the compiler could generate real machine code.

const M = [];

M[START] = () => {
    A = 1; // first OS only needs to hold one closure
    NEW_OS();
    OS = RES;
    A = 0; // first environment is empty
    NEW_ENVIRONMENT();
    ENV = RES;
    PC = PC + 1;
};

M[LDCN] = () => {
    A = P[PC + LDCN_VALUE_OFFSET];
    NEW_NUMBER();
    A = RES;
    PUSH_OS();
    PC = PC + 2;
};

M[LDCB] = () => {
    A = P[PC + LDCB_VALUE_OFFSET];
    NEW_BOOL();
    A = RES;
    PUSH_OS();
    PC = PC + 2;
};

M[LDCU] = () => {
    NEW_UNDEFINED();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
};

M[PLUS] = () => {
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT];
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT] + A;
    NEW_NUMBER();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
};

M[MINUS] = () => {
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT];
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT] - A;
    NEW_NUMBER();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
};

M[TIMES] = () => {
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT];
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT] * A;
    NEW_NUMBER();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
};

M[EQUAL] = () => {
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT];
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT] === A;
    NEW_BOOL();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
};

M[LESS] = () => {
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT];
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT] < A;
    NEW_BOOL();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
};

M[GEQ] = () => {
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT];
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT] >= A;
    NEW_BOOL();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
};

M[LEQ] = () => {
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT];
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT] <= A;
    NEW_BOOL();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
};

M[GREATER] = () => {
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT];
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT] > A;
    NEW_BOOL();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
};

M[NOT] = () => {
    POP_OS();
    A = !HEAP[RES + BOOL_VALUE_SLOT];
    NEW_BOOL();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
};

M[DIV] = () => {
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT];
    E = A;
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT] / A;
    NEW_NUMBER();
    A = RES;
    PUSH_OS();
    PC = PC + 1;
    E = E === 0;
    if (E) {
        STATE = DIV_ERROR;
        RUNNING = false;
    } else {
    }
};

M[POP] = () => {
    POP_OS();
    PC = PC + 1;
};

M[ASSIGN] = () => {
    POP_OS();
    HEAP[ENV + HEAP[ENV + FIRST_CHILD_SLOT] + P[PC + 1]] = RES;
    PC = PC + 2;
};

M[JOF] = () => {
    POP_OS();
    A = HEAP[RES + NUMBER_VALUE_SLOT];
    if (!A) {
        PC = P[PC + 1];
    } else {
    }
    if (A) {
        PC = PC + 2;
    } else {
    }
};

M[GOTO] = () => {
    PC = P[PC + 1];
};

M[LDF] = () => {
    A = P[PC + LDF_MAX_OS_SIZE_OFFSET];
    B = P[PC + LDF_ADDRESS_OFFSET];
    C = P[PC + LDF_ENV_EXTENSION_COUNT_OFFSET];
    NEW_CLOSURE();
    A = RES;
    PUSH_OS();
    PC = PC + 4;
};

M[LD] = () => {
    A = HEAP[ENV + HEAP[ENV + FIRST_CHILD_SLOT] + P[PC + 1]];
    PUSH_OS();
    PC = PC + 2;
};

M[CALL] = () => {
    G = P[PC + 1]; // lets keep number of arguments in G
    // we peek down OS to get the closure
    F = HEAP[OS + HEAP[OS + LAST_CHILD_SLOT] - G];
    // prep for EXTEND
    A = HEAP[F + CLOSURE_ENV_SLOT];
    // A is now env to be extended
    H = HEAP[A + LAST_CHILD_SLOT];
    // H is now offset of last child slot
    B = HEAP[F + CLOSURE_ENV_EXTENSION_COUNT_SLOT];
    // B is now the environment extension count
    L = HEAP[F + CLOSURE_ADDRESS_SLOT];
    N = HEAP[F + CLOSURE_OS_SIZE_SLOT]; // closure stack size

    EXTEND(); // after this, RES is new env

    // Heap address of new environment can
    // be changed by NEW_RS_FRAME and NEW_OS below.
    // Assigning TEMP_ROOT to address makes sure we
    // restore the updated value before competing CALL.
    TEMP_ROOT = RES;

    H = RES + H + G;
    // H is now address where last argument goes in new env
    for (C = H; C > H - G; C = C - 1) {
        POP_OS(); // now RES has the address of the next arg
        HEAP[C] = RES; // copy argument into new env
    }
    POP_OS(); // closure is on top of OS; pop; no more needed
    NEW_RTS_FRAME(); // saves PC + 2, ENV, OS
    A = RES;
    PUSH_RTS();
    A = N;
    NEW_OS();
    OS = RES;
    PC = L;
    ENV = TEMP_ROOT;
    TEMP_ROOT = -1;
};

M[RTN] = () => {
    POP_RTS();
    H = RES;
    PC = HEAP[H + RTS_FRAME_PC_SLOT];
    ENV = HEAP[H + RTS_FRAME_ENV_SLOT];
    POP_OS();
    A = RES;
    OS = HEAP[H + RTS_FRAME_OS_SLOT];
    PUSH_OS();
};

M[DONE] = () => {
    RUNNING = false;
};

function run() {
    while (RUNNING) {
        if (M[P[PC]] === undefined) {
            error(P[PC], "unknown op-code:");
        } else {
            M[P[PC]]();
        }
    }
    if (STATE === DIV_ERROR) {
        POP_OS();
        error(RES, "execution aborted:");
    } else if (STATE === OUT_OF_MEMORY_ERROR) {
        error(RES, "memory exhausted");
    } else {
        POP_OS();
        show_heap_value(RES);
    }
}
