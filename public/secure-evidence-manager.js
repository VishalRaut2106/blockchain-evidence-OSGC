// Enhanced Evidence Manager with Security & Validation
class SecureEvidenceManager {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'audio/mp3', 'text/plain'];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const evidenceForm = document.getElementById('evidenceForm');
        if (evidenceForm) {
            evidenceForm.addEventListener('submit', this.handleEvidenceSubmission.bind(this));
        }

        const fileInput = document.getElementById('evidenceFile');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelection.bind(this));
        }

        this.loadEvidence();
    }

    // Validate file before upload
    validateFile(file) {
        const errors = [];

        // Check file size
        if (file.size > this.maxFileSize) {
            errors.push(`File size exceeds ${this.formatFileSize(this.maxFileSize)} limit`);
        }

        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            errors.push(`File type ${file.type} not allowed`);
        }

        // Check file name for security
        if (this.containsMaliciousPatterns(file.name)) {
            errors.push('File name contains invalid characters');
        }

        return errors;
    }

    // Check for malicious file name patterns
    containsMaliciousPatterns(filename) {
        const maliciousPatterns = [
            /\.\./,           // Directory traversal
            /[<>:\"|?*]/,     // Invalid filename characters
            /\.(exe|bat|cmd|scr|pif|com)$/i, // Executable files
            /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i // Reserved names
        ];
        
        return maliciousPatterns.some(pattern => pattern.test(filename));
    }

    // Generate secure hash for file integrity
    async generateSecureHash(fileData) {
        const encoder = new TextEncoder();
        const data = encoder.encode(fileData);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Encrypt sensitive data before storage
    async encryptData(data, key) {
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(JSON.stringify(data));
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(key),
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            encodedData
        );

        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv)
        };
    }

    async handleFileSelection(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        const errors = this.validateFile(file);
        if (errors.length > 0) {
            showAlert('File validation failed: ' + errors.join(', '), 'error');
            event.target.value = '';
            return;
        }

        // Show file info
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.innerHTML = `
                <div class="file-preview">
                    <div class="file-icon">${this.getFileIcon(file.type)}</div>
                    <div class="file-details">
                        <p><strong>File:</strong> ${file.name}</p>
                        <p><strong>Size:</strong> ${this.formatFileSize(file.size)}</p>
                        <p><strong>Type:</strong> ${file.type}</p>
                        <p><strong>Status:</strong> <span class="text-success">✅ Valid</span></p>
                    </div>
                </div>
            `;
        }
    }

    async handleEvidenceSubmission(event) {
        event.preventDefault();
        
        try {
            showLoading(true);
            
            const formData = new FormData(event.target);
            const fileInput = document.getElementById('evidenceFile');
            const file = fileInput.files[0];
            
            if (!file) {
                showAlert('Please select a file to upload', 'error');
                showLoading(false);
                return;
            }

            // Validate file again
            const errors = this.validateFile(file);
            if (errors.length > 0) {
                showAlert('File validation failed: ' + errors.join(', '), 'error');
                showLoading(false);
                return;
            }

            // Convert file to base64
            const fileData = await storage.fileToBase64(file);
            const hash = await this.generateSecureHash(fileData);
            
            // Create evidence record with enhanced security
            const evidenceData = {
                caseId: formData.get('caseId') || 'CASE-' + Date.now(),
                title: this.sanitizeInput(formData.get('title')),
                description: this.sanitizeInput(formData.get('description')),
                type: formData.get('type'),
                fileData: fileData,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                hash: hash,
                submittedBy: userAccount,
                submissionIP: await this.getClientIP(),
                chainOfCustody: [{
                    action: 'EVIDENCE_CREATED',
                    by: userAccount,
                    timestamp: Date.now(),
                    ip: await this.getClientIP(),
                    details: 'Evidence initially submitted'
                }]
            };

            // Save evidence with audit trail
            const evidenceId = await storage.saveEvidence(evidenceData);
            
            // Log to blockchain (if connected)
            if (window.web3 && !config.DEMO_MODE) {
                await this.recordOnBlockchain(evidenceId, hash);
            }
            
            showLoading(false);
            showAlert('Evidence submitted successfully! ID: ' + evidenceId, 'success');
            
            // Reset form
            event.target.reset();
            document.getElementById('fileInfo').innerHTML = '';
            
            // Reload evidence list
            this.loadEvidence();
            
        } catch (error) {
            showLoading(false);
            console.error('Evidence submission error:', error);
            showAlert('Failed to submit evidence: ' + error.message, 'error');
        }
    }

    // Sanitize user input to prevent XSS
    sanitizeInput(input) {
        if (!input) return '';
        return input.replace(/[<>\"'&]/g, function(match) {
            const map = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;'
            };
            return map[match];
        });
    }

    // Record evidence hash on blockchain
    async recordOnBlockchain(evidenceId, hash) {
        try {
            if (!window.web3 || !window.contract) {
                console.log('Blockchain not available - using demo mode');
                return;
            }

            const accounts = await web3.eth.getAccounts();
            const result = await contract.methods.registerEvidence(
                evidenceId,
                hash,
                Date.now()
            ).send({ from: accounts[0] });

            console.log('Evidence recorded on blockchain:', result.transactionHash);
            return result.transactionHash;
        } catch (error) {
            console.error('Blockchain recording failed:', error);
            throw error;
        }
    }

    async loadEvidence() {
        try {
            const evidenceList = await storage.getAllEvidence();
            const container = document.getElementById('evidenceList');
            
            if (!container) return;
            
            if (evidenceList.length === 0) {
                container.innerHTML = '<p class="text-muted">No evidence submitted yet.</p>';
                return;
            }

            container.innerHTML = evidenceList.map(evidence => `
                <div class="evidence-card card">
                    <div class="card-body">
                        <div class="evidence-header">
                            <h5>${evidence.title}</h5>
                            <span class="badge badge-${this.getStatusClass(evidence.status)}">${evidence.status}</span>
                        </div>
                        <p class="text-muted">${evidence.description}</p>
                        <div class="evidence-meta">
                            <small class="text-muted">
                                <strong>Case:</strong> ${evidence.case_id || evidence.caseId}<br>
                                <strong>Type:</strong> ${evidence.type}<br>
                                <strong>File:</strong> ${evidence.file_name || evidence.fileName}<br>
                                <strong>Size:</strong> ${this.formatFileSize(evidence.file_size || evidence.fileSize)}<br>
                                <strong>Hash:</strong> <code class="hash-display">${(evidence.hash || '').substring(0, 16)}...</code><br>
                                <strong>Submitted:</strong> ${new Date(evidence.timestamp).toLocaleString()}
                            </small>
                        </div>
                        <div class="evidence-actions mt-3">
                            <button class="btn btn-sm btn-outline" onclick="secureEvidenceManager.viewEvidence(${evidence.id})">
                                👁️ View Details
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="secureEvidenceManager.downloadEvidence(${evidence.id})">
                                📥 Download
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="secureEvidenceManager.viewChainOfCustody(${evidence.id})">
                                📋 Chain of Custody
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading evidence:', error);
        }
    }

    async viewChainOfCustody(evidenceId) {
        try {
            const evidence = await storage.getEvidence(evidenceId);
            if (!evidence) {
                showAlert('Evidence not found', 'error');
                return;
            }

            const custody = evidence.chainOfCustody || evidence.chain_of_custody || [];
            
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📋 Chain of Custody - ${evidence.title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="custody-timeline">
                            ${custody.map((entry, index) => `
                                <div class="custody-entry">
                                    <div class="custody-step">${index + 1}</div>
                                    <div class="custody-details">
                                        <h4>${entry.action}</h4>
                                        <p><strong>By:</strong> ${entry.by}</p>
                                        <p><strong>When:</strong> ${new Date(entry.timestamp).toLocaleString()}</p>
                                        <p><strong>IP:</strong> ${entry.ip || 'Unknown'}</p>
                                        ${entry.details ? `<p><strong>Details:</strong> ${entry.details}</p>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="integrity-check mt-4">
                            <h4>🔒 Integrity Verification</h4>
                            <p><strong>SHA-256 Hash:</strong> <code>${evidence.hash}</code></p>
                            <button class="btn btn-primary" onclick="secureEvidenceManager.verifyIntegrity(${evidenceId})">
                                ✅ Verify File Integrity
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('Error viewing chain of custody:', error);
            showAlert('Error loading chain of custody', 'error');
        }
    }

    async verifyIntegrity(evidenceId) {
        try {
            const evidence = await storage.getEvidence(evidenceId);
            if (!evidence) {
                showAlert('Evidence not found', 'error');
                return;
            }

            // Recalculate hash
            const currentHash = await this.generateSecureHash(evidence.file_data || evidence.fileData);
            const originalHash = evidence.hash;

            if (currentHash === originalHash) {
                showAlert('✅ File integrity verified - Evidence has not been tampered with', 'success');
            } else {
                showAlert('❌ File integrity check failed - Evidence may have been modified', 'error');
            }

            // Log verification attempt
            await storage.logActivity(userAccount, 'INTEGRITY_CHECK', `Integrity check for evidence ${evidenceId}: ${currentHash === originalHash ? 'PASSED' : 'FAILED'}`);
            
        } catch (error) {
            console.error('Error verifying integrity:', error);
            showAlert('Error during integrity verification', 'error');
        }
    }

    // Utility functions
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType === 'application/pdf') return '📄';
        return '📁';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getStatusClass(status) {
        const statusClasses = {
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger',
            'under_review': 'info'
        };
        return statusClasses[status] || 'secondary';
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }
}

// Initialize secure evidence manager
const secureEvidenceManager = new SecureEvidenceManager();