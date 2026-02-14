function pickText(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) return el.textContent.trim();
  }
  return "";
}

function uniq(arr) {
  return [...new Set(arr.map(x => (x || "").trim()).filter(Boolean))];
}

// --- Pattern suggestion (simple + useful)
function suggestPattern(tags = [], title = "") {
  const t = (tags || []).map(x => x.toLowerCase());
  const name = (title || "").toLowerCase();

  const has = (kw) => t.some(x => x.includes(kw));

  if (has("two-pointers") || has("two pointers") || name.includes("two pointers")) return "Two Pointers";
  if (has("sliding-window") || has("sliding window") || name.includes("window")) return "Sliding Window";
  if (has("binary-search") || has("binary search") || name.includes("binary search")) return "Binary Search";
  if (has("dp") || has("dynamic programming") || name.includes("dynamic programming")) return "DP";
  if (has("graph") || has("bfs") || has("dfs") || name.includes("graph")) return "Graph (BFS/DFS)";
  if (has("heap") || has("priority queue") || name.includes("heap")) return "Heap / Priority Queue";
  if (has("stack") || name.includes("stack")) return "Stack";
  if (has("queue") || name.includes("queue")) return "Queue";
  if (has("greedy") || name.includes("greedy")) return "Greedy";
  if (has("backtracking") || name.includes("backtracking")) return "Backtracking";
  if (has("tree") || name.includes("tree")) return "Tree";
  if (has("trie") || name.includes("trie")) return "Trie";
  return "";
}

function normalizeDifficulty(x) {
  const s = (x || "").trim();
  // If it already looks good, keep it
  if (!s) return "";
  return s.replace(/\s+/g, " ");
}

// -------------------- LeetCode --------------------
function extractLeetCode() {
  const title =
    pickText(['div[data-cy="question-title"]', "h1", "div.text-title-large"]) ||
    document.title;

  // Better difficulty extraction
  let difficulty =
    pickText([
      'div[data-difficulty]',                 // sometimes exists
      'span[data-difficulty]',
      'div[class*="difficulty"]',
      'span[class*="difficulty"]',
      'div[data-cy="question-title"] ~ div span', // fallback nearby
    ]);

  // Fallback: search for Easy/Medium/Hard chips
  if (!difficulty) {
    const diffCandidates = ["Easy", "Medium", "Hard"];
    const body = document.body?.innerText || "";
    for (const d of diffCandidates) {
      if (body.includes(`\n${d}\n`)) { difficulty = d; break; }
    }
  }

  const tags = uniq(
    [...document.querySelectorAll("a[href*='/tag/']")]
      .map(a => a.textContent.trim())
  );

  return {
    platform: "LeetCode",
    title,
    url: location.href,
    difficulty: normalizeDifficulty(difficulty),
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

// -------------------- Codeforces --------------------
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

  // rating (difficulty)
  let difficulty = "";
  const pageText = document.body?.innerText || "";

  const m1 = pageText.match(/Difficulty:\s*(\d{3,4})/i);
  const m2 = pageText.match(/Rating:\s*(\d{3,4})/i);
  if (m1 && m1[1]) difficulty = `CF ${m1[1]}`;
  else if (m2 && m2[1]) difficulty = `CF ${m2[1]}`;

  return {
    platform: "Codeforces",
    title,
    url: location.href,
    difficulty: normalizeDifficulty(difficulty),
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

// -------------------- GeeksForGeeks --------------------
function extractGFG() {
  const title = pickText(["h1"]) || document.title;

  const difficulty = pickText([
    "[data-testid='problem-difficulty']",
    ".problemDifficulty",
    "span[class*='difficulty']",
    ".difficulty",
  ]);

  const tags = uniq(
    [...document.querySelectorAll("a[href*='tag'], a[href*='topic'], .tag, .problemTags span")]
      .map(x => x.textContent.trim())
  );

  return {
    platform: "GeeksforGeeks",
    title,
    url: location.href,
    difficulty: normalizeDifficulty(difficulty),
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

// -------------------- CodeChef --------------------
function extractCodeChef() {
  // CodeChef uses dynamic app; selectors vary
  const title =
    pickText([
      "h1",
      "header h1",
      ".problem-name",
      "[data-testid='problem-name']",
    ]) || document.title;

  // Difficulty sometimes shown as: "Difficulty: Easy/Medium/Hard" or star level
  let difficulty =
    pickText([
      "[data-testid='difficulty']",
      "div:has(> span) span:contains('Difficulty')", // not supported in querySelector, ignore
    ]);

  if (!difficulty) {
    const txt = document.body?.innerText || "";
    const m = txt.match(/Difficulty\s*:\s*(Easy|Medium|Hard)/i);
    if (m && m[1]) difficulty = m[1];
  }

  // Tags/topics sometimes appear as chips
  const tags = uniq(
    [
      ...document.querySelectorAll(
        "a[href*='/tags/'], a[href*='/tag/'], a[href*='topics'], span[class*='tag'], div[class*='tag']"
      )
    ].map(el => el.textContent.trim())
  );

  return {
    platform: "CodeChef",
    title,
    url: location.href,
    difficulty: normalizeDifficulty(difficulty),
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

// -------------------- HackerRank --------------------
function extractHackerRank() {
  const title =
    pickText([
      "h1",
      "header h1",
      "[data-automation='challenge-title']",
      ".challenge-title",
    ]) || document.title;

  // Difficulty often shows as Easy/Medium/Hard
  let difficulty =
    pickText([
      "[data-automation='challenge-difficulty']",
      "[data-testid='difficulty']",
      ".challenge-difficulty",
      "span[class*='difficulty']",
    ]);

  if (!difficulty) {
    const txt = document.body?.innerText || "";
    const m = txt.match(/\b(Easy|Medium|Hard)\b/i);
    if (m && m[1]) difficulty = m[1];
  }

  // tags: “Problem Solving”, “Algorithms”, etc.
  const tags = uniq(
    [
      ...document.querySelectorAll(
        "a[href*='/domains/'], a[href*='/topics/'], a[href*='/skills/'], span[class*='tag'], li[class*='tag']"
      )
    ].map(el => el.textContent.trim())
  );

  return {
    platform: "HackerRank",
    title,
    url: location.href,
    difficulty: normalizeDifficulty(difficulty),
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

// -------------------- InterviewBit --------------------
function extractInterviewBit() {
  const title =
    pickText([
      "h1",
      ".problem-title",
      ".p-title",
      "header h1",
    ]) || document.title;

  let difficulty =
    pickText([
      ".difficulty",
      "span.difficulty",
      "[class*='difficulty']",
    ]);

  if (!difficulty) {
    const txt = document.body?.innerText || "";
    const m = txt.match(/Difficulty\s*:\s*(Easy|Medium|Hard)/i);
    if (m && m[1]) difficulty = m[1];
  }

  const tags = uniq(
    [
      ...document.querySelectorAll(
        "a[href*='/topics/'], a[href*='/tags/'], .tags a, .tag, span.tag"
      )
    ].map(el => el.textContent.trim())
  );

  return {
    platform: "InterviewBit",
    title,
    url: location.href,
    difficulty: normalizeDifficulty(difficulty),
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

// -------------------- AtCoder --------------------
function extractAtCoder() {
  // AtCoder title like: "A - Something"
  const title =
    pickText([
      "#task-statement .h2",
      "span.h2",
      "h2",
      "h1",
    ]) || document.title;

  // AtCoder sometimes shows difficulty by color/number on tasks list, but inside task page it may not be explicit.
  // Best-effort: look for "Difficulty" text on page
  let difficulty = "";
  const txt = document.body?.innerText || "";
  const m = txt.match(/Difficulty\s*[:：]\s*([0-9]{1,4})/i);
  if (m && m[1]) difficulty = `AtCoder ${m[1]}`;

  // Tags are not standard on AtCoder; keep empty
  const tags = [];

  return {
    platform: "AtCoder",
    title,
    url: location.href,
    difficulty: normalizeDifficulty(difficulty),
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

// -------------------- CSES --------------------
function extractCSES() {
  const title =
    pickText([
      "h1",
      ".title",
      "h2",
    ]) || document.title;

  // CSES doesn't provide official difficulty/tags on task page
  const difficulty = "";
  const tags = [];

  return {
    platform: "CSES",
    title,
    url: location.href,
    difficulty,
    tags,
    patternSuggested: suggestPattern(tags, title)
  };
}

// -------------------- Router --------------------
function getProblemData() {
  const h = location.hostname;

  if (h.includes("leetcode.com")) return extractLeetCode();
  if (h.includes("codeforces.com")) return extractCodeforces();
  if (h.includes("geeksforgeeks.org") || h.includes("practice.geeksforgeeks.org")) return extractGFG();
  if (h.includes("codechef.com")) return extractCodeChef();
  if (h.includes("hackerrank.com")) return extractHackerRank();
  if (h.includes("interviewbit.com")) return extractInterviewBit();
  if (h.includes("atcoder.jp")) return extractAtCoder();
  if (h.includes("cses.fi")) return extractCSES();

  return { platform: h, title: document.title, url: location.href, difficulty: "", tags: [], patternSuggested: "" };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_PROBLEM") {
    sendResponse(getProblemData());
  }
});
