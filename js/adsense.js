// Google AdSense Integration
class AdSenseManager {
    constructor() {
        this.isAdSenseLoaded = false;
        this.adUnits = [];
    }

    // Initialize AdSense
    init() {
        // Load AdSense script
        this.loadAdSenseScript();
        
        // Create ad containers
        this.createAdContainers();
    }

    // Load Google AdSense script
    loadAdSenseScript() {
        if (this.isAdSenseLoaded) return;
        
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7600501505462222';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            this.isAdSenseLoaded = true;
            console.log('AdSense script loaded');
        };
        document.head.appendChild(script);
    }

    // Create ad containers
    createAdContainers() {
        // Header ad (banner)
        this.createAdUnit('header-ad', {
            slot: '1234567890',
            format: 'auto',
            responsive: true,
            style: { display: 'block' }
        });

        // Sidebar ad (rectangle)
        this.createAdUnit('sidebar-ad', {
            slot: '1234567891',
            format: 'rectangle',
            style: { display: 'block' }
        });

        // Footer ad (banner)
        this.createAdUnit('footer-ad', {
            slot: '1234567892',
            format: 'auto',
            responsive: true,
            style: { display: 'block' }
        });

        // In-content ad (after tools section)
        this.createAdUnit('content-ad', {
            slot: '1234567893',
            format: 'auto',
            responsive: true,
            style: { display: 'block' }
        });
    }

    // Create individual ad unit
    createAdUnit(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const adUnit = document.createElement('ins');
        adUnit.className = 'adsbygoogle';
        adUnit.style.display = 'block';
        adUnit.setAttribute('data-ad-client', 'ca-pub-7600501505462222');
        adUnit.setAttribute('data-ad-slot', config.slot);
        adUnit.setAttribute('data-ad-format', config.format);
        
        if (config.responsive) {
            adUnit.setAttribute('data-full-width-responsive', 'true');
        }

        // Apply custom styles
        Object.assign(adUnit.style, config.style);

        container.appendChild(adUnit);
        this.adUnits.push(adUnit);
    }

    // Push ads to AdSense
    pushAds() {
        if (!this.isAdSenseLoaded) {
            console.log('AdSense not loaded yet');
            return;
        }

        this.adUnits.forEach(adUnit => {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error('Error pushing ad:', e);
            }
        });
    }

    // Show/hide ads based on user preferences
    toggleAds(show) {
        const adContainers = document.querySelectorAll('[id$="-ad"]');
        adContainers.forEach(container => {
            container.style.display = show ? 'block' : 'none';
        });
    }

    // Handle ad errors
    handleAdError(adUnit, error) {
        console.error('AdSense error:', error);
        // Hide the ad unit on error
        adUnit.style.display = 'none';
    }
}

// Initialize AdSense when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const adManager = new AdSenseManager();
    adManager.init();
    
    // Push ads after a short delay to ensure page is fully loaded
    setTimeout(() => {
        adManager.pushAds();
    }, 1000);
});

// Export for global access
window.AdSenseManager = AdSenseManager;
