// Ukentlig blogg-generator for lrnify.no.
// Kjøres av .github/workflows/weekly-blog.yml. Velger neste ressurs i
// blogg/queue.json (og deretter spillene i index.html sitt GAMES-array
// når køen er tom), genererer et innlegg via Anthropic API, og skriver
// filene. Selve commit/PR håndteres av workflow-stegene etterpå.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY; // "owner/repo"
const MODEL = process.env.BLOG_MODEL || "claude-sonnet-5";
const TODAY = new Date().toISOString().slice(0, 10);

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

function writeOutput(name, value) {
  const outFile = process.env.GITHUB_OUTPUT;
  if (!outFile) return;
  fs.appendFileSync(outFile, `${name}<<__EOF__\n${value}\n__EOF__\n`);
}

function getExistingSlugs() {
  const bloggDir = path.join(ROOT, "blogg");
  return fs
    .readdirSync(bloggDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

async function getOpenPrSlugs() {
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) return [];
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls?state=open&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    if (!res.ok) return [];
    const prs = await res.json();
    return prs
      .map((pr) => pr.head?.ref || "")
      .filter((ref) => ref.startsWith("blog/"))
      .map((ref) => ref.slice("blog/".length));
  } catch {
    return [];
  }
}

function parseGamesFromIndex() {
  const indexHtml = readFile("index.html");
  const arrayMatch = indexHtml.match(/const GAMES = \[([\s\S]*?)\n\];/);
  if (!arrayMatch) return [];
  const body = arrayMatch[1];
  const entryRe =
    /\{\s*title:\s*"([^"]+)"\s*,\s*file:\s*"([^"]+)"\s*,\s*category:\s*"([^"]+)"\s*,\s*icon:\s*"([^"]*)"\s*,\s*color:\s*"([^"]*)"\s*,\s*size:\s*"([^"]*)"\s*,\s*locked:\s*(true|false)\s*\}/g;
  const games = [];
  let m;
  while ((m = entryRe.exec(body)) !== null) {
    const [, title, file, category, , , , locked] = m;
    if (locked === "true") continue;
    const slug = file
      .replace(/\/index\.html$/, "")
      .replace(/_/g, "-")
      .replace(/\//g, "-");
    games.push({
      slug,
      title,
      category,
      sourceFile: `games/${file}`,
      url: `games/${file}`,
      kind: "game",
    });
  }
  return games;
}

function loadQueue() {
  const queue = JSON.parse(readFile("blogg/queue.json")).map((q) => ({
    ...q,
    kind: "resource",
  }));
  return queue;
}

async function pickNext() {
  const covered = new Set([...getExistingSlugs(), ...(await getOpenPrSlugs())]);
  for (const entry of loadQueue()) {
    if (!covered.has(entry.slug)) return entry;
  }
  for (const entry of parseGamesFromIndex()) {
    if (!covered.has(entry.slug)) return entry;
  }
  return null;
}

function extractFacts(sourceFile) {
  const content = readFile(sourceFile);
  const re = /<(h[1-3]|button|label)[^>]*>([^<]{1,80})<\/\1>|<(h[1-3]|button|label)[^>]*>([^<]{1,80})/g;
  const facts = new Set();
  let m;
  while ((m = re.exec(content)) !== null) {
    const text = (m[2] || m[4] || "").replace(/\s+/g, " ").trim();
    if (text.length > 1) facts.add(text);
    if (facts.size >= 30) break;
  }
  return [...facts];
}

function buildPrompt(entry, facts) {
  const kindLabel =
    entry.kind === "game" ? "et læringsspill" : "et klasseromsverktøy/aktivitet";
  return `Du skriver et blogginnlegg for lrnify.no, en norsk skoleside med gratis læringsspill og klasseromsverktøy laget for LK20.

Ressursen dette innlegget handler om er ${kindLabel} som heter "${entry.title || entry.slug}" (kategori: ${entry.category || "ukjent"}), tilgjengelig på https://lrnify.no/${entry.url}.

Her er faktiske tekstelementer (knapper, overskrifter, etiketter) hentet direkte fra kildekoden til ressursen, som du MÅ basere innholdet på — ikke finn opp funksjoner som ikke er nevnt her:
${facts.map((f) => `- ${f}`).join("\n")}

Skriv et originalt, konkret blogginnlegg på 300–500 ord for lærere, på norsk (bokmål). Forklar hva ressursen gjør, hvorfor den er nyttig i undervisning eller klasseledelse, og koble naturlig til LK20 der det passer uten å overdrive. Skriv som en erfaren lærer som anbefaler et verktøy til en kollega — ikke generisk markedsføringsspråk. Avslutt naturlig med en oppfordring om å prøve ressursen.

Svar KUN med et JSON-objekt (ingen markdown-fences, ingen forklaring før eller etter), med nøyaktig denne strukturen:
{
  "title": "Kort, konkret tittel (maks ca. 60 tegn)",
  "metaDescription": "Én setning, maks 155 tegn, for søkemotorer",
  "excerpt": "Én til to setninger som sammendrag, maks 160 tegn",
  "bodyHtml": "Innleggets brødtekst som semantisk HTML: bruk <p>, <h2> og <ul>/<li> der det passer. IKKE inkluder <h1>, <html>, <head> eller <body>. Avslutt med et <p> som inneholder en lenke: <a href=\\"/${entry.url}\\">Prøv ${entry.title || entry.slug} gratis →</a>"
}`;
}

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const raw = data.content?.[0]?.text || "";
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function renderPostHtml({ slug, title, metaDescription, bodyHtml, date }) {
  const url = `https://lrnify.no/blogg/${slug}/index.html`;
  return `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} – LRNify</title>
<meta name="description" content="${esc(metaDescription)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(metaDescription)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="nb_NO">
<meta property="article:published_time" content="${date}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": ${JSON.stringify(title)},
  "description": ${JSON.stringify(metaDescription)},
  "datePublished": "${date}",
  "dateModified": "${date}",
  "inLanguage": "nb-NO",
  "url": "${url}",
  "mainEntityOfPage": "${url}",
  "author": { "@type": "Organization", "name": "LRNify" },
  "publisher": { "@type": "Organization", "name": "LRNify", "url": "https://lrnify.no/" }
}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chewy&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root{
    --cream:#fff9f0;
    --ink:#2b2118;
    --yellow:#facc15;
    --card:#ffffff;
    --muted:#7a6f63;
    --blue:#2563eb;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;}
  body{
    font-family:'Nunito',sans-serif;
    background:var(--cream);
    color:var(--ink);
    min-height:100%;
  }
  header{
    display:flex;align-items:center;justify-content:space-between;
    padding:18px 24px;
  }
  .logo{
    font-family:'Chewy',cursive;
    font-size:clamp(2rem,6vw,3rem);
    transform:rotate(-2deg);
    line-height:1;
    color:inherit;
    text-decoration:none;
    display:inline-block;
  }
  .logo b{color:var(--yellow);-webkit-text-stroke:2px var(--ink);font-weight:400;}
  header a.back{font-weight:800;color:var(--ink);text-decoration:none;font-size:.95rem;}
  main{max-width:720px;margin:0 auto;padding:12px 24px 60px;}
  article time{display:block;color:var(--muted);font-weight:700;font-size:.9rem;margin-bottom:10px;}
  article h1{font-size:clamp(1.7rem,5vw,2.3rem);line-height:1.15;margin-bottom:20px;}
  article h2{font-size:1.3rem;margin:32px 0 10px;}
  article p{line-height:1.7;margin-bottom:14px;font-size:1.05rem;}
  article ul{margin:0 0 14px 22px;line-height:1.7;}
  article li{margin-bottom:4px;}
  article a{color:var(--blue);font-weight:800;}
  footer{text-align:center;padding:30px 24px;color:var(--muted);font-size:.9rem;}
</style>
</head>
<body>
  <header>
    <a class="logo" href="/index.html">LRN<b>ify</b></a>
    <a class="back" href="/blogg/index.html">← Til bloggen</a>
  </header>

  <main>
    <article>
      <time datetime="${date}">${new Date(date).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}</time>
      <h1>${esc(title)}</h1>
${bodyHtml}
    </article>
  </main>

  <footer>LRNify · lær gjennom lek · © ${date.slice(0, 4)}</footer>
</body>
</html>
`;
}

function updatePostsList({ slug, title, excerpt, date }) {
  const file = "blogg/index.html";
  let content = readFile(file);
  const entry = `  {
    slug: "${slug}",
    title: "${title.replace(/"/g, '\\"')}",
    date: "${date}",
    excerpt: "${excerpt.replace(/"/g, '\\"')}"
  },\n`;
  content = content.replace(/(const POSTS = \[\n)/, `$1${entry}`);
  fs.writeFileSync(path.join(ROOT, file), content, "utf-8");
}

function updateSitemap({ slug, date }) {
  const file = "sitemap.xml";
  let content = readFile(file);
  const marker =
    '<url><loc>https://lrnify.no/blogg/index.html</loc><lastmod>';
  const idx = content.indexOf(marker);
  if (idx === -1) {
    content = content.replace(
      "</urlset>",
      `  <url><loc>https://lrnify.no/blogg/${slug}/index.html</loc><lastmod>${date}</lastmod></url>\n</urlset>`
    );
  } else {
    const lineEnd = content.indexOf("\n", idx);
    const insertion = `\n  <url><loc>https://lrnify.no/blogg/${slug}/index.html</loc><lastmod>${date}</lastmod></url>`;
    content = content.slice(0, lineEnd) + insertion + content.slice(lineEnd);
  }
  fs.writeFileSync(path.join(ROOT, file), content, "utf-8");
}

async function main() {
  const entry = await pickNext();
  if (!entry) {
    console.log("Bloggkøen er tom — ingen nytt innlegg denne uken.");
    writeOutput("has_post", "false");
    return;
  }

  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY mangler som secret i repoet.");
  }

  console.log(`Genererer innlegg for: ${entry.slug} (${entry.sourceFile})`);
  const facts = extractFacts(entry.sourceFile);
  const prompt = buildPrompt(entry, facts);
  const post = await callClaude(prompt);

  const postDir = path.join(ROOT, "blogg", entry.slug);
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(
    path.join(postDir, "index.html"),
    renderPostHtml({ slug: entry.slug, date: TODAY, ...post }),
    "utf-8"
  );

  updatePostsList({ slug: entry.slug, title: post.title, excerpt: post.excerpt, date: TODAY });
  updateSitemap({ slug: entry.slug, date: TODAY });

  writeOutput("has_post", "true");
  writeOutput("slug", entry.slug);
  writeOutput("title", post.title);
  writeOutput("url_path", `blogg/${entry.slug}/index.html`);
  console.log(`Ferdig: "${post.title}" -> blogg/${entry.slug}/index.html`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
