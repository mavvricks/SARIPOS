document.addEventListener('DOMContentLoaded', () => {

    function typewriterEffect() {
        const titleEl = document.getElementById('hero-title');
        if (!titleEl) return;
        const text = "Your Vibrant Manila Adventure Begins.";
        let i = 0;
        titleEl.innerHTML = "";
        function type() { if (i < text.length) { titleEl.innerHTML += text.charAt(i++); setTimeout(type, 80); } }
        type();
    }

    function setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el));
    }

    function setupTestimonialCarousel() {
        const slider = document.querySelector('.testimonial-slider');
        if (!slider) return;

        const testimonials = [
            {
                quote: "The location is simply unbeatable for our US Embassy appointment. We walked there in minutes! The staff was incredibly helpful and the room was spotless. Made the whole process so much less stressful.",
                author: "Maria S."
            },
            {
                quote: "An absolute gem for tourists! We explored Intramuros and the museums all on foot. The hotel felt like a peaceful haven after a long day of sightseeing. I would recommend this to anyone visiting Manila.",
                author: "Kenji T."
            },
            {
                quote: "What a wonderful stay. The Filipino hospitality here is second to none. Everyone from the front desk to the housekeeping staff was warm and accommodating. Excellent value for the service and location!",
                author: "David L."
            }
        ];
        
        // Populate slides
        testimonials.forEach(testimonial => {
            const slide = document.createElement('div');
            slide.className = 'testimonial-slide';
            slide.innerHTML = `
                <div class="testimonial-card">
                    <div class="star-rating">★★★★★</div>
                    <blockquote>"${testimonial.quote}"</blockquote>
                    <footer>- ${testimonial.author}</footer>
                </div>
            `;
            slider.appendChild(slide);
        });

        // Duplicate for infinite effect
        const slides = slider.querySelectorAll('.testimonial-slide');
        slides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.setAttribute('aria-hidden', true);
            slider.appendChild(clone);
        });

        slider.style.animation = `slide ${slides.length * 7}s linear infinite`;
    }

    // --- Service Request Modal Logic ---
    function setupServiceRequestModal() {
        const requestBtn = document.getElementById('request-service-btn');
        const modal = document.getElementById('service-request-modal');
        if (!requestBtn || !modal) return; // Exit if elements aren't on this page

        const closeBtn = modal.querySelector('.close-modal');
        const validateBtn = document.getElementById('validate-ref-btn');
        const refInput = document.getElementById('service-ref-number');
        const errorEl = document.getElementById('service-ref-error');

        // Open modal
        requestBtn.addEventListener('click', () => {
            modal.classList.add('show');
        });

        // Close modal
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            errorEl.textContent = ''; // Clear error on close
            refInput.value = '';
        });

        // Validate and redirect
        validateBtn.addEventListener('click', () => {
            const refNumber = refInput.value.trim().toUpperCase();
            if (!refNumber) {
                errorEl.textContent = 'Please enter a reference number.';
                return;
            }

            // Check localStorage for the booking (using the same key as booking.js)
            const bookingData = localStorage.getItem(`booking_${refNumber}`);
            
            if (bookingData) {
                // Success: Redirect to the service request page with the ref number
                window.location.href = `service-request.html?ref=${refNumber}`;
            } else {
                // Fail: Show error message
                errorEl.textContent = 'Reference number not found. Please check and try again.';
            }
        });
    }

    // --- NEW: Nav Scroll Highlighting Logic ---
    function setupNavScrollHighlight() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        const navLinksMap = new Map();
        navLinks.forEach(link => {
            navLinksMap.set(link.getAttribute('href'), link);
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.getAttribute('id');
                const link = navLinksMap.get(`#${id}`);
                
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    // Remove active from all
                    navLinks.forEach(l => l.classList.remove('active'));
                    // Add active to the current one
                    if(link) {
                        link.classList.add('active');
                    }
                }
            });
        }, { threshold: 0.5 }); // Triggers when 50% of the section is visible

        // Observe all sections
        sections.forEach(section => {
            observer.observe(section);
        });
    }


    // --- INITIALIZATION ---
    typewriterEffect();
    setupScrollAnimations();
    setupTestimonialCarousel();
    setupServiceRequestModal(); // Initialize the modal
    setupNavScrollHighlight(); // Initialize the nav highlighting
});