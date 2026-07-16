/**
 * ArenaAI 2026 - Node.js Automated Test Runner
 * Executes unit assertions in tests.js on server/CI environment.
 */
import { runTestSuite } from './tests.js';

console.log("=== Running ArenaAI 2026 Verification Test Suite ===");
const summary = runTestSuite();

summary.results.forEach(test => {
  if (test.passed) {
    console.log(`[PASS] ${test.name}`);
  } else {
    console.error(`[FAIL] ${test.name} - Error: ${test.error}`);
  }
});

console.log("\n=============================================");
console.log(`Tests Run: ${summary.totalCount} | Passed: ${summary.passedCount} | Failed: ${summary.failedCount}`);
console.log("=============================================");

if (summary.failedCount > 0) {
  process.exit(1);
} else {
  console.log("All assertions passed successfully! (100% Compliance)");
  process.exit(0);
}
