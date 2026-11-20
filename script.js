const STORAGE_KEYS = {
  workers: "ruralconnect_workers",
  jobs: "ruralconnect_jobs"
};

const demoJobs = [
  { id: "demo-1", factory: "Greenfield Works", skill: "Welding", location: "Village A", distance: 5, wage: 750, type: "FULL-TIME" },
  { id: "demo-2", factory: "Sunrise Workshop", skill: "Helper", location: "Village A", distance: 8, wage: 500, type: "CONTRACT" },
  { id: "demo-3", factory: "Thendral Farms", skill: "Farm work", location: "Village B", distance: 7, wage: 650, type: "DAILY WAGE" }
];

let jobs = loadData(STORAGE_KEYS.jobs, demoJobs);
let workers = loadData(STORAGE_KEYS.workers, []);

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(jobs));
  localStorage.setItem(STORAGE_KEYS.workers, JSON.stringify(workers));
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function renderJobs(list = jobs) {
  const jobList = document.getElementById("jobList");
  const emptyState = document.getElementById("emptyState");
  document.getElementById("jobCount").textContent =
    `${list.length} ${list.length === 1 ? "opportunity" : "opportunities"}`;

  if (list.length === 0) {
    jobList.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  jobList.innerHTML = list.map(job => `
    <article class="job-card">
      <div class="job-card-top">
        <span class="job-icon">▤</span>
        <span class="job-type">${escapeHTML(job.type || "LOCAL ROLE")}</span>
      </div>
      <h3>${escapeHTML(job.skill)}</h3>
      <p class="company-name">${escapeHTML(job.factory)}</p>
      <div class="job-meta">
        <span>⌖ ${escapeHTML(job.location)} · ${Number(job.distance)} km</span>
        <span>₹${Number(job.wage).toLocaleString("en-IN")} <small>/ day</small></span>
      </div>
      <div class="skill-tags"><span>${escapeHTML(job.skill)}</span><span>Local opportunity</span></div>
      <button class="text-button apply-button" data-job-id="${escapeHTML(job.id)}">View opportunity <span>↗</span></button>
    </article>
  `).join("");
}

function calculateMatch(worker, job) {
  let score = 0;
  const sameSkill = worker.skill.trim().toLowerCase() === job.skill.trim().toLowerCase();

  if (sameSkill) score += 50;
  if (Number(job.distance) <= Number(worker.distance)) score += 25;
  if (Number(job.wage) >= Number(worker.wage)) score += 25;

  return score;
}

document.getElementById("workerForm").addEventListener("submit", event => {
  event.preventDefault();

  const worker = {
    id: `worker-${Date.now()}`,
    name: document.getElementById("workerName").value.trim(),
    skill: document.getElementById("workerSkill").value.trim(),
    location: document.getElementById("workerLocation").value.trim(),
    distance: Number(document.getElementById("workerDistance").value),
    wage: Number(document.getElementById("workerWage").value)
  };

  if (!worker.name || !worker.skill || !worker.location ||
      worker.distance <= 0 || worker.wage <= 0) {
    document.getElementById("workerFeedback").textContent = "Please enter valid details in every field.";
    return;
  }

  workers.push(worker);
  saveData();
  document.getElementById("workerFeedback").textContent = `Profile created for ${worker.name}. You can now check matching jobs.`;
  event.target.reset();
  showToast("Worker profile created successfully.");
  showMatchingJobs(worker);
});

document.getElementById("jobForm").addEventListener("submit", event => {
  event.preventDefault();

  const job = {
    id: `job-${Date.now()}`,
    factory: document.getElementById("factoryName").value.trim(),
    skill: document.getElementById("requiredSkill").value.trim(),
    location: document.getElementById("jobLocation").value.trim(),
    distance: Number(document.getElementById("jobDistance").value),
    wage: Number(document.getElementById("jobWage").value),
    type: "NEW LISTING"
  };

  if (!job.factory || !job.skill || !job.location ||
      job.distance < 0 || job.wage <= 0) {
    document.getElementById("jobFeedback").textContent = "Please enter valid details in every field.";
    return;
  }

  jobs.unshift(job);
  saveData();
  renderJobs();
  document.getElementById("jobFeedback").textContent = "Your opportunity is now listed on this demo website.";
  event.target.reset();
  showToast("Job opportunity published.");
  document.getElementById("jobs").scrollIntoView({ behavior: "smooth" });
});

function showMatchingJobs(worker) {
  const matches = jobs
    .map(job => ({ job, score: calculateMatch(worker, job) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    showToast("No matching jobs yet. Try again when more jobs are posted.");
    return;
  }

  const top = matches[0];
  showToast(`Best match for ${worker.name}: ${top.job.factory} — ${top.score}% match.`);
  document.getElementById("jobs").scrollIntoView({ behavior: "smooth" });
}

document.getElementById("searchButton").addEventListener("click", () => {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const location = document.getElementById("locationFilter").value.trim().toLowerCase();

  const filtered = jobs.filter(job => {
    const matchesQuery = !query ||
      job.skill.toLowerCase().includes(query) ||
      job.factory.toLowerCase().includes(query);
    const matchesLocation = !location || job.location.toLowerCase().includes(location);
    return matchesQuery && matchesLocation;
  });

  renderJobs(filtered);
});

document.getElementById("searchInput").addEventListener("keydown", event => {
  if (event.key === "Enter") document.getElementById("searchButton").click();
});
document.getElementById("locationFilter").addEventListener("keydown", event => {
  if (event.key === "Enter") document.getElementById("searchButton").click();
});

document.getElementById("jobList").addEventListener("click", event => {
  const button = event.target.closest(".apply-button");
  if (!button) return;

  const job = jobs.find(item => item.id === button.dataset.jobId);
  if (!job) return;

  showToast(`${job.skill} at ${job.factory}. Register your worker profile to check suitability.`);
  document.getElementById("worker").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll(".demo-apply").forEach(button => {
  button.addEventListener("click", () => {
    showToast("Demo listing selected. Create a worker profile to explore matching.");
    document.getElementById("worker").scrollIntoView({ behavior: "smooth" });
  });
});

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
renderJobs();
