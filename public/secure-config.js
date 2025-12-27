// Secure Configuration - No Exposed Credentials
const config = {
    // Demo mode for testing
    DEMO_MODE: true,
    
    // Network configuration
    NETWORK_ID: 11155111, // Sepolia testnet
    NETWORK_NAME: 'Sepolia',
    RPC_URL: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    
    // Contract addresses (update after deployment)
    CONTRACT_ADDRESS: '0x0000000000000000000000000000000000000000',
    
    // IPFS configuration (use environment variables in production)
    PINATA_API_KEY: '',
    PINATA_SECRET_KEY: '',
    PINATA_JWT: '',
    
    // API endpoints
    IPFS_GATEWAY: 'https://gateway.pinata.cloud/ipfs/',
    
    // File upload limits
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_FILE_TYPES: ['image/*', 'application/pdf', 'video/*', 'audio/*', 'text/*'],
    
    // Security settings
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    MAX_LOGIN_ATTEMPTS: 5,
    
    // Encryption settings
    ENCRYPTION_ALGORITHM: 'AES-256-GCM'
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else {
    window.config = config;
}