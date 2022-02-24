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
    SOURCE_PATH=$1
    TEST_INPUT=$2

    TEST_NAME=$(basename "$TEST_INPUT")

    SOURCE_CODE=$(cat $SOURCE_PATH)
    TEST_SOURCE=$(test_source_code $TEST_INPUT)

    PROGRAM=$(printf "%s\\n%s" "$SOURCE_CODE" "$TEST_SOURCE")

    # create temporary files to hold inputs to diff
    EXPECTED_OUTPUT_FILE=$(mktemp)
    SOURCE_OUTPUT_FILE=$(mktemp)

    # populate temporary files
    test_expected_output "$TEST_INPUT" > "$EXPECTED_OUTPUT_FILE"
    $JS_SLANG -e --chapter=4 "$PROGRAM" > "$SOURCE_OUTPUT_FILE" 2>&1

    EXPECTED_OUTPUT=$(cat "$EXPECTED_OUTPUT_FILE")
    if [[ ${#EXPECTED_OUTPUT} -gt 32 ]]; then
        TRUNCATED_OUTPUT=$(echo "$EXPECTED_OUTPUT" | cut -c 1-32 -)
        PRETTY_EXPECTED=$(printf "%s..." "$TRUNCATED_OUTPUT")
    else
        PRETTY_EXPECTED="$EXPECTED_OUTPUT"
    fi

    # run diff
    echo "${normal}$SOURCE_PATH:$TEST_NAME, expecting: $PRETTY_EXPECTED"
    DIFF=$(diff "$SOURCE_OUTPUT_FILE" "$EXPECTED_OUTPUT_FILE" 2>&1)

    # delete temporary files
    rm "$EXPECTED_OUTPUT_FILE" "$SOURCE_OUTPUT_FILE"

    # record result of test
    if [ "$DIFF" = "" ]; then
            passed=$((passed+1)); echo "${green}PASS"
    else
            failed=$((failed+1)); echo "${red}FAIL:$DIFF"
    fi
}


if [ ! -f "$JS_SLANG_REPL" ]; then
    failwith "js-slang repl not found at $JS_SLANG_REPL - hint: run \"yarn install\" first"
fi


for TEST_FOLDER in $TEST_FOLDERS; do
    SOURCE_NAME="${TEST_FOLDER#*/}"
    SOURCE_PATH="src/$SOURCE_NAME.js"

    # make sure student source file exists
    if [ ! -f "$SOURCE_PATH" ]; then
        failwith "file $SOURCE_PATH was not found in project."
    fi

    # run through each test input and test student source against input
    for TEST_PATH in $TEST_FOLDER/*; do
        if [ -f "$TEST_PATH" ]; then
            test_source "$SOURCE_PATH" "$TEST_PATH"
        fi
    done
done

echo "${normal}test cases completed; $passed passed, $failed failed"
if [ $failed -gt 0 ]; then
    exit -1
else
    exit 0
fi
