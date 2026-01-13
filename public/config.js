/**
 * Application Configuration - Simplified
 */
const config = {
    DEMO_MODE: false,
    VERSION: '2.0.0',
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    ALLOWED_TYPES: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/avi',
        'audio/mp3', 'audio/wav', 'audio/ogg',
        'application/pdf', 'application/msword',
        'text/plain', 'text/csv'
    ],
    ITEMS_PER_PAGE: 20,
    ANIMATION_DURATION: 300
};