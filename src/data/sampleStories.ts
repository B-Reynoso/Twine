import { TwineStoryData } from '../types/twine';
import { parseTwineHtml } from '../utils/twineParser';

/**
 * Builds a self-contained, fully-playable Twine 2 Harlowe-styled scenario HTML file.
 * Contains embedded responsive Twine story runtime engine, styles, state engine, and branch navigation.
 */
function createPlayableTwineHtml(
  title: string,
  startPid: string,
  passages: { pid: string; name: string; tags: string; pos: string; content: string }[]
): string {
  const passageNodes = passages
    .map(
      (p) =>
        `    <tw-passagedata pid="${p.pid}" name="${escapeHtml(p.name)}" tags="${p.tags}" pos="${p.pos}" size="100,100">${escapeHtml(
          p.content
        )}</tw-passagedata>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg-color: #0f172a;
      --card-bg: #1e293b;
      --text-color: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-hover: #7dd3fc;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 1.5rem;
      line-height: 1.7;
    }
    #twine-viewport {
      max-width: 780px;
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      padding: 2.5rem;
      position: relative;
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .scenario-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
      margin-bottom: 1.75rem;
    }
    .story-title {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
      font-weight: 700;
    }
    .passage-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 1.25rem;
      line-height: 1.3;
    }
    .passage-body {
      font-size: 1.125rem;
      color: #e2e8f0;
      white-space: pre-line;
      margin-bottom: 2rem;
    }
    .passage-body p {
      margin-bottom: 1rem;
    }
    .twine-choice-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin-top: 1.5rem;
    }
    .twine-choice-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-align: left;
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #f1f5f9;
      padding: 1rem 1.25rem;
      border-radius: 10px;
      font-size: 1.05rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      text-decoration: none;
    }
    .twine-choice-btn:hover {
      background: rgba(56, 189, 248, 0.18);
      border-color: var(--accent);
      transform: translateX(4px);
      color: #ffffff;
    }
    .twine-choice-btn::before {
      content: "➔";
      color: var(--accent);
      font-weight: bold;
    }
    .ending-card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.25rem;
      margin-top: 2rem;
      text-align: center;
    }
    .restart-btn {
      background: #334155;
      color: #ffffff;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 600;
      transition: background 0.2s;
      margin-top: 0.75rem;
    }
    .restart-btn:hover {
      background: #475569;
    }
    .tag-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-muted);
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      margin-right: 0.4rem;
    }
    tw-storydata { display: none !important; }
  </style>
</head>
<body>
  <!-- Authentic Twine 2 Story Data for parser compatibility -->
  <tw-storydata name="${escapeHtml(title)}" startnode="${startPid}" creator="Twine" creator-version="2.3.16" format="Harlowe" format-version="3.3.7" zoom="1" options="" hidden>
    <style role="stylesheet" id="twine-user-stylesheet" type="text/twine-css"></style>
    <script role="script" id="twine-user-script" type="text/twine-javascript"></script>
${passageNodes}
  </tw-storydata>

  <!-- Interactive Twine Scenario Viewer Runtime -->
  <main id="twine-viewport" role="main">
    <div class="scenario-header">
      <span class="story-title">${escapeHtml(title)}</span>
      <div id="passage-tags"></div>
    </div>
    <h1 class="passage-title" id="p-title"></h1>
    <div class="passage-body" id="p-body"></div>
    <div class="twine-choice-list" id="p-choices"></div>
    <div id="p-ending" style="display:none;"></div>
  </main>

  <script>
    (function() {
      // Parse embedded tw-passagedata
      const storyData = document.querySelector('tw-storydata');
      const startPid = storyData ? storyData.getAttribute('startnode') : '1';
      const passageElements = document.querySelectorAll('tw-passagedata');
      const passages = {};
      const passageByName = {};

      passageElements.forEach(el => {
        const pid = el.getAttribute('pid');
        const name = el.getAttribute('name');
        const tags = el.getAttribute('tags') || '';
        const rawContent = el.textContent || '';
        const item = { pid, name, tags: tags.split(/\\s+/).filter(Boolean), content: rawContent };
        passages[pid] = item;
        passageByName[name] = item;
      });

      function parseChoices(text) {
        const choices = [];
        // Extract [[Label->Target]] or [[Target<-Label]] or [[Target]]
        const bracketRegex = /\[\[(?:([^\]|\->]+)->)?([^\]|<\-]+)(?:<-([^\]]+))?\]\]/g;
        let match;
        while ((match = bracketRegex.exec(text)) !== null) {
          const raw = match[0].slice(2, -2);
          let label = raw;
          let target = raw;
          if (raw.includes('->')) {
            const parts = raw.split('->');
            label = parts[0].trim();
            target = parts[1].trim();
          } else if (raw.includes('<-')) {
            const parts = raw.split('<-');
            label = parts[1].trim();
            target = parts[0].trim();
          } else if (raw.includes('|')) {
            const parts = raw.split('|');
            label = parts[0].trim();
            target = parts[1].trim();
          }
          choices.push({ label, target, originalMatch: match[0] });
        }
        return choices;
      }

      function cleanBodyText(text, choices) {
        let clean = text;
        choices.forEach(c => {
          clean = clean.replace(c.originalMatch, '');
        });
        return clean.trim();
      }

      function renderPassage(identifier) {
        const p = passages[identifier] || passageByName[identifier];
        if (!p) {
          console.error("Passage not found: " + identifier);
          return;
        }

        const choices = parseChoices(p.content);
        const cleanContent = cleanBodyText(p.content, choices);

        document.getElementById('p-title').textContent = p.name;
        document.getElementById('p-body').textContent = cleanContent;

        // Tags
        const tagsContainer = document.getElementById('passage-tags');
        tagsContainer.innerHTML = '';
        p.tags.forEach(t => {
          const badge = document.createElement('span');
          badge.className = 'tag-badge';
          badge.textContent = '#' + t;
          tagsContainer.appendChild(badge);
        });

        // Choices
        const choiceContainer = document.getElementById('p-choices');
        choiceContainer.innerHTML = '';
        const endingContainer = document.getElementById('p-ending');
        endingContainer.style.display = 'none';

        if (choices.length > 0) {
          choices.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'twine-choice-btn';
            btn.textContent = c.label;
            btn.onclick = () => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              renderPassage(c.target);
            };
            choiceContainer.appendChild(btn);
          });
        } else {
          // Scenario Ending
          endingContainer.style.display = 'block';
          endingContainer.innerHTML = \`
            <div class="ending-card">
              <h3 style="color: #38bdf8; margin-bottom: 0.5rem;">Branch Scenario Concluded</h3>
              <p style="color: #94a3b8; font-size: 0.95rem;">You have reached a resolution node for this scenario.</p>
              <button class="restart-btn" id="restart-action">↺ Replay Scenario from Start</button>
            </div>
          \`;
          document.getElementById('restart-action').onclick = () => {
            renderPassage(startPid);
          };
        }

        // Notify parent iframe container if communication enabled
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'TWINE_PASSAGE_CHANGED',
              passageName: p.name,
              pid: p.pid,
              isEnding: choices.length === 0
            }, '*');
          }
        } catch (e) {}
      }

      // Initial render
      renderPassage(startPid);

      // Expose restart function globally for parent frame
      window.__restartTwineScenario = function() {
        window.scrollTo({ top: 0, behavior: 'instant' });
        renderPassage(startPid);
      };

      // Listen for parent messages (e.g. restart request)
      window.addEventListener('message', (event) => {
        if (event.data && (event.data.type === 'TWINE_RESTART' || event.data === 'TWINE_RESTART')) {
          window.scrollTo({ top: 0, behavior: 'instant' });
          renderPassage(startPid);
        }
      });
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sample Scenario 1: Medical Triage Ethics
 */
const scenario1RawHtml = createPlayableTwineHtml(
  'Medical Triage: The Protocol Dilemma',
  '1',
  [
    {
      pid: '1',
      name: 'Shift Commences: Critical Inflow',
      tags: 'triage intro decision',
      pos: '100,100',
      content: `02:40 AM. You are the Senior Triage Physician at Hope Valley Regional. 

A severe blizzard has severed regional transport. The hospital emergency backup generator is operating at 60% capacity. Suddenly, two ambulances arrive concurrently:

1. Patient Alpha: A 17-year-old high school athlete with acute respiratory failure from severe pulmonary trauma. Survival rate without immediate mechanical ventilation: < 15%.
2. Patient Beta: A 64-year-old community leader and organ donor advocate in acute hemorrhagic shock with multiple lacerations. Immediate surgery and blood transfusion required.

Only ONE critical resuscitation bay is prepped and immediately staffed.

What is your initial triage directive?

[[Direct intensive team to Patient Alpha (17-yo with respiratory failure)->Alpha Focus]]
[[Direct intensive team to Patient Beta (64-yo in hemorrhagic shock)->Beta Focus]]
[[Split nursing staff evenly between both bays simultaneously->Split Team Protocol]]`,
    },
    {
      pid: '2',
      name: 'Alpha Focus',
      tags: 'clinical branch emergency',
      pos: '300,50',
      content: `You deploy the primary resuscitation team to Patient Alpha. 

Your rapid sequence intubation stabilizes airway pressures, and chest decompression relieves tension pneumothorax within 18 minutes. Alpha's oxygen saturation rebounds from 62% to 94%.

However, Patient Beta's blood pressure drops precipitously to 68/40. The secondary nurse calls out:
"Doctor, Beta is coding. Blood bank says O-negative supply is capped at 2 units until dawn!"

Do you:
[[Administer the last 2 units of uncrossmatched O-negative to Beta and begin manual compressions->Beta Emergency Resuscitation]]
[[Conserve the blood products for operating theatre and initiate vasopressor protocol->Vasopressor Protocol]]`,
    },
    {
      pid: '3',
      name: 'Beta Focus',
      tags: 'clinical branch surgery',
      pos: '300,200',
      content: `You prioritize Patient Beta. The surgical team immediately controls the femoral arterial tear and administers warmed fluids. Beta's pulse stabilizes as vitals normalize.

Meanwhile, Patient Alpha in Bay 2 exhibits severe cyanosis. The junior resident reports difficulty with emergency endotracheal tube placement due to anatomical airway edema.

"We need the video laryngoscope right now, but it is sterilizing in Central Supply," the resident reports urgently.

How do you instruct the resident?
[[Perform an emergency surgical cricothyroidotomy immediately->Emergency Cricothyroidotomy]]
[[Attempt bag-valve mask ventilation with 100% O2 until laryngoscope arrives->Bag Valve Mask Defense]]`,
    },
    {
      pid: '4',
      name: 'Split Team Protocol',
      tags: 'resource management crisis',
      pos: '300,350',
      content: `You split your small night shift nursing staff evenly. 

The strategy initially maintains balance, but within 10 minutes both teams face simultaneous complications: Alpha requires two clinicians for complex airway positioning, while Beta requires two nurses to hang rapid infusers.

Fatigue and task saturation spike across the floor. You must personally step into one bay:

[[Take command of Alpha's airway management personally->Alpha Personal Care]]
[[Take command of Beta's hemorrhage control personally->Beta Personal Care]]`,
    },
    {
      pid: '5',
      name: 'Beta Emergency Resuscitation',
      tags: 'resolution positive ending',
      pos: '550,50',
      content: `The emergency transfusion and rhythmic compressions successfully return spontaneous circulation (ROSC) in Patient Beta after 9 tense minutes.

By dawn, the blizzard begins to clear and the regional trauma flight team lands. Both Patient Alpha and Patient Beta survive and are transferred to the regional surgical ICU in stable condition.

The hospital clinical review panel commends your decisive triage prioritization under extreme constraint.`,
    },
    {
      pid: '6',
      name: 'Vasopressor Protocol',
      tags: 'resolution mixed ending',
      pos: '550,150',
      content: `High-dose vasopressors temporarily elevate Beta's arterial pressure, but profound hypovolemia induces secondary renal shutdown.

Patient Alpha makes a complete neurological recovery. Patient Beta survives after prolonged emergency stabilization, but requires temporary dialysis. 

The hospital ethics board evaluates the night shift actions and acknowledges the impossible resource dilemma faced during the storm.`,
    },
    {
      pid: '7',
      name: 'Emergency Cricothyroidotomy',
      tags: 'resolution positive surgical ending',
      pos: '550,250',
      content: `Under your decisive direction, the resident flawlessly executes the emergency surgical airway. Oxygen saturation surges back to normal physiological levels within moments.

By morning, Patient Beta is out of the operating room with hemorrhage repaired, and Patient Alpha is safely intubated on mechanical ventilation. 

Your proactive surgical guidance averted an irreversible anoxic brain injury.`,
    },
    {
      pid: '8',
      name: 'Bag Valve Mask Defense',
      tags: 'resolution caution ending',
      pos: '550,350',
      content: `Bag-valve mask ventilation fails to provide adequate tidal volumes due to dynamic airway collapse. Alpha experiences brief periods of desaturation before the video laryngoscope arrives.

Alpha is successfully intubated, but neurological status requires prolonged monitoring in the neurological ICU. Patient Beta recovers well.

The incident results in a new hospital protocol ensuring dedicated emergency airway carts remain permanently stocked on the floor.`,
    },
    {
      pid: '9',
      name: 'Alpha Personal Care',
      tags: 'resolution tactical ending',
      pos: '550,450',
      content: `Your direct clinical hands secure Alpha's airway in under 90 seconds. With the senior physician on the scene, team morale solidifies. 

You quickly cross over to assist Beta's line placement once Alpha is stable. Both patients pull through the critical window. You prevented a potential cascade of errors through agile personal intervention.`,
    },
    {
      pid: '10',
      name: 'Beta Personal Care',
      tags: 'resolution outcome ending',
      pos: '550,550',
      content: `You stop the arterial bleed with direct surgical pressure and a pelvic binder. Beta survives the initial shock phase. 

Alpha was intubated by the resident with minor delays, achieving stability just as morning relief staff arrived. The hospital survives a harrowing night with zero mortality.`,
    },
  ]
);

/**
 * Sample Scenario 2: Cyber Incident Response
 */
const scenario2RawHtml = createPlayableTwineHtml(
  'Cyber Incident: Zero-Day Response',
  '1',
  [
    {
      pid: '1',
      name: 'Incident Detection: Sector 4',
      tags: 'infosec alert triage',
      pos: '100,100',
      content: `03:14 AM. The Security Operations Center (SOC) automated SIEM system flashes crimson:

ALERT: Anomalous outbound Kerberos ticket requests originating from internal Domain Controller DC-02 to an unidentified IP address in Eastern Europe. 

Simultaneously, the CFO calls your emergency line: "My desktop just threw an encrypted file popup demanding 50 Bitcoin within 4 hours. All our quarterly accounting databases are failing to open."

You are the Lead Incident Commander. What is your immediate containment action?

[[Isolate all enterprise Domain Controllers and trigger network partition->Network Isolation]]
[[Quietly deploy EDR memory telemetry dump to trace threat actor lateral movement->Silent Surveillance]]
[[Immediately sever the primary corporate WAN gateway to the Internet->Sever Internet Gateway]]`,
    },
    {
      pid: '2',
      name: 'Network Isolation',
      tags: 'containment tactical',
      pos: '300,50',
      content: `You execute automated VLAN isolation scripts, quarantining DC-02 and all financial workstation subnets. 

The ransomware propagation stops in its tracks. However, isolating the domain controller causes global authentication to fail for customer-facing e-commerce portals. Revenue loss is accruing at $40,000 per hour.

Your forensics team reports: "The attackers used compromised administrator credentials via an unpatched VPN appliance zero-day. They still have an active backdoor beaconing from an unknown host."

What is your next move?
[[Force immediate enterprise-wide password and Kerberos Golden Ticket reset->Enterprise Credential Reset]]
[[Keep customer portals down while conducting full offline memory forensics->Thorough Forensic Audit]]`,
    },
    {
      pid: '3',
      name: 'Silent Surveillance',
      tags: 'counter-intelligence risk',
      pos: '300,220',
      content: `You decide to monitor the threat actor's command-and-control channel for 20 minutes to identify all infected staging systems before alerting the attacker.

Your team discovers the attacker has already staged 400 GB of confidential customer records in an encrypted RAR archive on a backup storage server.

Suddenly, a secondary script triggers: the attackers detect your forensic agent and initiate an aggressive wiper routine across production database clusters!

Do you:
[[Trigger hard power shutdown to SAN storage arrays to prevent disk wiping->Emergency SAN Cut]]
[[Attempt remote script termination via PowerShell emergency console->Remote Script Kill]]`,
    },
    {
      pid: '4',
      name: 'Sever Internet Gateway',
      tags: 'defensive drastic',
      pos: '300,380',
      content: `You pull the plug on the corporate internet gateway. The adversary's external command-and-control connection is severed instantly.

No data exfiltration can occur across the perimeter. However, the ransomware is pre-programmed to execute locally using scheduled Windows tasks even without internet connectivity!

Workstations on floor 3 begin locking up one by one.

How do you contain the local spread?
[[Broadcast manual power-down instructions to on-site security personnel->Physical Power Down]]
[[Deploy local broadcast block via core switch CLI->Core Switch Filter]]`,
    },
    {
      pid: '5',
      name: 'Enterprise Credential Reset',
      tags: 'resolution victory ending',
      pos: '550,50',
      content: `You execute the dual Kerberos krbtgt password reset procedure twice, invalidating every forged ticket in the domain. 

The attacker's access collapses completely. The malware payload is neutralized before reaching the main customer database. By 09:00 AM, clean immutable backups are restored.

The Executive Board praises your rapid containment which prevented an estimated $12M data breach catastrophe.`,
    },
    {
      pid: '6',
      name: 'Thorough Forensic Audit',
      tags: 'resolution mixed ending',
      pos: '550,150',
      content: `The exhaustive audit pinpoints the exact zero-day entry point and cleanses every host. 

While customer downtime incurred substantial financial penalties and news media reported outages, zero customer data was leaked, and regulatory compliance standards were successfully preserved.`,
    },
    {
      pid: '7',
      name: 'Emergency SAN Cut',
      tags: 'resolution technical ending',
      pos: '550,250',
      content: `You sever the SAN storage controller power cords with 8 seconds to spare. The raw data disks remain intact and unencrypted.

It takes 14 hours to verify filesystem integrity and reboot, but all corporate archives and accounting files are 100% saved without paying a dime in ransom.`,
    },
    {
      pid: '8',
      name: 'Remote Script Kill',
      tags: 'resolution compromise ending',
      pos: '550,350',
      content: `The wiper process is partially terminated, but 35% of the finance databases suffer unrecoverable corruption before the kill signal finishes executing.

The company is forced to reconstruct two quarters of financial statements from secondary cold tape archives. A painful lesson in the dangers of delaying containment during active ransomware outbreaks.`,
    },
    {
      pid: '9',
      name: 'Physical Power Down',
      tags: 'resolution salvage ending',
      pos: '550,450',
      content: `Physical security teams run through the facility turning off circuit breakers. The physical intervention restricts infection to only 12 workstations.

By afternoon, forensic teams confirm the network is clean, and the incident is declared resolved with minimal corporate fallout.`,
    },
    {
      pid: '10',
      name: 'Core Switch Filter',
      tags: 'resolution tactical ending',
      pos: '550,550',
      content: `A rapid ACL firewall block deployed at the core Cisco switches isolates the infected subnet broadcast traffic.

Spread ceases completely. The incident response playbook is updated with this emergency ACL script for future rapid deployment.`,
    },
  ]
);

export const sampleStories: TwineStoryData[] = [
  {
    ...parseTwineHtml(scenario1RawHtml, 'Medical Triage: The Protocol Dilemma.html'),
    id: 'sample_medical_triage',
    description:
      'High-stakes hospital triage simulation. Navigate resource allocation, critical care ethics, and emergency surgical choices during a catastrophic blizzard.',
    tags: ['healthcare', 'ethics', 'triage', 'decision-making', 'simulation'],
    isSample: true,
  },
  {
    ...parseTwineHtml(scenario2RawHtml, 'Cyber Incident: Zero-Day Response.html'),
    id: 'sample_cyber_incident',
    description:
      'Interactive IT security incident command scenario. Respond to an active enterprise ransomware outbreak and lateral movement with real-time containment tactics.',
    tags: ['cybersecurity', 'incident-response', 'infosec', 'strategy'],
    isSample: true,
  },
];
