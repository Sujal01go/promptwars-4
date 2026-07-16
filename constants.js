/**
 * ArenaAI 2026 - Application Constants
 * Centralizes magic strings, view identifiers, and agent keys
 * to prevent duplication and improve maintainability.
 * @module constants
 */

/** @enum {string} Application view panel identifiers */
export const VIEW_NAMES = Object.freeze({
  MAP: 'map',
  FAN: 'fan',
  OPS: 'ops',
  LAB: 'lab'
});

/** @type {ReadonlyArray<string>} Ordered list of all navigable views */
export const ALL_VIEWS = Object.freeze([
  VIEW_NAMES.MAP,
  VIEW_NAMES.FAN,
  VIEW_NAMES.OPS,
  VIEW_NAMES.LAB
]);

/** @enum {string} AI agent prompt identifiers used in the Prompt Lab */
export const AGENT_KEYS = Object.freeze({
  FAN_ASSISTANT: 'fanAssistant',
  OPS_ASSISTANT: 'opsAssistant',
  SUSTAINABILITY: 'sustainabilityAdvisor'
});

/** @enum {string} View title strings for header display */
export const VIEW_TITLES = Object.freeze({
  [VIEW_NAMES.MAP]: 'Stadium Map & Wayfinding',
  [VIEW_NAMES.FAN]: 'Fan Concierge Assistant',
  [VIEW_NAMES.OPS]: 'Operations Command Desk',
  [VIEW_NAMES.LAB]: 'Prompt Engineering Sandbox'
});

/** @enum {string} View description strings for header display */
export const VIEW_DESCRIPTIONS = Object.freeze({
  [VIEW_NAMES.MAP]: 'Interactive crowd density mapper and accessibility routes.',
  [VIEW_NAMES.FAN]: 'Multilingual support dashboard and accessibility assistant.',
  [VIEW_NAMES.OPS]: 'Predictive crowd dispatch logs and automated real-time decision support.',
  [VIEW_NAMES.LAB]: 'Test and tweak the system prompts running the AI. Run compliance testing.'
});

/**
 * Maximum allowed character count for user chat input.
 * Prevents payload abuse and DoS vectors.
 * @type {number}
 */
export const MAX_CHAT_INPUT_LENGTH = 300;

/**
 * Regex pattern for validating Google Gemini API key format.
 * Keys must start with 'AIzaSy' followed by 30-40 alphanumeric/dash/underscore chars.
 * @type {RegExp}
 */
export const API_KEY_REGEX = /^AIzaSy[A-Za-z0-9_-]{30,40}$/;

/**
 * Interval (ms) for the live crowd density simulation ticker.
 * @type {number}
 */
export const LIVE_SIMULATION_INTERVAL_MS = 12000;
