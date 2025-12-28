// Google Analytics Configuration
// Replace 'G-XXXXXXXXXX' with your actual Google Analytics Measurement ID

const GA_MEASUREMENT_ID = 'G-KEYDE0ZH4Z'; // Your actual GA4 Measurement ID

// Initialize Google Analytics
function initializeAnalytics() {
    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);

    // Make gtag globally available
    window.gtag = gtag;
}

// Track custom events
function trackEvent(eventName, parameters = {}) {
    if (window.gtag) {
        gtag('event', eventName, parameters);
    }
}

// Track page views
function trackPageView(pageName) {
    if (window.gtag) {
        gtag('event', 'page_view', {
            page_title: pageName,
            page_location: window.location.href
        });
    }
}

// Track user actions
function trackUserAction(action, category = 'user_interaction') {
    trackEvent(action, {
        event_category: category,
        event_label: window.location.pathname
    });
}

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAnalytics);