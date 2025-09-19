// Google Analytics 4 Integration
class GoogleAnalytics {
    constructor() {
        this.measurementId = null;
        this.isLoaded = false;
    }

    // Initialize Google Analytics
    init(measurementId) {
        this.measurementId = measurementId;
        this.loadGoogleAnalytics();
    }

    // Load Google Analytics script
    loadGoogleAnalytics() {
        if (this.isLoaded || !this.measurementId) return;

        // Проверяем, загружен ли уже gtag
        if (typeof gtag !== 'undefined') {
            this.isLoaded = true;
            console.log('Google Analytics already loaded');
            return;
        }

        // Load gtag script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
        document.head.appendChild(script);

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', this.measurementId, {
            page_title: document.title,
            page_location: window.location.href
        });

        this.isLoaded = true;
        console.log('Google Analytics loaded');
    }

    // Track page view
    trackPageView(pagePath, pageTitle) {
        if (!this.isLoaded) return;
        
        gtag('config', this.measurementId, {
            page_path: pagePath,
            page_title: pageTitle
        });
    }

    // Track custom events
    trackEvent(eventName, parameters = {}) {
        if (!this.isLoaded) return;
        
        gtag('event', eventName, parameters);
    }

    // Track IP detection
    trackIPDetection(ipType, success = true) {
        this.trackEvent('ip_detection', {
            ip_type: ipType,
            success: success
        });
    }

    // Track tool usage
    trackToolUsage(toolName, action = 'used') {
        this.trackEvent('tool_usage', {
            tool_name: toolName,
            action: action
        });
    }

    // Track speed test
    trackSpeedTest(downloadSpeed, ping, quality) {
        this.trackEvent('speed_test', {
            download_speed: downloadSpeed,
            ping: ping,
            quality: quality
        });
    }

    // Track copy IP action
    trackCopyIP(ipType) {
        this.trackEvent('copy_ip', {
            ip_type: ipType
        });
    }
}

// Initialize Google Analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Replace 'G-XXXXXXXXXX' with your actual Measurement ID
    const measurementId = 'G-F2WSG6PBHJ'; // Ваш Measurement ID
    
    if (measurementId && measurementId !== 'G-XXXXXXXXXX') {
        const analytics = new GoogleAnalytics();
        analytics.init(measurementId);
        
        // Make analytics globally available
        window.GoogleAnalytics = analytics;
        
        // Ждем загрузки gtag, затем отслеживаем страницу
        const checkGtag = () => {
            if (typeof gtag !== 'undefined') {
                analytics.trackPageView(window.location.pathname, document.title);
            } else {
                setTimeout(checkGtag, 100);
            }
        };
        checkGtag();
    }
});

// Export for global access
window.GoogleAnalytics = GoogleAnalytics;
