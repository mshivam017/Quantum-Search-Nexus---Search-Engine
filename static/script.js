document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    const searchTypeButtons = document.querySelectorAll('.search-type-btn');
    const loadingIndicator = document.getElementById('loading');

    let currentSearchType = 'web';

    // Toggle search type buttons
    searchTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            searchTypeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update current search type
            currentSearchType = button.getAttribute('data-type');
            
            // Clear previous results
            searchResultsContainer.innerHTML = '';
        });
    });

    // Debounce function to limit API calls
    function debounce(func, delay) {
        let timeoutId;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }

    // Perform search
    async function performSearch(query, searchType) {
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        searchResultsContainer.innerHTML = '';

        try {
            const params = new URLSearchParams({
                q: query,
                type: searchType,
                num: 10
            });

            const response = await fetch(`/search?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            // Hide loading indicator
            loadingIndicator.style.display = 'none';

            // Directly use data as results are returned without a 'status' wrapper
            displayResults(data, searchType);
        } catch (error) {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            displayError('Network error. Please try again.');
            console.error('Search error:', error);
        }
    }

    // Display search results
    function displayResults(results, searchType) {
        searchResultsContainer.innerHTML = ''; // Clear previous results

        if (results.length === 0) {
            searchResultsContainer.innerHTML = '<p>No results found.</p>';
            return;
        }

        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.classList.add('result-card');

            switch(searchType) {
                case 'web':
                    resultElement.innerHTML = `
                        <div class="result-title">
                            <a href="${result.link}" target="_blank">${result.title}</a>
                        </div>
                        <div class="result-url">
                            <span>${result.metadata?.displayLink || result.link}</span>
                        </div>
                        <div class="result-snippet">
                            ${result.snippet}
                        </div>
                        <div class="result-meta">
                            <div class="result-source">${result.source}</div>
                            ${result.metadata?.pagemap?.cse_thumbnail ? 
                                `<div class="result-thumbnail">
                                    <img src="${result.metadata.pagemap.cse_thumbnail[0].src}" alt="Thumbnail">
                                </div>` : ''
                            }
                        </div>
                    `;
                    break;

                case 'images':
                    resultElement.innerHTML = `
                        <div class="image-result">
                            <img src="${result.image?.thumbnailLink || result.link}" alt="${result.title}">
                            <div class="image-overlay">
                                <div class="image-title">${result.title}</div>
                                <div class="image-meta">
                                    <span>Size: ${result.image?.width || 'N/A'}x${result.image?.height || 'N/A'}</span>
                                    <span>Source: ${result.metadata?.displayLink || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                    resultElement.classList.add('image-result-container');
                    break;

                case 'news':
                    resultElement.innerHTML = `
                        <div class="news-result">
                            <div class="news-thumbnail">
                                ${result.metadata?.pagemap?.cse_thumbnail ? 
                                    `<img src="${result.metadata.pagemap.cse_thumbnail[0].src}" alt="News Thumbnail">` : 
                                    '<div class="placeholder-thumbnail"></div>'
                                }
                            </div>
                            <div class="news-content">
                                <h3><a href="${result.link}" target="_blank">${result.title}</a></h3>
                                <p>${result.snippet}</p>
                                <div class="news-source">${result.metadata?.displayLink || result.source}</div>
                            </div>
                        </div>
                    `;
                    break;
            }

            searchResultsContainer.appendChild(resultElement);
        });
    }

    // Display error message
    function displayError(message) {
        searchResultsContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }

    // Search input event listener with debounce
    searchInput.addEventListener('input', debounce(function() {
        const query = this.value.trim();
        if (query.length > 2) {
            performSearch(query, currentSearchType);
        } else {
            searchResultsContainer.innerHTML = '';
        }
    }, 500));
});
