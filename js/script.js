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

// Enhanced Form Validation
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('.form-input');
    let isValid = true;
    
    inputs.forEach(input => {
        const value = input.value.trim();
        const errorElement = input.parentNode.querySelector('.error-message');
        
        // Remove existing error states
        input.classList.remove('error');
        if (errorElement) {
            errorElement.remove();
        }
        
        // Validate based on input type
        if (input.required && !value) {
            showFieldError(input, 'This field is required');
            isValid = false;
        } else if (input.type === 'email' && value && !isValidEmail(value)) {
            showFieldError(input, 'Please enter a valid email address');
            isValid = false;
        } else if (input.type === 'tel' && value && !isValidPhone(value)) {
            showFieldError(input, 'Please enter a valid phone number');
            isValid = false;
        }
    });
    
    return isValid;
}

function showFieldError(input, message) {
    input.classList.add('error');
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    input.parentNode.appendChild(errorElement);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

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


// Enhanced Contact Form Handler
function handleContactForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    
    // Validate form
    if (!validateForm(form)) {
        return false;
    }
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Sending...';
    
    // Get form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };
    
    // Simulate form submission (in real implementation, this would send to a server)
    setTimeout(() => {
        // Create email content
        const emailSubject = `Contact Form: ${data.subject}`;
        const emailBody = `
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Subject: ${data.subject}

Message:
${data.message}

---
Sent from Markazul-Uloom website contact form
        `.trim();
        
        // Open email client with pre-filled content
        const mailtoLink = `mailto:markazululoomalagbado40@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoLink);
        
        // Show success message
        submitButton.innerHTML = '✓ Message Sent!';
        submitButton.style.background = '#28a745';
        
        // Show success notification
        showNotification('Thank you for your message! Your email client has opened with your message pre-filled. Please send the email to complete your inquiry.', 'success');
        
        // Reset form
        form.reset();
        
        // Reset button after delay
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            submitButton.style.background = '';
        }, 3000);
        
    }, 1500);
    
    return false;
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#0056b3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Add CSS animation for spinning loader
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);









