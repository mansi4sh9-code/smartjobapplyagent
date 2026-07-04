// Application State Management
const state = {
    currentView: 'dashboard',
    resumeText: '',
    resumeParsed: null,
    searchTitle: '',
    searchLocation: '',
    searchResults: [],
    selectedJob: null,
    kitsCount: 0,
    generatedKits: {}, // Cache of generated kits: { jobId: { 0: text, 1: text, ... } }
    activeTab: 0,
    geminiApiKey: '',
    jsearchApiKey: ''
};

// Default Sample Resume for demonstration purposes
const SAMPLE_RESUME = `MANSI SHARMA
Email: mansi.sharma@email.com | Phone: +91 98765 43210 | Location: India
LinkedIn: linkedin.com/in/mansi-sharma

PROFESSIONAL SUMMARY
Highly analytical and detail-oriented Business Analyst with 4+ years of experience in facilitating requirements gathering, data modeling, and process optimization across financial services and retail domains. Proven track record of bridging the gap between business needs and technical solutions using Agile methodologies, SQL, and data visualization tools.

CORE COMPETENCIES
* Requirements Gathering & Analysis
* Agile (Scrum/Kanban), User Stories & backlog grooming
* SQL (PostgreSQL, MySQL) & Data Analysis
* Tableau & Power BI Dashboard Development
* Process Mapping (BPMN, MS Visio)
* Stakeholder Management & UAT Coordination

WORK EXPERIENCE
Senior Business Analyst | FinTech Solutions, Mumbai
July 2022 – Present
* Led requirement analysis and solution design for a high-priority peer-to-peer payments migration project, reducing transaction processing times by 22%.
* Facilitated weekly backlog refinement sessions and daily stand-ups for a cross-functional squad of 12 engineers and product owners.
* Created 50+ detailed user stories, process flow diagrams, and functional specifications mapping complex merchant boarding logic.
* Designed and maintained SQL dashboards in Tableau to track active merchant transaction flows, providing weekly KPIs to C-suite executives.

Business Analyst | Retail Analytics Corp, Pune
April 2020 – June 2022
* Conducted market analysis and gathered requirements for an e-commerce loyalty engine redesign, which boosted customer retention rates by 15% in 6 months.
* Collaborated with UX designers to develop wireframes and interactive mockups, accelerating business user sign-off by 30%.
* Maintained SQL queries to perform data verification tasks during regression testing, identifying 15+ high-priority software bugs before UAT.
* Coordinated User Acceptance Testing (UAT) with 25 business stakeholders, documenting test scripts and defect logs in Jira.

EDUCATION
Bachelor of Engineering in Computer Science
Mumbai University | 2016 – 2020`;

// Initialize Application on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Load data from local storage
    loadStateFromLocalStorage();

    // 2. Initialize UI Elements & Event Listeners
    setupNavigation();
    setupResumeActions();
    setupSearchActions();
    setupKitActions();
    setupSettingsActions();
    setupMobileMenu();
    setupSearchModal();

    // 3. Render Initial States
    renderResumeState();
    renderJSearchIndicatorState();
    updateDashboardStats();

    // 4. Sync API keys to input fields now that DOM is ready
    const geminiInput = document.getElementById('geminiApiKeyInput');
    if (geminiInput && state.geminiApiKey) geminiInput.value = state.geminiApiKey;
    const jsearchInput = document.getElementById('jsearchApiKeyInput');
    if (jsearchInput && state.jsearchApiKey) jsearchInput.value = state.jsearchApiKey;

    // Make state and navigation accessible globally for onclick/inline hooks
    window.app = {
        navigateTo
    };

    // Trigger Icons Replacement
    lucide.createIcons();
}

// ==========================================
// LOCAL STORAGE & DATA LOADING
// ==========================================
function loadStateFromLocalStorage() {
    const savedResume = localStorage.getItem('smart_apply_resume');
    if (savedResume) {
        state.resumeText = savedResume;
        state.resumeParsed = parseResumeQuick(savedResume);
    }

    const savedJSearchKey = localStorage.getItem('smart_apply_jsearch_key');
    if (savedJSearchKey) {
        state.jsearchApiKey = savedJSearchKey;
        document.getElementById('jsearchApiKeyInput').value = savedJSearchKey;
    }

    const savedGeminiKey = localStorage.getItem('smart_apply_gemini_key');
    if (savedGeminiKey) {
        state.geminiApiKey = savedGeminiKey;
    }

    const savedKitsCount = localStorage.getItem('smart_apply_kits_count');
    if (savedKitsCount) {
        state.kitsCount = parseInt(savedKitsCount, 10);
    }
}

function saveResumeToLocalStorage(text) {
    state.resumeText = text;
    state.resumeParsed = parseResumeQuick(text);
    localStorage.setItem('smart_apply_resume', text);
    renderResumeState();
    updateDashboardStats();
}

function parseResumeQuick(text) {
    if (!text || text.trim() === '') return null;
    const charCount = text.length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // Quick keyword search to find sections
    const sections = [];
    if (/experience|work|history|employment/i.test(text)) sections.push('Work History');
    if (/skills|competencies|technologies/i.test(text)) sections.push('Core Skills');
    if (/education|degree|university/i.test(text)) sections.push('Education');
    if (/summary|profile|about/i.test(text)) sections.push('Professional Summary');
    if (/project/i.test(text)) sections.push('Projects');

    return {
        charCount,
        wordCount,
        sections
    };
}

// ==========================================
// VIEWS ROUTING / NAVIGATION
// ==========================================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-target');
            navigateTo(targetView);
        });
    });

    // Handle initial hash routing
    const hash = window.location.hash.substring(1);
    if (hash && ['dashboard', 'resume', 'search', 'kit', 'settings'].includes(hash)) {
        navigateTo(hash);
    }
}

function navigateTo(viewId) {
    state.currentView = viewId;

    // Update active state in sidebar
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('data-target') === viewId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update active view content
    const views = document.querySelectorAll('.content-view');
    views.forEach(view => {
        if (view.id === `view-${viewId}`) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });

    // Update title bar
    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        dashboard: 'Dashboard Overview',
        resume: 'Resume Profile Builder',
        search: 'Job Opportunities Search',
        kit: 'One-Click Application Kit',
        settings: 'System & API Settings'
    };
    pageTitle.textContent = titles[viewId] || 'SmartApply Agent';

    // Special logic for kit page when transitioning
    if (viewId === 'kit') {
        renderKitView();
    }

    // Update dashboard metrics just in case
    if (viewId === 'dashboard') {
        updateDashboardStats();
    }

    // Scroll main view to top
    document.querySelector('.main-content').scrollTop = 0;

    // Update browser URL hash quietly
    history.pushState(null, null, `#${viewId}`);

    // If mobile, close the sidebar
    document.getElementById('sidebar').classList.remove('open');
}

function setupMobileMenu() {
    const mobileToggleBtn = document.getElementById('mobileToggleBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const sidebar = document.getElementById('sidebar');

    if (mobileToggleBtn) {
        mobileToggleBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }

    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
}

// ==========================================
// RESUME COMPONENT LOGIC
// ==========================================
function setupResumeActions() {
    const saveBtn = document.getElementById('saveResumeBtn');
    const loadSampleBtn = document.getElementById('loadSampleResumeBtn');
    const resumeInput = document.getElementById('resumeInput');

    if (resumeInput && state.resumeText) {
        resumeInput.value = state.resumeText;
        updateResumeCharCount(state.resumeText);
    }

    resumeInput.addEventListener('input', () => {
        updateResumeCharCount(resumeInput.value);
    });

    saveBtn.addEventListener('click', () => {
        const text = resumeInput.value;
        if (!text.trim()) {
            showToast('Resume content cannot be empty!', 'error');
            return;
        }
        saveResumeToLocalStorage(text);
        showToast('Resume profile saved successfully!', 'success');
    });

    loadSampleBtn.addEventListener('click', () => {
        resumeInput.value = SAMPLE_RESUME;
        updateResumeCharCount(SAMPLE_RESUME);
        saveResumeToLocalStorage(SAMPLE_RESUME);
        showToast('Sample Resume loaded and saved!', 'success');
    });
}

function updateResumeCharCount(text) {
    const charCountBadge = document.getElementById('resumeCharCount');
    if (charCountBadge) {
        charCountBadge.textContent = `${text.length} characters`;
    }
}

function renderResumeState() {
    const badge = document.getElementById('resumeBadge');
    const previewContainer = document.getElementById('resumePreviewContainer');

    if (state.resumeText) {
        // Update Sidebar Badge
        badge.textContent = 'Saved';
        badge.className = 'badge saved';

        // Update Preview Pane
        const summary = state.resumeParsed;
        let sectionsHtml = summary.sections.map(sec => `<span class="indicator-badge" style="background-color: var(--accent-blue-light); border-color: rgba(37, 99, 235, 0.2); color: var(--accent-blue);">${sec}</span>`).join(' ');

        previewContainer.innerHTML = `
            <div class="resume-analysis-card">
                <div class="stat-card" style="margin-bottom: 20px; box-shadow: none; border-color: var(--border-color); background-color: var(--bg-primary);">
                    <div class="stat-icon-wrapper blue"><i data-lucide="check-circle-2"></i></div>
                    <div class="stat-data">
                        <h3>Profile Quality Rating</h3>
                        <p class="stat-value" style="color: var(--accent-green);">Excellent</p>
                        <p class="stat-sub">${summary.wordCount} words analyzed.</p>
                    </div>
                </div>

                <h4>Parsed Document Details</h4>
                <ul class="analysis-list">
                    <li class="analysis-item">
                        <span class="analysis-key">Character Count:</span>
                        <span class="analysis-value">${summary.charCount}</span>
                    </li>
                    <li class="analysis-item">
                        <span class="analysis-key">Word Count:</span>
                        <span class="analysis-value">${summary.wordCount}</span>
                    </li>
                    <li class="analysis-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                        <span class="analysis-key">Identified Sections:</span>
                        <div class="sections-tag-list" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                            ${sectionsHtml || '<span class="form-text">None explicitly found</span>'}
                        </div>
                    </li>
                </ul>

                <h4 style="margin-top: 24px; margin-bottom: 8px;">Raw Profile Snapshot</h4>
                <pre class="font-code" style="background-color: var(--bg-primary); padding: 16px; border-radius: var(--radius-md); font-size: 12px; overflow-x: auto; max-height: 180px; border: 1px solid var(--border-color);">${escapeHtml(state.resumeText)}</pre>
            </div>
        `;
        lucide.createIcons();
    } else {
        badge.textContent = 'Missing';
        badge.className = 'badge';

        previewContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="file-question" class="empty-icon"></i>
                <h4>No Resume Saved Yet</h4>
                <p>Paste your resume on the left and click Save to store it in your session storage. Once saved, you'll see a brief analysis of the sections detected.</p>
            </div>
        `;
        lucide.createIcons();
    }
}

// ==========================================
// JOB SEARCH COMPONENT LOGIC
// ==========================================
function setupSearchActions() {
    const searchForm = document.getElementById('jobSearchForm');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('searchTitle').value.trim();
        const location = document.getElementById('searchLocation').value.trim() || 'Remote';

        if (!title) return;

        state.searchTitle = title;
        state.searchLocation = location;

        await performJobSearch(title, location);
    });
}

async function performJobSearch(title, location) {
    const grid = document.getElementById('jobsGrid');
    const skeleton = document.getElementById('searchSkeleton');
    const emptyState = document.getElementById('searchEmptyState');
    const resultsCount = document.getElementById('searchResultsCount');
    const searchBtn = document.getElementById('searchBtn');

    // Disable the search button
    if (searchBtn) {
        searchBtn.disabled = true;
    }

    // Show Loader
    grid.style.display = 'none';
    emptyState.style.display = 'none';
    skeleton.style.display = 'grid';
    resultsCount.textContent = 'Searching...';

    try {
        // Always try Indeed RSS feed first (free, no API key needed)
        showToast('Fetching live jobs from Indeed...', 'info');
        try {
            const response = await fetchLiveJSearch(title, location);
            state.searchResults = response;
        } catch (indeedError) {
            console.log('Indeed feed failed, using mock:', indeedError.message);
            showToast('Live search unavailable. Using smart mock data.', 'warning');
            await new Promise(resolve => setTimeout(resolve, 1500));
            state.searchResults = generateMockJobs(title, location);
        }

        skeleton.style.display = 'none';
        grid.style.display = 'grid';

        renderSearchResults();
    } catch (error) {
        console.error('Job search failed:', error);
        showToast('Error fetching jobs. Utilizing local mock generator.', 'error');

        state.searchResults = generateMockJobs(title, location);
        skeleton.style.display = 'none';
        grid.style.display = 'grid';
        renderSearchResults();
    } finally {
        // Re-enable the search button after results load
        if (searchBtn) {
            searchBtn.disabled = false;
        }
    }
}

async function fetchLiveJSearch(query, location) {
    // Use Indeed RSS feed via allorigins proxy (CORS-free, no API key needed)
    const indeedQuery = encodeURIComponent(query);
    const indeedLocation = encodeURIComponent(location || '');
    const indeedUrl = `https://www.indeed.com/rss?q=${indeedQuery}&l=${indeedLocation}&sort=date&limit=10`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(indeedUrl)}`;

    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
    
    const data = await res.json();
    const xmlText = data.contents;
    
    // Parse RSS XML
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item'));
    
    if (!items || items.length === 0) throw new Error('No jobs found in feed');
    
    return items.map((item, i) => {
        const title = item.querySelector('title')?.textContent || 'Job Opening';
        const link = item.querySelector('link')?.textContent || '#';
        const description = item.querySelector('description')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const source = item.querySelector('source')?.textContent || '';
        
        // Extract company from title (format: "Job Title - Company Name")
        const titleParts = title.split(' - ');
        const jobTitle = titleParts[0]?.trim() || title;
        const company = titleParts[1]?.trim() || source || 'Company';
        
        // Clean description HTML
        const cleanDesc = description.replace(/<[^>]*>/g, '').trim().substring(0, 500);
        
        // Format date
        const postedDate = pubDate ? new Date(pubDate).toLocaleDateString() : 'Recently';
        
        return {
            id: `indeed_${i}_${Date.now()}`,
            title: jobTitle,
            company: company,
            location: location || 'Remote',
            description: cleanDesc || 'View full job description on Indeed.',
            postedAt: postedDate,
            logoText: company.charAt(0).toUpperCase(),
            url: link
        };
    });
}

function renderSearchResults() {
    const grid = document.getElementById('jobsGrid');
    const resultsCount = document.getElementById('searchResultsCount');
    const searchEmptyState = document.getElementById('searchEmptyState');

    grid.innerHTML = '';

    if (state.searchResults.length === 0) {
        resultsCount.textContent = '0 jobs found';
        searchEmptyState.style.display = 'flex';
        return;
    }
    searchEmptyState.style.display = 'none';

    resultsCount.textContent = `${state.searchResults.length} jobs found`;

    state.searchResults.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
            <h4 class="job-title" title="${escapeHtml(job.title)}">${escapeHtml(job.title)}</h4>
            <p class="job-company">${escapeHtml(job.company)}</p>
            <div class="job-meta-row">
                <span><i data-lucide="map-pin"></i> ${escapeHtml(job.location)}</span>
                <span><i data-lucide="calendar"></i> ${escapeHtml(job.postedAt)}</span>
            </div>
            <p class="job-desc-snippet">${escapeHtml(job.description)}</p>
            <div class="job-card-actions">
                <button class="btn btn-secondary btn-sm btn-view-desc" data-id="${job.id}">
                    <i data-lucide="info"></i> Details
                </button>
                <button class="btn btn-primary btn-sm btn-generate-kit" data-id="${job.id}">
                    <i data-lucide="sparkles"></i> Generate Kit
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Reinitialize icons in new cards
    lucide.createIcons();

    // Event listeners inside the new cards
    grid.querySelectorAll('.btn-view-desc').forEach(btn => {
        btn.addEventListener('click', () => {
            const jobId = btn.getAttribute('data-id');
            const job = state.searchResults.find(j => j.id === jobId);
            if (job) openJobModal(job);
        });
    });

    grid.querySelectorAll('.btn-generate-kit').forEach(btn => {
        btn.addEventListener('click', () => {
            const jobId = btn.getAttribute('data-id');
            const job = state.searchResults.find(j => j.id === jobId);
            if (job) {
                selectJobAndGenerate(job);
            }
        });
    });
}

function openJobModal(job) {
    const modal = document.getElementById('jobDescModal');
    const modalTitle = document.getElementById('modalJobTitle');
    const modalContent = document.getElementById('modalJobContent');

    modalTitle.textContent = `${job.title} — ${job.company}`;

    // Structure description nicely (replace double newlines with paragraphs)
    const paragraphs = job.description.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('');

    modalContent.innerHTML = `
        <div class="job-meta-row" style="margin-bottom: 20px; font-size: 14px;">
            <span><i data-lucide="map-pin"></i> <strong>Location:</strong> ${escapeHtml(job.location)}</span>
            <span><i data-lucide="calendar"></i> <strong>Posted:</strong> ${job.postedAt}</span>
        </div>
        <h4>Job Description & Requirements</h4>
        <div class="job-desc-full" style="line-height: 1.7; max-height: 400px; overflow-y: auto; padding-right: 8px;">
            ${paragraphs}
        </div>
        ${job.url !== '#' ? `
            <div style="margin-top: 24px; text-align: right;">
                <a href="${job.url}" target="_blank" class="btn btn-primary">
                    <i data-lucide="external-link"></i> View Original Posting
                </a>
            </div>
        ` : ''}
    `;

    modal.style.display = 'flex';
    lucide.createIcons();
}

function setupSearchModal() {
    const modal = document.getElementById('jobDescModal');
    const closeBtn = document.getElementById('closeModalBtn');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Mock job generator database
function generateMockJobs(title, location) {
    const jobs = [];
    const industries = {
        analyst: ['Finance', 'Logistics', 'Retail Systems', 'E-commerce Platforms', 'Digital Operations'],
        developer: ['SaaS Core', 'Fintech Cloud Solutions', 'Healthcare AI Platform', 'Mobile Dev Studio'],
        manager: ['Product Growth', 'Strategic Operations', 'Business Intelligence Squad', 'Supply Chain Tech'],
        generic: ['Enterprise Services', 'Innovative Solutions Ltd', 'Global Ventures Group', 'Vanguard tech']
    };

    const titleLower = title.toLowerCase();
    let industrySet = industries.generic;
    if (titleLower.includes('analyst')) industrySet = industries.analyst;
    else if (titleLower.includes('developer') || titleLower.includes('engineer') || titleLower.includes('programmer')) industrySet = industries.developer;
    else if (titleLower.includes('manager') || titleLower.includes('lead') || titleLower.includes('director')) industrySet = industries.manager;

    const companies = ['Cognitive Systems Corp', 'NexaCorp International', 'Apex Analytics Group', 'CloudScale Technologies', 'BlueHorizon Solutions', 'Aventis Strategy Group'];
    const experiences = ['Associate', 'Senior', 'Lead', 'Principal', 'Junior'];

    for (let i = 0; i < 6; i++) {
        const expPrefix = experiences[i % experiences.length];
        const jobTitle = i === 2 ? title : `${expPrefix} ${title}`;
        const company = companies[i % companies.length];
        const industry = industrySet[i % industrySet.length];
        const jobLoc = location || 'Remote';
        const formattedLoc = i === 1 ? 'Remote' : jobLoc;
        const jobId = `mock-${i}-${Date.now()}`;

        let responsibilities = '';
        let requirements = '';

        if (titleLower.includes('analyst')) {
            responsibilities = `* Act as a key liaison between business units, software developers, and product owners to translate complex business needs into clear functional specifications.
* Conduct detailed process modeling, requirement gap analysis, and map workflows using BPMN or Visio standards.
* Perform SQL data extracts, write queries to analyze operational metrics, and build metrics dashboards in Power BI/Tableau.
* Support UAT testing processes, outline defect logs, and collaborate with QA engineers to resolve logic failures prior to release cycles.`;
            requirements = `* 3+ years experience as a Business Analyst, Systems Analyst, or Consultant in a tech or enterprise space.
* Proficient in querying database engines with SQL and developing data reports.
* Experience writing specifications documents, detailed user stories, and managing sprints within Agile boards.
* Excellent verbal, written, and presentation skills for executive client briefings.`;
        } else if (titleLower.includes('developer') || titleLower.includes('engineer') || titleLower.includes('programmer')) {
            responsibilities = `* Develop, test, and maintain robust web features using modern frameworks and cloud infrastructures.
* Build scalable RESTful backend microservices or responsive front-end UI workflows with high performance.
* Participate in pull request reviews, write unit/integration tests, and support CI/CD pipeline deployments.
* Partner with UI/UX designers and technical architects to build seamless digital user experiences.`;
            requirements = `* 2+ years of software development experience using modern JS frameworks (React, Vue) or backend environments (Node.js, Go, Python).
* Thorough familiarity with Git version control, REST APIs, and SQL or NoSQL database paradigms.
* Understanding of cloud ecosystems (AWS, GCP, or Azure) and DevOps principles.
* Strong algorithmic reasoning and clean coding habits.`;
        } else {
            responsibilities = `* Lead design, engineering, and delivery timelines for critical business initiatives.
* Drive collaboration across business stakeholders, product management, and engineering teams.
* Develop strategic roadmaps, prioritize product backlogs, and define core project metrics.
* Resolve operational bottlenecks, mitigate development risks, and present status updates to senior leadership.`;
            requirements = `* 4+ years of relevant experience in a leadership, management, or core technical role.
* Proven track record of running agile development squads or launching complex software assets.
* Solid analytical, organizational, and goal-tracking methodologies.
* Exceptional communication skills with cross-functional partners.`;
        }

        const fullDescription = `We are seeking a motivated ${jobTitle} to join our growing ${industry} division. In this role, you will work closely with creative professionals to build the next generation of solutions for our enterprise client portfolio.

Key Responsibilities:
${responsibilities}

Required Qualifications:
${requirements}

What We Offer:
* Competitive salary package with comprehensive health benefits.
* Flexible working schedule with hybrid/remote flexibility.
* Generous professional development budget.
* Collaborative culture built on trust and continuous learning.`;

        jobs.push({
            id: jobId,
            title: jobTitle,
            company: company,
            location: formattedLoc,
            description: fullDescription,
            postedAt: '2 days ago',
            logoText: company.charAt(0),
            url: '#'
        });
    }

    return jobs;
}

// ==========================================
// APPLICATION KIT COMPONENT LOGIC
// ==========================================
function setupKitActions() {
    const regenerateBtn = document.getElementById('regenerateKitBtn');
    const viewJobBtn = document.getElementById('viewJobDescBtn');
    const copyBtn = document.getElementById('copyTabContentBtn');
    const tabsNav = document.getElementById('kitTabsNav');

    // Register Tab Switch events
    tabsNav.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.tab-nav-btn');
        if (!tabBtn) return;

        const tabIndex = parseInt(tabBtn.getAttribute('data-tab'), 10);
        switchActiveKitTab(tabIndex);
    });

    // Regenerate kit
    regenerateBtn.addEventListener('click', () => {
        if (state.selectedJob) {
            triggerKitGeneration();
        }
    });

    // View Job Description details again
    viewJobBtn.addEventListener('click', () => {
        if (state.selectedJob) {
            openJobModal(state.selectedJob);
        }
    });

    // Copy action
    copyBtn.addEventListener('click', () => {
        copyActiveTabContent();
    });
}

function selectJobAndGenerate(job) {
    // 1. Verify resume is set
    if (!state.resumeText || state.resumeText.trim() === '') {
        showToast('Please enter and save your resume first!', 'error');
        navigateTo('resume');
        return;
    }

    // 2. Select Job
    state.selectedJob = job;

    // Clear cache for this job (forcing fresh generation)
    delete state.generatedKits[job.id];

    // 3. Navigate to Kit View
    navigateTo('kit');
}

function renderKitView() {
    const unselected = document.getElementById('kitUnselectedState');
    const activeState = document.getElementById('kitActiveState');
    const activeBadge = document.getElementById('kitActiveBadge');

    if (!state.selectedJob) {
        unselected.style.display = 'flex';
        activeState.style.display = 'none';
        activeBadge.style.display = 'none';
        return;
    }

    unselected.style.display = 'none';
    activeState.style.display = 'block';
    activeBadge.style.display = 'inline-block';

    // Set Job Header Details
    document.getElementById('kitJobTitle').textContent = state.selectedJob.title;
    document.getElementById('kitJobCompany').textContent = state.selectedJob.company;
    document.getElementById('kitJobLocation').textContent = state.selectedJob.location;

    const logoPlaceholder = document.getElementById('kitCompanyLogo');
    logoPlaceholder.textContent = state.selectedJob.logoText || state.selectedJob.company.charAt(0);

    // Check Cache
    if (state.generatedKits[state.selectedJob.id]) {
        // Already loaded
        document.getElementById('kitGenerationLoading').style.display = 'none';
        document.getElementById('kitWorkspace').style.display = 'block';
        switchActiveKitTab(state.activeTab); // display cache
    } else {
        // Trigger fresh generation
        triggerKitGeneration();
    }
}

async function triggerKitGeneration() {
    const loadingCard = document.getElementById('kitGenerationLoading');
    const workspace = document.getElementById('kitWorkspace');

    loadingCard.style.display = 'block';
    workspace.style.display = 'none';

    // Reset loading indicator list items
    const steps = [
        'Resume Bullet Rewriter', 'Cover Letter', 'Recruiter Cold Email',
        'Skills Gap Analysis', 'Interview Prep'
    ];

    steps.forEach((name, i) => {
        const stepEl = document.getElementById(`step-${i}`);
        if (stepEl) {
            stepEl.className = 'progress-step pending';
            const icon = stepEl.querySelector('i');
            if (icon) icon.setAttribute('data-lucide', 'circle');
        }
    });
    lucide.createIcons();

    // Prepare container in state
    state.generatedKits[state.selectedJob.id] = {};

    const prompts = [
        // Tab 0: Bullet Rewriter
        {
            system: "You are an expert executive resume writer and career strategist.",
            prompt: `Below is a candidate's resume and a target job description. 
            Identify the experience bullets in the resume. Rewrite at least 4-5 key bullet points to align exactly with the key responsibilities and technologies mentioned in the job description.
            Use the STAR methodology (Situation, Task, Action, Result) where possible, starting with strong, active resume verbs. 
            Return the output in Markdown. Structure it as a side-by-side comparison:
            
            ### original bullet
            > Original text
            
            ### Tailored Rewrite
            * Tailored text emphasizing direct job requirements and quantifiable results.
            
            Resume:
            ${state.resumeText}
            
            Job Description:
            ${state.selectedJob.description}`
        },
        // Tab 1: Cover Letter
        {
            system: "You are a professional copywriter specialized in compelling cover letters.",
            prompt: `Write a tailored, highly professional cover letter for the following job description using details from the candidate's resume.
            Ensure the cover letter is structured, business-formal, about 3-4 paragraphs, and addresses how the candidate's experience solves the company's requirements.
            Leave placeholders like [Date], [Hiring Manager Name] (if not known), [Recipient Address], and [Your Phone Number].
            Return the response in clear Markdown.
            
            Resume:
            ${state.resumeText}
            
            Job Description:
            ${state.selectedJob.description}`
        },
        // Tab 2: Cold Recruiter Email
        {
            system: "You are a job acquisition expert specializing in recruiter outreach.",
            prompt: `Create a short, punchy cold email (approx. 150 words) from the candidate to the hiring manager or recruiter for the job described below.
            It should feature an engaging subject line, a friendly hook mentioning the job title, a 2-sentence summary of the candidate's direct alignment, and a low-friction call-to-action for a 10-minute call.
            Format the output in Markdown.
            
            Resume:
            ${state.resumeText}
            
            Job Description:
            ${state.selectedJob.description}`
        },
        // Tab 3: Skills Gap Analysis
        {
            system: "You are an experienced technical career coach and skills evaluator.",
            prompt: `Analyze the candidate's resume against the requirements of the job description.
            Identify key skills (technical, industry-specific, and soft skills) required by the job.
            Compare them against the candidate's resume and build a Markdown table with columns:
            1. **Required Skill/Technology**
            2. **Match Status** (e.g., Proficient, Basic, Missing/Gap)
            3. **Actionable Recommendations** (e.g. specific open-source tools to learn, projects to build, online course subjects to close this gap)
            
            Below the table, provide a 3-sentence executive summary advising the candidate on their best strategy to qualify.
            
            Resume:
            ${state.resumeText}
            
            Job Description:
            ${state.selectedJob.description}`
        },
        // Tab 4: Interview Prep
        {
            system: "You are a professional HR director and technical interviewer.",
            prompt: `Generate exactly 10 interview preparation questions tailored for the job description.
            Include 5 behavioral questions (using the STAR format focus) and 5 technical/role-specific questions.
            For each question, provide:
            1. The interview question.
            2. The rationale of what the interviewer is looking for.
            3. A customized candidate answer draft based on the candidate's resume details.
            
            Format the output beautifully in Markdown.
            
            Resume:
            ${state.resumeText}
            
            Job Description:
            ${state.selectedJob.description}`
        },
    ];

    // Helper: sleep for ms milliseconds
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper: call Gemini with retry on quota errors
    async function callWithRetry(prompt, system, maxRetries = 3) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await callGeminiAPI(prompt, system);
            } catch (error) {
                const isQuota = error.message && error.message.toLowerCase().includes('quota');
                // Extract retry delay from error message if present
                const retryMatch = error.message && error.message.match(/retry in ([\d.]+)s/i);
                const retryDelay = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) * 1000 : 15000;

                if (isQuota && attempt < maxRetries - 1) {
                    console.log(`Quota hit on tab, waiting ${retryDelay / 1000}s before retry...`);
                    await sleep(retryDelay + 2000); // extra 2s buffer
                } else {
                    throw error;
                }
            }
        }
    }

    // Sequential generation with 2s delay between calls to avoid quota
    for (let index = 0; index < prompts.length; index++) {
        const p = prompts[index];
        const stepEl = document.getElementById(`step-${index}`);

        // Mark step as Working
        if (stepEl) {
            stepEl.className = 'progress-step working';
            const icon = stepEl.querySelector('i');
            if (icon) icon.setAttribute('data-lucide', 'loader-2');
            lucide.createIcons();
        }

        try {
            const result = await callWithRetry(p.prompt, p.system);

            // Mark step as Completed
            if (stepEl) {
                stepEl.className = 'progress-step done';
                const icon = stepEl.querySelector('i');
                if (icon) icon.setAttribute('data-lucide', 'check-circle-2');
                lucide.createIcons();
            }

            // Save to Cache
            state.generatedKits[state.selectedJob.id][index] = result;

            // Small delay between calls to avoid hitting rate limits
            if (index < prompts.length - 1) await sleep(3000);

        } catch (error) {
            console.error(`Error generating tab ${index}:`, error);

            const failText = `### Generation Failed\n\nFailed to connect to the Gemini API. Please check your API key in the Settings tab.\n\nError details: ${error.message}`;
            state.generatedKits[state.selectedJob.id][index] = failText;

            if (stepEl) {
                stepEl.className = 'progress-step done';
                const icon = stepEl.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'alert-circle');
                    icon.style.color = 'var(--accent-red)';
                }
                lucide.createIcons();
            }
        }
    }

    // Increment global kits count
    state.kitsCount++;
    localStorage.setItem('smart_apply_kits_count', state.kitsCount);

    // Hide loader, show workspace
    loadingCard.style.display = 'none';
    workspace.style.display = 'block';

    // Show initial tab
    switchActiveKitTab(0);
    updateDashboardStats();
    showToast('Application Kit successfully generated!', 'success');
}

async function callGeminiAPI(prompt, systemInstruction = '') {
    if (!state.geminiApiKey) {
        throw new Error('Gemini API key is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${state.geminiApiKey}`;

    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ]
    };

    if (systemInstruction) {
        requestBody.systemInstruction = {
            parts: [{ text: systemInstruction }]
        };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status}`;
        throw new Error(errMsg);
    }

    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
        throw new Error('Empty response received from Gemini model.');
    }

    return generatedText;
}

function switchActiveKitTab(index) {
    state.activeTab = index;

    // Toggle active state in HTML buttons
    const tabBtns = document.querySelectorAll('.tab-nav-btn');
    tabBtns.forEach(btn => {
        if (parseInt(btn.getAttribute('data-tab'), 10) === index) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Change Content
    const tabMetaTitle = document.getElementById('tabMetaTitle');
    const tabBody = document.getElementById('renderedTabBody');

    const tabTitles = [
        'Resume Bullet Rewriter', 'Tailored Cover Letter', 'Cold Recruiter Email Outreach',
        'Skills Gap Analysis', 'Interview Prep & Answers'
    ];

    tabMetaTitle.textContent = tabTitles[index] || 'Tailored Content';

    const jobId = state.selectedJob?.id;
    const content = state.generatedKits[jobId]?.[index] || '_Content not generated or missing._';

    // Set markdown parsing content
    tabBody.innerHTML = marked.parse(content);

    // Smooth scroll tab body to top
    document.getElementById('tab-panel-content').scrollTop = 0;
}

function copyActiveTabContent() {
    const jobId = state.selectedJob?.id;
    const contentText = state.generatedKits[jobId]?.[state.activeTab];

    if (!contentText) {
        showToast('No content to copy!', 'error');
        return;
    }

    navigator.clipboard.writeText(contentText).then(() => {
        const copyBtnText = document.getElementById('copyBtnText');
        const copyIcon = document.getElementById('copyIcon');

        copyBtnText.textContent = 'Copied!';
        copyIcon.setAttribute('data-lucide', 'check');
        lucide.createIcons();

        showToast('Copied content to clipboard!', 'success');

        setTimeout(() => {
            copyBtnText.textContent = 'Copy Tab Content';
            copyIcon.setAttribute('data-lucide', 'copy');
            lucide.createIcons();
        }, 2000);
    }).catch(err => {
        console.error('Clipboard copy failed:', err);
        showToast('Failed to copy. Please select and copy manually.', 'error');
    });
}

// ==========================================
// SETTINGS LOGIC
// ==========================================
function setupSettingsActions() {
    const saveGeminiBtn = document.getElementById('toggleGeminiKeyVisibility');
    const saveJsearchBtn = document.getElementById('toggleJsearchKeyVisibility');
    const geminiInput = document.getElementById('geminiApiKeyInput');
    const jsearchInput = document.getElementById('jsearchApiKeyInput');
    const clearBtn = document.getElementById('clearAllSessionDataBtn');

    // Toggle password fields visibility
    saveGeminiBtn.addEventListener('click', () => {
        toggleFieldType(geminiInput, saveGeminiBtn);
    });

    saveJsearchBtn.addEventListener('click', () => {
        toggleFieldType(jsearchInput, saveJsearchBtn);
    });

    // Save inputs directly on change
    geminiInput.addEventListener('change', () => {
        const val = geminiInput.value.trim();
        state.geminiApiKey = val;
        localStorage.setItem('smart_apply_gemini_key', val);
        showToast('Gemini API key updated.', 'info');
        updateGeminiIndicatorState();
    });

    jsearchInput.addEventListener('change', () => {
        const val = jsearchInput.value.trim();
        state.jsearchApiKey = val;
        localStorage.setItem('smart_apply_jsearch_key', val);
        showToast('JSearch API key updated.', 'info');
        renderJSearchIndicatorState();
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all your saved resume and API configuration settings? This will reset the app.')) {
            localStorage.clear();

            // Reset state
            state.resumeText = '';
            state.resumeParsed = null;
            state.searchTitle = '';
            state.searchLocation = '';
            state.searchResults = [];
            state.selectedJob = null;
            state.kitsCount = 0;
            state.generatedKits = {};
            state.activeTab = 0;
            state.geminiApiKey = '';
            state.jsearchApiKey = '';

            // Reset inputs
            geminiInput.value = state.geminiApiKey;
            jsearchInput.value = '';
            document.getElementById('resumeInput').value = '';

            // Re-render
            renderResumeState();
            renderJSearchIndicatorState();
            updateGeminiIndicatorState();
            updateDashboardStats();
            navigateTo('dashboard');

            showToast('All storage data reset successfully!', 'success');
        }
    });
}

function toggleFieldType(inputEl, btnEl) {
    const isPass = inputEl.type === 'password';
    inputEl.type = isPass ? 'text' : 'password';

    const icon = btnEl.querySelector('i');
    icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
    lucide.createIcons();
}

function renderJSearchIndicatorState() {
    const dot = document.getElementById('jsearchDot');
    const label = document.getElementById('jsearchStatusText');
    const widgetDesc = document.getElementById('statusDescText');

    if (state.jsearchApiKey && state.jsearchApiKey.trim() !== '') {
        dot.className = 'dot green';
        label.textContent = 'JSearch: Active';
    } else {
        dot.className = 'dot orange';
        label.textContent = 'JSearch: Mock Mode';
    }

    if (state.geminiApiKey === '') {
        widgetDesc.textContent = 'Using default key';
    } else if (state.geminiApiKey) {
        widgetDesc.textContent = 'Using custom key';
    } else {
        widgetDesc.textContent = 'API key missing';
    }
}

function updateGeminiIndicatorState() {
    const widgetDesc = document.getElementById('statusDescText');
    const indicator = document.getElementById('geminiIndicator');

    if (state.geminiApiKey === '') {
        widgetDesc.textContent = 'Using default key';
        indicator.innerHTML = '<span class="dot green"></span> Gemini v2.0 Flash';
    } else if (state.geminiApiKey) {
        widgetDesc.textContent = 'Using custom key';
        indicator.innerHTML = '<span class="dot green"></span> Custom Gemini Flash';
    } else {
        widgetDesc.textContent = 'API key missing';
        indicator.innerHTML = '<span class="dot red"></span> Gemini Key Missing';
    }
}

// ==========================================
// TOAST & DASHBOARD UTILITIES
// ==========================================
function updateDashboardStats() {
    const rStatus = document.getElementById('dashResumeStatus');
    const rSub = document.getElementById('dashResumeSub');
    const jStatus = document.getElementById('dashSelectedJob');
    const jSub = document.getElementById('dashSelectedJobSub');
    const countText = document.getElementById('dashKitsCount');

    // Resume Stats
    if (state.resumeText) {
        rStatus.textContent = 'Completed';
        rStatus.style.color = 'var(--accent-green)';
        rSub.textContent = `${state.resumeParsed.wordCount} words configured.`;
    } else {
        rStatus.textContent = 'Not Configured';
        rStatus.style.color = 'var(--accent-red)';
        rSub.textContent = 'Paste your resume to begin tailoring.';
    }

    // Selected Job Stats
    if (state.selectedJob) {
        jStatus.textContent = state.selectedJob.title;
        jStatus.style.color = 'var(--accent-blue)';
        jSub.textContent = `Company: ${state.selectedJob.company}`;
    } else {
        jStatus.textContent = 'No Job Selected';
        jStatus.style.color = 'var(--color-muted)';
        jSub.textContent = 'Select a job from Search to load kit.';
    }

    // Count
    countText.textContent = state.kitsCount;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-triangle';

    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Trigger exit animation
    setTimeout(() => {
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// HTML Escaping Utility
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
