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
    
    // Update URL hash
    window.location.hash = pageId;
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Handle hash-based navigation
function handleHashNavigation() {
    const hash = window.location.hash.substring(1); // Remove the # symbol
    if (hash && hash !== '') {
        showPage(hash);
    } else {
        showPage('home');
    }
}

// Handle initial page load
window.addEventListener("DOMContentLoaded", () => {
    handleHashNavigation();
});

// Handle hash changes (when user navigates with back/forward buttons)
window.addEventListener("hashchange", () => {
    handleHashNavigation();
});

// Simple Hide-on-Scroll Header Implementation (inspired by TUMF)
let lastScrollTop = 0;
let scrollThreshold = 10; // Minimum scroll distance to trigger hide/show

function initHideOnScrollHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    // Set initial state
    header.classList.add('header-visible');

    function handleScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // Prevent negative scrolling
        if (currentScroll < 0) return;
        
        // Calculate scroll direction
        const scrollDirection = currentScroll > lastScrollTop ? 'down' : 'up';
        const scrollDistance = Math.abs(currentScroll - lastScrollTop);
        
        // Only act if scroll distance is significant enough
        if (scrollDistance < scrollThreshold) return;
        
        if (scrollDirection === 'down' && currentScroll > 100) {
            // Scrolling down - hide header
            header.classList.remove('header-visible');
            header.classList.add('header-hidden');
        } else if (scrollDirection === 'up' || currentScroll <= 100) {
            // Scrolling up or at top - show header
            header.classList.remove('header-hidden');
            header.classList.add('header-visible');
        }
        
        lastScrollTop = currentScroll;
    }

    // Use throttled scroll listener for better performance
    let ticking = false;
    function throttledScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }

    // Add scroll listener
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Handle page load
    handleScroll();
}

// Initialize hide-on-scroll when DOM is ready
document.addEventListener('DOMContentLoaded', initHideOnScrollHeader);



// Handle custom donation card click
function handleCustomDonation() {
    // Create a modal or alert for custom donation
    const customAmount = prompt("Please enter your custom donation amount (₦):");
    
    if (customAmount && !isNaN(customAmount) && parseFloat(customAmount) > 0) {
        // Format the amount
        const formattedAmount = parseFloat(customAmount).toLocaleString();
        
        // Create a message for the user
        const message = `Thank you for your generous intention to donate ₦${formattedAmount}!\n\nTo proceed with your custom donation, please contact us through any of the following methods:\n\n• WhatsApp: +234 814 531 8366\n• Email: markazululoomalagbado40@gmail.com\n• Phone: +234 814 531 8366\n\nMention your custom amount of ₦${formattedAmount} when contacting us.`;
        
        alert(message);
        
        // Optionally scroll to contact methods section
        const contactSection = document.querySelector('.donation-methods');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    } else if (customAmount !== null) {
        alert("Please enter a valid donation amount.");
    }
}



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
        
        // Update footer prayer times
        const footerPrayerTimes = document.querySelector('.footer-prayer-times');
        if (footerPrayerTimes) {
            footerPrayerTimes.innerHTML = `
                <div>Fajr: ${this.formatTime(timings.Fajr)}</div>
                <div>Dhuhr: ${this.formatTime(timings.Dhuhr)}</div>
                <div>Asr: ${this.formatTime(timings.Asr)}</div>
                <div>Maghrib: ${this.formatTime(timings.Maghrib)}</div>
                <div>Isha: ${this.formatTime(timings.Isha)}</div>
            `;
        }

        // Update any other prayer times displays on the page
        const prayerTimeElements = document.querySelectorAll('.prayer-time-display');
        prayerTimeElements.forEach(element => {
            const prayerName = element.dataset.prayer;
            if (timings[prayerName]) {
                element.textContent = this.formatTime(timings[prayerName]);
            }
        });

        // Add last updated timestamp
        const lastUpdated = document.querySelector('.prayer-times-updated');
        if (lastUpdated) {
            const now = new Date();
            lastUpdated.textContent = `Last updated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        }
    }

    initializePrayerTimes() {
        // Update prayer times when page loads
        this.updatePrayerTimesDisplay();
        
        // Update prayer times every hour
        setInterval(() => {
            this.updatePrayerTimesDisplay();
        }, 3600000); // 1 hour = 3600000 milliseconds
        
        // Update prayer times at midnight (new day)
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.updatePrayerTimesDisplay();
            // Then update every 24 hours
            setInterval(() => {
                this.updatePrayerTimesDisplay();
            }, 86400000); // 24 hours = 86400000 milliseconds
        }, msUntilMidnight);
    }
}

// Initialize prayer times manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const prayerTimesManager = new PrayerTimesManager();
    
    // Make it globally accessible for manual updates
    window.prayerTimesManager = prayerTimesManager;
});

// Function to manually refresh prayer times
function refreshPrayerTimes() {
    if (window.prayerTimesManager) {
        window.prayerTimesManager.updatePrayerTimesDisplay();
    }
}



// Enhanced Navigation with Smooth Scrolling
function showPageSmooth(pageId) {
    // Hide all pages with fade effect
    document.querySelectorAll(".page").forEach(page => {
        page.style.opacity = '0';
        page.style.transform = 'translateY(20px)';
        setTimeout(() => {
            page.classList.remove("active");
        }, 300);
    });

    // Deactivate all navigation buttons
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.remove("active");
    });

    // Show the selected page with fade effect
    setTimeout(() => {
        const selectedPage = document.getElementById(pageId + "-page");
        const selectedButton = document.getElementById(pageId + "-btn");

        if (selectedPage) {
            selectedPage.classList.add("active");
            selectedPage.style.opacity = '1';
            selectedPage.style.transform = 'translateY(0)';
        }
        if (selectedButton) {
            selectedButton.classList.add("active");
        }
        
        // Update URL hash
        window.location.hash = pageId;
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
}

// Enhanced Prayer Times with Auto-Update
function updatePrayerTimes() {
    const prayerTimes = {
        Fajr: "5:13 AM",
        Dhuhr: "12:47 PM", 
        Asr: "4:15 PM",
        Maghrib: "7:04 PM",
        Isha: "8:15 PM"
    };
    
    // Update prayer times in all locations
    Object.keys(prayerTimes).forEach(prayer => {
        const elements = document.querySelectorAll(`[data-prayer="${prayer}"]`);
        elements.forEach(element => {
            element.textContent = prayerTimes[prayer];
        });
    });
    
    // Update last updated time
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    const updatedElements = document.querySelectorAll('.prayer-times-updated');
    updatedElements.forEach(element => {
        element.textContent = `Last updated: ${timeString}`;
    });
}

// Refresh prayer times function
function refreshPrayerTimes() {
    const button = event.target;
    button.style.transform = 'rotate(360deg)';
    button.disabled = true;
    
    setTimeout(() => {
        updatePrayerTimes();
        button.style.transform = 'rotate(0deg)';
        button.disabled = false;
        
        // Show success feedback
        button.textContent = '✓ Updated';
        setTimeout(() => {
            button.innerHTML = '🔄 Refresh Times';
        }, 2000);
    }, 1000);
}

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
    const isOpen = nav.classList.contains('mobile-open');
    
    if (isOpen) {
        nav.classList.remove('mobile-open');
        nav.style.maxHeight = '0';
    } else {
        nav.classList.add('mobile-open');
        nav.style.maxHeight = nav.scrollHeight + 'px';
    }
}

// Enhanced Donation Amount Handler
function handleCustomDonation() {
    const customAmount = prompt('Enter your donation amount (₦):');
    if (customAmount && !isNaN(customAmount) && parseFloat(customAmount) > 0) {
        alert(`Thank you for your generous donation of ₦${parseFloat(customAmount).toLocaleString()}! Please proceed with the payment using our provided bank details.`);
    }
}

// Enhanced Page Initialization
document.addEventListener("DOMContentLoaded", () => {
    // Initialize prayer times
    updatePrayerTimes();
    
    // Set up auto-update for prayer times (every hour)
    setInterval(updatePrayerTimes, 3600000);
    
    // Initialize scroll animations
    document.querySelectorAll('.section, .card').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        observer.observe(element);
    });
    
    // Initialize navigation
    handleHashNavigation();
    
    // Add click handlers for enhanced navigation
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const pageId = e.target.id.replace('-btn', '');
            showPageSmooth(pageId);
        });
    });
    
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









