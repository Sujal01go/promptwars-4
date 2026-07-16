/**
 * ArenaAI 2026 - Main Application Controller
 * Handles SPA navigation, dynamic SVG map rendering, interactive chats,
 * incident simulations, system prompt editing, and test reporting.
 * Expanded with Accessibility tools, transit calculators, carbon offsets, and live alert feeds.
 */

import { SYSTEM_PROMPTS } from './prompts.js';
import { STADIUM_SECTORS, GATES, ELEVATORS_FIRST_AID, describeSectorArc, getDensityColor } from './map-data.js';
import { AIEngine } from './ai-engine.js';
import { runTestSuite } from './tests.js';

// Initialize core state
const state = {
  activeView: 'map',
  activeAgentPrompt: 'fanAssistant', // Currently selected prompt in the Lab
  prompts: { ...SYSTEM_PROMPTS }, // Active prompts dictionary
  selectedSector: null,
  selectedGate: null,
  
  // Accessibility State
  a11yContrast: false,
  a11yFontScale: 1.0,
  a11yAudioNarrator: false
};

// Instantiate AI Engine
const ai = new AIEngine();

// Initialize local storage configurations
function loadConfig() {
  const savedKey = ai.getApiKey();
  const keyInput = document.getElementById('gemini-api-key');
  if (savedKey) {
    if (keyInput) keyInput.value = savedKey;
    updateAPIKeyStatus(true);
  } else {
    updateAPIKeyStatus(false);
  }

  // Load custom prompts from local storage if they exist
  for (const key of Object.keys(state.prompts)) {
    const savedPrompt = localStorage.getItem(`arena_prompt_${key}`);
    if (savedPrompt) {
      state.prompts[key] = savedPrompt;
    }
  }
}

// ==========================================================================
// 1. Navigation Controller
// ==========================================================================
const views = ['map', 'fan', 'ops', 'lab'];
views.forEach(view => {
  const btn = document.getElementById(`btn-${view}`);
  if (btn) {
    btn.addEventListener('click', () => switchView(view));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        switchView(view);
      }
    });
  }
});

function switchView(viewName) {
  state.activeView = viewName;
  
  views.forEach(v => {
    const btn = document.getElementById(`btn-${v}`);
    if (btn) {
      btn.classList.toggle('active', v === viewName);
      if (v === viewName) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    }
  });

  views.forEach(v => {
    const panel = document.getElementById(`view-${v}`);
    if (panel) {
      panel.classList.toggle('active', v === viewName);
    }
  });

  const title = document.getElementById('view-title');
  const desc = document.getElementById('view-desc');
  
  switch(viewName) {
    case 'map':
      title.textContent = 'Stadium Map & Wayfinding';
      desc.textContent = 'Interactive crowd density mapper and accessibility routes.';
      break;
    case 'fan':
      title.textContent = 'Fan Concierge Assistant';
      desc.textContent = 'Multilingual support dashboard and accessibility assistant.';
      break;
    case 'ops':
      title.textContent = 'Operations Command Desk';
      desc.textContent = 'Predictive crowd dispatch logs and automated real-time decision support.';
      break;
    case 'lab':
      title.textContent = 'Prompt Engineering Sandbox';
      desc.textContent = 'Test and tweak the system prompts running the AI. Run compliance testing.';
      break;
  }
}

// ==========================================================================
// 2. Interactive SVG Stadium Map Builder
// ==========================================================================
function renderStadiumSVG() {
  const svg = document.getElementById('stadium-svg');
  if (!svg) return;
  
  svg.innerHTML = '';
  const cx = 225;
  const cy = 200;
  
  // Draw outer boundaries and running track
  const track = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  track.setAttribute('cx', cx);
  track.setAttribute('cy', cy);
  track.setAttribute('rx', 180);
  track.setAttribute('ry', 150);
  track.setAttribute('class', 'track-oval');
  svg.appendChild(track);

  // Draw Football Pitch
  const pitchGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const pitch = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  pitch.setAttribute('x', cx - 50);
  pitch.setAttribute('y', cy - 35);
  pitch.setAttribute('width', 100);
  pitch.setAttribute('height', 70);
  pitch.setAttribute('rx', 4);
  pitch.setAttribute('class', 'pitch-rect');
  
  const pitchLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  pitchLine.setAttribute('x1', cx);
  pitchLine.setAttribute('y1', cy - 35);
  pitchLine.setAttribute('x2', cx);
  pitchLine.setAttribute('y2', cy + 35);
  pitchLine.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
  pitchLine.setAttribute('stroke-width', '1.5');
  
  const pitchCenter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  pitchCenter.setAttribute('cx', cx);
  pitchCenter.setAttribute('cy', cy);
  pitchCenter.setAttribute('r', 15);
  pitchCenter.setAttribute('fill', 'none');
  pitchCenter.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
  pitchCenter.setAttribute('stroke-width', '1.5');

  pitchGroup.appendChild(pitch);
  pitchGroup.appendChild(pitchLine);
  pitchGroup.appendChild(pitchCenter);
  svg.appendChild(pitchGroup);

  // Render Sectors (Donut segments)
  STADIUM_SECTORS.forEach(sector => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathStr = describeSectorArc(cx, cy, 75, 140, sector.angleStart, sector.angleEnd);
    path.setAttribute('d', pathStr);
    path.setAttribute('class', 'sector-path');
    path.setAttribute('id', `path-${sector.id}`);
    
    const color = getDensityColor(sector.crowdDensity);
    path.setAttribute('fill', color);
    
    path.setAttribute('role', 'button');
    path.setAttribute('tabindex', '0');
    path.setAttribute('aria-label', `${sector.name}, Crowd Density ${sector.crowdDensity}%, restroom wait ${sector.restroomWait} minutes.`);
    
    path.addEventListener('click', () => selectSector(sector));
    path.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectSector(sector);
      }
    });

    svg.appendChild(path);

    const angleRad = (((sector.angleStart + sector.angleEnd) / 2 - 90) * Math.PI) / 180;
    const textRadius = 110;
    const tx = cx + textRadius * Math.cos(angleRad);
    const ty = cy + textRadius * Math.sin(angleRad);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', tx);
    label.setAttribute('y', ty + 4);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#f3f4f6');
    label.setAttribute('font-size', '8px');
    label.setAttribute('font-weight', '700');
    label.setAttribute('pointer-events', 'none');
    label.textContent = sector.id.replace('sec', '');
    svg.appendChild(label);
  });

  // Render Gates (Circles)
  GATES.forEach(gate => {
    const gateGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gateGroup.setAttribute('class', 'gate-marker');
    gateGroup.setAttribute('role', 'button');
    gateGroup.setAttribute('tabindex', '0');
    gateGroup.setAttribute('aria-label', `Gate ${gate.name}, status ${gate.status}, wait time ${gate.waitTime} minutes.`);
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', gate.x);
    circle.setAttribute('cy', gate.y);
    circle.setAttribute('r', 10);
    circle.setAttribute('fill', gate.status === 'CONGESTED' ? '#ff1744' : '#00e5ff');
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '1.5');
    
    const letter = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    letter.setAttribute('x', gate.x);
    letter.setAttribute('y', gate.y + 3);
    letter.setAttribute('text-anchor', 'middle');
    letter.setAttribute('fill', '#000');
    letter.setAttribute('font-size', '10px');
    letter.setAttribute('font-weight', '800');
    letter.textContent = gate.name.replace('Gate ', '');
    
    gateGroup.appendChild(circle);
    gateGroup.appendChild(letter);
    
    gateGroup.addEventListener('click', () => selectGate(gate));
    gateGroup.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectGate(gate);
      }
    });

    svg.appendChild(gateGroup);
  });

  // Render elevators and first aid points
  ELEVATORS_FIRST_AID.forEach(node => {
    const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textNode.setAttribute('x', node.x);
    textNode.setAttribute('y', node.y);
    textNode.setAttribute('class', 'map-icon');
    textNode.setAttribute('role', 'button');
    textNode.setAttribute('tabindex', '0');
    textNode.setAttribute('aria-label', `${node.name}: ${node.desc}`);
    textNode.textContent = node.type === 'elevator' ? '♿' : '🏥';
    
    textNode.addEventListener('click', () => selectA11yNode(node));
    textNode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectA11yNode(node);
      }
    });

    svg.appendChild(textNode);
  });
}

function selectSector(sector) {
  state.selectedSector = sector;
  state.selectedGate = null;
  
  document.querySelectorAll('.sector-path').forEach(p => p.classList.remove('selected'));
  const sectorEl = document.getElementById(`path-${sector.id}`);
  if (sectorEl) sectorEl.classList.add('selected');

  const title = document.getElementById('sector-detail-title');
  const body = document.getElementById('sector-detail-body');
  if (!title || !body) return;
  
  title.textContent = sector.name;
  const densityColor = getDensityColor(sector.crowdDensity);
  
  body.innerHTML = `
    <div class="detail-section">
      <div class="sector-name-header">
        <span class="badge" style="background-color: ${densityColor}; color:#000;">${sector.type}</span>
        <span class="text-cyan font-weight-700">${sector.crowdDensity}% Crowd density</span>
      </div>

      <div class="metric-grid">
        <div class="metric-box">
          <span class="metric-box-label">🚻 Restroom Wait</span>
          <span class="metric-box-val ${sector.restroomWait > 10 ? 'text-red' : 'text-emerald'}">${sector.restroomWait} mins</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">🍔 Concessions Wait</span>
          <span class="metric-box-val ${sector.concessionWait > 15 ? 'text-red' : 'text-emerald'}">${sector.concessionWait} mins</span>
        </div>
      </div>

      <div class="a11y-checklist">
        <div class="a11y-title">Accessibility Infrastructure</div>
        <div class="a11y-item">
          <span class="a11y-check">✔</span> Step-Free Pathways: Available
        </div>
        <div class="a11y-item">
          ${sector.accessible ? '<span class="a11y-check">✔</span> Wheelchair Platforms: Available' : '<span class="a11y-cross">✘</span> Wheelchair Platforms: Unavailable (Redirect to Sector 108)'}
        </div>
        <div class="a11y-item">
          <span class="a11y-check">✔</span> Assisted Listening Audio Loop
        </div>
      </div>

      ${sector.notes ? `
        <div class="notes-box">
          <div class="notes-box-title">Steward Advisory</div>
          <p class="small-text">${escapeHtml(sector.notes)}</p>
        </div>
      ` : ''}
    </div>
  `;
}

function selectGate(gate) {
  state.selectedGate = gate;
  state.selectedSector = null;
  document.querySelectorAll('.sector-path').forEach(p => p.classList.remove('selected'));

  const title = document.getElementById('sector-detail-title');
  const body = document.getElementById('sector-detail-body');
  if (!title || !body) return;
  
  title.textContent = gate.name;
  
  body.innerHTML = `
    <div class="detail-section">
      <div class="sector-name-header">
        <span class="badge badge-accent">${gate.type.replace('-', ' ')}</span>
        <span class="${gate.status === 'CONGESTED' ? 'text-red' : 'text-emerald'} font-weight-700">${gate.status}</span>
      </div>

      <div class="metric-grid">
        <div class="metric-box">
          <span class="metric-box-label">⏱ Gate Queue Wait</span>
          <span class="metric-box-val ${gate.waitTime > 10 ? 'text-red' : 'text-emerald'}">${gate.waitTime} mins</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">♿ Step-Free Access</span>
          <span class="metric-box-val text-cyan">${gate.accessible ? 'Supported' : 'Limited'}</span>
        </div>
      </div>

      <div class="a11y-checklist">
        <div class="a11y-title">Nearby Transit Status</div>
        <div class="a11y-item">
          🚇 Metro Line 1: Normal operations from East Terminal
        </div>
        <div class="a11y-item">
          🚌 Event Shuttles: Boarding from gate lanes 1-4
        </div>
      </div>
      
      <div class="notes-box" style="border-left-color: ${gate.status === 'CONGESTED' ? 'var(--color-red)' : 'var(--color-cyan)'}">
        <div class="notes-box-title">Transit Advisory</div>
        <p class="small-text">Average processing speed is 40 fans/minute per turnstile lane.</p>
      </div>
    </div>
  `;
}

function selectA11yNode(node) {
  state.selectedGate = null;
  state.selectedSector = null;
  document.querySelectorAll('.sector-path').forEach(p => p.classList.remove('selected'));

  const title = document.getElementById('sector-detail-title');
  const body = document.getElementById('sector-detail-body');
  if (!title || !body) return;
  
  title.textContent = node.name;
  
  body.innerHTML = `
    <div class="detail-section">
      <div class="sector-name-header">
        <span class="badge badge-cyan">${node.type.toUpperCase()}</span>
        <span class="text-emerald font-weight-700">${node.status}</span>
      </div>

      <div class="notes-box" style="margin-top: 10px;">
        <div class="notes-box-title">Location Description</div>
        <p class="small-text">${escapeHtml(node.desc)}</p>
      </div>
    </div>
  `;
}

// ==========================================================================
// 3. Fan Portal: Chat Concierge & Route Planner
// ==========================================================================
const fanChatForm = document.getElementById('fan-chat-form');
const fanChatInput = document.getElementById('fan-chat-input');
const fanChatMessages = document.getElementById('fan-chat-messages');

if (fanChatForm) {
  fanChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = fanChatInput.value.trim();
    if (!query) return;
    
    handleFanQuery(query);
    fanChatInput.value = '';
  });
}

document.querySelectorAll('.prompt-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const promptText = chip.getAttribute('data-prompt');
    if (promptText) handleFanQuery(promptText);
  });
});

function seedWelcomeMessage() {
  if (!fanChatMessages) return;
  fanChatMessages.innerHTML = '';
  appendChatBubble('assistant', `Welcome to the FIFA World Cup 2026 Stadium Fan Hub! 🏟️

I am your GenAI Assistant. You can ask me about accessibility elevator routes, restroom waiting times, green transport shuttles, and first-aid points. 

Select a preset card or write your query below in any language!`);
}

function appendChatBubble(sender, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  
  const senderLabel = document.createElement('span');
  senderLabel.className = 'bubble-sender';
  senderLabel.textContent = sender === 'assistant' ? 'ArenaAI Concierge' : 'Fan Guest';
  bubble.appendChild(senderLabel);

  const textContainer = document.createElement('div');
  textContainer.className = 'bubble-text';
  textContainer.innerHTML = safeRenderContent(text);
  bubble.appendChild(textContainer);

  fanChatMessages.appendChild(bubble);
  fanChatMessages.scrollTop = fanChatMessages.scrollHeight;

  return textContainer;
}

async function handleFanQuery(userInput) {
  appendChatBubble('user', userInput);

  const textContainer = appendChatBubble('assistant', '');
  textContainer.classList.add('streaming-cursor');
  
  let fullResponseText = '';
  const systemPrompt = state.prompts.fanAssistant;
  
  try {
    await ai.generateStream('fanAssistant', userInput, systemPrompt, (chunk, done, error) => {
      if (error) {
        textContainer.classList.remove('streaming-cursor');
        textContainer.innerHTML = `<span class="text-red">Error calling AI Engine: ${escapeHtml(error.message || error)}</span>`;
        return;
      }

      if (done) {
        textContainer.classList.remove('streaming-cursor');
        textContainer.innerHTML = safeRenderContent(fullResponseText);
        
        // Narrate text to speech if active
        if (state.a11yAudioNarrator) {
          narrateVoiceText(fullResponseText);
        }
        return;
      }

      fullResponseText += chunk;
      textContainer.innerHTML = safeRenderContent(fullResponseText);
      fanChatMessages.scrollTop = fanChatMessages.scrollHeight;
    });
  } catch (e) {
    textContainer.classList.remove('streaming-cursor');
    textContainer.innerHTML = `<span class="text-red">Error: ${escapeHtml(e.message)}</span>`;
  }
}

// Accessible Route Planner Binds
const btnCalculateRoute = document.getElementById('btn-calculate-route');
const routeFromSelect = document.getElementById('route-from');
const routeToSelect = document.getElementById('route-to');
const routeResultBox = document.getElementById('route-result-box');
const routeResultText = document.getElementById('route-result-text');

if (btnCalculateRoute) {
  btnCalculateRoute.addEventListener('click', () => {
    if (!routeResultBox || !routeResultText) return;
    
    routeResultBox.classList.remove('hidden');
    routeResultText.textContent = "Calculating accessible route details...";
    routeResultText.classList.add('streaming-cursor');

    const fromSector = routeFromSelect.value;
    const destName = routeToSelect.options[routeToSelect.selectedIndex].text;
    
    const promptQuery = `Calculate wheelchair step-free path directions from Seat Sector ${fromSector} to destination: ${destName}. Include elevator numbers and estimated walking times.`;
    let fullRoutePlan = '';
    
    ai.generateStream('fanAssistant', promptQuery, state.prompts.fanAssistant, (chunk, done, error) => {
      if (error) {
        routeResultText.classList.remove('streaming-cursor');
        routeResultText.textContent = `Route Calculator Error: ${error.message}`;
        return;
      }
      if (done) {
        routeResultText.classList.remove('streaming-cursor');
        routeResultText.innerHTML = safeRenderContent(fullRoutePlan);
        
        if (state.a11yAudioNarrator) {
          narrateVoiceText("Route plan calculated: " + fullRoutePlan);
        }
        return;
      }
      fullRoutePlan += chunk;
      routeResultText.innerHTML = safeRenderContent(fullRoutePlan);
    });
  });
}

// Live PA Announcement Translator
const langBtns = document.querySelectorAll('.lang-btn');
const translatedBox = document.getElementById('translated-pa-text');
langBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    langBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const targetLang = btn.getAttribute('data-lang');
    simulatePATranslation(targetLang);
  });
});

async function simulatePATranslation(langCode) {
  if (!translatedBox) return;
  translatedBox.textContent = "Translating Live announcement...";
  translatedBox.classList.add('streaming-cursor');

  const baseText = "Attention all spectators. Due to high crowd density at Gate A, please redirect your exit routes towards Gate B and Gate C where wait times are under 3 minutes.";
  const query = `Translate this announcement to language code [${langCode}]: "${baseText}"`;
  
  let fullTranslation = '';
  
  try {
    await ai.generateStream('fanAssistant', query, state.prompts.fanAssistant, (chunk, done, error) => {
      if (error) {
        translatedBox.classList.remove('streaming-cursor');
        translatedBox.textContent = `Translation Error: ${error.message}`;
        return;
      }
      if (done) {
        translatedBox.classList.remove('streaming-cursor');
        translatedBox.innerHTML = safeRenderContent(fullTranslation);
        return;
      }
      fullTranslation += chunk;
      translatedBox.innerHTML = safeRenderContent(fullTranslation);
    });
  } catch (e) {
    translatedBox.classList.remove('streaming-cursor');
    translatedBox.textContent = `Error: ${e.message}`;
  }
}

// ==========================================================================
// 4. Operations Desk: Incident Alerts, Carbon Calculator & Sustainability
// ==========================================================================
const incidentForm = document.getElementById('incident-form');
const incidentInput = document.getElementById('incident-input');
const responseArea = document.getElementById('incident-response-area');

if (incidentForm) {
  incidentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const incidentText = incidentInput.value.trim();
    if (!incidentText) return;
    
    processOpsIncident(incidentText);
  });
}

// Live alert ticker events
document.querySelectorAll('.ticker-event').forEach(alertCard => {
  alertCard.addEventListener('click', () => {
    const alertMsg = alertCard.getAttribute('data-alert');
    if (incidentInput && alertMsg) {
      incidentInput.value = alertMsg;
      processOpsIncident(alertMsg);
      
      // Auto scroll down to incident form
      incidentInput.scrollIntoView({ behavior: 'smooth' });
    }
  });
  // Keyboard access
  alertCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      alertCard.click();
    }
  });
});

async function processOpsIncident(incidentText) {
  if (!responseArea) return;
  responseArea.classList.remove('hidden');
  
  const severityBadge = document.getElementById('response-severity-badge');
  const dispatchText = document.getElementById('dispatch-order-text');
  const paText = document.getElementById('pa-broadcast-text');
  const checklistList = document.getElementById('action-checklist-list');
  
  severityBadge.className = "badge";
  severityBadge.textContent = "ANALYZING...";
  dispatchText.textContent = "Generating dispatch brief...";
  paText.textContent = "Drafting public safety announcements...";
  checklistList.innerHTML = "<li>Evaluating emergency checklists...</li>";
  
  let fullResponse = '';
  const systemPrompt = state.prompts.opsAssistant;
  
  try {
    await ai.generateStream('opsAssistant', incidentText, systemPrompt, (chunk, done, error) => {
      if (error) {
        dispatchText.textContent = `API Error: ${error.message}`;
        return;
      }
      
      if (done) {
        let cleanJson = fullResponse.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace('```json', '').replace('```', '');
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace('```', '').replace('```', '');
        }
        
        try {
          const parsed = JSON.parse(cleanJson.trim());
          
          severityBadge.textContent = parsed.severity;
          severityBadge.className = `badge badge-${parsed.severity.toLowerCase() === 'high' ? 'danger' : 'accent'}`;
          if (parsed.severity.toLowerCase() === 'medium') {
             severityBadge.style.backgroundColor = 'var(--color-amber)';
             severityBadge.style.color = '#000';
          } else if (parsed.severity.toLowerCase() === 'low') {
             severityBadge.style.backgroundColor = 'var(--color-emerald)';
             severityBadge.style.color = '#000';
          }
          
          dispatchText.textContent = parsed.dispatch;
          paText.textContent = parsed.paAnnouncement;
          
          checklistList.innerHTML = '';
          parsed.actionSteps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            checklistList.appendChild(li);
          });

          if (state.a11yAudioNarrator) {
            narrateVoiceText(`High priority operational plan generated. Dispatch: ${parsed.dispatch}`);
          }
        } catch (jsonErr) {
          dispatchText.textContent = "AI processed incident, but returned unstructured text:";
          paText.innerHTML = safeRenderContent(fullResponse);
          checklistList.innerHTML = "<li>Check local sector stewards for verification.</li>";
          severityBadge.textContent = "ALERT";
          severityBadge.className = "badge badge-accent";
        }
        return;
      }
      
      fullResponse += chunk;
      dispatchText.textContent = `Analyzing response: ${fullResponse.substring(0, 150)}...`;
    });
  } catch (e) {
    dispatchText.textContent = `Error executing incident pipeline: ${e.message}`;
  }
}

// Carbon Offset Calculator Binds
const calcPassengersInput = document.getElementById('calc-passengers');
const calcBottlesInput = document.getElementById('calc-bottles');
const calcCo2Val = document.getElementById('calc-co2-val');
const calcPointsVal = document.getElementById('calc-points-val');

function recalculateCarbonScore() {
  if (!calcPassengersInput || !calcBottlesInput || !calcCo2Val || !calcPointsVal) return;
  const passengers = Math.max(0, parseInt(calcPassengersInput.value) || 0);
  const bottles = Math.max(0, parseInt(calcBottlesInput.value) || 0);

  // Math variables aligning with tests.js formula
  const passengerSavings = passengers * 0.45; // kg CO2
  const bottleSavings = bottles * 0.05; // kg CO2
  const totalOffset = (passengerSavings + bottleSavings).toFixed(1);
  const points = Math.round(passengers * 1.0 + bottles * 0.15);

  calcCo2Val.textContent = `${totalOffset} kg`;
  calcPointsVal.textContent = `${points} pts`;
}

if (calcPassengersInput) calcPassengersInput.addEventListener('input', recalculateCarbonScore);
if (calcBottlesInput) calcBottlesInput.addEventListener('input', recalculateCarbonScore);

// Sustainability Advisor recommendations
const refreshSusBtn = document.getElementById('btn-refresh-sus');
const susAdviceBox = document.getElementById('sustainability-advice-text');
if (refreshSusBtn) {
  refreshSusBtn.addEventListener('click', async () => {
    if (!susAdviceBox) return;
    susAdviceBox.textContent = "Analyzing waste stream metrics and sorting statistics...";
    susAdviceBox.classList.add('streaming-cursor');
    
    const query = "Analyze compostable waste level (62% capacity) and high plastic contamination reports in Sector 112. Recommend steward actions.";
    let fullAdvice = '';
    
    try {
      await ai.generateStream('sustainabilityAdvisor', query, state.prompts.sustainabilityAdvisor, (chunk, done, error) => {
        if (error) {
          susAdviceBox.classList.remove('streaming-cursor');
          susAdviceBox.textContent = `Error fetching advisor recommendations: ${error.message}`;
          return;
        }
        if (done) {
          susAdviceBox.classList.remove('streaming-cursor');
          susAdviceBox.innerHTML = safeRenderContent(fullAdvice);
          return;
        }
        fullAdvice += chunk;
        susAdviceBox.innerHTML = safeRenderContent(fullAdvice);
      });
    } catch(e) {
      susAdviceBox.classList.remove('streaming-cursor');
      susAdviceBox.textContent = `Error: ${e.message}`;
    }
  });
}

// ==========================================================================
// 5. Prompt Lab & Developer Tools
// ==========================================================================
const apiSaveBtn = document.getElementById('btn-save-key');
const apiClearBtn = document.getElementById('btn-clear-key');
const apiKeyInput = document.getElementById('gemini-api-key');

if (apiSaveBtn) {
  apiSaveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      alert('Please enter a valid API key.');
      return;
    }
    ai.setApiKey(key);
    updateAPIKeyStatus(true);
    alert('Google Gemini API Key saved locally!');
  });
}

if (apiClearBtn) {
  apiClearBtn.addEventListener('click', () => {
    ai.clearApiKey();
    apiKeyInput.value = '';
    updateAPIKeyStatus(false);
    alert('API Key cleared. Now using Simulator mode.');
  });
}

function updateAPIKeyStatus(isLive) {
  const statusMsg = document.getElementById('api-key-status-msg');
  const badge = document.getElementById('active-mode-badge');
  const badgeText = document.getElementById('active-mode-text');
  
  if (isLive) {
    if (statusMsg) statusMsg.innerHTML = `<span class="status-indicator-dot green"></span> Live Mode Connected (Gemini 2.5).`;
    if (badge) badge.className = "sidebar-footer-badge mode-badge live";
    if (badgeText) badgeText.textContent = "Live Gemini API";
    if (apiClearBtn) apiClearBtn.classList.remove('hidden');
    if (apiSaveBtn) apiSaveBtn.classList.add('hidden');
  } else {
    if (statusMsg) statusMsg.innerHTML = `<span class="status-indicator-dot yellow"></span> Currently utilizing Local Simulation.`;
    if (badge) badge.className = "sidebar-footer-badge mode-badge simulator";
    if (badgeText) badgeText.textContent = "Simulator Mode";
    if (apiClearBtn) apiClearBtn.classList.add('hidden');
    if (apiSaveBtn) apiSaveBtn.classList.remove('hidden');
  }
}

// Prompt Editor Tabs
const promptTabs = document.querySelectorAll('.prompt-tab-btn');
const promptTextarea = document.getElementById('prompt-editor-textarea');
const charCounter = document.getElementById('prompt-char-count');

promptTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    promptTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const agent = tab.getAttribute('data-agent');
    state.activeAgentPrompt = agent;
    loadPromptText(agent);
  });
});

function loadPromptText(agent) {
  if (!promptTextarea) return;
  const content = state.prompts[agent];
  promptTextarea.value = content;
  if (charCounter) charCounter.textContent = `${content.length} characters`;
}

if (promptTextarea) {
  promptTextarea.addEventListener('input', () => {
    if (charCounter) charCounter.textContent = `${promptTextarea.value.length} characters`;
  });
}

const savePromptBtn = document.getElementById('btn-save-prompt');
if (savePromptBtn) {
  savePromptBtn.addEventListener('click', () => {
    const text = promptTextarea.value.trim();
    const agent = state.activeAgentPrompt;
    
    state.prompts[agent] = text;
    localStorage.setItem(`arena_prompt_${agent}`, text);
    alert(`System Instructions updated for ${agent.replace('Assistant', '')}!`);
  });
}

const resetPromptBtn = document.getElementById('btn-reset-prompt');
if (resetPromptBtn) {
  resetPromptBtn.addEventListener('click', () => {
    const agent = state.activeAgentPrompt;
    state.prompts[agent] = SYSTEM_PROMPTS[agent];
    localStorage.removeItem(`arena_prompt_${agent}`);
    loadPromptText(agent);
    alert(`Reset ${agent.replace('Assistant', '')} instructions to default.`);
  });
}

// ==========================================================================
// 6. In-App Unit Test Suite Runner
// ==========================================================================
const runTestsBtn = document.getElementById('btn-run-tests');
const testListContainer = document.getElementById('test-list-container');

if (runTestsBtn) {
  runTestsBtn.addEventListener('click', () => {
    executeAppTests();
  });
}

function executeAppTests() {
  if (!testListContainer) return;
  testListContainer.innerHTML = '<div class="empty-state"><p>Running verification assertions...</p></div>';
  
  const statusVal = document.getElementById('test-status-val');
  const passedVal = document.getElementById('test-passed-val');
  const failedVal = document.getElementById('test-failed-val');
  
  if (statusVal) {
    statusVal.textContent = "RUNNING...";
    statusVal.className = "metric-val text-amber";
  }

  setTimeout(() => {
    const results = runTestSuite();
    testListContainer.innerHTML = '';
    
    results.results.forEach(test => {
      const item = document.createElement('div');
      item.className = `test-item ${test.passed ? 'passed' : 'failed'}`;
      item.setAttribute('role', 'listitem');

      const indicator = document.createElement('span');
      indicator.className = 'test-indicator';
      indicator.textContent = test.passed ? '🟢' : '🔴';
      item.appendChild(indicator);

      const details = document.createElement('div');
      details.className = 'test-details';

      const testTitle = document.createElement('span');
      testTitle.className = 'test-title';
      testTitle.textContent = test.name;
      details.appendChild(testTitle);

      const testDesc = document.createElement('span');
      testDesc.className = 'test-desc';
      testDesc.textContent = test.description;
      details.appendChild(testDesc);

      if (!test.passed && test.error) {
        const testError = document.createElement('span');
        testError.className = 'test-error';
        testError.textContent = `Assertion Error: ${test.error}`;
        details.appendChild(testError);
      }

      item.appendChild(details);
      testListContainer.appendChild(item);
    });

    if (statusVal) {
      statusVal.textContent = results.failedCount === 0 ? "PASSED" : "FAILED";
      statusVal.className = `metric-val ${results.failedCount === 0 ? 'text-emerald' : 'text-red'}`;
    }
    if (passedVal) passedVal.textContent = `${results.passedCount} / ${results.totalCount}`;
    if (failedVal) failedVal.textContent = results.failedCount;
    
  }, 400);
}

// ==========================================================================
// 7. Accessibility Toolset Quick Bar Implementation
// ==========================================================================
const btnContrast = document.getElementById('btn-a11y-contrast');
const btnTextUp = document.getElementById('btn-a11y-textup');
const btnTextDn = document.getElementById('btn-a11y-textdn');
const btnAudio = document.getElementById('btn-a11y-audio');

if (btnContrast) {
  btnContrast.addEventListener('click', () => {
    state.a11yContrast = !state.a11yContrast;
    document.body.classList.toggle('high-contrast', state.a11yContrast);
    btnContrast.style.border = state.a11yContrast ? '2px solid var(--color-cyan)' : '';
  });
}

if (btnTextUp) {
  btnTextUp.addEventListener('click', () => {
    state.a11yFontScale = Math.min(1.4, state.a11yFontScale + 0.1);
    document.documentElement.style.setProperty('--font-multiplier', state.a11yFontScale.toString());
  });
}

if (btnTextDn) {
  btnTextDn.addEventListener('click', () => {
    state.a11yFontScale = 1.0;
    document.documentElement.style.setProperty('--font-multiplier', '1.0');
  });
}

if (btnAudio) {
  btnAudio.addEventListener('click', () => {
    state.a11yAudioNarrator = !state.a11yAudioNarrator;
    btnAudio.textContent = state.a11yAudioNarrator ? '🔊 On' : '🔊';
    btnAudio.style.border = state.a11yAudioNarrator ? '2px solid var(--color-cyan)' : '';
    
    if (state.a11yAudioNarrator) {
      narrateVoiceText("Text to speech narrator enabled.");
    } else {
      window.speechSynthesis.cancel();
    }
  });
}

function narrateVoiceText(text) {
  if (!window.speechSynthesis) return;
  
  // Clear currently speaking voice
  window.speechSynthesis.cancel();

  // Strip markdown formatting symbols before speaking to prevent robotic reading
  const cleanSpeechText = text
    .replace(/\*\*|\*/g, "")
    .replace(/<\/?[^>]+(>|$)/g, "") // Strip HTML if any
    .replace(/`{3}[\s\S]*?`{3}/g, "Code block details skipped."); // Skip reading raw code/JSON blocks

  const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

// ==========================================================================
// 8. General Utility Functions
// ==========================================================================

function safeRenderContent(text) {
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

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// On DOM Loaded initialization
window.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  renderStadiumSVG();
  seedWelcomeMessage();
  loadPromptText('fanAssistant');
  
  if (STADIUM_SECTORS.length > 0) {
    selectSector(STADIUM_SECTORS[0]);
  }
});
