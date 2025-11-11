// app.js — public GitHub API version (no OAuth required)

// Base GitHub API URL
const GITHUB_API = "https://api.github.com";

// UI elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("repoGrid");
const emptyState = document.getElementById("emptyState");


// Search public repos by keyword
async function fetchRepos({ query = "react", sort = "stars", order = "desc" } = {}) {
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&per_page=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("GitHub API failed");
  const json = await res.json();
  return json.items;
}

function renderRepos(repos) {
  resultsContainer.innerHTML = "";
  if (!repos || repos.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";
  repos.forEach(repo => {
    const card = document.createElement("div");
    card.className = "glass-card repo-card";
    card.innerHTML = `
      <div class="repo-title font-semibold text-lg">${repo.full_name}</div>
      <div class="repo-desc text-sm text-gray-300">${repo.description || "No description"}</div>
      <div class="text-sm text-gray-400 mt-2">⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}</div>
      <button class="btn-accent mt-3" data-owner="${repo.owner.login}" data-repo="${repo.name}">
        Explore
      </button>
    `;
    resultsContainer.appendChild(card);
  });
}


// Fetch repo files/folders
async function fetchRepoContents(owner, repo, path = "") {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch repo contents");
  return await res.json();
}

// Show repo contents in modal or inline
async function showRepoContents(owner, repo, path = "") {
  const files = await fetchRepoContents(owner, repo, path);
  resultsContainer.innerHTML = `
    <button class="btn-ghost" id="backBtn">← Back to search</button>
    <h2 style="margin-top:1rem">${owner}/${repo} ${path ? "/" + path : ""}</h2>
  `;
  const list = document.createElement("div");
  files.forEach(file => {
    const item = document.createElement("div");
    item.className = "glass-card repo-card";
    item.innerHTML = `
      <div>${file.type === "dir" ? "📁" : "📄"} ${file.name}</div>
    `;
    item.onclick = () => {
      if (file.type === "dir") {
        showRepoContents(owner, repo, file.path);
      } else {
        showFileContent(owner, repo, file.path);
      }
    };
    list.appendChild(item);
  });
  resultsContainer.appendChild(list);
  document.getElementById("backBtn").onclick = loadSearch;
}

// Show file content (text preview)
async function showFileContent(owner, repo, path) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url);
  const file = await res.json();
  const decoded = atob(file.content);
  resultsContainer.innerHTML = `
    <button class="btn-ghost" id="backBtn">← Back</button>
    <h2>${file.name}</h2>
    <pre style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:1rem; color:#cde7ff; overflow-x:auto;">
${decoded.substring(0, 2000)}
    </pre>
  `;
  document.getElementById("backBtn").onclick = () => {
    const parts = path.split("/");
    parts.pop();
    showRepoContents(owner, repo, parts.join("/"));
  };
}

// Load initial search
async function loadSearch() {
  const query = searchInput.value.trim() || "react";
  const repos = await fetchRepos({ query });
  renderRepos(repos);
}

// Event listeners
searchBtn.addEventListener("click", loadSearch);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") loadSearch();
});

// Explore button click
resultsContainer.addEventListener("click", (e) => {
  if (e.target.matches(".btn-accent")) {
    const owner = e.target.dataset.owner;
    const repo = e.target.dataset.repo;
    showRepoContents(owner, repo);
  }
});

// Initial load
loadSearch();
