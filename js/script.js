const PAGE_TITLES = {
    home: "Markaz-ul-Uloom School of Arabic & Islamic Studies",
    about: "About Us | Markaz-ul-Uloom",
    services: "Admissions | Markaz-ul-Uloom",
    programmes: "Programmes | Markaz-ul-Uloom",
    staff: "Staff | Markaz-ul-Uloom",
    students: "Students | Markaz-ul-Uloom",
    alumni: "Alumni | Markaz-ul-Uloom",
    administration: "Administration | Markaz-ul-Uloom",
    anniversary: "40th Anniversary | Markaz-ul-Uloom",
    "masjid-project": "Al-Uloom Central Mosque | Markaz-ul-Uloom",
    contact: "Contact Us | Markaz-ul-Uloom",
    events: "Events | Markaz-ul-Uloom",
    donate: "Donate | Markaz-ul-Uloom"
};

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll(".page").forEach(page => {
        page.style.display = "none";
        page.classList.remove("active");
    });

    // Deactivate all navigation buttons
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.remove("active");
    });

    // Show the selected page and activate its button
    const selectedPage = document.getElementById(pageId + "-page");
    const selectedButton = document.getElementById(pageId + "-btn");

    if (selectedPage) {
        selectedPage.style.display = "block";
        selectedPage.classList.add("active");
    }
    if (selectedButton) {
        selectedButton.classList.add("active");
    }

    // Update tab title so bookmarks/history show the actual section
    if (PAGE_TITLES[pageId]) {
        document.title = PAGE_TITLES[pageId];
    }

    // Update URL hash
    window.location.hash = pageId;

    // Scroll to top
    window.scrollTo(0, 0);
}

// Handle hash-based navigation
function handleHashNavigation() {
    const hash = window.location.hash.substring(1); // Remove the # symbol
    const pageId = hash && hash !== '' ? hash : 'home';

    // Avoid redundant re-render: showPage() itself updates the hash, which
    // fires this same handler again via 'hashchange'. Skip if already shown.
    const currentActive = document.querySelector('.page.active');
    if (currentActive && currentActive.id === pageId + '-page') {
        return;
    }

    showPage(pageId);
}

// Handle initial page load
window.addEventListener("DOMContentLoaded", () => {
    handleHashNavigation();
});

// Keep the footer copyright year current without manual edits every year
document.addEventListener("DOMContentLoaded", () => {
    const year = new Date().getFullYear();

    const yearEl = document.getElementById("copyright-year");
    if (yearEl) {
        yearEl.textContent = year;
    }

    const yearArEl = document.getElementById("copyright-year-ar");
    if (yearArEl) {
        const easternArabicDigits = "٠١٢٣٤٥٦٧٨٩";
        yearArEl.textContent = String(year).replace(/[0-9]/g, d => easternArabicDigits[d]);
    }
});

// Handle hash changes (when user navigates with back/forward buttons)
window.addEventListener("hashchange", () => {
    handleHashNavigation();
});

// The header used to hide on scroll-down and reappear on scroll-up, but
// that scroll listener + transform transition was the source of visible
// lag/jank on scroll (especially on phones). The header is simpler and
// smoother just staying fixed in place at all times.

// Close the mobile nav menu after tapping a nav item, so users aren't
// left staring at the open menu after navigating on a phone.
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    nav.addEventListener('click', (e) => {
        if (e.target.closest('.nav-btn, .dropdown-item') && nav.classList.contains('mobile-open')) {
            toggleMobileMenu();
        }
    });
});




// Dynamic Prayer Times Functionality
class PrayerTimesManager {
    constructor() {
        this.latitude = 6.5244; // Lagos, Nigeria latitude
        this.longitude = 3.3792; // Lagos, Nigeria longitude
        this.timezone = 'Africa/Lagos';
        this.method = 2; // Islamic Society of North America (ISNA) method
        this.initializePrayerTimes();
    }

    async fetchPrayerTimes() {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = today.getDate();
            
            // Using Aladhan API for prayer times
            const response = await fetch(
                `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${this.latitude}&longitude=${this.longitude}&method=${this.method}&tune=0,0,0,0,0,0,0,0,0`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch prayer times');
            }
            
            const data = await response.json();
            return data.data.timings;
        } catch (error) {
            console.error('Error fetching prayer times:', error);
            // Return fallback times if API fails
            return this.getFallbackTimes();
        }
    }

    getFallbackTimes() {
        // Fallback prayer times for Lagos (approximate)
        return {
            Fajr: "05:13",
            Dhuhr: "12:47", 
            Asr: "16:15",
            Maghrib: "19:04",
            Isha: "20:15"
        };
    }

    formatTime(time24) {
        // Convert 24-hour format to 12-hour format
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    async updatePrayerTimesDisplay() {
        const timings = await this.fetchPrayerTimes();

        // Update every prayer time display on the page (homepage + contact page)
        const prayerTimeElements = document.querySelectorAll('.prayer-time-display');
        prayerTimeElements.forEach(element => {
            const prayerName = element.dataset.prayer;
            if (timings[prayerName]) {
                element.textContent = this.formatTime(timings[prayerName]);
            }
        });
    }

    initializePrayerTimes() {
        // Show today's times as soon as the page loads
        this.updatePrayerTimesDisplay();

        // Then silently refresh once a day at midnight — prayer times only
        // change once per day, so there's no need for anything more frequent
        // or any user-facing control.
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        setTimeout(() => {
            this.updatePrayerTimesDisplay();
            setInterval(() => {
                this.updatePrayerTimesDisplay();
            }, 86400000); // 24 hours
        }, msUntilMidnight);
    }
}

// Initialize prayer times manager when DOM is loaded; refreshing happens
// automatically in the background (see initializePrayerTimes above).
document.addEventListener('DOMContentLoaded', () => {
    new PrayerTimesManager();
});

// Enhanced Loading Animation
function showLoading(element) {
    element.classList.add('loading');
    setTimeout(() => {
        element.classList.remove('loading');
    }, 1500);
}

// Intersection Observer for Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Enhanced Mobile Menu Toggle
function toggleMobileMenu() {
    const nav = document.querySelector('.nav');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const isOpen = nav.classList.contains('mobile-open');

    if (isOpen) {
        nav.classList.remove('mobile-open');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    } else {
        nav.classList.add('mobile-open');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
        // The menu is a full-screen overlay now, so lock background scroll
        // while it's open rather than letting the page scroll behind it.
        document.body.style.overflow = 'hidden';
    }
}

// Enhanced Page Initialization
document.addEventListener("DOMContentLoaded", () => {
    // Initialize scroll animations
    document.querySelectorAll('.section, .card').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        observer.observe(element);
    });

    // Initialize navigation
    handleHashNavigation();

    // Initialize loading animations for images
    document.querySelectorAll('img').forEach(img => {
        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', () => {
                img.style.opacity = '1';
            });
        }
    });
    
    // Add enhanced hover effects to cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            showLoading(card);
        });
    });
    
    console.log('Enhanced Markazul-Uloom website loaded successfully!');
});

// Enhanced Error Handling
window.addEventListener('error', (e) => {
    console.error('Website error:', e.error);
    // Could implement user-friendly error reporting here
});

// Performance Monitoring
window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`Page loaded in ${Math.round(loadTime)}ms`);
    
    // Could implement performance analytics here
});

// Enhanced Accessibility Features
document.addEventListener('keydown', (e) => {
    // Enhanced keyboard navigation
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
    
    // Escape key to close mobile menu
    if (e.key === 'Escape') {
        const nav = document.querySelector('.nav');
        if (nav.classList.contains('mobile-open')) {
            toggleMobileMenu();
        }
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
});

// Service Worker Registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Could register service worker here for PWA functionality
        console.log('Service Worker support detected');
    });
}











