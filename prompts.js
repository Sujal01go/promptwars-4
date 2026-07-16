/**
 * ArenaAI 2026 - Generative AI Prompt Templates & System Instructions
 * This file houses the system instructions used for the Prompt Lab and AI Engine.
 */

export const SYSTEM_PROMPTS = {
  fanAssistant: `You are the ArenaAI Multilingual Fan Assistant for the FIFA World Cup 2026 at the stadium. 
Your goal is to provide helpful, concise, and friendly guidance to fans, with a heavy emphasis on:
1. Accessibility: Always prioritize step-free routes, elevator locations, and assistance options for disabled fans when asked about navigation.
2. Multilingual Support: Be ready to respond in the language of the query. Keep language simple and easy to understand.
3. Transportation & Wayfinding: Give clear directions to gates, seating sectors, restrooms, and external transport (Metro, shuttles, rideshares).
4. Safety & Comfort: Offer tips on heat hydration, location of first-aid posts, and emergency exit awareness.

CONSTRAINTS:
- Keep responses short (under 3 sentences where possible) for quick mobile reading.
- Do not make up stadium sections. Use standard sections 101-124 (Lower Bowl) and 201-224 (Upper Bowl).
- Keep formatting clean using bullet points if giving directions.`,

  opsAssistant: `You are the ArenaAI Operations Dispatch & Crowd Management Engine for stadium organizers and staff.
Your role is to analyze incident reports, evaluate safety risks, and generate immediate operational briefs.
For every reported incident, you MUST output a structured JSON response containing:
1. "severity": "LOW", "MEDIUM", or "HIGH".
2. "dispatch": A brief command statement dispatching the correct staff category (Security, Medical, Cleaning, Maintenance, VolSupport).
3. "paAnnouncement": A short, clear safety/redirection announcement in English and Spanish for stadium speakers.
4. "actionSteps": A numbered list of 3 tactical actions the on-site supervisor must execute immediately.

CONSTRAINTS:
- Maintain a calm, professional, and safety-first tactical tone.
- Ensure the dispatch instructions designate specific entrance gates/elevators based on the reported sector.
- Response must be valid JSON, enclosed in triple backticks containing 'json'.`,

  sustainabilityAdvisor: `You are the ArenaAI Stadium Sustainability and Green Guide for organizers and volunteers.
Your objective is to optimize waste segregation, carbon footprints, and energy efficiency.
You answer questions regarding waste sorting rules, container capacities, volunteer positioning to prevent landfill contamination, and green transport incentives.

CONSTRAINTS:
- Focus on practical, actionable steps for a stadium setting.
- Highlight the 3 stream system: Recyclables (blue bins), Compostable/Food Waste (green bins), Landfill (black bins).
- Frame answers around FIFA's Green Stadium Goal. Keep responses under 4 sentences.`
};

// High-fidelity local simulation database for Simulator Mode
// Matches keywords in user queries to return realistic streaming response objects.
export const SIMULATOR_DATABASE = {
  fanAssistant: [
    {
      keywords: ['wheelchair', 'accessible', 'elevator', 'disabled', 'ramp', 'step-free'],
      response: `All stadium gates have accessible lanes. The nearest step-free elevator to the main concourse is located next to Gate C. Section 104 and 118 have dedicated wheelchair companion seating platforms with visual access to the big screens. Volunteers in blue bibs are stationed nearby to assist with mobile ordering.`
    },
    {
      keywords: ['metro', 'train', 'bus', 'transit', 'shuttle', 'transport', 'uber', 'taxi', 'exit'],
      response: `To beat the post-match crowd, we recommend taking Metro Line 1 from the Stadium East Terminal, which runs trains every 2 minutes. Shuttle buses to Downtown departures start from Gate B transit plaza immediately. For rideshares, walk to the designated pick-up Zone 4 near the Outer Gate F park.`
    },
    {
      keywords: ['restroom', 'toilet', 'bathroom', 'wc'],
      response: `Restrooms are located in every sector concourse. To minimize waiting: Restrooms in Sectors 108 and 212 currently have wait times under 2 minutes, while Sector 104 is highly congested (10+ min wait). Accessible and all-gender family restrooms are available next to Sectors 103, 115, and 220.`
    },
    {
      keywords: ['water', 'hot', 'heat', 'medical', 'first aid', 'hurt', 'sick', 'sun', 'hydrate'],
      response: `First Aid stations are fully operational at Sector 103 (Main Concourse) and Sector 215 (Upper Concourse). Free water refill stations are active next to every food court. If you or someone else feels unwell due to the heat, notify the nearest steward or press the "SOS Assistance" button on your digital ticket.`
    },
    {
      keywords: ['translate', 'french', 'spanish', 'german', 'arabic', 'portuguese', 'announcement'],
      response: `[PA Translation System]: "Attention all spectators. Due to high crowd density at Gate A, please redirect your exit routes towards Gate B and Gate C where wait times are under 3 minutes. Emergency exit pathways remain clear. Thank you for your cooperation."`
    },
    {
      default: `Welcome to the FIFA World Cup 2026 Fan Support Hub! You can ask me about accessibility routes, nearest restrooms, public transport schedules, water refill stations, or language translations. How can I help make your stadium experience better today?`
    }
  ],
  opsAssistant: [
    {
      keywords: ['medical', 'heart', 'collapsed', 'hurt', 'injury', 'fainted', 'seizure'],
      response: `\`\`\`json
{
  "severity": "HIGH",
  "dispatch": "Dispatch Medical Response Team Alpha from Tunnel 2 to Sector 108, Row 12, Seat 4 immediately. Escort path: Gate C Service Elevator.",
  "paAnnouncement": "Steward team, please clear outer aisle corridor at Section 108 to allow emergency access. / Personal de seguridad, por favor despejen el pasillo en la Sección 108 para el paso de emergencia.",
  "actionSteps": [
    "Secure the immediate perimeter around the casualty to allow breathing room and medical access.",
    "Liaise with Sector Coordinator to guide Team Alpha directly from the tunnel entry point.",
    "Monitor surrounding spectators for heat distress and distribute emergency water packs."
  ]
}
\`\`\``
    },
    {
      keywords: ['crowd', 'congestion', 'gridlock', 'gate a', 'crush', 'packed'],
      response: `\`\`\`json
{
  "severity": "HIGH",
  "dispatch": "Dispatch Crowd Safety Stewards Group 4 to Gate A outer plaza. Instruct Gate B entry turnstiles to open extra accessibility lanes.",
  "paAnnouncement": "Spectators entering through Gate A: please utilize the adjacent Gate B entrances where queue times are under 2 minutes. / Espectadores ingresando por Puerta A: por favor utilicen los accesos de Puerta B donde el tiempo de espera es menor a 2 minutos.",
  "actionSteps": [
    "Adjust electronic signage at transit drop-off zones directing incoming fans to Gates B and C.",
    "Instruct volunteer teams at Metro exit points to split the incoming crowd flow 50/50.",
    "Initiate queue gating procedures at Gate A perimeter fence to pulse flow safely into turnstiles."
  ]
}
\`\`\``
    },
    {
      keywords: ['spill', 'water', 'beer', 'slippery', 'wet', 'trash', 'overflow'],
      response: `\`\`\`json
{
  "severity": "LOW",
  "dispatch": "Dispatch Venue Operations Cleaning Unit 3 with wet-floor sign and mop to Sector 104 Concourse near food stand 2.",
  "paAnnouncement": "No stadium-wide PA broadcast needed. Inform local stewards to guide pedestrian traffic around Sector 104 concession spill area.",
  "actionSteps": [
    "Deploy caution cones to isolate the slippery area immediately.",
    "Clean the spill and dry-mop the floor surface to prevent slip hazards.",
    "Report completion to Central Operations Command to clear the incident log ticket."
  ]
}
\`\`\``
    },
    {
      keywords: ['sustainability', 'compost', 'bin', 'trash', 'recycling', 'plastic'],
      response: `\`\`\`json
{
  "severity": "MEDIUM",
  "dispatch": "Dispatch Green Volunteers Unit B to Sector 112 waste hub. Send replacements for compostable sorting bags.",
  "paAnnouncement": "Help us keep FIFA 2026 green! Please sort plastic bottles in blue bins and food waste in green bins. / ¡Ayúdenos a mantener verde el Mundial 2026! Deposite botellas en contenedores azules y residuos orgánicos en los verdes.",
  "actionSteps": [
    "Reposition volunteer monitors directly at high-traffic bins in Sector 112 to advise fans during peak half-time.",
    "Install high-visibility overhead signs displaying recyclable vs. compostable items.",
    "Clear cross-contaminated bags to the back storage for sorting before shipping to organic composting partners."
  ]
}
\`\`\``
    },
    {
      default: `\`\`\`json
{
  "severity": "LOW",
  "dispatch": "Assess standard operational status. No active dispatch required.",
  "paAnnouncement": "Welcome to FIFA World Cup 2026 Stadium. Please keep stairways clear. / Bienvenidos al Estadio de la Copa Mundial. Por favor mantengan las escaleras despejadas.",
  "actionSteps": [
    "Confirm communications lines are clear across Sectors 101 to 224.",
    "Verify all turnstiles and security lanes are reporting normal status rates.",
    "Review local weather parameters for the next 2-hour window."
  ]
}
\`\`\``
    }
  ],
  sustainabilityAdvisor: [
    {
      keywords: ['bin', 'sorting', 'compost', 'recycling', 'plastic', 'waste', 'bottle', 'cup'],
      response: `FIFA 2026 stadiums employ a strict 3-stream waste system:
1. **Recyclables (Blue)**: All PET plastic bottles, aluminum cups, and dry cardboard cardboard trays.
2. **Compostable (Green)**: Bio-polymer food packaging and leftover organic waste.
3. **Landfill (Black)**: Non-recyclable wraps, napkins, and dirty items.
Green volunteer monitors are stationed at every major hub to guide fans and prevent cross-contamination.`
    },
    {
      keywords: ['carbon', 'travel', 'energy', 'footprint', 'green', 'sustainability', 'power'],
      response: `Our stadium matches 100% of its energy consumption during matchdays using offsite solar arrays and rooftop solar cells. Fans can reduce their carbon footprint by using the free event shuttle buses or riding Metro Line 1. High-efficiency LED lighting saves up to 40% energy compared to traditional floodlights.`
    },
    {
      default: `To maintain FIFA's Green Stadium Goal, ensure volunteers check compost bins for plastic contamination (compost requires < 1% contamination). Encourage fans to use recycling channels by showing carbon-saving stats on stadium screens.`
    }
  ]
};
