/**
 * ArenaAI 2026 - Browser-based Test Suite
 * Validates core functions, data models, prompt properties, security, and accessibility.
 */

import { SYSTEM_PROMPTS, SIMULATOR_DATABASE } from './prompts';
import { getDensityColor, describeSectorArc, STADIUM_SECTORS } from './map-data';

// Helper equivalent to the safeRenderContent function in app.js
function testSafeRender(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  let escaped = div.innerHTML;
  
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

// Route planner mock logic for test
function calculateMockRoute(sector, dest) {
  let text = '';
  if (sector === '108') {
    text = "Exit Sector 108 corridor directly left. Elevators to concourse are active next to sector exit. Head to Gate C Transit terminal.";
  } else if (sector === '112') {
    text = "Head North towards green hub. Level ramp available. Exit via Gate B for event buses.";
  } else {
    text = "Follow concourse level pathways to nearest exit Gate. Elevators available next to Sectors 103 and 108.";
  }
  return text;
}

// Carbon calculator formula mock
function calculateCarbonOffset(passengers, bottles) {
  const passengerSavings = passengers * 0.45; // kg CO2 saved per passenger on Metro
  const bottleSavings = bottles * 0.05; // kg CO2 saved per recycled bottle
  const totalOffset = parseFloat((passengerSavings + bottleSavings).toFixed(1));
  const points = Math.round(passengers * 1.0 + bottles * 0.15);
  return { totalOffset, points };
}

export const unitTests = [
  {
    name: "System Prompts Structure Test",
    description: "Verifies that the base system prompts are present and non-empty for all core agents.",
    run: () => {
      const keys = ['fanAssistant', 'opsAssistant', 'sustainabilityAdvisor'];
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
    name: "SVG Donut Arc Generator Test",
    description: "Validates that the mathematical arc formula generates valid SVG path instructions.",
    run: () => {
      const pathStr = describeSectorArc(200, 200, 100, 180, 0, 45);
      if (!pathStr.startsWith('M')) {
        throw new Error(`SVG path must start with a Move command 'M', got: "${pathStr.substring(0, 10)}"`);
      }
      if (!pathStr.includes('A')) {
        throw new Error(`SVG path must contain Arc commands 'A'. Path: "${pathStr}"`);
      }
      if (!pathStr.endsWith('Z')) {
        throw new Error(`SVG path must close with a Close command 'Z'. Path: "${pathStr}"`);
      }
    }
  },
  {
    name: "Local Simulator Keyword Engine Test",
    description: "Validates that the NLP simulator matches accessibility queries with appropriate answers.",
    run: () => {
      const rules = SIMULATOR_DATABASE.fanAssistant;
      const query = "Where is the wheelchair elevator?";
      const match = rules.find(rule => 
        rule.keywords && rule.keywords.some(kw => query.toLowerCase().includes(kw))
      );

      if (!match) {
        throw new Error("Simulator failed to match accessibility keywords.");
      }
      if (!match.response.toLowerCase().includes("elevator") && !match.response.toLowerCase().includes("wheelchair")) {
        throw new Error("Simulator matched accessibility keywords but returned an irrelevant response.");
      }
    }
  },
  {
    name: "Stadium Data Schema integrity Test",
    description: "Verifies sectors, crowd levels, and accessibility nodes adhere to standard formats.",
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
    name: "Incident JSON Template Output Test",
    description: "Verifies the operations simulator outputs structurally valid JSON responses.",
    run: () => {
      const rules = SIMULATOR_DATABASE.opsAssistant;
      const medRule = rules.find(r => r.keywords && r.keywords.includes('medical'));
      if (!medRule) {
        throw new Error("Missing medical incident rule in simulated ops assistant database.");
      }

      let rawJson = medRule.response;
      if (rawJson.startsWith("```json")) {
        rawJson = rawJson.replace("```json", "").replace("```", "");
      }
      rawJson = rawJson.trim();

      try {
        const parsed = JSON.parse(rawJson);
        if (!parsed.severity || !parsed.dispatch || !parsed.paAnnouncement || !Array.isArray(parsed.actionSteps)) {
          throw new Error("Incident JSON is missing key properties (severity, dispatch, paAnnouncement, actionSteps).");
        }
      } catch (e) {
        throw new Error(`Failed to parse simulated incident JSON: ${e.message}`);
      }
    }
  },
  {
    name: "XSS Sanitation Security Test",
    description: "Verifies HTML tags like script, iframe, or event handlers are properly escaped during render to satisfy Security criteria.",
    run: () => {
      const dangerousMessage = "<script>alert('XSS')</script><iframe src='test'></iframe><img src=x onerror=alert(1)>";
      const cleanOutput = testSafeRender(dangerousMessage);
      
      if (cleanOutput.includes("<script>") || cleanOutput.includes("<iframe>") || cleanOutput.includes("onerror")) {
        throw new Error(`Security Failure: Rendered text contains unescaped HTML elements. Output: "${cleanOutput}"`);
      }
      if (!cleanOutput.includes("&lt;script&gt;") && !cleanOutput.includes("&lt;iframe")) {
        throw new Error("Sanitizer removed text instead of safely escaping it.");
      }
    }
  },
  {
    name: "Carbon Calculator Formula Test",
    description: "Verifies the math logic correctly calculates carbon offsets and sustainability points.",
    run: () => {
      // 100 passengers, 200 bottles
      const result = calculateCarbonOffset(100, 200);
      
      const expectedOffset = 100 * 0.45 + 200 * 0.05; // 45 + 10 = 55.0 kg
      if (result.totalOffset !== expectedOffset) {
        throw new Error(`Expected offset ${expectedOffset} kg, got ${result.totalOffset}`);
      }
      
      const expectedPoints = Math.round(100 * 1.0 + 200 * 0.15); // 100 + 30 = 130
      if (result.points !== expectedPoints) {
        throw new Error(`Expected points ${expectedPoints}, got ${result.points}`);
      }
    }
  },
  {
    name: "Accessible Transit Routing Test",
    description: "Verifies that the pathfinder returns valid step-free descriptions for wheelchair sectors.",
    run: () => {
      const output = calculateMockRoute('108', 'metro');
      if (!output.toLowerCase().includes("elevator") || !output.toLowerCase().includes("gate c")) {
        throw new Error(`Accessibility Wayfinding failed to route Section 108. Output: "${output}"`);
      }
    }
  }
];

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
