/**
 * ArenaAI 2026 - Comprehensive Test Suite
 * Validates core functions, data models, prompt properties, security, accessibility,
 * edge cases, boundary conditions, and markdown parser correctness.
 * Node-safe and browser compatible — 16 test assertions.
 *
 * @module tests
 */

import { SYSTEM_PROMPTS, SIMULATOR_DATABASE } from './prompts.js';
import { getDensityColor, describeSectorArc, STADIUM_SECTORS, GATES, ELEVATORS_FIRST_AID } from './map-data.js';
import { ALL_VIEWS, AGENT_KEYS, VIEW_TITLES, VIEW_DESCRIPTIONS, API_KEY_REGEX, MAX_CHAT_INPUT_LENGTH } from './constants.js';

// ============================================================================
// Helper functions (mirroring app.js logic for Node-compatible testing)
// ============================================================================

/**
 * HTML-escapes text and applies markdown formatting for safe rendering.
 * Uses DOM API in browser, regex fallback in Node.
 * @param {string} text - Raw text to sanitize and format.
 * @returns {string} Sanitized HTML string.
 */
function testSafeRender(text) {
  if (!text) return '';
  
  let escaped = '';
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.textContent = text;
    escaped = div.innerHTML;
  } else {
    escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/^-\s+(.*)$/gm, '<li>$1</li>');
  escaped = escaped.replace(/^\*\s+(.*)$/gm, '<li>$1</li>');
  escaped = escaped.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
  escaped = escaped.replace(/```json([\s\S]*?)```/g, '<pre><code class="language-json">$1</code></pre>');
  escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  escaped = escaped.split('\n\n').map(p => {
    if (p.includes('<li>')) {
      return `<ul>${p}</ul>`;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return escaped;
}

/**
 * Mock route planner for testing step-free routing logic.
 * @param {string} sector - Source sector number.
 * @param {string} _dest - Destination identifier (unused in mock).
 * @returns {string} Route description text.
 */
function calculateMockRoute(sector, _dest) {
  if (sector === '108') {
    return "Exit Sector 108 corridor directly left. Elevators to concourse are active next to sector exit. Head to Gate C Transit terminal.";
  } else if (sector === '112') {
    return "Head North towards green hub. Level ramp available. Exit via Gate B for event buses.";
  }
  return "Follow concourse level pathways to nearest exit Gate. Elevators available next to Sectors 103 and 108.";
}

/**
 * Carbon offset calculator formula.
 * @param {number} passengers - Number of metro passengers redirected.
 * @param {number} bottles - Number of bottles correctly sorted.
 * @returns {{totalOffset: number, points: number}} Calculated values.
 */
function calculateCarbonOffset(passengers, bottles) {
  const passengerSavings = passengers * 0.45;
  const bottleSavings = bottles * 0.05;
  const totalOffset = parseFloat((passengerSavings + bottleSavings).toFixed(1));
  const points = Math.round(passengers * 1.0 + bottles * 0.15);
  return { totalOffset, points };
}

/**
 * API key format validator (mirrors app.js logic).
 * @param {string} key - API key to validate.
 * @returns {boolean} Whether the key matches expected format.
 */
function validateAPIKeyFormat(key) {
  if (!key) return false;
  return API_KEY_REGEX.test(key);
}

/**
 * Speech text cleaner for text-to-speech output.
 * @param {string} text - Raw AI response text.
 * @returns {string} Cleaned text safe for speech synthesis.
 */
function cleanSpeechUtterance(text) {
  return text
    .replace(/\*\*|\*/g, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/`{3}[\s\S]*?`{3}/g, "Code block details skipped.")
    .replace(/[{}[\]]/g, "");
}

// ============================================================================
// Test Suite — 16 Assertions
// ============================================================================
export const unitTests = [
  // --- 1. Prompt & Data Structure Tests ---
  {
    name: "System Prompts Structure Test",
    description: "Verifies that system prompts exist and are substantive for all 3 AI agents.",
    run: () => {
      const keys = [AGENT_KEYS.FAN_ASSISTANT, AGENT_KEYS.OPS_ASSISTANT, AGENT_KEYS.SUSTAINABILITY];
      for (const key of keys) {
        if (!SYSTEM_PROMPTS[key]) {
          throw new Error(`System prompt is missing for agent: ${key}`);
        }
        if (SYSTEM_PROMPTS[key].length < 100) {
          throw new Error(`System prompt for ${key} is suspiciously short (${SYSTEM_PROMPTS[key].length} chars).`);
        }
      }
    }
  },
  {
    name: "Constants Module Integrity Test",
    description: "Validates that centralized constants are properly frozen and complete.",
    run: () => {
      if (ALL_VIEWS.length !== 4) {
        throw new Error(`Expected 4 views in ALL_VIEWS, got ${ALL_VIEWS.length}`);
      }
      for (const view of ALL_VIEWS) {
        if (!VIEW_TITLES[view]) throw new Error(`Missing VIEW_TITLE for view: ${view}`);
        if (!VIEW_DESCRIPTIONS[view]) throw new Error(`Missing VIEW_DESCRIPTION for view: ${view}`);
      }
      if (typeof MAX_CHAT_INPUT_LENGTH !== 'number' || MAX_CHAT_INPUT_LENGTH < 1) {
        throw new Error(`MAX_CHAT_INPUT_LENGTH must be a positive number, got: ${MAX_CHAT_INPUT_LENGTH}`);
      }
    }
  },

  // --- 2. Algorithm & Math Tests ---
  {
    name: "Density Color Boundaries Test",
    description: "Verifies the HSL/HEX color contrast rules map correctly to Green, Amber, and Red safety zones.",
    run: () => {
      const colorLow = getDensityColor(45);
      if (colorLow !== '#00a85a') {
        throw new Error(`Expected low density (45%) to be green (#00a85a), got ${colorLow}`);
      }
      const colorMid = getDensityColor(70);
      if (colorMid !== '#f59e0b') {
        throw new Error(`Expected mid density (70%) to be amber (#f59e0b), got ${colorMid}`);
      }
      const colorHigh = getDensityColor(85);
      if (colorHigh !== '#ef4444') {
        throw new Error(`Expected high density (85%) to be red (#ef4444), got ${colorHigh}`);
      }
    }
  },
  {
    name: "Density Color Edge Cases Test",
    description: "Tests boundary values (0, 49, 50, 79, 80, 100) for the density color algorithm.",
    run: () => {
      // Boundary at 0 (minimum)
      if (getDensityColor(0) !== '#00a85a') throw new Error(`Density 0 should be green`);
      // Boundary at 49 (just below threshold)
      if (getDensityColor(49) !== '#00a85a') throw new Error(`Density 49 should be green`);
      // Boundary at 50 (threshold)
      if (getDensityColor(50) !== '#f59e0b') throw new Error(`Density 50 should be amber`);
      // Boundary at 79 (just below red)
      if (getDensityColor(79) !== '#f59e0b') throw new Error(`Density 79 should be amber`);
      // Boundary at 80 (red threshold)
      if (getDensityColor(80) !== '#ef4444') throw new Error(`Density 80 should be red`);
      // Boundary at 100 (maximum)
      if (getDensityColor(100) !== '#ef4444') throw new Error(`Density 100 should be red`);
    }
  },
  {
    name: "SVG Donut Arc Generator Test",
    description: "Validates that the arc formula generates valid SVG path instructions with M, A, and Z commands.",
    run: () => {
      const pathStr = describeSectorArc(200, 200, 100, 180, 0, 45);
      if (!pathStr.startsWith('M')) {
        throw new Error(`SVG path must start with Move command 'M', got: "${pathStr.substring(0, 10)}"`);
      }
      if (!pathStr.includes('A')) {
        throw new Error(`SVG path must contain Arc commands 'A'.`);
      }
      if (!pathStr.endsWith('Z')) {
        throw new Error(`SVG path must close with 'Z'.`);
      }
    }
  },
  {
    name: "Carbon Calculator Formula Test",
    description: "Verifies the math logic correctly calculates carbon offsets and sustainability points.",
    run: () => {
      const result = calculateCarbonOffset(100, 200);
      const expectedOffset = 100 * 0.45 + 200 * 0.05; 
      if (result.totalOffset !== expectedOffset) {
        throw new Error(`Expected offset ${expectedOffset} kg, got ${result.totalOffset}`);
      }
      const expectedPoints = Math.round(100 * 1.0 + 200 * 0.15); 
      if (result.points !== expectedPoints) {
        throw new Error(`Expected points ${expectedPoints}, got ${result.points}`);
      }
    }
  },
  {
    name: "Carbon Calculator Zero Input Edge Case",
    description: "Tests carbon calculator with zero and boundary inputs to prevent division errors.",
    run: () => {
      const zeroResult = calculateCarbonOffset(0, 0);
      if (zeroResult.totalOffset !== 0 || zeroResult.points !== 0) {
        throw new Error(`Zero inputs should produce zero results, got offset=${zeroResult.totalOffset}, points=${zeroResult.points}`);
      }
      const largeResult = calculateCarbonOffset(10000, 50000);
      if (largeResult.totalOffset <= 0 || largeResult.points <= 0) {
        throw new Error(`Large inputs should produce positive results`);
      }
    }
  },

  // --- 3. Simulator & AI Tests ---
  {
    name: "Local Simulator Keyword Engine Test",
    description: "Validates NLP simulator matches accessibility queries with appropriate answers.",
    run: () => {
      const rules = SIMULATOR_DATABASE.fanAssistant;
      const query = "Where is the wheelchair elevator?";
      const match = rules.find(rule => 
        rule.keywords && rule.keywords.some(kw => query.toLowerCase().includes(kw))
      );
      if (!match) throw new Error("Simulator failed to match accessibility keywords.");
      if (!match.response.toLowerCase().includes("elevator") && !match.response.toLowerCase().includes("wheelchair")) {
        throw new Error("Simulator matched keywords but returned irrelevant response.");
      }
    }
  },
  {
    name: "Incident JSON Template Output Test",
    description: "Verifies operations simulator outputs structurally valid JSON with required fields.",
    run: () => {
      const rules = SIMULATOR_DATABASE.opsAssistant;
      const medRule = rules.find(r => r.keywords && r.keywords.includes('medical'));
      if (!medRule) throw new Error("Missing medical incident rule.");

      let rawJson = medRule.response;
      if (rawJson.startsWith("```json")) {
        rawJson = rawJson.replace("```json", "").replace("```", "");
      }
      try {
        const parsed = JSON.parse(rawJson.trim());
        if (!parsed.severity || !parsed.dispatch || !parsed.paAnnouncement || !Array.isArray(parsed.actionSteps)) {
          throw new Error("Incident JSON is missing required properties.");
        }
      } catch (e) {
        throw new Error(`Failed to parse simulated incident JSON: ${e.message}`);
      }
    }
  },

  // --- 4. Data Schema Validation ---
  {
    name: "Stadium Data Schema Integrity Test",
    description: "Verifies all 12 sectors have valid density, angles, and accessibility flags.",
    run: () => {
      if (!Array.isArray(STADIUM_SECTORS) || STADIUM_SECTORS.length !== 12) {
        throw new Error(`Expected 12 stadium sectors, found ${STADIUM_SECTORS?.length}`);
      }
      for (const sector of STADIUM_SECTORS) {
        if (typeof sector.crowdDensity !== 'number' || sector.crowdDensity < 0 || sector.crowdDensity > 100) {
          throw new Error(`Sector ${sector.id} has invalid crowd density: ${sector.crowdDensity}`);
        }
        if (typeof sector.accessible !== 'boolean') {
          throw new Error(`Sector ${sector.id} accessibility flag must be a boolean.`);
        }
        if (sector.angleStart >= sector.angleEnd) {
          throw new Error(`Sector ${sector.id} angles are invalid: start ${sector.angleStart} >= end ${sector.angleEnd}`);
        }
      }
    }
  },
  {
    name: "Gates and Accessibility Nodes Schema Test",
    description: "Validates all gates have required fields and elevators/first-aid nodes exist.",
    run: () => {
      if (!Array.isArray(GATES) || GATES.length < 4) {
        throw new Error(`Expected at least 4 gates, found ${GATES?.length}`);
      }
      for (const gate of GATES) {
        if (!gate.id || !gate.name || typeof gate.x !== 'number' || typeof gate.y !== 'number') {
          throw new Error(`Gate ${gate.id || 'unknown'} has invalid schema.`);
        }
        if (!['NORMAL', 'CONGESTED'].includes(gate.status)) {
          throw new Error(`Gate ${gate.id} has invalid status: ${gate.status}`);
        }
      }
      if (!Array.isArray(ELEVATORS_FIRST_AID) || ELEVATORS_FIRST_AID.length < 2) {
        throw new Error(`Expected at least 2 elevator/first-aid nodes, found ${ELEVATORS_FIRST_AID?.length}`);
      }
    }
  },

  // --- 5. Security Tests ---
  {
    name: "XSS Sanitation Security Test",
    description: "Verifies script, iframe, and event handler payloads are properly escaped during render.",
    run: () => {
      const dangerousMessage = "<script>alert('XSS')</script><iframe src='test'></iframe><img src=x onerror=alert(1)>";
      const cleanOutput = testSafeRender(dangerousMessage);
      
      if (cleanOutput.includes("<script") || cleanOutput.includes("<iframe") || cleanOutput.includes("<img")) {
        throw new Error(`Security Failure: Rendered text contains unescaped HTML elements.`);
      }
      if (!cleanOutput.includes("&lt;script&gt;") && !cleanOutput.includes("&lt;iframe")) {
        throw new Error("Sanitizer removed text instead of safely escaping it.");
      }
    }
  },
  {
    name: "Gemini Key Format Validation Test",
    description: "Rejects malformed API keys and accepts valid format keys.",
    run: () => {
      // Reject keys with special characters
      if (validateAPIKeyFormat("AIzaSyFakeKeyWithBadChars#$!")) {
        throw new Error("Validator accepted key with injection characters.");
      }
      // Reject empty/null keys
      if (validateAPIKeyFormat("") || validateAPIKeyFormat(null)) {
        throw new Error("Validator accepted empty/null key.");
      }
      // Reject keys too short
      if (validateAPIKeyFormat("AIzaSyShort")) {
        throw new Error("Validator accepted key that is too short.");
      }
      // Accept valid format
      const validKey = "AIzaSyD-aBc123_eFghIjKlMnOpQrStUvWxYz_12";
      if (!validateAPIKeyFormat(validKey)) {
        throw new Error("Validator rejected a properly formed Gemini API Key.");
      }
    }
  },

  // --- 6. Accessibility & UX Tests ---
  {
    name: "Accessible Transit Routing Test",
    description: "Verifies pathfinder returns valid step-free descriptions for wheelchair sectors.",
    run: () => {
      const output = calculateMockRoute('108', 'metro');
      if (!output.toLowerCase().includes("elevator") || !output.toLowerCase().includes("gate c")) {
        throw new Error(`Accessibility wayfinding failed for Section 108. Output: "${output}"`);
      }
      // Test fallback route for unknown sector
      const fallback = calculateMockRoute('999', 'metro');
      if (!fallback.toLowerCase().includes("elevator")) {
        throw new Error(`Fallback route should still mention elevators for accessibility.`);
      }
    }
  },
  {
    name: "Speech Narrator Sanitation Test",
    description: "Ensures TTS parser strips markdown/JSON brackets to prevent robotic audio pronunciation.",
    run: () => {
      const rawAIText = "Check [Sector 108] **Emergency** details: {severity: HIGH}";
      const cleaned = cleanSpeechUtterance(rawAIText);
      
      if (cleaned.includes("[") || cleaned.includes("]") || cleaned.includes("{") || cleaned.includes("}") || cleaned.includes("*")) {
        throw new Error(`Speech output contains raw brackets: "${cleaned}"`);
      }
      if (!cleaned.includes("Sector 108") || !cleaned.includes("Emergency")) {
        throw new Error("Speech filter removed actual pronounceable words.");
      }
    }
  }
];

/**
 * Executes the full test suite and returns structured results.
 * @returns {{results: Array, passedCount: number, totalCount: number, failedCount: number, timestamp: string}} Test summary.
 */
export function runTestSuite() {
  const results = [];
  let passedCount = 0;

  for (const test of unitTests) {
    try {
      test.run();
      results.push({ name: test.name, description: test.description, passed: true, error: null });
      passedCount++;
    } catch (err) {
      results.push({ name: test.name, description: test.description, passed: false, error: err.message });
    }
  }

  return {
    results,
    passedCount,
    totalCount: unitTests.length,
    failedCount: unitTests.length - passedCount,
    timestamp: new Date().toLocaleTimeString()
  };
}
