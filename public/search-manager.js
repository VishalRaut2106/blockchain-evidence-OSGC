// Advanced Search and Filter System
class SearchManager {
    constructor() {
        this.filters = {
            dateRange: { start: null, end: null },
            status: '',
            type: '',
            caseId: '',
            submittedBy: ''
        };
        this.sortBy = 'timestamp';
        this.sortOrder = 'desc';
        this.initializeSearch();
    }

    initializeSearch() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.performSearch.bind(this), 300));
        }

        // Filter controls
        this.initializeFilters();
        
        // Sort controls
        this.initializeSorting();
    }

    initializeFilters() {
        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.status = statusFilter.value;
                this.performSearch();
            });
        }

        // Type filter
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filters.type = typeFilter.value;
                this.performSearch();
            });
        }

        // Date range filters
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate) {
            startDate.addEventListener('change', () => {
                this.filters.dateRange.start = startDate.value;
                this.performSearch();
            });
        }
        
        if (endDate) {
            endDate.addEventListener('change', () => {
                this.filters.dateRange.end = endDate.value;
                this.performSearch();
            });
        }

        // Clear filters button
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', this.clearAllFilters.bind(this));
        }
    }

    initializeSorting() {
        const sortSelect = document.getElementById('sortBy');
        const sortOrder = document.getElementById('sortOrder');

        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sortBy = sortSelect.value;
                this.performSearch();
            });
        }

        if (sortOrder) {
            sortOrder.addEventListener('change', () => {
                this.sortOrder = sortOrder.value;
                this.performSearch();
            });
        }
    }

    async performSearch() {
        try {
            showLoading(true);
            
            const searchTerm = document.getElementById('searchInput')?.value || '';
            const allEvidence = await storage.getAllEvidence();
            
            let filteredResults = allEvidence;

            // Apply text search
            if (searchTerm) {
                filteredResults = this.applyTextSearch(filteredResults, searchTerm);
            }

            // Apply filters
            filteredResults = this.applyFilters(filteredResults);

            // Apply sorting
            filteredResults = this.applySorting(filteredResults);

            // Display results
            this.displayResults(filteredResults);
            this.updateResultsCount(filteredResults.length, allEvidence.length);
            
            showLoading(false);
        } catch (error) {
            console.error('Search error:', error);
            showAlert('Search failed: ' + error.message, 'error');
            showLoading(false);
        }
    }

    applyTextSearch(evidence, searchTerm) {
        const term = searchTerm.toLowerCase();
        return evidence.filter(item => {
            return (
                (item.title || '').toLowerCase().includes(term) ||
                (item.description || '').toLowerCase().includes(term) ||
                (item.case_id || item.caseId || '').toLowerCase().includes(term) ||
                (item.file_name || item.fileName || '').toLowerCase().includes(term) ||
                (item.evidence_id || '').toLowerCase().includes(term) ||
                (item.submitted_by || '').toLowerCase().includes(term)
            );
        });
    }

    applyFilters(evidence) {
        return evidence.filter(item => {
            // Status filter
            if (this.filters.status && item.status !== this.filters.status) {
                return false;
            }

            // Type filter
            if (this.filters.type && item.type !== this.filters.type) {
                return false;
            }

            // Date range filter
            if (this.filters.dateRange.start || this.filters.dateRange.end) {
                const itemDate = new Date(item.timestamp);
                
                if (this.filters.dateRange.start) {
                    const startDate = new Date(this.filters.dateRange.start);
                    if (itemDate < startDate) return false;
                }
                
                if (this.filters.dateRange.end) {
                    const endDate = new Date(this.filters.dateRange.end);
                    endDate.setHours(23, 59, 59, 999); // End of day
                    if (itemDate > endDate) return false;
                }
            }

            return true;
        });
    }

    applySorting(evidence) {
        return evidence.sort((a, b) => {
            let aValue, bValue;

            switch (this.sortBy) {
                case 'title':
                    aValue = (a.title || '').toLowerCase();
                    bValue = (b.title || '').toLowerCase();
                    break;
                case 'timestamp':
                    aValue = new Date(a.timestamp);
                    bValue = new Date(b.timestamp);
                    break;
                case 'size':
                    aValue = a.file_size || a.fileSize || 0;
                    bValue = b.file_size || b.fileSize || 0;
                    break;
                case 'type':
                    aValue = (a.type || '').toLowerCase();
                    bValue = (b.type || '').toLowerCase();
                    break;
                default:
                    aValue = a[this.sortBy] || '';
                    bValue = b[this.sortBy] || '';
            }

            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    displayResults(results) {
        const container = document.getElementById('searchResults') || document.getElementById('evidenceList');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `
                <div class=\"no-results\">
                    <div class=\"no-results-icon\">🔍</div>
                    <h3>No Evidence Found</h3>
                    <p>Try adjusting your search criteria or filters.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = results.map(evidence => `
            <div class=\"evidence-card card search-result\">
                <div class=\"card-body\">
                    <div class=\"evidence-header\">
                        <h5>${this.highlightSearchTerm(evidence.title)}</h5>
                        <span class=\"badge badge-${this.getStatusClass(evidence.status)}\">${evidence.status}</span>
                    </div>
                    <p class=\"text-muted\">${this.highlightSearchTerm(evidence.description || '')}</p>\n                    <div class=\"evidence-meta\">
                        <div class=\"meta-row\">
                            <span class=\"meta-label\">ID:</span>\n                            <span class=\"meta-value\">${evidence.evidence_id || evidence.id}</span>\n                        </div>\n                        <div class=\"meta-row\">
                            <span class=\"meta-label\">Case:</span>\n                            <span class=\"meta-value\">${this.highlightSearchTerm(evidence.case_id || evidence.caseId)}</span>\n                        </div>\n                        <div class=\"meta-row\">
                            <span class=\"meta-label\">Type:</span>\n                            <span class=\"meta-value\">${evidence.type}</span>\n                        </div>\n                        <div class=\"meta-row\">
                            <span class=\"meta-label\">File:</span>\n                            <span class=\"meta-value\">${evidence.file_name || evidence.fileName}</span>\n                        </div>\n                        <div class=\"meta-row\">
                            <span class=\"meta-label\">Size:</span>\n                            <span class=\"meta-value\">${this.formatFileSize(evidence.file_size || evidence.fileSize)}</span>\n                        </div>\n                        <div class=\"meta-row\">
                            <span class=\"meta-label\">Submitted:</span>\n                            <span class=\"meta-value\">${new Date(evidence.timestamp).toLocaleString()}</span>\n                        </div>\n                        <div class=\"meta-row\">
                            <span class=\"meta-label\">By:</span>\n                            <span class=\"meta-value\">${this.highlightSearchTerm(evidence.submitted_by || '')}</span>\n                        </div>\n                    </div>\n                    <div class=\"evidence-actions mt-3\">\n                        <button class=\"btn btn-sm btn-outline\" onclick=\"secureEvidenceManager.viewEvidence(${evidence.id})\">\n                            👁️ View\n                        </button>\n                        <button class=\"btn btn-sm btn-outline\" onclick=\"secureEvidenceManager.downloadEvidence(${evidence.id})\">\n                            📥 Download\n                        </button>\n                        <button class=\"btn btn-sm btn-outline\" onclick=\"secureEvidenceManager.viewChainOfCustody(${evidence.id})\">\n                            📋 Chain of Custody\n                        </button>\n                    </div>\n                </div>\n            </div>\n        `).join('');\n    }\n\n    highlightSearchTerm(text) {\n        const searchTerm = document.getElementById('searchInput')?.value;\n        if (!searchTerm || !text) return text;\n        \n        const regex = new RegExp(`(${searchTerm})`, 'gi');\n        return text.replace(regex, '<mark>$1</mark>');\n    }\n\n    updateResultsCount(filtered, total) {\n        const counter = document.getElementById('resultsCount');\n        if (counter) {\n            counter.textContent = `Showing ${filtered} of ${total} evidence items`;\n        }\n    }\n\n    clearAllFilters() {\n        // Reset filters\n        this.filters = {\n            dateRange: { start: null, end: null },\n            status: '',\n            type: '',\n            caseId: '',\n            submittedBy: ''\n        };\n\n        // Reset form controls\n        const controls = [\n            'searchInput', 'statusFilter', 'typeFilter', \n            'startDate', 'endDate', 'sortBy', 'sortOrder'\n        ];\n        \n        controls.forEach(id => {\n            const element = document.getElementById(id);\n            if (element) {\n                if (element.type === 'select-one') {\n                    element.selectedIndex = 0;\n                } else {\n                    element.value = '';\n                }\n            }\n        });\n\n        // Reset sort\n        this.sortBy = 'timestamp';\n        this.sortOrder = 'desc';\n\n        // Perform search to show all results\n        this.performSearch();\n    }\n\n    // Utility functions\n    debounce(func, wait) {\n        let timeout;\n        return function executedFunction(...args) {\n            const later = () => {\n                clearTimeout(timeout);\n                func(...args);\n            };\n            clearTimeout(timeout);\n            timeout = setTimeout(later, wait);\n        };\n    }\n\n    formatFileSize(bytes) {\n        if (!bytes) return '0 Bytes';\n        const k = 1024;\n        const sizes = ['Bytes', 'KB', 'MB', 'GB'];\n        const i = Math.floor(Math.log(bytes) / Math.log(k));\n        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];\n    }\n\n    getStatusClass(status) {\n        const statusClasses = {\n            'pending': 'warning',\n            'approved': 'success',\n            'rejected': 'danger',\n            'under_review': 'info'\n        };\n        return statusClasses[status] || 'secondary';\n    }\n\n    // Export search results\n    async exportResults() {\n        try {\n            const searchTerm = document.getElementById('searchInput')?.value || '';\n            const allEvidence = await storage.getAllEvidence();\n            \n            let results = allEvidence;\n            if (searchTerm) results = this.applyTextSearch(results, searchTerm);\n            results = this.applyFilters(results);\n            results = this.applySorting(results);\n\n            const exportData = {\n                searchTerm: searchTerm,\n                filters: this.filters,\n                totalResults: results.length,\n                exportDate: new Date().toISOString(),\n                results: results.map(item => ({\n                    id: item.evidence_id || item.id,\n                    title: item.title,\n                    caseId: item.case_id || item.caseId,\n                    type: item.type,\n                    fileName: item.file_name || item.fileName,\n                    fileSize: item.file_size || item.fileSize,\n                    submittedBy: item.submitted_by,\n                    timestamp: item.timestamp,\n                    status: item.status\n                }))\n            };\n\n            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });\n            const url = URL.createObjectURL(blob);\n            \n            const a = document.createElement('a');\n            a.href = url;\n            a.download = `evidence-search-results-${new Date().toISOString().split('T')[0]}.json`;\n            document.body.appendChild(a);\n            a.click();\n            document.body.removeChild(a);\n            URL.revokeObjectURL(url);\n\n            showAlert('Search results exported successfully', 'success');\n        } catch (error) {\n            console.error('Export error:', error);\n            showAlert('Failed to export results', 'error');\n        }\n    }\n}\n\n// Initialize search manager\nconst searchManager = new SearchManager();