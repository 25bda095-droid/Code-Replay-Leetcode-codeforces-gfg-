function pickText(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) return el.textContent.trim();
  }
  return "";
}

function uniq(arr) {
  return [...new Set(arr.map(x => x.trim()).filter(Boolean))];
}

// --- Pattern suggestion (simple + useful)
function suggestPattern(tags = [], title = "") {
  const t = tags.map(x => x.toLowerCase());
  const name = title.toLowerCase();

  const has = (kw) => t.some(x => x.includes(kw));

  if (has("two-pointers") || name.includes("two pointers")) return "Two Pointers";
  if (has("sliding-window") || name.includes("window")) return "Sliding Window";
  if (has("binary-search") || name.includes("binary search")) return "Binary Search";
  if (has("dp") || has("dynamic programming")) return "DP";
  if (has("graph") || has("bfs") || has("dfs")) return "Graph (BFS/DFS)";
  if (has("heap") || has("priority queue")) return "Heap / Priority Queue";
  if (has("stack")) return "Stack";
  if (has("queue")) return "Queue";
  if (has("greedy")) return "Greedy";
  if (has("backtracking")) return "Backtracking";
  if (has("tree")) return "Tree";
  if (has("trie")) return "Trie";
  return "";
}

// --- LeetCode extraction
function extractLeetCode() {
  const title =
    pickText(['div[data-cy="question-title"]', "h1", "div.text-title-large"]) ||
    document.title;

  // Difficulty chip is usually in DOM; fallback is text search.
  let difficulty = "";
  const diffCandidates = ["Easy", "Medium", "Hard"];
  for (const d of diffCandidates) {
    if (document.body.innerText.includes("\n" + d + "\n")) { difficulty = d; break; }
  }

  const tags = uniq(
    [...document.querySelectorAll("a[href*='/tag/']")]
      .map(a => a.textContent.trim())
  );

  return {
    platform: "LeetCode",
    title,
    url: location.href,
    difficulty,
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

// --- Codeforces extraction with rating (difficulty)
function extractCodeforces() {
  const titleRaw = pickText([
    ".problem-statement .title",
    "#pageContent .title",
    "div.title"
  ]);
  const title = titleRaw ? titleRaw.replace(/^\s*\w+\.\s*/, "").trim() : document.title;

  const tags = uniq(
    [...document.querySelectorAll(".roundbox .tag-box a")]
      .map(a => a.textContent.trim())
  );

  // Try find problem rating like "Difficulty: 1200" or "Rating: 800"
  let difficulty = "";
  const pageText = document.body.innerText;

  const m1 = pageText.match(/Difficulty:\s*(\d{3,4})/i);
  const m2 = pageText.match(/Rating:\s*(\d{3,4})/i);

  if (m1 && m1[1]) difficulty = m1[1];
  else if (m2 && m2[1]) difficulty = m2[1];

  // Sometimes CF uses stars or "800" near sidebar; last fallback
  if (!difficulty) {
    const likely = [...document.querySelectorAll("span, div")]
      .map(el => el.textContent.trim())
      .find(x => /^\d{3,4}$/.test(x));
    if (likely) difficulty = likely;
  }

  return {
    platform: "Codeforces",
    title,
    url: location.href,
    difficulty: difficulty ? `CF ${difficulty}` : "",
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

// --- GFG extraction
function extractGFG() {
  const title = pickText(["h1"]) || document.title;

  // Difficulty on GFG is inconsistent; keep best effort
  const difficulty = pickText([
    "[data-testid='problem-difficulty']",
    ".problemDifficulty",
    "span[class*='difficulty']"
  ]);

  const tags = uniq(
    [...document.querySelectorAll("a[href*='tag'], a[href*='topic'], .tag, .problemTags span")]
      .map(x => x.textContent.trim())
  );

  return {
    platform: "GeeksforGeeks",
    title,
    url: location.href,
    difficulty,
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

function getProblemData() {
  const h = location.hostname;
  if (h.includes("leetcode.com")) return extractLeetCode();
  if (h.includes("codeforces.com")) return extractCodeforces();
  if (h.includes("geeksforgeeks.org")) return extractGFG();
  return { platform: h, title: document.title, url: location.href, difficulty: "", tags: [], patternSuggested: "" };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_PROBLEM") {
    sendResponse(getProblemData());
  }
});
