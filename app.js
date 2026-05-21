const STORAGE_KEYS = {
  newsletters: "newsletter-inspiration.newsletters",
  templates: "newsletter-inspiration.templates",
};
const REPLY_RATE_WEIGHT = 10;
const MAX_POSITION_BONUS = 6;

const defaultTemplate = {
  id: crypto.randomUUID(),
  name: "Quick story template",
  body: `Subject: {{topic}}

Hi {{audience}},

{{hook}}

Why it matters:
{{insight}}

If this resonates, {{cta}}.

Visual idea: {{imagePrompt}}`,
};

const demoNewsletters = [
  {
    id: crypto.randomUUID(),
    title: "Why founder-led newsletters outperform product updates",
    body: "We broke down three founder stories that felt personal, specific, and easy to reply to. Readers responded most when we included a concrete mistake and asked for their version of it.",
    audience: "B2B SaaS founders",
    cta: "reply with the story your audience quotes back to you",
    replyRate: 12.4,
  },
  {
    id: crypto.randomUUID(),
    title: "The 15-minute content operating system for solo marketers",
    body: "This issue mapped one lightweight weekly process: collect insights, pick one pain point, expand with one story, and finish with a single reply CTA.",
    audience: "Solo marketers",
    cta: "hit reply and tell me which step slows you down",
    replyRate: 9.1,
  },
  {
    id: crypto.randomUUID(),
    title: "What happened when we swapped generic CTAs for one sharp question",
    body: "The newsletter compared reply rates before and after using one audience-specific question at the end. The most engaged readers wanted benchmarks and examples.",
    audience: "Newsletter operators",
    cta: "reply with your current CTA and I will suggest a sharper version",
    replyRate: 14.8,
  },
];

const stopWords = new Set([
  "about", "after", "again", "almost", "also", "always", "among", "because", "before", "being",
  "between", "could", "every", "found", "founder", "their", "there", "these", "those", "through",
  "under", "using", "week", "when", "where", "which", "while", "with", "your", "from", "have",
  "into", "that", "this", "they", "them", "what", "will", "would", "just", "than", "then", "were",
  "reply", "rate", "newsletter", "newsletters", "readers", "most", "generic", "happened", "swapped",
  "issue", "issues", "behind", "three",
]);

const elements = {
  rawNewsletter: document.querySelector("#raw-newsletter"),
  newsletterTitle: document.querySelector("#newsletter-title"),
  newsletterReplyRate: document.querySelector("#newsletter-reply-rate"),
  newsletterAudience: document.querySelector("#newsletter-audience"),
  newsletterCta: document.querySelector("#newsletter-cta"),
  newsletterBody: document.querySelector("#newsletter-body"),
  newsletterForm: document.querySelector("#newsletter-form"),
  extractNewsletter: document.querySelector("#extract-newsletter"),
  templateName: document.querySelector("#template-name"),
  templateBody: document.querySelector("#template-body"),
  templateForm: document.querySelector("#template-form"),
  newsletterList: document.querySelector("#newsletter-list"),
  templateList: document.querySelector("#template-list"),
  newsletterCount: document.querySelector("#newsletter-count"),
  templateCount: document.querySelector("#template-count"),
  draftTemplatePicker: document.querySelector("#draft-template-picker"),
  generateIdeas: document.querySelector("#generate-ideas"),
  ideaList: document.querySelector("#idea-list"),
  seedDemo: document.querySelector("#seed-demo"),
  newsletterItemTemplate: document.querySelector("#newsletter-item-template"),
  templateItemTemplate: document.querySelector("#template-item-template"),
  ideaTemplate: document.querySelector("#idea-template"),
};

const state = {
  newsletters: loadCollection(STORAGE_KEYS.newsletters),
  templates: loadCollection(STORAGE_KEYS.templates),
};

if (state.templates.length === 0) {
  state.templates = [defaultTemplate];
}

if (new URLSearchParams(window.location.search).get("demo") === "1" && state.newsletters.length === 0) {
  state.newsletters = demoNewsletters;
  persistState();
}

bindEvents();
render();

function bindEvents() {
  elements.extractNewsletter.addEventListener("click", handleExtraction);
  elements.newsletterForm.addEventListener("submit", handleNewsletterSubmit);
  elements.templateForm.addEventListener("submit", handleTemplateSubmit);
  elements.generateIdeas.addEventListener("click", renderIdeas);
  elements.seedDemo.addEventListener("click", seedDemoData);
}

function loadCollection(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(`Could not load ${key}`, error);
    return [];
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEYS.newsletters, JSON.stringify(state.newsletters));
  localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(state.templates));
}

function handleExtraction() {
  const extracted = extractNewsletter(elements.rawNewsletter.value);
  elements.newsletterTitle.value = extracted.title;
  elements.newsletterBody.value = extracted.body;
  if (!elements.newsletterAudience.value) {
    elements.newsletterAudience.value = extracted.audience;
  }
  if (!elements.newsletterCta.value) {
    elements.newsletterCta.value = extracted.cta;
  }
}

function extractNewsletter(rawInput) {
  const lines = rawInput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { title: "", body: "", audience: "", cta: "" };
  }

  const explicitSubject = lines.find((line) => /^subject:/i.test(line));
  const title = explicitSubject
    ? explicitSubject.replace(/^subject:/i, "").trim()
    : lines[0];
  const bodyLines = explicitSubject ? lines.filter((line) => line !== explicitSubject) : lines.slice(1);
  const body = bodyLines.join(" ");
  const audienceMatch = body.match(/for ([A-Za-z0-9\s&-]+?)(?:[.,]|$)/i);
  const ctaMatch = body.match(/(reply[^.?!]*[.?!]?)/i);

  return {
    title,
    body,
    audience: audienceMatch ? audienceMatch[1].trim() : "",
    cta: ctaMatch ? ctaMatch[1].trim() : "",
  };
}

function handleNewsletterSubmit(event) {
  event.preventDefault();
  const title = elements.newsletterTitle.value.trim();
  const body = elements.newsletterBody.value.trim();

  if (!title || !body) {
    window.alert("Please provide at least a subject and body for the newsletter.");
    return;
  }

  state.newsletters.unshift({
    id: crypto.randomUUID(),
    title,
    body,
    audience: elements.newsletterAudience.value.trim() || "your audience",
    cta: elements.newsletterCta.value.trim() || "reply with your perspective",
    replyRate: Number(elements.newsletterReplyRate.value || 0),
  });

  elements.newsletterForm.reset();
  elements.newsletterReplyRate.value = "5.0";
  persistState();
  render();
}

function handleTemplateSubmit(event) {
  event.preventDefault();
  const name = elements.templateName.value.trim();
  const body = elements.templateBody.value.trim();

  if (!name || !body) {
    window.alert("Please add both a template name and template body.");
    return;
  }

  state.templates.unshift({ id: crypto.randomUUID(), name, body });
  elements.templateForm.reset();
  persistState();
  render();
}

function render() {
  renderNewsletters();
  renderTemplates();
  renderIdeas();
}

function renderNewsletters() {
  const collection = state.newsletters;
  elements.newsletterCount.textContent = `${collection.length} saved`;
  elements.newsletterList.innerHTML = "";

  if (collection.length === 0) {
    elements.newsletterList.className = "item-list empty-state";
    elements.newsletterList.textContent = "Add your first newsletter to start generating ideas.";
    return;
  }

  elements.newsletterList.className = "item-list";

  collection.forEach((newsletter) => {
    const fragment = elements.newsletterItemTemplate.content.cloneNode(true);
    fragment.querySelector(".item-title").textContent = newsletter.title;
    fragment.querySelector(".performance-pill").textContent = `${newsletter.replyRate.toFixed(1)}% reply`;
    fragment.querySelector(".item-meta").textContent = `${newsletter.audience} • CTA: ${newsletter.cta}`;
    fragment.querySelector(".item-body").textContent = summarize(newsletter.body, 160);
    elements.newsletterList.appendChild(fragment);
  });
}

function renderTemplates() {
  const collection = state.templates;
  elements.templateCount.textContent = `${collection.length} saved`;
  elements.templateList.innerHTML = "";
  elements.draftTemplatePicker.innerHTML = "";

  collection.forEach((template, index) => {
    const fragment = elements.templateItemTemplate.content.cloneNode(true);
    fragment.querySelector(".item-title").textContent = template.name;
    fragment.querySelector(".template-preview").textContent = summarize(template.body, 180);
    elements.templateList.appendChild(fragment);

    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    if (index === 0) {
      option.selected = true;
    }
    elements.draftTemplatePicker.appendChild(option);
  });

  if (collection.length === 0) {
    elements.templateList.className = "item-list empty-state";
    elements.templateList.textContent = "No templates saved yet.";
  } else {
    elements.templateList.className = "item-list";
  }
}

function renderIdeas() {
  const ideas = generateIdeas(state.newsletters, getSelectedTemplate());
  elements.ideaList.innerHTML = "";

  if (ideas.length === 0) {
    elements.ideaList.className = "idea-grid empty-state";
    elements.ideaList.textContent = "Add at least one newsletter to generate inspiration.";
    return;
  }

  elements.ideaList.className = "idea-grid";
  ideas.forEach((idea) => {
    const fragment = elements.ideaTemplate.content.cloneNode(true);
    fragment.querySelector(".idea-title").textContent = idea.topic;
    fragment.querySelector(".idea-score").textContent = `${idea.score.toFixed(1)} idea score`;
    fragment.querySelector(".idea-hook").textContent = idea.hook;
    const list = fragment.querySelector(".idea-details");
    [
      `Why now: ${idea.whyNow}`,
      `Best audience: ${idea.audience}`,
      `Suggested CTA: ${idea.cta}`,
      `Source signals: ${idea.signals.join(", ")}`,
    ].forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      list.appendChild(li);
    });

    fragment.querySelector(".draft-output").textContent = idea.draft;
    fragment.querySelector(".image-prompt").textContent = idea.imagePrompt;

    const svgUri = buildSvgDataUri(idea);
    const image = fragment.querySelector(".image-preview");
    image.src = svgUri;
    image.alt = `${idea.topic} cover suggestion`;
    const downloadLink = fragment.querySelector(".download-link");
    downloadLink.href = svgUri;
    downloadLink.download = `${slugify(idea.topic)}.svg`;

    elements.ideaList.appendChild(fragment);
  });
}

function generateIdeas(newsletters, template) {
  if (newsletters.length === 0) {
    return [];
  }

  const baselineAudience = newsletters[0]?.audience || "newsletter readers";
  const inspiration = newsletters
    .slice()
    .sort((left, right) => right.replyRate - left.replyRate)
    .slice(0, 3);
  const angleBuilders = [
    (primary, secondary, audience) => `${primary} clinic: the ${secondary} question ${audience} will actually answer`,
    (primary, secondary, audience) => `${primary} playbook: a sharper ${secondary} angle for ${audience}`,
    (primary, secondary, audience) => `${primary} teardown: the ${secondary} framework behind higher newsletter replies`,
  ];

  return inspiration.map((source, index) => {
    const tokens = getKeywords(source.title);
    const primary = formatKeyword(tokens[0] || "reply");
    const secondary = formatKeyword(tokens[1] || "story").toLowerCase();
    const audience = source.audience || baselineAudience;
    const topic = deriveTopic(source.title, audience, angleBuilders[index % angleBuilders.length], primary, secondary);
    const hook = `This idea borrows the strongest signal from "${source.title}" and reframes it into a more specific topic that still invites an easy reply.`;
    const whyNow = `Previous issues on similar themes reached up to ${source.replyRate.toFixed(1)}% replies, so this concept doubles down on proven reader curiosity while keeping the framing new.`;
    const insight = `Open with the lesson from "${source.title}", then expand into one overlooked tactic, one real example, and one question the reader can answer in under two minutes.`;
    const cta = source.cta || "reply and tell me your take";
    const imagePrompt = `Editorial newsletter cover for "${topic}" with bold typography, high-contrast gradient, subtle email motifs, and a modern product-marketing style.`;
    const draft = applyTemplate(template?.body || defaultTemplate.body, {
      topic,
      hook,
      insight,
      cta,
      audience,
      imagePrompt,
    });
    const score = source.replyRate * REPLY_RATE_WEIGHT + Math.max(0, MAX_POSITION_BONUS - index);

    return {
      topic,
      hook,
      whyNow,
      insight,
      cta,
      audience,
      imagePrompt,
      draft,
      signals: [primary, secondary, source.title, `${source.replyRate.toFixed(1)}% reply rate`],
      score,
    };
  });
}

function getSelectedTemplate() {
  const selectedId = elements.draftTemplatePicker.value;
  return state.templates.find((template) => template.id === selectedId) || state.templates[0];
}

function getKeywords(text) {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 3 && !stopWords.has(token))
    )
  );
}

function applyTemplate(templateBody, data) {
  return templateBody.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

function buildSvgDataUri(idea) {
  const safeTitle = escapeHtml(idea.topic);
  const safeHook = escapeHtml(summarize(idea.hook, 100));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1d4ed8" />
          <stop offset="55%" stop-color="#7c3aed" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bg)" rx="36" />
      <rect x="90" y="90" width="1420" height="720" rx="30" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
      <text x="120" y="220" fill="#dbeafe" font-size="38" font-family="Arial, sans-serif" font-weight="700">Newsletter cover suggestion</text>
      <foreignObject x="120" y="270" width="1120" height="360">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color: white;">
          <div style="font-size: 72px; font-weight: 800; line-height: 1.08; margin-bottom: 24px;">${safeTitle}</div>
          <div style="font-size: 30px; line-height: 1.45; color: #e0e7ff;">${safeHook}</div>
        </div>
      </foreignObject>
      <text x="120" y="760" fill="#bfdbfe" font-size="30" font-family="Arial, sans-serif">Visual brief: bold type, clean editorial layout, reply-driven storytelling</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function seedDemoData() {
  state.newsletters = demoNewsletters;
  if (state.templates.length === 0) {
    state.templates = [defaultTemplate];
  }
  persistState();
  render();
}

function summarize(text, maxLength) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}…`;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatKeyword(value) {
  if (value.toLowerCase() === "ctas") {
    return "CTA";
  }

  return capitalize(value.replace(/-/g, " "));
}

function deriveTopic(sourceTitle, audience, fallbackBuilder, primary, secondary) {
  const lowerTitle = sourceTitle.toLowerCase();

  if (lowerTitle.includes("cta")) {
    return `CTA clinic: the one-question ending ${audience} will actually answer`;
  }

  if (lowerTitle.includes("founder-led")) {
    return `Founder-led story playbook: updates ${audience} will reply to`;
  }

  if (lowerTitle.includes("operating system") || lowerTitle.includes("15-minute")) {
    return `15-minute content system: a repeatable prompt for ${audience}`;
  }

  return fallbackBuilder(primary, secondary, audience);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
