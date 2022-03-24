/* 

Virtual machine for language Source §1-

using virtual machine SVML1, Lecture Week 5 of CS4215

Instructions: press "Run" to evaluate an example expression
              (scroll down and un-comment one example)
              
The language Source §1- is defined as follows:

stmt    ::= expr ;
         |  const x = expr ;
         |  return expr ;
         |  stmt stmt ;

expr    ::= number
         |  true | false
         |  expr ? expr : expr
         |  expr && expr
         |  expr || expr
         |  expr binop expr
         |  unop expr
         |  expr ( expr (, expr)* )
         |  ( params ) => { stmt } ;
binop   ::= + | - | * | / | < | > | <= | >= | === | !==
unop    ::= !              
params  ::= ε | name ( , name ) . . .
*/

// SYNTAX OF SOURCE §1

// Functions from SICP JS Section 4.1.2
// with slight modifications

function is_tagged_list(expr, the_tag) {
    return is_pair(expr) && head(expr) === the_tag;
}

// names are tagged with "name".

function is_name(stmt) {
    return is_tagged_list(stmt, "name");
}
function symbol_of_name(stmt) {
    return head(tail(stmt));
}

function is_literal(stmt) {
    return is_tagged_list(stmt, "literal");
}

function literal_value(component) {
    return head(tail(component));
}

function make_literal(value) {
    return list("literal", value);
}

function is_undefined_expression(stmt) {
    return is_name(stmt) && symbol_of_name(stmt) === "undefined";
}

// constant declarations are tagged with "constant_declaration"
// and have "name" and "value" properties

function is_constant_declaration(stmt) {
    return is_tagged_list(stmt, "constant_declaration");
}
function declaration_symbol(component) {
    return symbol_of_name(head(tail(component)));
}
function constant_declaration_value(stmt) {
    return head(tail(tail(stmt)));
}
function make_constant_declaration(name, value_expression) {
    return list("constant_declaration", name, value_expression);
}
function is_declaration(component) {
    return (
        is_tagged_list(component, "constant_declaration") ||
        is_tagged_list(component, "variable_declaration") ||
        is_tagged_list(component, "function_declaration")
    );
}

// applications are tagged with "application"
// and have "operator" and "operands"

function is_application(component) {
    return is_tagged_list(component, "application");
}
function function_expression(component) {
    return head(tail(component));
}
function arg_expressions(component) {
    return head(tail(tail(component)));
}

// we distinguish primitive applications by their
// operator name

function is_operator_combination(component) {
    return (
        is_unary_operator_combination(component) ||
        is_binary_operator_combination(component)
    );
}
function is_unary_operator_combination(component) {
    return is_tagged_list(component, "unary_operator_combination");
}
function is_binary_operator_combination(component) {
    return is_tagged_list(component, "binary_operator_combination");
}
function operator_symbol(component) {
    return list_ref(component, 1);
}
function first_operand(component) {
    return list_ref(component, 2);
}
function second_operand(component) {
    return list_ref(component, 3);
}

// logical compositions are tagged
// with "logical_composition"

function is_logical_composition(expr) {
    return is_tagged_list(expr, "logical_composition");
}
function logical_composition_operator(expr) {
    return head(tail(expr));
}

// conditional expressions are tagged
// with "conditional_expression"

function is_conditional_expression(expr) {
    return is_tagged_list(expr, "conditional_expression");
}
function cond_expr_pred(expr) {
    return list_ref(expr, 1);
}
function cond_expr_cons(expr) {
    return list_ref(expr, 2);
}
function cond_expr_alt(expr) {
    return list_ref(expr, 3);
}
function make_conditional_expression(expr1, expr2, expr3) {
    return list("conditional_expression", expr1, expr2, expr3);
}

// lambda expressions are tagged with "lambda_expression"
// have a list of "parameters" and a "body" statement

function is_lambda_expression(component) {
    return is_tagged_list(component, "lambda_expression");
}
function lambda_parameter_symbols(component) {
    return map(symbol_of_name, head(tail(component)));
}
function lambda_body(component) {
    return head(tail(tail(component)));
}
function make_lambda_expression(parameters, body) {
    return list("lambda_expression", parameters, body);
}

// blocks are tagged with "block"
// have "body" statement

function is_block(component) {
    return is_tagged_list(component, "block");
}
function block_body(component) {
    return head(tail(component));
}

// function declarations are tagged with "lambda_expression"
// have a list of "parameters" and a "body" statement

function is_function_declaration(component) {
    return is_tagged_list(component, "function_declaration");
}
function function_declaration_name(component) {
    return list_ref(component, 1);
}
function function_declaration_parameters(component) {
    return list_ref(component, 2);
}
function function_declaration_body(component) {
    return list_ref(component, 3);
}
function function_decl_to_constant_decl(component) {
    return make_constant_declaration(
        function_declaration_name(component),
        make_lambda_expression(
            function_declaration_parameters(component),
            function_declaration_body(component)
        )
    );
}

// sequences of statements are just represented
// by tagged lists of statements by the parser.

function is_sequence(stmt) {
    return is_tagged_list(stmt, "sequence");
}
function make_sequence(stmts) {
    return list("sequence", stmts);
}
function sequence_statements(stmt) {
    return head(tail(stmt));
}
function is_empty_sequence(stmts) {
    return is_null(stmts);
}
function is_last_statement(stmts) {
    return is_null(tail(stmts));
}
function first_statement(stmts) {
    return head(stmts);
}
function rest_statements(stmts) {
    return tail(stmts);
}

// functions return the value that results from
// evaluating their expression

function is_return_statement(stmt) {
    return is_tagged_list(stmt, "return_statement");
}
function return_statement_expression(stmt) {
    return head(tail(stmt));
}

// OP-CODES

// op-codes of machine instructions, used by compiler
// and machine

const START = 0;
const LDCN = 1; // followed by: number
const LDCB = 2; // followed by: boolean
const LDCU = 3;
const PLUS = 4;
const MINUS = 5;
const TIMES = 6;
const EQUAL = 7;
const LESS = 8;
const GREATER = 9;
const LEQ = 10;
const GEQ = 11;
const NOT = 12;
const DIV = 13;
const POP = 14;
const ASSIGN = 15; // followed by: index of value in environment
const JOF = 16; // followed by: jump address
const GOTO = 17; // followed by: jump address
const LDF = 18; // followed by: max_stack_size, address, env extensn count
const CALL = 19;
const LD = 20; // followed by: index of value in environment
const RTN = 21;
const DONE = 22;

// some auxiliary constants
// to keep track of the inline data

const LDF_MAX_OS_SIZE_OFFSET = 1;
const LDF_ADDRESS_OFFSET = 2;
const LDF_ENV_EXTENSION_COUNT_OFFSET = 3;
const LDCN_VALUE_OFFSET = 1;
const LDCB_VALUE_OFFSET = 1;

// printing opcodes for debugging

const OPCODES = list(
    pair(START, "START  "),
    pair(LDCN, "LDCN   "),
    pair(LDCB, "LDCB   "),
    pair(LDCU, "LDCU   "),
    pair(PLUS, "PLUS   "),
    pair(MINUS, "MINUS  "),
    pair(TIMES, "TIMES  "),
    pair(EQUAL, "EQUAL  "),
    pair(LESS, "LESS   "),
    pair(GREATER, "GREATER"),
    pair(LEQ, "LEQ    "),
    pair(GEQ, "GEQ    "),
    pair(NOT, "NOT    "),
    pair(DIV, "DIV    "),
    pair(POP, "POP    "),
    pair(ASSIGN, "ASSIGN "),
    pair(JOF, "JOF    "),
    pair(GOTO, "GOTO   "),
    pair(LDF, "LDF    "),
    pair(CALL, "CALL   "),
    pair(LD, "LD     "),
    pair(RTN, "RTN    "),
    pair(DONE, "DONE   ")
);

// get a the name of an opcode, for debugging

function get_name(op) {
    function lookup(opcodes) {
        return is_null(opcodes)
            ? error(op, "unknown opcode")
            : op === head(head(opcodes))
            ? tail(head(opcodes))
            : lookup(tail(opcodes));
    }
    return lookup(OPCODES);
}

// pretty-print the program

function print_program(P) {
    let i = 0;
    while (i < array_length(P)) {
        let s = stringify(i);
        const op = P[i];
        s = s + ": " + get_name(P[i]);
        i = i + 1;
        if (
            op === LDCN ||
            op === LDCB ||
            op === GOTO ||
            op === JOF ||
            op === ASSIGN ||
            op === LDF ||
            op === LD ||
            op === CALL
        ) {
            s = s + " " + stringify(P[i]);
            i = i + 1;
        } else {
        }
        if (op === LDF) {
            s = s + " " + stringify(P[i]) + " " + stringify(P[i + 1]);
            i = i + 2;
        } else {
        }
        display("", s);
    }
}

// COMPILER FROM SOURCE TO SVML

// parse given string and compile it to machine code
// return the machine code in an array

function parse_and_compile(string) {
    // machine_code is array for machine instructions
    const machine_code = [];

    // insert_pointer keeps track of the next free place
    // in machine_code
    let insert_pointer = 0;

    // three insert functions (nullary, unary, binary instructions)
    function add_nullary_instruction(op_code) {
        machine_code[insert_pointer] = op_code;
        insert_pointer = insert_pointer + 1;
    }
    // unary instructions have one argument (constant or address)
    function add_unary_instruction(op_code, arg_1) {
        machine_code[insert_pointer] = op_code;
        machine_code[insert_pointer + 1] = arg_1;
        insert_pointer = insert_pointer + 2;
    }
    // binary instructions have two arguments
    function add_binary_instruction(op_code, arg_1, arg_2) {
        machine_code[insert_pointer] = op_code;
        machine_code[insert_pointer + 1] = arg_1;
        machine_code[insert_pointer + 2] = arg_2;
        insert_pointer = insert_pointer + 3;
    }
    // ternary instructions have three arguments
    function add_ternary_instruction(op_code, arg_1, arg_2, arg_3) {
        machine_code[insert_pointer] = op_code;
        machine_code[insert_pointer + 1] = arg_1;
        machine_code[insert_pointer + 2] = arg_2;
        machine_code[insert_pointer + 3] = arg_3;
        insert_pointer = insert_pointer + 4;
    }

    // to_compile stack keeps track of remaining compiler work:
    // these are function bodies that still need to be compiled
    let to_compile = null;
    function no_more_to_compile() {
        return is_null(to_compile);
    }
    function pop_to_compile() {
        const next = head(to_compile);
        to_compile = tail(to_compile);
        return next;
    }
    function push_to_compile(task) {
        to_compile = pair(task, to_compile);
    }

    // to compile a function body, we need an index table
    // to get the environment indices for each name
    // (parameters, globals and locals)
    // Each compile function returns the max operand stack
    // size needed for running the code. When compilation of
    // a function body is done, the function continue_to_compile
    // writes the max operand stack size and the address of the
    // function body to the given addresses.

    function make_to_compile_task(
        function_body,
        max_stack_size_address,
        address_address,
        index_table
    ) {
        return list(
            function_body,
            max_stack_size_address,
            address_address,
            index_table
        );
    }
    function to_compile_task_body(to_compile_task) {
        return list_ref(to_compile_task, 0);
    }
    function to_compile_task_max_stack_size_address(to_compile_task) {
        return list_ref(to_compile_task, 1);
    }
    function to_compile_task_address_address(to_compile_task) {
        return list_ref(to_compile_task, 2);
    }
    function to_compile_task_index_table(to_compile_task) {
        return list_ref(to_compile_task, 3);
    }

    // index_table keeps track of environment addresses
    // assigned to names
    function make_empty_index_table() {
        return null;
    }
    function extend_index_table(t, s) {
        return is_null(t)
            ? list(pair(s, 0))
            : pair(pair(s, tail(head(t)) + 1), t);
    }
    function index_of(t, s) {
        return is_null(t)
            ? error(s, "name not found:")
            : head(head(t)) === s
            ? tail(head(t))
            : index_of(tail(t), s);
    }

    // a small complication: the toplevel function
    // needs to return the value of the last statement
    let toplevel = true;

    function continue_to_compile() {
        while (!is_null(to_compile)) {
            const next_to_compile = pop_to_compile();
            const address_address =
                to_compile_task_address_address(next_to_compile);
            machine_code[address_address] = insert_pointer;
            const index_table = to_compile_task_index_table(next_to_compile);
            const max_stack_size_address =
                to_compile_task_max_stack_size_address(next_to_compile);
            const body = to_compile_task_body(next_to_compile);
            const max_stack_size = compile(body, index_table, true);
            machine_code[max_stack_size_address] = max_stack_size;
            toplevel = false;
        }
    }

    function scan_out_declarations(component) {
        return is_sequence(component)
            ? accumulate(
                  append,
                  null,
                  map(scan_out_declarations, sequence_statements(component))
              )
            : is_declaration(component)
            ? list(declaration_symbol(component))
            : null;
    }

    // compile_arguments compiles the arguments and
    // computes the maximal stack size needed for
    // computing the arguments. Note that the arguments
    // themselves accumulate on the operand stack, which
    // explains the "i + compile(...)"
    function compile_arguments(exprs, index_table) {
        let i = 0;
        let s = length(exprs);
        let max_stack_size = 0;
        while (i < s) {
            max_stack_size = math_max(
                i + compile(head(exprs), index_table, false),
                max_stack_size
            );
            i = i + 1;
            exprs = tail(exprs);
        }
        return max_stack_size;
    }

    function compile_logical_composition(expr, index_table) {
        if (logical_composition_operator(expr) === "&&") {
            return compile(
                make_conditional_expression(
                    first_operand(expr),
                    second_operand(expr),
                    make_literal(false)
                ),
                index_table,
                false
            );
        } else {
            return compile(
                make_conditional_expression(
                    first_operand(expr),
                    make_literal(true),
                    second_operand(expr)
                ),
                index_table,
                false
            );
        }
    }

    function compile_conditional_expression(expr, index_table, insert_flag) {
        const m_1 = compile(cond_expr_pred(expr), index_table, false);
        add_unary_instruction(JOF, NaN);
        const JOF_address_address = insert_pointer - 1;
        const m_2 = compile(cond_expr_cons(expr), index_table, insert_flag);
        let GOTO_address_address = NaN;
        if (!insert_flag) {
            add_unary_instruction(GOTO, NaN);
            GOTO_address_address = insert_pointer - 1;
        } else {
        }
        machine_code[JOF_address_address] = insert_pointer;
        const m_3 = compile(cond_expr_alt(expr), index_table, insert_flag);
        if (!insert_flag) {
            machine_code[GOTO_address_address] = insert_pointer;
        } else {
        }
        return math_max(m_1, m_2, m_3);
    }

    function compile_operator_combination(expr, index_table) {
        const op = operator_symbol(expr);
        const operand_1 = first_operand(expr);
        if (op === "!") {
            const max_stack_size = compile(operand_1, index_table, false);
            add_nullary_instruction(NOT);
            return max_stack_size;
        } else {
            const operand_2 = second_operand(expr);
            const op_code =
                op === "+"
                    ? PLUS
                    : op === "-"
                    ? MINUS
                    : op === "*"
                    ? TIMES
                    : op === "/"
                    ? DIV
                    : op === "==="
                    ? EQUAL
                    : op === "<"
                    ? LESS
                    : op === "<="
                    ? LEQ
                    : op === ">"
                    ? GREATER
                    : op === ">="
                    ? GEQ
                    : error(op, "unknown operator:");
            const m_1 = compile(operand_1, index_table, false);
            const m_2 = compile(operand_2, index_table, false);
            add_nullary_instruction(op_code);
            return math_max(m_1, 1 + m_2);
        }
    }

    function compile_application(expr, index_table) {
        const max_stack_operator = compile(
            function_expression(expr),
            index_table,
            false
        );
        const max_stack_operands = compile_arguments(
            arg_expressions(expr),
            index_table
        );
        add_unary_instruction(CALL, length(arg_expressions(expr)));
        return math_max(max_stack_operator, max_stack_operands + 1);
    }

    function compile_lambda_expression(expr, index_table) {
        const the_body = lambda_body(expr);
        const body = is_block(the_body) ? block_body(the_body) : the_body;
        const locals = scan_out_declarations(body);
        const parameters = lambda_parameter_symbols(expr);
        const extended_index_table = accumulate(
            (s, it) => extend_index_table(it, s),
            index_table,
            append(reverse(locals), reverse(parameters))
        );
        add_ternary_instruction(
            LDF,
            NaN,
            NaN,
            length(parameters) + length(locals)
        );
        const max_stack_size_address = insert_pointer - 3;
        const address_address = insert_pointer - 2;
        push_to_compile(
            make_to_compile_task(
                body,
                max_stack_size_address,
                address_address,
                extended_index_table
            )
        );
        return 1;
    }

    function compile_sequence(expr, index_table, insert_flag) {
        const statements = sequence_statements(expr);
        if (is_empty_sequence(statements)) {
            return 0;
        } else if (is_last_statement(statements)) {
            return compile(
                first_statement(statements),
                index_table,
                insert_flag
            );
        } else {
            const m_1 = compile(
                first_statement(statements),
                index_table,
                false
            );
            add_nullary_instruction(POP);
            const m_2 = compile(
                make_sequence(rest_statements(statements)),
                index_table,
                insert_flag
            );
            return math_max(m_1, m_2);
        }
    }

    function compile_constant_declaration(expr, index_table) {
        const name = declaration_symbol(expr);
        const index = index_of(index_table, name);
        const max_stack_size = compile(
            constant_declaration_value(expr),
            index_table,
            false
        );
        add_unary_instruction(ASSIGN, index);
        add_nullary_instruction(LDCU);
        return max_stack_size;
    }

    function compile(expr, index_table, insert_flag) {
        let max_stack_size = 0;
        if (is_literal(expr)) {
            if (is_number(literal_value(expr))) {
                add_unary_instruction(LDCN, literal_value(expr));
                max_stack_size = 1;
            } else if (is_boolean(literal_value(expr))) {
                add_unary_instruction(LDCB, literal_value(expr));
                max_stack_size = 1;
            } else {
                error(expr, "unknown literal:");
            }
        } else if (is_undefined_expression(expr)) {
            add_nullary_instruction(LDCU);
            max_stack_size = 1;
        } else if (is_logical_composition(expr)) {
            max_stack_size = compile_logical_composition(expr, index_table);
        } else if (is_conditional_expression(expr)) {
            max_stack_size = compile_conditional_expression(
                expr,
                index_table,
                insert_flag
            );
            insert_flag = false;
        } else if (is_operator_combination(expr)) {
            max_stack_size = compile_operator_combination(expr, index_table);
        } else if (is_application(expr)) {
            max_stack_size = compile_application(expr, index_table);
        } else if (is_lambda_expression(expr)) {
            max_stack_size = compile_lambda_expression(expr, index_table);
        } else if (is_name(expr)) {
            add_unary_instruction(
                LD,
                index_of(index_table, symbol_of_name(expr))
            );
            max_stack_size = 1;
        } else if (is_sequence(expr)) {
            max_stack_size = compile_sequence(expr, index_table, insert_flag);
            insert_flag = false;
        } else if (is_constant_declaration(expr)) {
            max_stack_size = compile_constant_declaration(expr, index_table);
        } else if (is_function_declaration(expr)) {
            max_stack_size = compile(
                function_decl_to_constant_decl(expr),
                index_table,
                insert_flag
            );
        } else if (is_return_statement(expr)) {
            max_stack_size = compile(
                return_statement_expression(expr),
                index_table,
                false
            );
        } else {
            error(expr, "unknown expression:");
        }

        // handling of return
        if (insert_flag) {
            if (is_return_statement(expr)) {
                add_nullary_instruction(RTN);
            } else if (
                toplevel &&
                (is_literal(expr) ||
                    is_undefined_expression(expr) ||
                    is_application(expr) ||
                    is_operator_combination(expr))
            ) {
                add_nullary_instruction(RTN);
            } else {
                add_nullary_instruction(LDCU);
                max_stack_size = max_stack_size + 1;
                add_nullary_instruction(RTN);
            }
        } else {
        }
        return max_stack_size;
    }

    const program = parse(string);
    add_nullary_instruction(START);
    add_ternary_instruction(
        LDF,
        NaN,
        NaN,
        length(scan_out_declarations(program))
    );
    const LDF_max_stack_size_address = insert_pointer - 3;
    const LDF_address_address = insert_pointer - 2;
    add_unary_instruction(CALL, 0);
    add_nullary_instruction(DONE);

    const locals = reverse(scan_out_declarations(program));
    const program_names_index_table = accumulate(
        (s, it) => extend_index_table(it, s),
        make_empty_index_table(),
        locals
    );

    push_to_compile(
        make_to_compile_task(
            program,
            LDF_max_stack_size_address,
            LDF_address_address,
            program_names_index_table
        )
    );
    continue_to_compile();
    return machine_code;
}
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

    // Link all others as free
    for (let i = 1; i < A; i = i + 1) {
        B = i * NODE_SIZE;
        HEAP[B + VAL_SLOT] = "Free node";
        HEAP[B + LEFT_SLOT] = i === A - 1 ? NIL : NODE_SIZE * ((i + 1) % A);
        HEAP[B + RIGHT_SLOT] = NIL;
        HEAP[B + COLOR_SLOT] = WHITE;
    }

    FREE = 1 * NODE_SIZE;
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
    display(G, "to EXTEND");
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

function show_heap_value(address) {
    display(
        "",
        "result: heap node of value = " + stringify(HEAP[address + VAL_SLOT])
    );
}

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
    display(ENV, "Curr ENV:");
    display(OS, "Curr OS:");
    A = P[PC + 1];
    ACCESS_ENV();
    A = RES;
    display(A, "Access:");
    PUSH_OS_NODE();
    display(OS, "Curr OS:");
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

function print_heap(k) {
    // for (let i = k; i < array_length(HEAP); i = i + 1) {
    //     display(HEAP[i]);
    // }
    display(HEAP);
}

M[CALL] = () => {
    display(OS, "Curr OS:");
    display(ENV, "Curr ENV:");

    K = P[PC + 1]; // Number of args
    NEW_ENVIRONMENT();
    C = RES; // C is extended part of env
    display(RES, "C: ");

    for (L = K; L > 0; L = L - 1) {
        print_heap(40);
        POP_OS();
        A = RES;
        B = L - 1;
        display(B, "B:");
        display(HEAP[A + VAL_SLOT], "A:");
        BIND_IN_ENV();
    }
    print_heap(40);

    POP_OS();
    L = RES; // L is closure node
    display(HEAP[L + VAL_SLOT], "L:");

    N = HEAP[L + LEFT_SLOT]; // N is closure info node
    display(HEAP[N + VAL_SLOT], "N:");
    A = HEAP[N + LEFT_SLOT]; // A is closure env
    display(HEAP[A + VAL_SLOT], "A:");

    B = C;
    EXTEND();
    D = RES; // D is new env
    display(HEAP[D + VAL_SLOT], "D VAL_SLOT:");
    display(D, "D:");

    PUSH_RTS(); // Current env and os pushed

    NEW_OS();
    E = RES; // E is new OS;

    OS = E;
    ENV = D;
    PC = HEAP[N + VAL_SLOT];
    print_heap(1);
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
    const GC_PROBABILITY = 0.0;

    while (RUNNING) {
        display(PC, "Counter:");
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

initialize_machine(160);
P = parse_and_compile(`
const foo = (x, y) => x + y;
foo(1, 2);
`);
print_program(P);
run();
