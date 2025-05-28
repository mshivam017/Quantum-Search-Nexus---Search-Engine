
let currentSearchType = 'web';

document.querySelectorAll('.search-type-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.search-type-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentSearchType = this.getAttribute('data-type');
        document.getElementById('search-results').innerHTML = '';
    });
});

function performSearch() {
    const query = document.getElementById('search-input').value;
    const resultsContainer = document.getElementById('search-results');
    const loadingIndicator = document.getElementById('loading');

    if (!query.trim()) {
        alert('Please enter a search query');
        return;
    }

    resultsContainer.innerHTML = '';
    loadingIndicator.style.display = 'block';

    fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `query=${encodeURIComponent(query)}&type=${currentSearchType}`
    })
    .then(response => response.json())
    .then(data => {
        loadingIndicator.style.display = 'none';
        
        if (data.status === 'success') {
            displayResults(data.results);
        } else {
            resultsContainer.innerHTML = `
                <div class="result-card" style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🌌</div>
                    <h3 style="color: #00ffff; font-size: 1.5rem; margin-bottom: 1rem;">
                        ${data.message || 'No quantum signals detected'}
                    </h3>
                    <p style="color: rgba(255,255,255,0.7);">
                        Try adjusting your search parameters to explore different dimensions
                    </p>
                </div>
            `;
        }
    })
    .catch(error => {
        loadingIndicator.style.display = 'none';
        resultsContainer.innerHTML = `
            <div class="result-card" style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h3 style="color: #ff69b4; font-size: 1.5rem; margin-bottom: 1rem;">
                    Network Error
                </h3>
                <p style="color: rgba(255,255,255,0.7);">${error.message}</p>
            </div>
        `;
    });
}

function displayResults(results) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="result-card" style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🌌</div>
                <h3 style="color: #00ffff; font-size: 1.5rem; margin-bottom: 1rem;">
                    No Results Found
                </h3>
                <p style="color: rgba(255,255,255,0.7);">
                    Try different search terms or explore another dimension
                </p>
            </div>
        `;
        return;
    }

    results.forEach(result => {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';

        if (currentSearchType === 'images') {
            resultCard.innerHTML = `
                <div class="image-result">
                    <img src="${result.image_url}" alt="${result.title}">
                    <div class="image-overlay">
                        <h3 class="image-title">${result.title || 'Untitled Image'}</h3>
                        <div class="image-meta">
                            <span>${result.dimensions || 'Unknown dimensions'}</span>
                            <span>${result.source || 'Unknown source'}</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (currentSearchType === 'news') {
            resultCard.innerHTML = `
                <div class="news-result">
                    <div class="news-thumbnail">
                        <img src="${result.thumbnail || '/api/placeholder/120/120'}" alt="${result.title}">
                    </div>
                    <div class="news-content">
                        <span class="news-source">${result.source}</span>
                        <h3 class="result-title">
                            <a href="${result.link}" target="_blank">${result.title}</a>
                        </h3>
                        <p resultCard.innerHTML = 
                <div class="news-result">
                    <div class="news-thumbnail">
                        <img src="${result.thumbnail || '/api/placeholder/120/120'}" alt="${result.title}">
                    </div>
                    <div class="news-content">
                        <span class="news-source">${result.source}</span>
                        <h3 class="result-title">
                            <a href="${result.link}" target="_blank">${result.title}</a>
                        </h3>
                        <p class="result-snippet">${result.snippet}</p>
                        <div class="result-meta">
                            <span class="result-date">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                                </svg>
                                ${result.date}
                            </span>
                            <span class="result-category">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/>
                                    <circle cx="5" cy="19" r="1"/>
                                </svg>
                                ${result.category}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Web search results
            resultCard.innerHTML = `
                <h3 class="result-title">
                    <a href="${result.link}" target="_blank">${result.title}</a>
                </h3>
                <div class="result-url">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    ${extractDomain(result.link)}
                </div>
                <p class="result-snippet">${result.snippet}</p>
                <div class="result-meta">
                    <span class="result-date">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        ${result.date || 'No date available'}
                    </span>
                    <span class="result-category">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        ${result.category || 'General'}
                    </span>
                </div>
            `;
        }

        resultsContainer.appendChild(resultCard);
    });
}

function extractDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
}

document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});