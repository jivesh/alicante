#!/bin/bash

# TESTING SCRIPT
#
# Tests student source code against expected outputs 
#
# See test files under tests for specification of tests

JS_SLANG_REPL="node_modules/js-slang/dist/repl/repl.js"
JS_SLANG="node $JS_SLANG_REPL"

TEST_FOLDERS="tests/*"
red=`tput setaf 1`
green=`tput setaf 2`
normal=`tput setaf 7`

passed=0
failed=0

# Prints error and exits script - used for fatal errors
failwith() {
    echo "${red}ERR: Could not complete tests."
    echo "${red}ERR: $1"
    exit -1
}

# given a test input, returns the source code
test_source_code() {
    awk 'BEGIN{expected=1}/\/\/ *expected: */{expected = 0}//{if(expected){print $0}}' $1
}

# given a test input, returns the expected output
test_expected_output() {
    awk 'BEGIN{expected=0}/\/\/ *expected: */{expected = 1}//{if(expected){print $0}}' $1 \
        | sed -e 's/\/\/ expected: *\(.*\)/\1/'
}


# Tests source file ($1) against test input ($2)
# test input is expected to be of the form:
# ... code
# // expected:
test_source() {
    VM_SOURCE_PATH=$1
    TEST_INPUT=$2
    TEST_OUTPUT_DIR=$3

    TEST_NAME=$(basename "$TEST_INPUT")
    COMPILER_PATH="src/compile.js"
#    echo "Number of lines in compiler file is $(wc -l < $COMPILER_PATH)"

    TEST_OUTPUT_FILE=$(printf "%s/%s" "$TEST_OUTPUT_DIR" "$TEST_NAME")
    rm -f TEST_OUTPUT_FILE
    touch TEST_OUTPUT_FILE

    VM_CODE=$(cat $VM_SOURCE_PATH)
    COMPILER_CODE=$(cat $COMPILER_PATH)
    SOURCE_CODE=$(printf "%s\\n%s" "$COMPILER_CODE" "$VM_CODE")

    TEST_SOURCE=$(test_source_code $TEST_INPUT)

    PROGRAM=$(printf "%s\\n%s" "$SOURCE_CODE" "$TEST_SOURCE")

    $JS_SLANG -e --chapter=4 "$PROGRAM" > "$TEST_OUTPUT_FILE" 2>&1

    echo "Executed test $TEST_NAME, find output in $TEST_OUTPUT_FILE"
}


if [ ! -f "$JS_SLANG_REPL" ]; then
    failwith "js-slang repl not found at $JS_SLANG_REPL - hint: run \"yarn install\" first"
fi


for TEST_FOLDER in $TEST_FOLDERS; do
    SOURCE_NAME="${TEST_FOLDER#*/}"
    SOURCE_PATH="src/$SOURCE_NAME.js"
    TEST_OUTPUT_PATH="test-outputs/$SOURCE_NAME"

    mkdir -p "$TEST_OUTPUT_PATH"

    # make sure student source file exists
    if [ ! -f "$SOURCE_PATH" ]; then
        failwith "file $SOURCE_PATH was not found in project."
    fi

    # run through each test input and test student source against input
    for TEST_PATH in $TEST_FOLDER/*; do
        if [ -f "$TEST_PATH" ]; then
          test_source "$SOURCE_PATH" "$TEST_PATH" "$TEST_OUTPUT_PATH"
        fi
    done
done

echo "${normal}test cases completed"
if [ $failed -gt 0 ]; then
    exit -1
else
    exit 0
fi
