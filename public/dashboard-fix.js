/**
 * Dashboard Fix - Real MetaMask Integration
 */

// Ensure all required globals exist
if (!window.storage) {
    window.storage = {
        async getUser(walletAddress) {
            const userData = localStorage.getItem('evidUser_' + walletAddress);
            return userData ? JSON.parse(userData) : null;
        },
        async saveUser(userData) {
            localStorage.setItem('evidUser_' + userData.walletAddress, JSON.stringify(userData));
            return true;
        }
    };
}

if (!window.simpleNotifications) {
    window.simpleNotifications = {
        addNotification: (title, message, type) => {
            console.log(`${type}: ${title} - ${message}`);
        }
    };
}

// Prevent console errors from missing functions
window.gtag = window.gtag || function() { console.log('Analytics disabled'); };

console.log('Dashboard fix loaded - Real MetaMask mode');