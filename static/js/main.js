// Global State
let releaseNotes = [];
let filteredNotes = [];
let currentFilter = 'all';
let currentSearch = '';

// Tweet Modal State
let selectedNote = null;
let includeLink = true;
let includeHashtags = true;

// DOM Elements
const btnRefresh = document.getElementById('btn-refresh');
const refreshIcon = document.getElementById('refresh-icon');
const cacheIndicator = document.getElementById('cache-indicator');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const notesList = document.getElementById('notes-list');

// Stat values
const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');
const statBreaking = document.getElementById('stat-breaking');
const statIssues = document.getElementById('stat-issues');

// Search & Filters
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const filterTagsContainer = document.getElementById('filter-tags-container');
const btnResetFilters = document.getElementById('btn-reset-filters');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelTweet = document.getElementById('btn-cancel-tweet');
const btnSubmitTweet = document.getElementById('btn-submit-tweet');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCountSpan = document.getElementById('char-count');
const charProgressCircle = document.getElementById('char-progress');
const toggleLinkBtn = document.getElementById('toggle-link');
const toggleHashtagsBtn = document.getElementById('toggle-hashtags');
const tweetSourceBadge = document.getElementById('tweet-source-badge');
const tweetSourceDate = document.getElementById('tweet-source-date');
const tweetSourceText = document.getElementById('tweet-source-text');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes(false);
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    btnRefresh.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Reset filters button from empty state
    btnResetFilters.addEventListener('click', resetFilters);

    // Search input
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        if (currentSearch) {
            searchClear.classList.remove('hidden');
        } else {
            searchClear.classList.add('hidden');
        }
        renderReleaseNotes();
    });

    // Clear search button
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        searchClear.classList.add('hidden');
        renderReleaseNotes();
    });

    // Category filter tags
    filterTagsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tag')) {
            // Remove active class from all
            document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
            // Add active class to clicked tag
            e.target.classList.add('active');
            
            currentFilter = e.target.getAttribute('data-type');
            renderReleaseNotes();
        }
    });

    // Click on Stats cards to filter
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => {
            const filterType = card.getAttribute('data-filter');
            
            // Map card filter names to badge tag names
            let mappedFilter = 'all';
            if (filterType === 'feature') mappedFilter = 'Feature';
            if (filterType === 'breaking') mappedFilter = 'Breaking';
            if (filterType === 'issue') mappedFilter = 'Issue';

            // Find corresponding tag
            const targetTag = Array.from(document.querySelectorAll('.filter-tag'))
                .find(tag => tag.getAttribute('data-type') === mappedFilter);
            
            if (targetTag) {
                targetTag.click();
                // Smooth scroll down to controls if screen is small
                window.scrollTo({
                    top: document.querySelector('.controls-panel').offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Modal Close
    btnCloseModal.addEventListener('click', closeTweetModal);
    btnCancelTweet.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    // Modal Toggles (Link and Hashtags)
    toggleLinkBtn.addEventListener('click', () => {
        includeLink = !includeLink;
        toggleLinkBtn.classList.toggle('active', includeLink);
        updateTweetFromToggles();
    });

    toggleHashtagsBtn.addEventListener('click', () => {
        includeHashtags = !includeHashtags;
        toggleHashtagsBtn.classList.toggle('active', includeHashtags);
        updateTweetFromToggles();
    });

    // Textarea changes
    tweetTextarea.addEventListener('input', () => {
        updateCharCounter();
    });

    // Submit Tweet
    btnSubmitTweet.addEventListener('click', submitTweet);
}

// Fetch Release Notes from API
function fetchReleaseNotes(forceRefresh = false) {
    showLoading(true);
    
    let url = '/api/release-notes';
    if (forceRefresh) {
        url += '?refresh=true';
    }

    refreshIcon.classList.add('spinning');
    btnRefresh.disabled = true;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not OK');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                releaseNotes = data.entries;
                
                // Show cache badge if applicable
                if (data.from_cache) {
                    cacheIndicator.classList.remove('hidden');
                } else {
                    cacheIndicator.classList.add('hidden');
                    if (forceRefresh) {
                        showToast("Release notes updated successfully!", "success");
                    }
                }
                
                updateStats();
                renderReleaseNotes();
            } else {
                throw new Error(data.error || 'Server error occurred');
            }
        })
        .catch(err => {
            console.error('Error fetching release notes:', err);
            showToast('Failed to load release notes: ' + err.message, 'error');
            notesList.innerHTML = `<div class="state-container"><div class="empty-icon"><i class="fa-solid fa-circle-exclamation" style="color:var(--color-breaking)"></i></div><h3>Error Loading Feed</h3><p>${err.message}</p><button onclick="fetchReleaseNotes(true)" class="btn btn-secondary">Try Again</button></div>`;
        })
        .finally(() => {
            showLoading(false);
            refreshIcon.classList.remove('spinning');
            btnRefresh.disabled = false;
        });
}

// Show/Hide loading state
function showLoading(isLoading) {
    if (isLoading) {
        loadingState.classList.remove('hidden');
        notesList.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
        notesList.classList.remove('hidden');
    }
}

// Update Dashboard Statistics Cards
function updateStats() {
    let total = 0;
    let features = 0;
    let breaking = 0;
    let issues = 0;

    releaseNotes.forEach(entry => {
        entry.items.forEach(item => {
            total++;
            const type = item.type.toLowerCase();
            if (type.includes('feature')) features++;
            if (type.includes('breaking')) breaking++;
            if (type.includes('issue')) issues++;
        });
    });

    statTotal.textContent = total;
    statFeatures.textContent = features;
    statBreaking.textContent = breaking;
    statIssues.textContent = issues;
}

// Reset all search and filter conditions
function resetFilters() {
    searchInput.value = '';
    currentSearch = '';
    searchClear.classList.add('hidden');
    
    document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
    document.querySelector('.filter-tag[data-type="all"]').classList.add('active');
    currentFilter = 'all';
    
    renderReleaseNotes();
}

// Helper to strip HTML tags for plain text search or tweet text
function stripHtml(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// Render Release notes list based on current filters and search keyword
function renderReleaseNotes() {
    notesList.innerHTML = '';
    let matchesFound = 0;

    releaseNotes.forEach(entry => {
        // Filter items in this entry
        const matchedItems = entry.items.filter(item => {
            // Check category filter
            const matchesFilter = (currentFilter === 'all') || (item.type.toLowerCase() === currentFilter.toLowerCase());
            
            // Check text search
            const cleanContent = stripHtml(item.content).toLowerCase();
            const cleanType = item.type.toLowerCase();
            const cleanDate = entry.date.toLowerCase();
            
            const matchesSearch = !currentSearch || 
                                  cleanContent.includes(currentSearch) || 
                                  cleanType.includes(currentSearch) ||
                                  cleanDate.includes(currentSearch);
            
            return matchesFilter && matchesSearch;
        });

        if (matchedItems.length > 0) {
            matchesFound += matchedItems.length;

            // Create Date Card Container
            const dateCard = document.createElement('div');
            dateCard.className = 'date-section';
            
            // Date Header
            const headerHtml = `
                <div class="date-header">
                    <div class="date-title">
                        <i class="fa-regular fa-calendar"></i>
                        <span>${entry.date}</span>
                    </div>
                    ${entry.link ? `<a href="${entry.link}" target="_blank" rel="noopener noreferrer" class="date-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> Docs</a>` : ''}
                </div>
            `;
            dateCard.innerHTML = headerHtml;

            // Update Items List Container
            const itemsList = document.createElement('div');
            itemsList.className = 'update-items-container';

            matchedItems.forEach(item => {
                const updateItem = document.createElement('div');
                updateItem.className = 'update-item';

                // Map badge class
                let badgeClass = 'badge-update';
                const lowerType = item.type.toLowerCase();
                if (lowerType.includes('feature')) badgeClass = 'badge-feature';
                else if (lowerType.includes('announcement')) badgeClass = 'badge-announcement';
                else if (lowerType.includes('breaking')) badgeClass = 'badge-breaking';
                else if (lowerType.includes('issue')) badgeClass = 'badge-issue';
                else if (lowerType.includes('change')) badgeClass = 'badge-change';

                // Strip HTML for tooltips/attributes
                const plainText = stripHtml(item.content);

                updateItem.innerHTML = `
                    <div class="update-header">
                        <span class="badge ${badgeClass}">${item.type}</span>
                        <button class="btn-tweet-trigger" title="Share this update on X / Twitter">
                            <i class="fa-brands fa-x-twitter"></i> Tweet
                        </button>
                    </div>
                    <div class="update-body">
                        ${item.content}
                    </div>
                `;

                // Tweet trigger event
                const tweetBtn = updateItem.querySelector('.btn-tweet-trigger');
                tweetBtn.addEventListener('click', () => {
                    openTweetModal(entry.date, entry.link, item.content, item.type);
                });

                itemsList.appendChild(updateItem);
            });

            dateCard.appendChild(itemsList);
            notesList.appendChild(dateCard);
        }
    });

    // Check if matches were found
    if (matchesFound === 0) {
        emptyState.classList.remove('hidden');
        notesList.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        notesList.classList.remove('hidden');
    }
}

// Open Tweet Composer Modal
function openTweetModal(date, link, content, type) {
    selectedNote = { date, link, content, type };
    
    // Set preview details
    tweetSourceBadge.textContent = type;
    
    // Apply badge styles
    tweetSourceBadge.className = 'badge';
    let badgeClass = 'badge-update';
    const lowerType = type.toLowerCase();
    if (lowerType.includes('feature')) badgeClass = 'badge-feature';
    else if (lowerType.includes('announcement')) badgeClass = 'badge-announcement';
    else if (lowerType.includes('breaking')) badgeClass = 'badge-breaking';
    else if (lowerType.includes('issue')) badgeClass = 'badge-issue';
    else if (lowerType.includes('change')) badgeClass = 'badge-change';
    tweetSourceBadge.classList.add(badgeClass);

    tweetSourceDate.textContent = date;
    tweetSourceText.textContent = stripHtml(content);

    // Initial toggle states
    includeLink = true;
    includeHashtags = true;
    toggleLinkBtn.classList.add('active');
    toggleHashtagsBtn.classList.add('active');

    // Generate content
    tweetTextarea.value = generateTweetContent();
    updateCharCounter();

    // Show modal
    tweetModal.classList.remove('hidden');
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Auto-focus textarea
    setTimeout(() => {
        tweetTextarea.focus();
        tweetTextarea.setSelectionRange(0, 0); // Put cursor at start
    }, 100);
}

// Close Tweet Composer Modal
function closeTweetModal() {
    tweetModal.classList.add('hidden');
    document.body.style.overflow = '';
    selectedNote = null;
}

// Generate the Tweet text based on states
function generateTweetContent() {
    if (!selectedNote) return "";

    const date = selectedNote.date;
    const type = selectedNote.type;
    const docLink = selectedNote.link;
    const rawText = stripHtml(selectedNote.content);
    
    const header = `BigQuery ${type} (${date}): `;
    const tags = includeHashtags ? " #BigQuery #GoogleCloud" : "";
    
    // Character Limit Math for smart truncation:
    // Twitter URLs take exactly 23 chars. Tags take tags.length. Header takes header.length.
    const urlReserved = includeLink && docLink ? 23 : 0;
    const tagsLength = tags.length;
    const headerLength = header.length;
    
    // Max characters we can allocate to the actual content snippet:
    // 280 (Twitter limit) - headerLength - tagsLength - urlReserved - extra whitespace
    const extraSpacing = (includeLink ? 2 : 0) + (includeHashtags ? 1 : 0);
    const maxDescriptionLength = 280 - headerLength - tagsLength - urlReserved - extraSpacing;
    
    let description = rawText;
    if (description.length > maxDescriptionLength) {
        description = description.substring(0, maxDescriptionLength - 3) + "...";
    }
    
    let tweet = `${header}${description}`;
    if (includeLink && docLink) {
        tweet += `\n\n${docLink}`;
    }
    if (includeHashtags) {
        tweet += `\n${tags.trim()}`;
    }
    
    return tweet;
}

// Re-generate tweet when toggling tags/link
function updateTweetFromToggles() {
    // Only re-generate if we haven't drastically edited the content or if we want to reset
    // For convenience, we overwrite the composer
    tweetTextarea.value = generateTweetContent();
    updateCharCounter();
}

// Calculate Twitter length (treating any URL as 23 characters)
function calculateTwitterLength(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    // Replace all URLs with a 23 character dummy string
    const processedText = text.replace(urlRegex, "12345678901234567890123");
    return processedText.length;
}

// Update Circular character counter & limits
function updateCharCounter() {
    const text = tweetTextarea.value;
    const tweetLen = calculateTwitterLength(text);
    const remaining = 280 - tweetLen;
    
    charCountSpan.textContent = remaining;

    // Handle warning styling
    charCountSpan.className = '';
    if (remaining <= 20 && remaining >= 0) {
        charCountSpan.classList.add('warning');
    } else if (remaining < 0) {
        charCountSpan.classList.add('danger');
    }

    // Enable/Disable submit button
    if (tweetLen === 0 || remaining < 0) {
        btnSubmitTweet.classList.add('disabled');
        btnSubmitTweet.disabled = true;
    } else {
        btnSubmitTweet.classList.remove('disabled');
        btnSubmitTweet.disabled = false;
    }

    // Progress Ring SVG Update
    const circle = charProgressCircle;
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    const percentage = Math.min(tweetLen / 280, 1);
    const offset = circumference - (percentage * circumference);
    circle.style.strokeDashoffset = offset;

    // Color progress ring accordingly
    if (remaining < 0) {
        circle.style.stroke = 'var(--color-breaking)';
    } else if (remaining <= 20) {
        circle.style.stroke = 'var(--color-issue)';
    } else {
        circle.style.stroke = 'var(--color-primary)';
    }
}

// Launch Twitter intent and close modal
function submitTweet() {
    const text = tweetTextarea.value;
    const tweetLen = calculateTwitterLength(text);
    
    if (tweetLen === 0 || tweetLen > 280) {
        showToast("Tweet length must be between 1 and 280 characters.", "error");
        return;
    }

    // Twitter share intent URL
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    // Open in new tab
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    
    closeTweetModal();
    showToast("Opening X / Twitter sharing page!", "success");
}

// Toast Notifications helper
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    // Reset toast style
    toast.className = 'toast';
    const icon = toast.querySelector('.toast-icon');
    
    if (type === 'error') {
        toast.style.borderLeftColor = 'var(--color-breaking)';
        toast.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        icon.className = 'fa-solid fa-circle-exclamation toast-icon';
        icon.style.color = 'var(--color-breaking)';
    } else {
        toast.style.borderLeftColor = 'var(--color-feature)';
        toast.style.borderColor = 'var(--border-feature)';
        icon.className = 'fa-solid fa-circle-check toast-icon';
        icon.style.color = 'var(--color-feature)';
    }

    toast.classList.remove('hidden');
    
    // Hide toast after 4 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}
