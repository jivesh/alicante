// VIRTUAL MACHINE

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
let RUNNING = false;

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
let O = 0;
let Q = 0;

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
    display(O, "O  :");
    display(Q, "Q  :");
    display(OS, "OS :");
    display(ENV, "ENV:");
    display(RTS, "RTS:");
    display(TOP_RTS, "TOP_RTS:");
}

// HEAP is array containing all dynamically allocated data structures
let HEAP = NaN;
// Address of head node in free list
let FREE = -Infinity;
// Number of free nodes left
let FREE_LEFT = -Infinity;
// Address of NIL node in HEAP
let NIL = -Infinity;
// the size of the heap is fixed
let HEAP_SIZE = -Infinity;

// special register to help in breaking call
let CALL_RESUME = false;

// general node layout
const NODE_SIZE = 4;
const VAL_SLOT = 0;
const LEFT_SLOT = 1; // Doubles as next pointer
const RIGHT_SLOT = 2;
const COLOR_SLOT = 3;

// node colors
const WHITE = 0;
const GREY = 1;
const BLACK = 2;

///////////////////////////////////////////////////////////////////////////////
/// MEMORY MANAGEMENT
///////////////////////////////////////////////////////////////////////////////

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

    // Link all others as free
    FREE_LEFT = 0;
    for (C = 1; C < A; C = C + 1) {
        B = C * NODE_SIZE;
        HEAP[B + VAL_SLOT] = "Free node";
        HEAP[B + LEFT_SLOT] = C === A - 1 ? NIL : NODE_SIZE * ((C + 1) % A);
        HEAP[B + RIGHT_SLOT] = NIL;
        HEAP[B + COLOR_SLOT] = WHITE;
        FREE_LEFT = FREE_LEFT + 1;
    }

    FREE = 1 * NODE_SIZE;
    HEAP[FREE + VAL_SLOT] = "Free root";
}

///////////////////////////////////////////////////////////////////////////////
/// GC Stuff
///////////////////////////////////////////////////////////////////////////////

// GC states
const MARK_ROOTS = 0;
const MARK = 1;
const APPEND = 2;

let GC_STATE = MARK_ROOTS;

let GC_INDEX = 0;
let GC_COUNTER = HEAP_SIZE;

function MARK_ROOTS_PHASE() {
    HEAP[NIL + COLOR_SLOT] = GREY;
    HEAP[FREE + COLOR_SLOT] = GREY;
    HEAP[OS + COLOR_SLOT] = GREY;
    HEAP[ENV + COLOR_SLOT] = GREY;
    for (let i = 0; i < array_length(RTS); i = i + 1) {
        HEAP[RTS[i] + COLOR_SLOT] = GREY;
    }

    GC_STATE = MARK;
}

function display_color(A) {
    if (A === GREY) {
        display("Current color: grey");
    } else if (A === BLACK) {
        display("Current color: black");
    } else {
        display("Current color: white");
    }
}

function MARK_PHASE() {
    if (GC_COUNTER === 0) {
        // Done marking, switch to APPEND
        GC_STATE = APPEND;
        GC_INDEX = 0;
    } else {
        A = HEAP[GC_INDEX + COLOR_SLOT];

        // display(GC_INDEX, "Current GC Index:");
        // display_color(A);

        if (A === GREY) {
            // Grey -> Black, shade children
            HEAP[GC_INDEX + COLOR_SLOT] = BLACK;

            for (F = LEFT_SLOT; F <= RIGHT_SLOT; F = F + 1) {
                E = HEAP[GC_INDEX + F];
                if (E === NIL) {
                }
                HEAP[E + COLOR_SLOT] = math_max(HEAP[E + COLOR_SLOT], GREY);
            }

            GC_COUNTER = HEAP_SIZE;
        } else {
            // Skip, account for node
            GC_COUNTER = GC_COUNTER - 1;
        }
        GC_INDEX = (GC_INDEX + NODE_SIZE) % HEAP_SIZE;
    }
}

function APPEND_PHASE() {
    if (GC_INDEX === HEAP_SIZE) {
        GC_STATE = MARK_ROOTS;
        GC_INDEX = 0;
        GC_COUNTER = HEAP_SIZE;
    } else {
        A = HEAP[GC_INDEX + COLOR_SLOT];
        if (A === BLACK) {
            HEAP[GC_INDEX + COLOR_SLOT] = WHITE;
        } else {
            HEAP[FREE + VAL_SLOT] = "Free node";
            HEAP[GC_INDEX + VAL_SLOT] = "Free root";
            HEAP[GC_INDEX + LEFT_SLOT] = FREE;
            HEAP[GC_INDEX + RIGHT_SLOT] = NIL;
            FREE = GC_INDEX;

            FREE_LEFT = FREE_LEFT + 1;
        }
        GC_INDEX = GC_INDEX + NODE_SIZE;
    }
}

function INVOKE_GC() {
    if (GC_STATE === MARK_ROOTS) {
        display("Marking roots");
        MARK_ROOTS_PHASE();
    } else if (GC_STATE === MARK) {
        display("Marking");
        MARK_PHASE();
    } else {
        display("Appending");
        APPEND_PHASE();
    }
}

// Expects: Required number of nodes in O
function CHECK_OOM() {
    if (FREE_LEFT < O) {
        RES = false;
    } else {
        RES = true;
    }
}

// Pops from free list if available
// Returns: RES is new node address
function NEW() {
    RES = FREE;
    FREE = HEAP[FREE + LEFT_SLOT];
    HEAP[FREE + VAL_SLOT] = "Free root";

    HEAP[RES + LEFT_SLOT] = NIL;
    HEAP[RES + COLOR_SLOT] = WHITE;

    FREE_LEFT = FREE_LEFT - 1;
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
    // G = A;
    // O = 0;
    // while (HEAP[G + LEFT_SLOT] !== NIL) {
    //     O = O + 1;
    //     G = HEAP[G + LEFT_SLOT];
    // }
    G = A;

    NEW_ENVIRONMENT();
    H = RES;
    I = H;

    while (HEAP[G + LEFT_SLOT] !== NIL) {
        NEW_ENV_BIND();
        HEAP[H + LEFT_SLOT] = RES;
        HEAP[RES + RIGHT_SLOT] = HEAP[HEAP[G + LEFT_SLOT] + RIGHT_SLOT];
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
    HEAP[J + RIGHT_SLOT] = NIL; // Right child is stack size, ignored

    // Allocate closure info node
    NEW();
    HEAP[RES + VAL_SLOT] = H; // Value is new PC
    HEAP[RES + LEFT_SLOT] = ENV; // Left child is current env node
    HEAP[RES + RIGHT_SLOT] = NIL; // Right child is extension size, ignored

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

function show_heap_value(address) {
    display(
        "",
        "result: heap node of value = " + stringify(HEAP[address + VAL_SLOT])
    );
}

///////////////////////////////////////////////////////////////////////////////
/// Machine Stuff
///////////////////////////////////////////////////////////////////////////////

const M = [];
const R = [];

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
    B = A;
    POP_OS();
    A = HEAP[RES + VAL_SLOT] / B;
    PUSH_OS_NUM();
    PC = PC + 1;

    B = B === 0;
    if (B) {
        STATE = DIV_ERROR;
        RUNNING = false;
    } else {
    }
};

M[POP] = () => {
    POP_OS();
    PC = PC + 1;
};

R[POP] = () => {
    RES = true;
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

R[JOF] = () => {
    RES = true;
};

M[GOTO] = () => {
    PC = P[PC + 1];
};

R[GOTO] = () => {
    RES = true;
};

M[ASSIGN] = () => {
    POP_OS();
    A = RES;
    B = P[PC + 1];
    C = ENV;
    BIND_IN_ENV();
    PC = PC + 2;
};

R[ASSIGN] = () => {
    O = 1;
    CHECK_OOM();
};

M[LD] = () => {
    A = P[PC + 1];
    ACCESS_ENV();
    A = RES;
    PUSH_OS_NODE();
    PC = PC + 2;
};

R[LD] = () => {
    O = 1;
    CHECK_OOM();
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

R[LDF] = () => {
    O = 3;
    CHECK_OOM();
};

M[CALL] = () => {
    N = P[PC + 1]; // Number of args

    NEW_ENVIRONMENT();
    C = RES; // C is extended part of env

    for (L = N; L > 0; L = L - 1) {
        POP_OS();
        A = RES;
        B = L - 1;
        BIND_IN_ENV();
    }

    POP_OS();
    L = RES; // L is closure node
    N = HEAP[L + LEFT_SLOT]; // N is closure info node
    A = HEAP[N + LEFT_SLOT]; // A is closure env

    PUSH_RTS(); // Current env and os pushed

    ENV = C; // Temp to keep it from being collected
    OS = L; // Temp to keep it from being collected

    CALL_RESUME = true;
};

R[CALL] = () => {
    N = P[PC + 1];

    O = 2 + N;
    CHECK_OOM();
};

const CALL_2 = 23;

M[CALL_2] = () => {
    L = OS;
    N = HEAP[L + LEFT_SLOT]; // N is closure info node
    A = HEAP[N + LEFT_SLOT]; // A is closure env

    B = ENV;
    EXTEND();
    ENV = RES; // New extended env

    NEW_OS();
    OS = RES; // New OS

    PC = HEAP[N + VAL_SLOT];

    CALL_RESUME = false;
};

R[CALL_2] = () => {
    L = OS;
    N = HEAP[L + LEFT_SLOT];
    A = HEAP[N + LEFT_SLOT];

    O = 2;
    while (HEAP[A + LEFT_SLOT] !== NIL) {
        O = O + 1;
        A = HEAP[A + LEFT_SLOT];
    }

    CHECK_OOM();
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

R[RTN] = () => {
    O = 1;
    CHECK_OOM();
};

M[DONE] = () => {
    RUNNING = false;
};

///////////////////////////////////////////////////////////////////////////////
/// Main loop
///////////////////////////////////////////////////////////////////////////////

function scan_heap() {
    let K = 0;
    for (I = 0; I < array_length(HEAP); I = I + NODE_SIZE) {
        J = HEAP[I + VAL_SLOT];
        if (J === "Free node" || J === "Free root") {
            K = K + 1;
        }
    }
    display(
        array_length(HEAP) - K * 4,
        "--------------------------------------------------Used: "
    );
}

function run() {
    const GC_PROBABILITY = 0.5;

    while (RUNNING) {
        if (math_random() < GC_PROBABILITY && PC > 5) {
            INVOKE_GC();
        } else {
            display(PC, "PC: ");
            if (M[P[PC]] === undefined) {
                error(P[PC], "unknown op-code:");
            } else {
                H = P[PC];
                if (H === CALL && CALL_RESUME) {
                    H = CALL_2;
                }

                // Check memory
                if (R[H] === undefined) {
                    O = 2;
                    CHECK_OOM();
                } else {
                    R[H]();
                }

                if (RES) {
                    M[H]();
                }
            }
        }
        scan_heap();
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

P = parse_and_compile(`
function factorial(n) {
    return n === 0 ? 1 : n * factorial(n - 1);
}
factorial(5);
`);
print_program(P);
initialize_machine(100);
run();