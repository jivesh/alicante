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

// machine states

const NORMAL = 0;
const DIV_ERROR = 1;
const OUT_OF_MEMORY_ERROR = 2;

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
// Address of head node in free list
let FREE = -Infinity;
// Address of NIL node in HEAP
let NIL = -Infinity;
// the size of the heap is fixed
let HEAP_SIZE = -Infinity;
// temporary root
let TEMP_ROOT = -Infinity;

// general node layout
const NODE_SIZE = 4;
const VAL_SLOT = 0;
const LEFT_SLOT = 1; // Doubles as next pointer
const RIGHT_SLOT = 2;
const COLOR_SLOT = 3;

// node colors
const WHITE = "white";
const GREY = "grey";
const BLACK = "black";

// ///////////////////////////////////
// MEMORY MANAGEMENT
// ///////////////////////////////////

function initialize_machine(heapsize) {
    display(heapsize, "\nRunning VM with heap size:");
    init_heap(heapsize);
    RUNNING = true;
    STATE = NORMAL;
    PC = 0;
}

// HEAP = [NIL, Root1, Root2, FreeRoot]
function init_heap(heapsize) {
    A = math_floor(heapsize / 4);
    display(A * 4, "\nInitialising with usable heap size:");
    HEAP = [];
    HEAP_SIZE = A * 4;

    // NIL node
    NIL = 0 * NODE_SIZE;
    HEAP[NIL + VAL_SLOT] = "NIL node";
    HEAP[NIL + LEFT_SLOT] = NIL;
    HEAP[NIL + RIGHT_SLOT] = NIL;
    HEAP[NIL + COLOR_SLOT] = WHITE;

    // Init roots
    for (let i = 1; i < 3; i = i + 1) {
        B = i * NODE_SIZE;
        HEAP[B + VAL_SLOT] = "Root node";
        HEAP[B + LEFT_SLOT] = NIL;
        HEAP[B + RIGHT_SLOT] = NIL;
        HEAP[B + COLOR_SLOT] = WHITE;
    }

    // Link all others as free
    for (let i = 3; i < A; i = i + 1) {
        B = i * NODE_SIZE;
        HEAP[B + VAL_SLOT] = "Free node";
        HEAP[B + LEFT_SLOT] = i === A - 1 ? NIL : NODE_SIZE * ((i + 1) % A);
        HEAP[B + RIGHT_SLOT] = NIL;
        HEAP[B + COLOR_SLOT] = WHITE;
    }

    FREE = 3 * NODE_SIZE;
    HEAP[FREE + VAL_SLOT] = "Free root";
}

function INVOKE_GC() {
    display("COLLECTING GARBAGE");
}

// Pops from free list if available
// Returns: RES is new node address
function NEW() {
    if (FREE === NIL) {
        STATE = OUT_OF_MEMORY_ERROR;
        RUNNING = false;
    } else {
    }

    RES = FREE;
    FREE = HEAP[FREE + LEFT_SLOT];
    HEAP[FREE + VAL_SLOT] = "Free root";

    HEAP[RES + LEFT_SLOT] = NIL;
    HEAP[RES + COLOR_SLOT] = WHITE;
}

///////////////////////////////////////////////////////////////////////////////
/// OS Stuff
///////////////////////////////////////////////////////////////////////////////

// Expects: value in A
// Returns: OS & RES is new OS head
function PUSH_OS_VAL() {
    // Allocate number
    NEW();
    HEAP[RES + VAL_SLOT] = A;
    G = RES;

    // Allocate new os node
    NEW();
    HEAP[RES + VAL_SLOT] = "OS Top";
    HEAP[RES + LEFT_SLOT] = OS; // Left child as current OS node
    HEAP[RES + RIGHT_SLOT] = G; // Right child as value node

    HEAP[OS + VAL_SLOT] = "OS Node";
    OS = RES;
}

// Expects: value in A
// Returns: OS & RES is new OS head
function PUSH_OS_NUM() {
    display(A, "New number:");
    PUSH_OS_VAL();
}

// Expects: value in A
// Returns: OS & RES is new OS head
function PUSH_OS_BOOL() {
    display(A, "New boolean:");
    PUSH_OS_VAL();
}

// Doesn't expect anything
// Returns: OS & RES is new OS head
function PUSH_OS_UNDEF() {
    display("New undefined");
    A = "undefined";
    PUSH_OS_VAL();
}

// Expects: node address in A
// Returns: OS & RES is new OS head
function PUSH_OS_NODE() {
    display("Pushing node");

    // Allocate new os node
    NEW();
    HEAP[RES + VAL_SLOT] = "OS Top";
    HEAP[RES + LEFT_SLOT] = OS;

    // Assign node
    HEAP[RES + RIGHT_SLOT] = A;

    HEAP[OS + VAL_SLOT] = "OS Node";
    OS = RES;
}

// Doesn't expect anything
// Returns: RES is new OS
function NEW_OS() {
    display("New OS");
    NEW();
    HEAP[RES + VAL_SLOT] = "OS Top";
}

// Doesn't expect anything
// Returns: RES is value node
function POP_OS() {
    display("Popping from OS");
    G = OS;
    OS = HEAP[OS + LEFT_SLOT];
    RES = HEAP[G + RIGHT_SLOT];

    HEAP[G + VAL_SLOT] = "Popped";
    HEAP[OS + VAL_SLOT] = "OS Top";
}

// // Doesn't expect anything
// // Returns: RES is value node
// function PEEK_OS() {
//     display("Peeking OS");
//     G = HEAP[OS + RIGHT_SLOT];
//     RES = HEAP[G + VAL_SLOT];
// }

///////////////////////////////////////////////////////////////////////////////
/// Env Stuff
///////////////////////////////////////////////////////////////////////////////

// Doesn't expect anything
// Returns: RES is new ENV
function NEW_ENVIRONMENT() {
    display("New ENV");
    NEW();
    HEAP[RES + VAL_SLOT] = "ENV Start";
}

function NEW_ENV_BIND() {
    display("New env binding");
    NEW();
    HEAP[RES + VAL_SLOT] = "Env Bind";
}

// Expects: Address of value node in A, Index in env in B, Env to bind in in C
// Returns: Nothing
function BIND_IN_ENV() {
    H = A;

    // Traverse till the end
    G = C;
    B = B + 1; // Account for env root node
    while (B > 0) {
        if (HEAP[G + LEFT_SLOT] === NIL) {
            NEW_ENV_BIND();
            HEAP[G + LEFT_SLOT] = RES;
            G = RES;
        } else {
            G = HEAP[G + LEFT_SLOT];
        }
        B = B - 1;
    }

    // Assign binding
    display("Assigned binding");
    HEAP[G + RIGHT_SLOT] = H;
}

// Expects: Index in env in A
// Returns: RES is value node
function ACCESS_ENV() {
    display("Acessing env");
    G = ENV;
    B = A + 1;
    while (B > 0) {
        G = HEAP[G + LEFT_SLOT];
        B = B - 1;
    }
    RES = HEAP[G + RIGHT_SLOT];
}

// Expects: base env in A, extended part in B
// Returns: RES and A is extended env
function EXTEND() {
    G = A;
    NEW_ENVIRONMENT();
    H = RES;
    I = H;

    while (HEAP[G + LEFT_SLOT] !== NIL) {
        NEW_ENV_BIND();
        HEAP[H + LEFT_SLOT] = RES;
        HEAP[RES + RIGHT_SLOT] = HEAP[G + LEFT_SLOT];
        H = RES;
        G = HEAP[G + LEFT_SLOT];
    }
    HEAP[H + LEFT_SLOT] = HEAP[B + LEFT_SLOT];
    RES = I;
}

///////////////////////////////////////////////////////////////////////////////
/// Closure Stuff
///////////////////////////////////////////////////////////////////////////////

// Expects: Stack size in A, Func PC in B, Env extension count in C
// Returns: RES is closure node
function NEW_CLOSURE() {
    display("New closure");
    G = A;
    H = B;
    I = C;

    // Allocate closure root
    NEW();
    J = RES;
    HEAP[J + VAL_SLOT] = "Closure root";
    HEAP[J + RIGHT_SLOT] = G; // Right child is stack size

    // Allocate closure info node
    NEW();
    HEAP[RES + VAL_SLOT] = H; // Value is new PC
    HEAP[RES + LEFT_SLOT] = ENV; // Left child is current env node
    HEAP[RES + RIGHT_SLOT] = I; // Right child is extension size

    HEAP[J + LEFT_SLOT] = RES; // Left child is closure info node
    RES = J;
}

///////////////////////////////////////////////////////////////////////////////
/// RTS Stuff
///////////////////////////////////////////////////////////////////////////////

// Expects: OS, ENV and PC in registers
// Returns: RES is new RTS frame
function PUSH_RTS() {
    NEW();
    HEAP[RES + VAL_SLOT] = PC + 2; // Value is new PC
    HEAP[RES + LEFT_SLOT] = OS; // Left child is OS
    HEAP[RES + RIGHT_SLOT] = ENV; // Right child is ENV

    TOP_RTS = TOP_RTS + 1;
    RTS[TOP_RTS] = RES;
}

function POP_RTS() {
    RES = RTS[TOP_RTS];
    TOP_RTS = TOP_RTS - 1;
}

// // debugging: show current heap
// function is_node_tag(x) {
//     return x !== undefined && x <= -100 && x >= -110;
// }
// function node_kind(x) {
//     return x === NUMBER_TAG
//         ? "number"
//         : x === BOOL_TAG
//         ? "bool"
//         : x === CLOSURE_TAG
//         ? "closure"
//         : x === RTS_FRAME_TAG
//         ? "RTS frame"
//         : x === OS_TAG
//         ? "OS"
//         : x === ENV_TAG
//         ? "environment"
//         : x === UNDEFINED_TAG
//         ? "undefined"
//         : " (unknown node kind)";
// }
// function show_heap(s) {
//     const len = array_length(HEAP);
//     let i = 0;
//     display("", "--- HEAP --- " + s);
//     while (i < len) {
//         display(
//             "",
//             stringify(i) +
//                 ": " +
//                 stringify(HEAP[i]) +
//                 (is_number(HEAP[i]) && is_node_tag(HEAP[i])
//                     ? " (" + node_kind(HEAP[i]) + ")"
//                     : "")
//         );
//         i = i + 1;
//     }
// }

function show_heap_value(address) {
    display(
        "",
        "result: heap node of value = " + stringify(HEAP[address + VAL_SLOT])
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
    NEW_OS();
    OS = RES;
    NEW_ENVIRONMENT();
    ENV = RES;
    PC = PC + 1;
};

M[LDCN] = () => {
    A = P[PC + LDCN_VALUE_OFFSET];
    PUSH_OS_NUM();
    PC = PC + 2;
};

M[LDCB] = () => {
    A = P[PC + LDCB_VALUE_OFFSET];
    PUSH_OS_BOOL();
    PC = PC + 2;
};

M[LDCU] = () => {
    PUSH_OS_UNDEF();
    PC = PC + 1;
};

M[PLUS] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];
    POP_OS();
    A = HEAP[RES + VAL_SLOT] + A;
    PUSH_OS_NUM();
    PC = PC + 1;
};

M[MINUS] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];
    POP_OS();
    A = HEAP[RES + VAL_SLOT] - A;
    PUSH_OS_NUM();
    PC = PC + 1;
};

M[TIMES] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];
    POP_OS();
    A = HEAP[RES + VAL_SLOT] * A;
    PUSH_OS_NUM();
    PC = PC + 1;
};

M[EQUAL] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];
    POP_OS();
    A = HEAP[RES + VAL_SLOT] === A;
    PUSH_OS_BOOL();
    PC = PC + 1;
};

M[LESS] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];
    POP_OS();
    A = HEAP[RES + VAL_SLOT] < A;
    PUSH_OS_BOOL();
    PC = PC + 1;
};

M[GEQ] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];
    POP_OS();
    A = HEAP[RES + VAL_SLOT] >= A;
    PUSH_OS_BOOL();
    PC = PC + 1;
};

M[LEQ] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];
    POP_OS();
    A = HEAP[RES + VAL_SLOT] <= A;
    PUSH_OS_BOOL();
    PC = PC + 1;
};

M[GREATER] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];
    POP_OS();
    A = HEAP[RES + VAL_SLOT] > A;
    PUSH_OS_BOOL();
    PC = PC + 1;
};

M[NOT] = () => {
    POP_OS();
    A = !HEAP[RES + VAL_SLOT];
    PUSH_OS_BOOL();
    PC = PC + 1;
};

M[DIV] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];
    E = A;
    POP_OS();
    A = HEAP[RES + VAL_SLOT] / E;
    PUSH_OS_NUM();
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

M[JOF] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];

    if (A) {
        PC = PC + 2;
    } else {
        PC = P[PC + 1];
    }
};

M[GOTO] = () => {
    PC = P[PC + 1];
};

M[ASSIGN] = () => {
    POP_OS();
    A = RES;
    B = P[PC + 1];
    C = ENV;
    BIND_IN_ENV();
    PC = PC + 2;
};

M[LD] = () => {
    A = P[PC + 1];
    ACCESS_ENV();
    A = RES;
    PUSH_OS_NODE();
    PC = PC + 2;
};

M[LDF] = () => {
    A = P[PC + LDF_MAX_OS_SIZE_OFFSET];
    B = P[PC + LDF_ADDRESS_OFFSET];
    C = P[PC + LDF_ENV_EXTENSION_COUNT_OFFSET];
    NEW_CLOSURE();
    A = RES;
    PUSH_OS_NODE();
    PC = PC + 4;
};

M[CALL] = () => {
    K = P[PC + 1]; // Number of args
    NEW_ENVIRONMENT();
    C = RES; // C is extended part of env

    for (L = K; L > 0; L = L - 1) {
        POP_OS();
        A = RES;
        B = L - 1;
        BIND_IN_ENV();
    }

    POP_OS();
    L = RES; // L is closure node

    N = HEAP[L + LEFT_SLOT]; // N is closure info node
    A = HEAP[N + LEFT_SLOT]; // A is closure env

    B = C;
    EXTEND();
    D = RES; // D is new env

    PUSH_RTS(); // Current env and os pushed

    NEW_OS();
    E = RES; // E is new OS;

    OS = E;
    ENV = D;
    PC = HEAP[N + VAL_SLOT];
};

M[RTN] = () => {
    POP_RTS();
    H = RES;

    PC = HEAP[H + VAL_SLOT];
    ENV = HEAP[H + RIGHT_SLOT];
    POP_OS();
    A = RES;
    OS = HEAP[H + LEFT_SLOT];
    PUSH_OS_NODE();
};

M[DONE] = () => {
    RUNNING = false;
};

function run() {
    const GC_PROBABILITY = 1.0;

    while (RUNNING) {
        if (math_random() < GC_PROBABILITY) {
            INVOKE_GC();
        }

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
