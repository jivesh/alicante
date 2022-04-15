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
let O = 0;

function show_executing(s) {
    // display("", "--- RUN ---" + s);
    // display(PC, "PC :");
    // display(get_name(P[PC]), "instr:");
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
// temporary root
let TEMP_ROOT = -Infinity;

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
    A = math_floor(heapsize / NODE_SIZE);
    display(A * NODE_SIZE, "\nInitialising with usable heap size:");
    HEAP = [];
    HEAP_SIZE = A * NODE_SIZE;

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

const MARK_ROOTS = 0;
const MARK = 1;
const APPEND = 2;
let GC_STATE = MARK_ROOTS;

// GC registers
let GC_A = 0;
let GC_B = 0;
let GC_C = 0;
let GC_D = 0;
let GC_E = 0;
let GC_F = 0;

function MARK_ROOTS_PHASE() {
    HEAP[NIL + COLOR_SLOT] = BLACK;
    HEAP[FREE + COLOR_SLOT] = GREY;
    HEAP[OS + COLOR_SLOT] = GREY;
    HEAP[ENV + COLOR_SLOT] = GREY;
    for (let GC_A = 0; GC_A < array_length(RTS); GC_A = GC_A + 1) {
        HEAP[RTS[GC_A] + COLOR_SLOT] = GREY;
    }

    GC_STATE = MARK;
    GC_A = 0;
    GC_B = HEAP_SIZE;
}

function MARK_PHASE() {
    if (GC_B < 1) {
        GC_STATE = APPEND;
        GC_A = 0;
    } else {
        GC_C = HEAP[GC_A + COLOR_SLOT];

        if (GC_C === GREY) {
            HEAP[GC_A + COLOR_SLOT] = BLACK;

            for (GC_D = LEFT_SLOT; GC_D <= RIGHT_SLOT; GC_D = GC_D + 1) {
                GC_E = HEAP[GC_A + GC_D];
                if (GC_E === NIL) {
                } else {
                    HEAP[GC_E + COLOR_SLOT] = math_max(
                        HEAP[GC_E + COLOR_SLOT],
                        GREY
                    );
                }
            }

            GC_B = HEAP_SIZE;
        } else {
            GC_B = GC_B - NODE_SIZE;
        }
        GC_A = (GC_A + NODE_SIZE) % HEAP_SIZE;
    }
}

function APPEND_PHASE() {
    if (GC_A === HEAP_SIZE) {
        GC_STATE = MARK_ROOTS;
    } else {
        GC_C = HEAP[GC_A + COLOR_SLOT];
        if (GC_C === BLACK) {
            HEAP[GC_A + COLOR_SLOT] = WHITE;
        } else if (GC_C === WHITE) {
            HEAP[FREE + VAL_SLOT] = "Free node";
            HEAP[GC_A + VAL_SLOT] = "Free root";
            HEAP[GC_A + LEFT_SLOT] = FREE;
            HEAP[GC_A + RIGHT_SLOT] = NIL;
            FREE = GC_A;

            FREE_LEFT = FREE_LEFT + 1;
        } else {
            display(HEAP);
        }
        GC_A = GC_A + NODE_SIZE;
    }
}

let MARK_REPS = 5; // num of markings each round
let APPEND_REPS = 1; // num of appends each rouns
function INVOKE_GC() {
    if (GC_STATE === MARK_ROOTS) {
        MARK_ROOTS_PHASE();
    } else if (GC_STATE === MARK) {
        for (GC_F = 0; GC_F < MARK_REPS; GC_F = GC_F + 1) {
            MARK_PHASE();
        }
    } else {
        for (GC_F = 0; GC_F < APPEND_REPS; GC_F = GC_F + 1) {
            APPEND_PHASE();
        }
    }
}

// Expects: Requried number of nodes in O
function CHECK_OOM() {
    RES = false;
    if (FREE_LEFT < O) {
        STOP_THE_WORLD();
        if (FREE === NIL) {
            STATE = OUT_OF_MEMORY_ERROR;
            RUNNING = false;
        } else {
            RES = true;
        }

        // Reset GC
        GC_STATE = MARK_ROOTS;
    } else {
        RES = true;
    }
}

// Reset all colours
function CLEAR_COLORS() {
    HEAP[NIL + COLOR_SLOT] = BLACK; // Ensure NIL is not collected
    for (GC_F = NIL + NODE_SIZE; GC_F < HEAP_SIZE; GC_F = GC_F + NODE_SIZE) {
        HEAP[GC_F + COLOR_SLOT] = WHITE;
    }
}

// Fall back
function STOP_THE_WORLD() {
    CLEAR_COLORS();

    // Add roots
    GC_A = []; // Queue
    GC_A[0] = FREE;
    HEAP[FREE + COLOR_SLOT] = GREY;

    GC_A[1] = ENV;
    HEAP[ENV + COLOR_SLOT] = GREY;

    GC_A[2] = OS;
    HEAP[OS + COLOR_SLOT] = GREY;

    GC_B = 3; // Back pointer
    for (GC_C = 0; GC_C <= TOP_RTS; GC_C = GC_C + 1) {
        GC_A[GC_B] = RTS[GC_C];
        HEAP[GC_A[GC_B] + COLOR_SLOT] = GREY;
        GC_B = GC_B + 1;
    }

    // Marking
    GC_C = 0; // Front pointer
    while (GC_C < GC_B) {
        GC_D = GC_A[GC_C];
        if (HEAP[GC_D + COLOR_SLOT] === GREY) {
            // Mark black and add children
            HEAP[GC_D + COLOR_SLOT] = BLACK;

            for (GC_E = LEFT_SLOT; GC_E <= RIGHT_SLOT; GC_E = GC_E + 1) {
                GC_F = HEAP[GC_D + GC_E];
                if (GC_F === NIL) {
                } else {
                    HEAP[GC_F + COLOR_SLOT] = math_max(
                        HEAP[GC_F + COLOR_SLOT],
                        GREY
                    );
                    GC_A[GC_B] = GC_F;
                    GC_B = GC_B + 1;
                }
            }
        } else {
        }
        GC_C = GC_C + 1;
    }

    // Sweeping
    for (GC_C = 0; GC_C < array_length(HEAP); GC_C = GC_C + NODE_SIZE) {
        if (HEAP[GC_C + COLOR_SLOT] === WHITE) {
            // Append white to free list
            HEAP[FREE + VAL_SLOT] = "Free node";
            HEAP[GC_C + VAL_SLOT] = "Free root";
            HEAP[GC_C + LEFT_SLOT] = FREE;
            HEAP[GC_C + RIGHT_SLOT] = NIL;
            FREE = GC_C;

            FREE_LEFT = FREE_LEFT + 1;
        } else {
        }
        HEAP[GC_C + COLOR_SLOT] = WHITE;
    }
}

// Pops from free list if available
// Returns: RES is new node address
function NEW() {
    RES = FREE;
    FREE = HEAP[FREE + LEFT_SLOT];
    HEAP[FREE + VAL_SLOT] = "Free root";

    HEAP[RES + LEFT_SLOT] = NIL;
    HEAP[FREE + COLOR_SLOT] = math_max(HEAP[FREE + COLOR_SLOT], GREY);

    HEAP[RES + COLOR_SLOT] = math_max(HEAP[RES + COLOR_SLOT], GREY);

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
    D = RES;

    // Allocate new os node
    NEW();
    HEAP[RES + VAL_SLOT] = "OS Top";
    HEAP[RES + LEFT_SLOT] = OS; // Left child as current OS node
    HEAP[RES + RIGHT_SLOT] = D; // Right child as value node

    HEAP[OS + VAL_SLOT] = "OS Node";
    OS = RES;
}

// Expects: value in A
// Returns: OS & RES is new OS head
function PUSH_OS_NUM() {
    PUSH_OS_VAL();
}

// Expects: value in A
// Returns: OS & RES is new OS head
function PUSH_OS_BOOL() {
    PUSH_OS_VAL();
}

// Doesn't expect anything
// Returns: OS & RES is new OS head
function PUSH_OS_UNDEF() {
    A = "undefined";
    PUSH_OS_VAL();
}

// Expects: node address in A
// Returns: OS & RES is new OS head
function PUSH_OS_NODE() {
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
    NEW();
    HEAP[RES + VAL_SLOT] = "OS Top";
}

// Doesn't expect anything
// Returns: RES is value node
function POP_OS() {
    D = OS; // Old OS top
    OS = HEAP[OS + LEFT_SLOT]; // New OS top
    RES = HEAP[D + RIGHT_SLOT];

    HEAP[D + VAL_SLOT] = "Popped";
    HEAP[OS + VAL_SLOT] = "OS Top";

    HEAP[OS + COLOR_SLOT] = math_max(HEAP[OS + COLOR_SLOT], GREY);

    HEAP[RES + COLOR_SLOT] = math_max(HEAP[RES + COLOR_SLOT], GREY);
}

///////////////////////////////////////////////////////////////////////////////
/// Env Stuff
///////////////////////////////////////////////////////////////////////////////

// Expects: Size of env in A
// Returns: RES is new ENV
function NEW_ENVIRONMENT() {
    NEW();
    HEAP[RES + VAL_SLOT] = "ENV Start";
    D = RES;

    NEW();
    HEAP[D + RIGHT_SLOT] = RES;
    HEAP[RES + VAL_SLOT] = A;

    // Allocate binding nodes
    E = D;
    for (H = 0; H < A; H = H + 1) {
        NEW_ENV_BIND();
        HEAP[E + LEFT_SLOT] = RES;
        E = RES;
    }
    RES = D;
}

function NEW_ENV_BIND() {
    NEW();
    HEAP[RES + VAL_SLOT] = "Env Bind";
}

// Expects: Env to extend in A, Number of bindings to add in B
function ADD_BINDINGS() {
    D = HEAP[A + RIGHT_SLOT];
    HEAP[D + VAL_SLOT] = HEAP[D + VAL_SLOT] + B;

    G = A;
    while (HEAP[G + LEFT_SLOT] !== NIL) {
        G = HEAP[G + LEFT_SLOT];
    }

    for (H = 0; H < B; H = H + 1) {
        NEW_ENV_BIND();
        HEAP[G + LEFT_SLOT] = RES;
        G = RES;
    }
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
    HEAP[G + RIGHT_SLOT] = H;
}

// Expects: Index in env in A
// Returns: RES is value node
function ACCESS_ENV() {
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
    A = HEAP[HEAP[A + RIGHT_SLOT] + VAL_SLOT];
    NEW_ENVIRONMENT();

    H = RES;
    I = H;
    while (HEAP[G + LEFT_SLOT] !== NIL) {
        HEAP[HEAP[H + LEFT_SLOT] + RIGHT_SLOT] =
            HEAP[HEAP[G + LEFT_SLOT] + RIGHT_SLOT];
        H = HEAP[H + LEFT_SLOT];
        G = HEAP[G + LEFT_SLOT];
    }
    HEAP[H + LEFT_SLOT] = HEAP[B + LEFT_SLOT];
    RES = I;

    I = HEAP[I + RIGHT_SLOT];
    J = HEAP[B + RIGHT_SLOT];
    HEAP[I + VAL_SLOT] = HEAP[I + VAL_SLOT] + HEAP[J + VAL_SLOT];
}

///////////////////////////////////////////////////////////////////////////////
/// Closure Stuff
///////////////////////////////////////////////////////////////////////////////

// Expects: Stack size in A, Func PC in B, Env extension count in C
// Returns: RES is closure node
function NEW_CLOSURE() {
    G = A;
    H = B;
    I = C;

    // Allocate closure root
    NEW();
    J = RES;
    HEAP[J + VAL_SLOT] = "Closure root";

    // Allocate closure info node
    NEW();
    D = RES;
    HEAP[D + VAL_SLOT] = H; // Value is new PC
    HEAP[D + LEFT_SLOT] = ENV; // Left child is current env node

    // Allocate 2nd closure info node
    NEW();
    E = RES;
    HEAP[E + VAL_SLOT] = C; // Value is extension count

    HEAP[J + LEFT_SLOT] = D; // Left child is 1st closure info node
    HEAP[J + RIGHT_SLOT] = E; // Right child is 2nd closure info node
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

const M = []; // Instrcutions
const MEM = []; // Memory required for instructions
const CALL_2 = 23;

M[START] = () => {
    NEW_OS();
    OS = RES;

    A = 0;
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
MEM[POP] = 0;

M[JOF] = () => {
    POP_OS();
    A = HEAP[RES + VAL_SLOT];

    if (A) {
        PC = PC + 2;
    } else {
        PC = P[PC + 1];
    }
};
MEM[JOF] = 0;

M[GOTO] = () => {
    PC = P[PC + 1];
};
MEM[GOTO] = 0;

M[ASSIGN] = () => {
    POP_OS();
    A = RES;
    B = P[PC + 1];
    C = ENV;
    BIND_IN_ENV();
    PC = PC + 2;
};
MEM[ASSIGN] = 0;

M[LD] = () => {
    A = P[PC + 1];
    ACCESS_ENV();
    A = RES;
    PUSH_OS_NODE();
    PC = PC + 2;
};
MEM[LD] = 1;

M[LDF] = () => {
    A = P[PC + LDF_MAX_OS_SIZE_OFFSET];
    B = P[PC + LDF_ADDRESS_OFFSET];
    C = P[PC + LDF_ENV_EXTENSION_COUNT_OFFSET];

    NEW_CLOSURE();
    A = RES;
    PUSH_OS_NODE();
    PC = PC + 4;
};
MEM[LDF] = 4;

M[CALL] = () => {
    N = P[PC + 1]; // Number of args

    A = N;
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

    PUSH_RTS(); // Current env and os pushed

    ENV = C; // Temp to keep it from being collected, env
    OS = L; // Temp to keep it from being collected, closure

    CALL_RESUME = true;
};
MEM[CALL] = -1;

function GET_CALL_MEM() {
    L = OS;
    D = HEAP[L + LEFT_SLOT]; // D is closure info node 1
    E = HEAP[L + RIGHT_SLOT]; // E is closure infor node 2

    A = ENV;
    O = HEAP[E + VAL_SLOT] - HEAP[HEAP[A + RIGHT_SLOT] + VAL_SLOT]; // Extension left

    A = HEAP[D + LEFT_SLOT]; // A is closure env
    O = O + HEAP[HEAP[A + RIGHT_SLOT] + VAL_SLOT] + 3;
}

M[CALL_2] = () => {
    L = OS;
    K = HEAP[L + LEFT_SLOT]; // K is closure info node 1
    N = HEAP[L + RIGHT_SLOT]; // N is closure infor node 2

    C = ENV;
    A = ENV;
    B = HEAP[N + VAL_SLOT] - HEAP[HEAP[A + RIGHT_SLOT] + VAL_SLOT]; // Extension left
    ADD_BINDINGS();

    A = HEAP[K + LEFT_SLOT]; // A is closure env
    B = C;
    EXTEND();
    C = RES; // C is new env

    NEW_OS();
    B = RES; // B is new OS;

    OS = B;
    ENV = C;
    PC = HEAP[K + VAL_SLOT];

    CALL_RESUME = false;
};
MEM[CALL_2] = -1;

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
MEM[RTN] = 1;

M[DONE] = () => {
    RUNNING = false;
};
MEM[DONE] = 0;

///////////////////////////////////////////////////////////////////////////////
/// Main loop
///////////////////////////////////////////////////////////////////////////////

let CALL_RESUME = false;

function scan_heap() {
    K = 0;
    for (I = 0; I < array_length(HEAP); I = I + NODE_SIZE) {
        J = HEAP[I + VAL_SLOT];
        if (J === "Free node" || J === "Free root") {
            K = K + 1;
        } else {
        }
    }
    display(
        array_length(HEAP) - K * 4
    );
}

const SEQ = [0];
let SEQ_I = 0;

const RUN_PROGRAM = 0;
const RUN_GC = 1;

// User can change this
let test_interleaving = list(RUN_PROGRAM, RUN_GC);

function run_with_test_interleaving() {
    while (RUNNING) {
        if (SEQ[SEQ_I] === undefined) {
            // Keep wrapping around the test interleaving
            SEQ[SEQ_I] = list_ref(
                test_interleaving,
                SEQ_I % length(test_interleaving)
            );
        } else {
        }

        if (SEQ[SEQ_I] === RUN_GC) {
            INVOKE_GC();
        } else {
            // display(PC, "PC: ");
            F = P[PC]; // Current Instruction
            if (M[F] === undefined) {
                error(F, "unknown op-code:");
            } else {
                if (F === CALL && CALL_RESUME) {
                    F = CALL_2;
                } else {
                }

                // Find memory needed
                if (MEM[F] === undefined) {
                    O = 2;
                } else if (F === CALL_2) {
                    GET_CALL_MEM();
                } else if (F === CALL) {
                    O = 3 + P[PC + 1];
                } else {
                    O = MEM[F];
                }

                // Check if enough memory available
                CHECK_OOM();
                if (RES) {
                    M[F](); // Run instruction
                } else {
                }
            }
        }

        SEQ_I = SEQ_I + 1;
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

function run() {
    const GC_PROBABILITY = 0.2;

    while (RUNNING) {
        if (SEQ[SEQ_I] === undefined) {
            SEQ[SEQ_I] = math_random() < GC_PROBABILITY ? 1 : 0;
        } else {
        }

        if (SEQ[SEQ_I] === 1) {
            INVOKE_GC();
        } else {
            // display(PC, "PC: ");
            F = P[PC]; // Current Instruction
            if (M[F] === undefined) {
                error(F, "unknown op-code:");
            } else {
                if (F === CALL && CALL_RESUME) {
                    F = CALL_2;
                } else {
                }

                // Find memory needed
                if (MEM[F] === undefined) {
                    O = 2;
                } else if (F === CALL_2) {
                    GET_CALL_MEM();
                } else if (F === CALL) {
                    O = 3 + P[PC + 1];
                } else {
                    O = MEM[F];
                }

                // Check if enough memory available
                CHECK_OOM();
                if (RES) {
                    M[F](); // Run instruction
                } else {
                }
            }
        }

        SEQ_I = SEQ_I + 1;
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

function configure_mark_reps(n) {
    MARK_REPS = math_floor(HEAP_SIZE / NODE_SIZE) / n;
}

function configure_append_reps(n) {
    APPEND_REPS = math_floor(HEAP_SIZE / NODE_SIZE) / n;
}

MARK_REPS = 10;
APPEND_REPS = 10;
