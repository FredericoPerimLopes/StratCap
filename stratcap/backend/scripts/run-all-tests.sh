#!/bin/bash

# StratCap Backend - Comprehensive Test Runner
# This script runs all test suites and generates detailed reports

set -e

echo "🧪 StratCap Backend Test Suite"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Clean previous coverage reports
echo "🧹 Cleaning previous reports..."
rm -rf coverage/
rm -rf test-results/
mkdir -p test-results/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🔍 Running Linting and Type Checks..."
echo "-------------------------------------"

# Run linting
echo "Running ESLint..."
npm run lint || echo "⚠️  Linting issues found"

# Run type checking
echo "Running TypeScript type check..."
npx tsc --noEmit || echo "⚠️  Type checking issues found"

echo ""
echo "🧪 Running Test Suites..."
echo "-------------------------"

# Function to run tests and capture results
run_test_suite() {
    local test_name="$1"
    local test_pattern="$2"
    local output_file="test-results/${test_name}.json"
    
    echo "Running $test_name tests..."
    
    if npm test -- --testNamePattern="$test_pattern" --json --outputFile="$output_file" > /dev/null 2>&1; then
        echo "✅ $test_name: PASSED"
    else
        echo "❌ $test_name: FAILED"
    fi
}

# Run individual test suites
run_test_suite "Waterfall Calculations" "WaterfallCalculationService|WaterfallController"
run_test_suite "Capital Activities" "CapitalActivity"
run_test_suite "Fee Management" "Fee"
run_test_suite "Fund Management" "Fund"
run_test_suite "Investor Management" "Investor"

echo ""
echo "🚀 Running Performance Tests..."
echo "-------------------------------"

if npm test -- performance.test.ts --verbose > test-results/performance.log 2>&1; then
    echo "✅ Performance tests: PASSED"
    echo "📊 Performance metrics saved to test-results/performance.log"
else
    echo "❌ Performance tests: FAILED"
fi

echo ""
echo "🔗 Running Integration Tests..."
echo "-------------------------------"

if npm test -- integration.test.ts --verbose > test-results/integration.log 2>&1; then
    echo "✅ Integration tests: PASSED"
else
    echo "❌ Integration tests: FAILED"
fi

echo ""
echo "📊 Generating Coverage Report..."
echo "--------------------------------"

# Run all tests with coverage
npm test -- --coverage --coverageReporters=text-lcov --coverageReporters=html --coverageReporters=json > test-results/coverage.log 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Coverage report generated successfully"
    echo "📁 HTML report: coverage/lcov-report/index.html"
    echo "📄 LCOV data: coverage/lcov.info"
else
    echo "❌ Coverage report generation failed"
fi

echo ""
echo "📈 Test Summary Report"
echo "====================="

# Extract coverage summary
if [ -f "coverage/coverage-summary.json" ]; then
    echo "Coverage Summary:"
    node -e "
        const fs = require('fs');
        const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
        const total = coverage.total;
        console.log(\`  Statements: \${total.statements.pct}%\`);
        console.log(\`  Branches:   \${total.branches.pct}%\`);
        console.log(\`  Functions:  \${total.functions.pct}%\`);
        console.log(\`  Lines:      \${total.lines.pct}%\`);
    "
fi

# Count test results
total_tests=$(find test-results -name "*.json" -exec cat {} \; | grep -o '"numTotalTests":[0-9]*' | cut -d':' -f2 | paste -sd+ | bc 2>/dev/null || echo "0")
passed_tests=$(find test-results -name "*.json" -exec cat {} \; | grep -o '"numPassedTests":[0-9]*' | cut -d':' -f2 | paste -sd+ | bc 2>/dev/null || echo "0")
failed_tests=$(find test-results -name "*.json" -exec cat {} \; | grep -o '"numFailedTests":[0-9]*' | cut -d':' -f2 | paste -sd+ | bc 2>/dev/null || echo "0")

echo ""
echo "Test Execution Summary:"
echo "  Total Tests:  $total_tests"
echo "  Passed:       $passed_tests"
echo "  Failed:       $failed_tests"

if [ "$failed_tests" -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed! Ready for deployment."
    exit 0
else
    echo ""
    echo "⚠️  Some tests failed. Please review the results."
    exit 1
fi