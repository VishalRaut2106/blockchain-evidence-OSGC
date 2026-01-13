/**
 * Sample Data Initialization for EVID-DGC
 * Creates sample cases and evidence for testing and demonstration
 */

function initializeSampleData() {
    // Check if sample data already exists
    if (localStorage.getItem('sampleDataInitialized') === 'true') {
        return;
    }

    // Sample cases
    const sampleCases = [
        {
            id: 'INV-2024-001',
            title: 'Downtown Burglary Investigation',
            status: 'OPEN',
            location: 'Downtown Office Building',
            date: '2024-03-15',
            createdBy: 'Detective Smith',
            createdAt: '2024-03-15T10:30:00Z',
            description: 'Break-in at downtown office building with multiple items stolen',
            priority: 'High',
            assignedTo: 'Investigator Team A'
        },
        {
            id: 'INV-2024-002',
            title: 'Financial Fraud Case',
            status: 'ANALYZING',
            location: 'Financial District',
            date: '2024-03-12',
            createdBy: 'Agent Johnson',
            createdAt: '2024-03-12T14:20:00Z',
            description: 'Suspected financial fraud involving multiple transactions',
            priority: 'Critical',
            assignedTo: 'Forensic Team B'
        },
        {
            id: 'INV-2024-003',
            title: 'Retail Theft Investigation',
            status: 'CLOSED',
            location: 'Shopping Mall',
            date: '2024-03-10',
            createdBy: 'Officer Davis',
            createdAt: '2024-03-10T09:15:00Z',
            description: 'Organized retail theft ring investigation completed',
            priority: 'Medium',
            assignedTo: 'Investigation Unit C',
            closedAt: '2024-03-20T16:45:00Z'
        },
        {
            id: 'PUB-2024-001',
            title: 'Public Safety Incident',
            status: 'CLOSED',
            location: 'City Park',
            date: '2024-02-20',
            createdBy: 'Park Security',
            createdAt: '2024-02-20T11:00:00Z',
            description: 'Public safety incident resolved with community cooperation',
            priority: 'Low',
            isPublic: true,
            closedAt: '2024-02-25T14:30:00Z'
        },
        {
            id: 'PUB-2024-002',
            title: 'Traffic Investigation',
            status: 'CLOSED',
            location: 'Main Street Intersection',
            date: '2024-02-25',
            createdBy: 'Traffic Division',
            createdAt: '2024-02-25T08:30:00Z',
            description: 'Traffic incident investigation completed with safety improvements',
            priority: 'Medium',
            isPublic: true,
            closedAt: '2024-03-01T12:00:00Z'
        }
    ];

    // Sample evidence
    const sampleEvidence = [
        {
            id: 'EVD-001',
            fileName: 'security_camera_footage.mp4',
            fileSize: 15728640, // 15MB
            fileType: 'video/mp4',
            uploadedBy: 'Detective Smith',
            uploadedAt: '2024-03-15T11:00:00Z',
            status: 'Verified',
            hash: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef',
            caseId: 'INV-2024-001',
            description: 'Security camera footage from building entrance',
            isPublic: false
        },
        {
            id: 'EVD-002',
            fileName: 'financial_records.pdf',
            fileSize: 2097152, // 2MB
            fileType: 'application/pdf',
            uploadedBy: 'Agent Johnson',
            uploadedAt: '2024-03-12T15:30:00Z',
            status: 'Verified',
            hash: 'sha256:b2c3d4e5f6789012345678901234567890abcdef01',
            caseId: 'INV-2024-002',
            description: 'Bank transaction records for fraud investigation',
            isPublic: false
        },
        {
            id: 'EVD-003',
            fileName: 'witness_statement.pdf',
            fileSize: 524288, // 512KB
            fileType: 'application/pdf',
            uploadedBy: 'Officer Davis',
            uploadedAt: '2024-03-10T10:45:00Z',
            status: 'Verified',
            hash: 'sha256:c3d4e5f6789012345678901234567890abcdef0123',
            caseId: 'INV-2024-003',
            description: 'Witness statement from store manager',
            isPublic: false
        },
        {
            id: 'EVD-004',
            fileName: 'incident_photos.zip',
            fileSize: 8388608, // 8MB
            fileType: 'application/zip',
            uploadedBy: 'Park Security',
            uploadedAt: '2024-02-20T12:00:00Z',
            status: 'Verified',
            hash: 'sha256:d4e5f6789012345678901234567890abcdef012345',
            caseId: 'PUB-2024-001',
            description: 'Photos from public safety incident scene',
            isPublic: true
        },
        {
            id: 'EVD-005',
            fileName: 'traffic_analysis.pdf',
            fileSize: 1048576, // 1MB
            fileType: 'application/pdf',
            uploadedBy: 'Traffic Division',
            uploadedAt: '2024-02-25T09:15:00Z',
            status: 'Verified',
            hash: 'sha256:e5f6789012345678901234567890abcdef0123456',
            caseId: 'PUB-2024-002',
            description: 'Traffic flow analysis and recommendations',
            isPublic: true
        }
    ];

    // Sample activity logs
    const sampleLogs = [
        {
            id: 'LOG-001',
            user_id: '0xtest1000000000000000000000000000000000002',
            action: 'case_created',
            details: {
                case_id: 'INV-2024-001',
                case_title: 'Downtown Burglary Investigation'
            },
            timestamp: '2024-03-15T10:30:00Z'
        },
        {
            id: 'LOG-002',
            user_id: '0xtest1000000000000000000000000000000000002',
            action: 'evidence_uploaded',
            details: {
                evidence_id: 'EVD-001',
                file_name: 'security_camera_footage.mp4'
            },
            timestamp: '2024-03-15T11:00:00Z'
        },
        {
            id: 'LOG-003',
            user_id: '0xtest1000000000000000000000000000000000003',
            action: 'evidence_analyzed',
            details: {
                evidence_id: 'EVD-002',
                analysis_type: 'financial_forensics'
            },
            timestamp: '2024-03-12T16:00:00Z'
        }
    ];

    // Store sample data
    localStorage.setItem('cases', JSON.stringify(sampleCases));
    localStorage.setItem('evidence', JSON.stringify(sampleEvidence));
    localStorage.setItem('activityLogs', JSON.stringify(sampleLogs));
    localStorage.setItem('sampleDataInitialized', 'true');

    console.log('Sample data initialized successfully');
}

// Auto-initialize sample data when script loads
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure other scripts are loaded
    setTimeout(initializeSampleData, 1000);
});

// Export for manual initialization
window.initializeSampleData = initializeSampleData;