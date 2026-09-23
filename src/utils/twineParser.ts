import { TwinePassage, TwineStoryData, TwineAnalysis } from '../types/twine';

/**
 * Extracts links from passage text supporting Harlowe, SugarCube, Chapbook, and classic Twine syntaxes.
 */
export function extractTwineLinks(content: string): string[] {
  const linksSet = new Set<string>();

  // 1. Classic brackets [[target]] or [[text->target]] or [[target<-text]]
  const bracketRegex = /\[\[(?:([^\]|\->]+)->)?([^\]|<\-]+)(?:<-([^\]]+))?\]\]/g;
  let match: RegExpExecArray | null;

  while ((match = bracketRegex.exec(content)) !== null) {
    // If [[text->target]], match[2] is target
    // If [[target<-text]], match[2] is target
    // If [[target]], match[2] is target
    const fullMatch = match[0].slice(2, -2);
    if (fullMatch.includes('->')) {
      const parts = fullMatch.split('->');
      if (parts[1]?.trim()) linksSet.add(parts[1].trim());
    } else if (fullMatch.includes('<-')) {
      const parts = fullMatch.split('<-');
      if (parts[0]?.trim()) linksSet.add(parts[0].trim());
    } else if (fullMatch.includes('|')) {
      // SugarCube style [[text|target]]
      const parts = fullMatch.split('|');
      if (parts[1]?.trim()) linksSet.add(parts[1].trim());
    } else {
      if (fullMatch.trim()) linksSet.add(fullMatch.trim());
    }
  }

  // 2. Harlowe macros: (link-goto: "text", "target") or (go-to: "target")
  const harloweGotoRegex = /\((?:link-goto|go-to):\s*["']([^"']+)["'](?:\s*,\s*["']([^"']+)["'])?\)/gi;
  while ((match = harloweGotoRegex.exec(content)) !== null) {
    const target = match[2] ? match[2].trim() : match[1]?.trim();
    if (target) linksSet.add(target);
  }

  // 3. SugarCube macros: <<link "text" "target">> or <<goto "target">>
  const sugarCubeRegex = /<<(?:link\s+["'][^"']+["']\s+["']([^"']+)["']|goto\s+["']([^"']+)["'])>>/gi;
  while ((match = sugarCubeRegex.exec(content)) !== null) {
    const target = match[1] || match[2];
    if (target?.trim()) linksSet.add(target.trim());
  }

  // 4. HTML data-passage="target" or class="link-internal"
  const htmlPassageRegex = /data-passage=["']([^"']+)["']/gi;
  while ((match = htmlPassageRegex.exec(content)) !== null) {
    if (match[1]?.trim()) linksSet.add(match[1].trim());
  }

  return Array.from(linksSet);
}

/**
 * Parses raw Twine HTML file text into structured TwineStoryData.
 */
export function parseTwineHtml(htmlContent: string, fileName: string = 'Untitled Twine Story'): TwineStoryData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Twine 2 specification stores stories in <tw-storydata>
  const storyDataEl = doc.querySelector('tw-storydata');

  let title = fileName.replace(/\.(html|htm)$/i, '');
  let format = 'Harlowe';
  let formatVersion = '3.3.0';
  let creator = 'Twine';
  let creatorVersion = '2.3.0';
  let startNodePid = '1';

  if (storyDataEl) {
    title = storyDataEl.getAttribute('name') || title;
    format = storyDataEl.getAttribute('format') || format;
    formatVersion = storyDataEl.getAttribute('format-version') || formatVersion;
    creator = storyDataEl.getAttribute('creator') || creator;
    creatorVersion = storyDataEl.getAttribute('creator-version') || creatorVersion;
    startNodePid = storyDataEl.getAttribute('startnode') || '1';
  } else {
    // Check <title> tag
    const titleTag = doc.querySelector('title');
    if (titleTag && titleTag.textContent?.trim()) {
      title = titleTag.textContent.trim();
    }
  }

  // Passages
  const passageElements = Array.from(doc.querySelectorAll('tw-passagedata'));
  const passages: TwinePassage[] = [];

  if (passageElements.length > 0) {
    for (const pEl of passageElements) {
      const pid = pEl.getAttribute('pid') || String(passages.length + 1);
      const name = pEl.getAttribute('name') || `Passage ${pid}`;
      const tagsRaw = pEl.getAttribute('tags') || '';
      const tags = tagsRaw.split(/\s+/).filter(Boolean);
      const posAttr = pEl.getAttribute('pos') || '100,100';
      const [posX, posY] = posAttr.split(',').map((v) => parseInt(v, 10) || 100);
      const sizeAttr = pEl.getAttribute('size') || '100,100';
      const [sizeW, sizeH] = sizeAttr.split(',').map((v) => parseInt(v, 10) || 100);
      const content = pEl.textContent || '';
      const links = extractTwineLinks(content);

      passages.push({
        pid,
        name,
        tags,
        pos: { x: posX, y: posY },
        size: { width: sizeW, height: sizeH },
        content,
        links,
        isStart: pid === startNodePid,
        isEnding: links.length === 0,
      });
    }
  } else {
    // If no <tw-passagedata> tags were found, this might be a custom exported Twine or standalone scenario
    // We synthesize a root passage so that player and branch visualizer still render properly
    passages.push({
      pid: '1',
      name: title || 'Start Scenario',
      tags: ['scenario-root'],
      pos: { x: 150, y: 150 },
      size: { width: 120, height: 80 },
      content: 'Scenario loaded from standalone Twine HTML container.',
      links: [],
      isStart: true,
      isEnding: true,
    });
    startNodePid = '1';
  }

  // Compute story tags from passage tags
  const storyTagsSet = new Set<string>();
  storyTagsSet.add(format.toLowerCase());
  for (const p of passages) {
    for (const t of p.tags) {
      storyTagsSet.add(t.toLowerCase());
    }
  }

  const id = 'twine_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  return {
    id,
    title,
    format,
    formatVersion,
    creator,
    creatorVersion,
    startNodePid,
    passages,
    rawHtml: htmlContent,
    sizeBytes: new Blob([htmlContent]).size,
    uploadedAt: Date.now(),
    playCount: 0,
    tags: Array.from(storyTagsSet).slice(0, 8),
  };
}

/**
 * Calculates analytics on a Twine story.
 */
export function analyzeTwineStory(story: TwineStoryData): TwineAnalysis {
  let totalWords = 0;
  let totalLinks = 0;
  let endingCount = 0;

  const passageNames = new Set(story.passages.map((p) => p.name));
  const referencedNames = new Set<string>();

  for (const p of story.passages) {
    const words = p.content.trim().split(/\s+/).filter(Boolean).length;
    totalWords += words;
    totalLinks += p.links.length;

    if (p.links.length === 0) {
      endingCount++;
    }

    for (const target of p.links) {
      referencedNames.add(target);
    }
  }

  // Orphan passages: not start passage, and never referenced by any link
  const startPassage = story.passages.find((p) => p.pid === story.startNodePid) || story.passages[0];
  let orphanCount = 0;

  for (const p of story.passages) {
    if (p.pid !== story.startNodePid && !referencedNames.has(p.name)) {
      orphanCount++;
    }
  }

  const averageBranchingFactor = story.passages.length > 0 ? totalLinks / story.passages.length : 0;

  return {
    totalPassages: story.passages.length,
    totalWords,
    totalLinks,
    endingPassagesCount: endingCount,
    orphanPassagesCount: orphanCount,
    averageBranchingFactor: parseFloat(averageBranchingFactor.toFixed(2)),
    detectedEngine: `${story.format} v${story.formatVersion}`,
    startPassageName: startPassage ? startPassage.name : 'Unknown',
  };
}
