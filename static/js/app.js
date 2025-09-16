// Store rounds in local storage
let rounds = JSON.parse(localStorage.getItem('pdgaRounds')) || [];

// Store outlier IDs and time-excluded IDs globally so they can be shared between functions
let globalOutlierIds = new Set();
let globalTimeExcludedIds = new Set();

// Dark mode functionality
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeIcon = document.getElementById('darkModeIcon');
const body = document.body;

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    darkModeIcon.textContent = '☀️';
}

// DOM Elements
const roundForm = document.getElementById('roundForm');
const roundsList = document.getElementById('roundsList');
const roundCount = document.getElementById('roundCount');
const currentRating = document.getElementById('currentRating');
const importBtn = document.getElementById('importBtn');
const importStatus = document.getElementById('importStatus');
const pdgaNumberInput = document.getElementById('pdgaNumber');
const clearAllBtn = document.getElementById('clearAllBtn');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    updateRoundsList();
    initializeDarkMode();
});
roundForm.addEventListener('submit', addRound);
importBtn.addEventListener('click', importFromPDGA);
darkModeToggle.addEventListener('click', toggleDarkMode);
clearAllBtn.addEventListener('click', clearAllRounds);

// Add a new round
function addRound(e) {
    e.preventDefault();
    
    const course = document.getElementById('course').value.trim();
    const date = document.getElementById('date').value;
    const tier = document.getElementById('tier').value;
    const division = document.getElementById('division').value;
    const score = parseInt(document.getElementById('score').value);
    const rating = parseInt(document.getElementById('rating').value);
    
    if (!course || !date || isNaN(score) || isNaN(rating)) {
        alert('Please fill in all required fields with valid values');
        return;
    }
    
    // Create round object matching PDGA import structure
    const round = {
        id: Date.now(),
        course: course,
        tier: tier,
        date: date,
        division: division,
        round: '1', // Default to round 1 for manually added rounds
        score: score,
        rating: rating,
        evaluated: 'Yes',
        included: 'Yes'
    };
    
    // Check for duplicates using the same logic as import
    const isDuplicate = rounds.some(r => 
        r.course === round.course && 
        r.date === round.date && 
        r.score === round.score && 
        r.rating === round.rating &&
        r.division === round.division &&
        r.tier === round.tier &&
        r.round === round.round
    );
    
    if (isDuplicate) {
        alert('This round already exists in your data!');
        return;
    }
    
    rounds.unshift(round);
    saveRounds();
    
    // Recalculate PDGA rating and update outlier status for all rounds
    updateStats();
    updateRoundsList();
    
    roundForm.reset();
    
    // Set default date to today for next entry
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    
    console.log('Round added successfully. Rating recalculated.');
}

// Save rounds to local storage
function saveRounds() {
    localStorage.setItem('pdgaRounds', JSON.stringify(rounds));
}

// Determine outlier status for visual highlighting
function determineOutlierStatus() {
    const includedRounds = rounds.filter(round => round.included === 'Yes' || round.included === undefined);
    if (includedRounds.length === 0) return new Set();
    
    const sortedRounds = [...includedRounds].sort((a, b) => new Date(b.date) - new Date(a.date));
    const mostRecentDate = sortedRounds[0].date;
    
    // Get eligible rounds (same logic as rating calculation)
    const twelveMonthsAgo = getDateTwelveMonthsAgo(mostRecentDate);
    let eligibleRounds = sortedRounds.filter(round => round.date >= twelveMonthsAgo);
    
    if (eligibleRounds.length < 8) {
        const twentyFourMonthsAgo = getDateTwelveMonthsAgo(twelveMonthsAgo);
        eligibleRounds = sortedRounds.filter(round => round.date >= twentyFourMonthsAgo);
    }
    
    // Find outliers if there are at least 7 rounds
    const outlierIds = new Set();
    if (eligibleRounds.length >= 7) {
        const initialRatings = eligibleRounds.map(round => round.rating);
        const initialAverage = initialRatings.reduce((sum, val) => sum + val, 0) / initialRatings.length;
        const stdDev = calculateStandardDeviation(initialRatings);
        const threshold = Math.min(100, 2.5 * stdDev);
        const cutoff = initialAverage - threshold;
        
        eligibleRounds.forEach(round => {
            if (round.rating < cutoff) {
                outlierIds.add(round.id);
            }
        });
    }
    
    return outlierIds;
}

// Update the rounds list in the UI
function updateRoundsList() {
    if (rounds.length === 0) {
        roundsList.innerHTML = '<div class="text-muted text-center py-3">No rounds added yet</div>';
        roundCount.textContent = '0 rounds';
        currentRating.textContent = 'Rating: N/A';
        return;
    }

    // Use the globally stored outlier IDs from the last updateStats() call
    const outlierIds = globalOutlierIds;
    
    console.log('=== Visual Highlighting Debug ===');
    console.log('Global outlier IDs:', Array.from(globalOutlierIds));
    console.log('Total rounds to display:', rounds.length);
    
    // Sort rounds by date (newest first)
    const sortedRounds = [...rounds].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create table structure
    let tableHTML = `
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th scope="col">Tournament</th>
                        <th scope="col">Date</th>
                        <th scope="col">Tier</th>
                        <th scope="col">Division</th>
                        <th scope="col">Round</th>
                        <th scope="col">Score</th>
                        <th scope="col">Round Rating</th>
                        <th scope="col">Status</th>
                        <th scope="col">Action</th>
                    </tr>
                </thead>
                <tbody>`;
    
    sortedRounds.forEach(round => {
        const isOutlier = outlierIds.has(round.id);
        const isTimeExcluded = globalTimeExcludedIds.has(round.id);
        const isExcluded = round.included !== 'Yes' && round.included !== undefined;
        const rowClass = isOutlier || isTimeExcluded || isExcluded ? 'table-danger' : '';
        const statusBadge = isExcluded ? '<span class="badge bg-warning">Excluded</span>' : 
                            isOutlier ? '<span class="badge bg-danger">Outlier</span>' : 
                            isTimeExcluded ? '<span class="badge bg-secondary">Too Old</span>' : 
                            '<span class="badge bg-success">Included</span>';
        
        // Debug logging for each round
        if (isOutlier) {
            console.log(`Round ${round.id} (${round.course}): OUTLIER - Rating: ${round.rating}`);
        }
        if (isTimeExcluded) {
            console.log(`Round ${round.id} (${round.course}): TIME EXCLUDED - Date: ${round.date}`);
        }
        
        tableHTML += `
                    <tr class="${rowClass}">
                        <td><strong>${round.course}</strong></td>
                        <td>${formatDate(round.date)}</td>
                        <td><span class="badge bg-secondary">${round.tier || 'N/A'}</span></td>
                        <td><span class="badge bg-info">${round.division || 'N/A'}</span></td>
                        <td>${round.round || 'N/A'}</td>
                        <td>${round.score}</td>
                        <td><span class="badge bg-success">${round.rating}</span></td>
                        <td>${statusBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteRound(${round.id})" title="Delete Round">
                                ×
                            </button>
                        </td>
                    </tr>`;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>`;
    
    roundsList.innerHTML = tableHTML;
    updateStats();
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Calculate standard deviation of an array of numbers
function calculateStandardDeviation(values) {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / values.length);
}

// Get date 12 months ago from a given date
function getDateTwelveMonthsAgo(date) {
    const result = new Date(date);
    result.setMonth(result.getMonth() - 12);
    return result.toISOString().split('T')[0];
}

// Calculate current rating based on PDGA rules
function updateStats() {
    if (rounds.length === 0) {
        roundCount.textContent = '0 rounds';
        currentRating.textContent = 'Rating: N/A';
        return;
    }

    // 1. Filter for only rounds that are included in PDGA rating (Included = 'Yes')
    const includedRounds = rounds.filter(round => round.included === 'Yes' || round.included === undefined);
    console.log('=== PDGA Rating Calculation Debug ===');
    console.log('Total rounds in data:', rounds.length);
    console.log('Rounds with Included=Yes:', includedRounds.length);
    
    // Show which rounds are excluded
    const excludedRounds = rounds.filter(round => round.included !== 'Yes' && round.included !== undefined);
    if (excludedRounds.length > 0) {
        console.log('Excluded rounds:', excludedRounds.map(r => `${r.course} (${r.date}) - Included: ${r.included}`));
    }
    
    // Sort included rounds by date (newest first)
    const sortedRounds = [...includedRounds].sort((a, b) => new Date(b.date) - new Date(a.date));
    const mostRecentDate = sortedRounds[0].date;
    
    console.log('Most recent date:', mostRecentDate);
    
    // 2. Get rounds from last 12 months
    const twelveMonthsAgo = getDateTwelveMonthsAgo(mostRecentDate);
    let eligibleRounds = sortedRounds.filter(round => round.date >= twelveMonthsAgo);
    
    console.log('12 months ago:', twelveMonthsAgo);
    console.log('Rounds in last 12 months:', eligibleRounds.length);
    
    // 3. If fewer than 8 rounds, go back up to 24 months total
    if (eligibleRounds.length < 8) {
        const twentyFourMonthsAgo = getDateTwelveMonthsAgo(twelveMonthsAgo);
        eligibleRounds = sortedRounds.filter(round => round.date >= twentyFourMonthsAgo);
        console.log('Extended to 24 months ago:', twentyFourMonthsAgo);
        console.log('Rounds in 24 months:', eligibleRounds.length);
    }
    
    // 4. Calculate initial average to find outliers
    const initialRatings = eligibleRounds.map(round => round.rating);
    const initialAverage = initialRatings.reduce((sum, val) => sum + val, 0) / initialRatings.length;
    const stdDev = calculateStandardDeviation(initialRatings);
    
    console.log('Initial ratings:', initialRatings);
    console.log('Initial average:', initialAverage.toFixed(2));
    console.log('Standard deviation:', stdDev.toFixed(2));
    
    // 5. Remove outliers ONLY if there are at least 7 rounds
    let filteredRounds = eligibleRounds;
    globalOutlierIds.clear(); // Clear previous outlier IDs
    
    if (eligibleRounds.length >= 7) {
        const threshold = Math.min(100, 2.5 * stdDev);
        const cutoff = initialAverage - threshold;
        filteredRounds = eligibleRounds.filter(round => 
            round.rating >= cutoff
        );
        
        // Store outlier IDs globally for visual highlighting
        eligibleRounds.forEach(round => {
            if (round.rating < cutoff) {
                globalOutlierIds.add(round.id);
            }
        });
        
        console.log('Outlier threshold:', threshold.toFixed(2));
        console.log('Cutoff rating:', cutoff.toFixed(2));
        console.log('Rounds after outlier removal:', filteredRounds.length);
        console.log('Filtered ratings:', filteredRounds.map(r => r.rating));
        console.log('Outlier IDs stored globally:', Array.from(globalOutlierIds));
        
        // Also store time-excluded rounds for visual highlighting
        globalTimeExcludedIds.clear();
        sortedRounds.forEach(round => {
            if (!eligibleRounds.some(er => er.id === round.id)) {
                globalTimeExcludedIds.add(round.id);
            }
        });
        console.log('Time-excluded IDs stored globally:', Array.from(globalTimeExcludedIds));
    } else {
        console.log('Fewer than 7 rounds - no outlier removal');
        console.log('All rounds included:', filteredRounds.map(r => r.rating));
    }
    
    // 6. Double weight the most recent 25% of rounds ONLY if 9+ rounds
    const numRounds = filteredRounds.length;
    let weightedRounds = [...filteredRounds];
    let totalWeight = numRounds;
    
    if (numRounds >= 9) {
        const numWeighted = Math.floor(numRounds * 0.25);
        console.log('9+ rounds - applying double weighting');
        console.log('Number of rounds to double-weight:', numWeighted);
        console.log('Double-weighted ratings:', filteredRounds.slice(0, numWeighted).map(r => r.rating));
        
        // Add the most recent 25% again for double weighting
        weightedRounds = [
            ...filteredRounds.slice(0, numWeighted), // These will be double-weighted
            ...filteredRounds
        ];
        totalWeight = numRounds + numWeighted;
    } else {
        console.log('Fewer than 9 rounds - no double weighting');
    }
    
    // 7. Calculate final average
    const totalRating = weightedRounds.reduce((sum, round) => sum + round.rating, 0);
    const exactAverage = totalRating / totalWeight;
    
    // Try different rounding methods to match PDGA
    const roundedStandard = Math.round(exactAverage);
    const roundedUp = Math.ceil(exactAverage - 0.5); // Round 0.5 and above up
    const roundedCeil = Math.ceil(exactAverage);
    
    console.log('Total rating points:', totalRating);
    console.log('Total weight:', totalWeight);
    console.log('Exact average:', exactAverage.toFixed(4));
    console.log('Standard rounding (Math.round):', roundedStandard);
    console.log('Round half up:', roundedUp);
    console.log('Always round up (Math.ceil):', roundedCeil);
    
    // PDGA always rounds up to the nearest whole number
    const averageRating = Math.ceil(exactAverage);
    console.log('Exact average:', exactAverage.toFixed(4), 'Rounded up to:', averageRating);
    console.log('=====================================');
    
    // 8. Update UI
    roundCount.textContent = `${numRounds} round${numRounds !== 1 ? 's' : ''}`;
    currentRating.textContent = `Rating: ${averageRating}`;
}

// Calculate rating for a single round
function calculateRoundRating(round) {
    // PDGA rating formula: (1000 + (round.rating - round.score) * 20)
    const roundRating = Math.round(1000 + (round.rating - round.score) * 20);
    return roundRating;
}

// Delete a round
function deleteRound(id) {
    if (confirm('Are you sure you want to delete this round?')) {
        rounds = rounds.filter(round => round.id !== id);
        saveRounds();
        
        // Recalculate PDGA rating and update outlier status after deletion
        updateStats();
        updateRoundsList();
        
        console.log('Round deleted. Rating recalculated.');
    }
}

// Import rounds from PDGA API
async function importFromPDGA() {
    const pdgaNumber = pdgaNumberInput.value.trim();
    
    if (!pdgaNumber || isNaN(pdgaNumber) || pdgaNumber < 1 || pdgaNumber > 999999) {
        importStatus.textContent = 'Please enter a valid PDGA number (1-999999)';
        importStatus.className = 'import-error';
        return;
    }
    
    importBtn.disabled = true;
    importStatus.textContent = 'Fetching player data from PDGA...';
    importStatus.className = '';
    
    try {
        // Try multiple CORS proxy services for reliability
        const targetUrl = `https://www.pdga.com/player/${pdgaNumber}/details`;
        const proxyServices = [
            {
                url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
                type: 'json',
                name: 'AllOrigins'
            },
            {
                url: `https://cors-anywhere.herokuapp.com/${targetUrl}`,
                type: 'text',
                name: 'CORS Anywhere'
            },
            {
                url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
                type: 'text',
                name: 'CORS Proxy'
            }
        ];
        
        let htmlText = null;
        let lastError = null;
        
        // Try each proxy service until one works
        for (const proxy of proxyServices) {
            try {
                console.log(`Trying ${proxy.name}: ${proxy.url}`);
                importStatus.textContent = `Fetching player data via ${proxy.name}...`;
                
                const response = await fetch(proxy.url, {
                    method: 'GET',
                    headers: proxy.name === 'CORS Anywhere' ? { 'X-Requested-With': 'XMLHttpRequest' } : {}
                });
                
                if (response.ok) {
                    if (proxy.type === 'json') {
                        const proxyData = await response.json();
                        if (proxyData.contents) {
                            htmlText = proxyData.contents;
                            console.log(`${proxy.name} request successful`);
                            break;
                        }
                    } else {
                        htmlText = await response.text();
                        console.log(`${proxy.name} request successful`);
                        break;
                    }
                }
            } catch (error) {
                console.log(`${proxy.name} failed:`, error.message);
                lastError = error;
            }
        }
        
        if (!htmlText) {
            throw lastError || new Error('All proxy services failed');
        }
        
        // Check if the page contains player data
        if (!htmlText.includes('player-results-details') && !htmlText.includes('Ratings Detail')) {
            importStatus.textContent = `PDGA number ${pdgaNumber} not found or has no rated rounds.`;
            importStatus.className = 'import-error';
            return;
        }
        
        importStatus.textContent = 'Parsing player data...';
        
        // Parse the HTML to extract round data
        const parsedRounds = parseHTMLPlayerData(htmlText);
        
        if (parsedRounds.length === 0) {
            importStatus.textContent = 'No rated rounds found for this player.';
            importStatus.className = 'import-error';
            return;
        }
        
        let importedCount = 0;
        
        // Add parsed rounds with unique IDs, avoiding duplicates
        parsedRounds.forEach(round => {
            const isDuplicate = rounds.some(r => 
                r.course === round.course && 
                r.date === round.date && 
                r.score === round.score && 
                r.rating === round.rating &&
                r.division === round.division &&
                r.tier === round.tier &&
                r.round === round.round
            );
            
            console.log(`Checking duplicate for ${round.course} R${round.round}: ${isDuplicate ? 'DUPLICATE' : 'UNIQUE'}`);
            
            if (!isDuplicate) {
                rounds.unshift({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    ...round
                });
                importedCount++;
            }
        });
        
        saveRounds();
        updateStats();
        updateRoundsList();
        
        if (importedCount > 0) {
            importStatus.textContent = `Successfully imported ${importedCount} rounds for PDGA #${pdgaNumber}`;
            importStatus.className = 'import-success';
        } else {
            importStatus.textContent = 'All rounds were already in your list (no duplicates added)';
            importStatus.className = 'import-success';
        }
    } catch (error) {
        console.error('Error fetching PDGA data:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            importStatus.textContent = 'Network error. Please check your connection and try again.';
        } else {
            importStatus.textContent = 'Error importing player data. Please try again.';
        }
        importStatus.className = 'import-error';
    } finally {
        importBtn.disabled = false;
    }
}

// Parse HTML player data from PDGA website
function parseHTMLPlayerData(htmlText) {
    console.log('=== PDGA HTML Parsing Debug ===');
    
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    
    // Find the player results table
    const table = doc.querySelector('#player-results-details');
    if (!table) {
        console.log('No player results table found');
        return [];
    }
    
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.log('No table body found');
        return [];
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`Found ${rows.length} table rows`);
    
    const tempRounds = [];
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 9) {
            // Extract data from table cells
            const tournamentCell = cells[0].querySelector('a');
            const tournament = tournamentCell ? tournamentCell.textContent.trim() : cells[0].textContent.trim();
            const tier = cells[1].textContent.trim();
            const dateStr = cells[2].textContent.trim();
            const division = cells[3].textContent.trim();
            const roundStr = cells[4].textContent.trim();
            const score = parseInt(cells[5].textContent.trim());
            const rating = parseInt(cells[6].textContent.trim());
            const evaluated = cells[7].textContent.trim();
            const included = cells[8].textContent.trim();
            
            console.log(`Row ${index + 1}: ${tournament}, ${tier}, ${dateStr}, ${division}, R${roundStr}, ${score}, ${rating}, ${evaluated}, ${included}`);
            
            // Parse date (format: d-MMM-yyyy)
            const parsedDate = parseDate(dateStr);
            
            if (tournament && !isNaN(score) && !isNaN(rating) && parsedDate) {
                tempRounds.push({
                    course: tournament,
                    tier: tier,
                    date: parsedDate,
                    division: division,
                    round: roundStr || '1',
                    score: score,
                    rating: rating,
                    evaluated: evaluated,
                    included: included,
                    originalIndex: tempRounds.length
                });
                console.log(`  ✅ Round added (${tempRounds.length})`);
            } else {
                console.log(`  ❌ Round skipped - tournament: ${!!tournament}, score: ${!isNaN(score)}, rating: ${!isNaN(rating)}, date: ${!!parsedDate}`);
            }
        } else {
            console.log(`Row ${index + 1}: Insufficient columns (${cells.length})`);
        }
    });
    
    console.log(`Total rounds parsed: ${tempRounds.length}`);
    return tempRounds;
}

// Parse date from PDGA format (e.g., "20-Jul-2025" or "19-Aug to 23-Aug-2025")
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    let targetDate = dateStr;
    
    // Handle date ranges (take the first date but extract year from the end)
    if (dateStr.includes(' to ')) {
        const parts = dateStr.split(' to ');
        const startDate = parts[0]; // e.g., "19-Aug"
        const endDate = parts[1];   // e.g., "23-Aug-2025"
        
        // Extract year from end date
        const endParts = endDate.split('-');
        if (endParts.length === 3) {
            const year = endParts[2];
            targetDate = `${startDate}-${year}`; // e.g., "19-Aug-2025"
        }
    }
    
    try {
        // Parse format like "20-Jul-2025"
        const parts = targetDate.split('-');
        if (parts.length === 3) {
            const day = parts[0];
            const month = parts[1];
            const year = parts[2];
            
            // Convert month name to number
            const monthMap = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            };
            
            const monthNum = monthMap[month];
            if (monthNum) {
                return `${year}-${monthNum}-${day.padStart(2, '0')}`;
            }
        }
    } catch (error) {
        console.error('Error parsing date:', dateStr, error);
    }
    
    return null;
}

// Dark mode functions
function initializeDarkMode() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        darkModeIcon.textContent = '☀️';
    } else {
        body.removeAttribute('data-theme');
        darkModeIcon.textContent = '🌙';
    }
}

function toggleDarkMode() {
    const currentTheme = body.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        // Switch to light mode
        body.removeAttribute('data-theme');
        darkModeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        // Switch to dark mode
        body.setAttribute('data-theme', 'dark');
        darkModeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

// Clear all rounds function
function clearAllRounds() {
    if (rounds.length === 0) {
        alert('No rounds to clear!');
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete all ${rounds.length} rounds? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        rounds = [];
        saveRounds();
        updateRoundsList();
        
        // Show success message briefly
        const originalText = clearAllBtn.textContent;
        clearAllBtn.textContent = 'Cleared!';
        clearAllBtn.disabled = true;
        
        setTimeout(() => {
            clearAllBtn.textContent = originalText;
            clearAllBtn.disabled = false;
        }, 2000);
    }
}

// Make deleteRound available globally for the onclick handler
window.deleteRound = deleteRound;
