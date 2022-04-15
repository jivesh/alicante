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

function is_variable_declaration(stmt) {
    return is_tagged_list(stmt, "variable_declaration");
}
function variable_declaration_value(stmt) {
    return head(tail(tail(stmt)));
}
function make_variable_declaration(name, value_expression) {
    return list("variable_declaration", name, value_expression);
}

function is_assignment(stmt) {
    return is_tagged_list(stmt, "assignment");
}
function assignment_declaration_value(stmt) {
    return head(tail(tail(stmt)));
}
function make_assignment(name, value_expression) {
    return list("assignment", name, value_expression);
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

// while loops are tagged with "while_loop"
// have a condition and a body

function is_while_loop(component) {
    return is_tagged_list(component, "while_loop");
}
function while_condition(component) {
    return list_ref(component, 1);
}
function while_body(component) {
    return list_ref(component, 2);
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

    function compile_while_loop(expr, index_table, insert_flag) {
        const GOTO_endpoint = insert_pointer;

        const cond = compile(while_condition(expr), index_table, false);
        add_unary_instruction(JOF, NaN);
        const JOF_address = insert_pointer - 1;

        const body = compile(while_body(expr), index_table, false);
        add_unary_instruction(GOTO, NaN);
        const GOTO_address = insert_pointer - 1;
        machine_code[GOTO_address] = GOTO_endpoint;

        machine_code[JOF_address] = insert_pointer;
        add_nullary_instruction(LDCU);

        return math_max(cond, body);
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

    function compile_variable_declaration(expr, index_table) {
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

    function compile_assignment(expr, index_table) {
        const name = declaration_symbol(expr);
        const index = index_of(index_table, name);
        const max_stack_size = compile(
            constant_declaration_value(expr),
            index_table,
            false
        );
        add_unary_instruction(ASSIGN, index);
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
        } else if (is_variable_declaration(expr)) {
                max_stack_size = compile_variable_declaration(expr, index_table);
        } else if (is_assignment(expr)) {
            max_stack_size = compile_assignment(expr, index_table);
        } else if (is_while_loop(expr)) {
            max_stack_size = compile_while_loop(expr, index_table);
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
