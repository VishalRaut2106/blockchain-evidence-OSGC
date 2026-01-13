/**
 * Simple Notifications System for Admin
 */

window.simpleNotifications = {
    addNotification: function(title, message, type) {
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    }
};