const DISCORD_USER_ID = '1287723093770506253'; 
let activityStartTimestamp = null;
let timerInterval = null;

function parseActivityImage(imgId, appId) {
    if (!imgId) return 'https://cdn.discordapp.com/embed/avatars/0.png';
    if (imgId.startsWith('mp:external/')) {
        return imgId.replace('mp:external/', 'https://media.discordapp.net/external/');
    } else if (imgId.startsWith('spotify:')) {
        return `https://i.scdn.co/image/${imgId.split(':')[1]}`;
    } else if (appId) {
        return `https://cdn.discordapp.com/app-assets/${appId}/${imgId}.webp`;
    }
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
}

function startLiveTimer(startTimestamp) {
    if (timerInterval) clearInterval(timerInterval);
    const timeElement = document.getElementById('rpc-time');
    
    function updateTimerString() {
        if (!timeElement) return;
        const now = Date.now();
        const diff = now - startTimestamp;
        
        if (diff < 0) {
            timeElement.innerText = "00:00 transcurridos";
            return;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (num) => String(num).padStart(2, '0');
        
        if (hours > 0) {
            timeElement.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} transcurridos`;
        } else {
            timeElement.innerText = `${pad(minutes)}:${pad(seconds)} transcurridos`;
        }
    }

    updateTimerString();
    timerInterval = setInterval(updateTimerString, 1000);
}

async function updateDiscordStatus() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}?t=${Date.now()}`);
        const data = await response.json();

        if (!data.success) {
            console.warn("Lanyard API: El usuario no se encuentra en el servidor común o tiene la privacidad apagada.");
            document.getElementById('display-name').innerText = "Faby";
            document.getElementById('display-username').innerText = "@offline";
            return; 
        }

        const discordData = data.data;
        const status = discordData.discord_status;
        
        const pfpImg = document.getElementById('pfp-image');
        if (pfpImg && discordData.discord_user.avatar) {
            pfpImg.src = `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${discordData.discord_user.avatar}.webp?size=128`;
        }

        const displayName = document.getElementById('display-name');
        const displayUsername = document.getElementById('display-username');
        
        if (displayName) {
            displayName.innerText = discordData.discord_user.global_name || discordData.discord_user.username;
        }
        if (displayUsername) {
            displayUsername.innerText = `@${discordData.discord_user.username}`;
        }

        const indicator = document.getElementById('status-indicator');
        if (indicator) {
            indicator.className = 'status-indicator'; 
            if (status === 'online') indicator.classList.add('status-online');
            else if (status === 'idle') indicator.classList.add('status-idle');
            else if (status === 'dnd') indicator.classList.add('status-dnd');
        }

        const rpcContainer = document.getElementById('rpc-container');
        const rpcName = document.getElementById('rpc-name');
        const rpcDetails = document.getElementById('rpc-details');
        const rpcState = document.getElementById('rpc-state');
        const rpcMainImg = document.getElementById('rpc-main-img');
        const rpcSubImg = document.getElementById('rpc-sub-img');
        const rpcTime = document.getElementById('rpc-time');

        const activities = discordData.activities;
        
        if (activities && activities.length > 0) {
            const game = activities.find(a => a.type === 0 || a.type === 1); 
            
            if (game) {
                if (rpcName) rpcName.innerText = game.name;
                if (rpcDetails) rpcDetails.innerText = game.details || '';
                if (rpcState) rpcState.innerText = game.state || '';
                
                if (rpcMainImg) {
                    const largeImgId = game.assets ? game.assets.large_image : null;
                    rpcMainImg.src = parseActivityImage(largeImgId, game.application_id);
                }

                if (rpcSubImg) {
                    const smallImgId = game.assets ? game.assets.small_image : null;
                    if (smallImgId) {
                        rpcSubImg.src = parseActivityImage(smallImgId, game.application_id);
                        rpcSubImg.style.display = 'block';
                    } else {
                        rpcSubImg.style.display = 'none';
                    }
                }

                if (game.timestamps && game.timestamps.start) {
                    if (activityStartTimestamp !== game.timestamps.start) {
                        activityStartTimestamp = game.timestamps.start;
                        startLiveTimer(activityStartTimestamp);
                    }
                    if (rpcTime) rpcTime.style.display = 'block';
                } else {
                    if (timerInterval) clearInterval(timerInterval);
                    if (rpcTime) rpcTime.style.display = 'none';
                    activityStartTimestamp = null;
                }

                if (rpcContainer) rpcContainer.style.display = 'block';
            } else {
                if (rpcContainer) rpcContainer.style.display = 'none';
                if (timerInterval) clearInterval(timerInterval);
            }
        } else {
            if (rpcContainer) rpcContainer.style.display = 'none';
            if (timerInterval) clearInterval(timerInterval);
        }
    } catch (error) {
        console.error("Error consultando Lanyard API:", error);
    }
}

updateDiscordStatus();
setInterval(updateDiscordStatus, 5000);


/* ==========================================================================
   SISTEMA PARALLAX GLOBAL E INCLINACIÓN TRIDIMENSIONAL
   ========================================================================= */
const card = document.getElementById('discord-card');
const MAX_TILT_DEG = 10; 
let globalMouseX = 0;
let globalMouseY = 0;

window.addEventListener('mousemove', (e) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const positionX = (e.clientX / width) - 0.5;
    const positionY = (e.clientY / height) - 0.5;
    
    globalMouseX = positionX;
    globalMouseY = positionY;
    
    const rotateY = (positionX * MAX_TILT_DEG * 2).toFixed(2);
    const rotateX = (-positionY * MAX_TILT_DEG * 2).toFixed(2);
    
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    card.style.boxShadow = `${-rotateY * 1.5}px ${rotateX * 1.5}px 45px rgba(0, 0, 0, 0.5)`;
});

document.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    card.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.4)';
    globalMouseX = 0;
    globalMouseY = 0;
});


/* ==========================================================================
   MOTOR DE PARTÍCULAS (ESTRELLAS / COPOS EN FUSIÓN DE INERCIA)
   ========================================================================== */
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];
const numberOfParticles = 65;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5; 
        this.speedY = Math.random() * 0.4 + 0.1; 
        this.opacity = Math.random() * 0.5 + 0.3; 
    }
    update() {
        this.y += this.speedY;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }
    draw() {
        ctx.beginPath();
        const parallaxX = this.x + (globalMouseX * -35 * this.size);
        const parallaxY = this.y + (globalMouseY * -35 * this.size);
        ctx.arc(parallaxX, parallaxY, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(171, 201, 253, ${this.opacity})`; 
        ctx.fill();
    }
}

function initParticles() {
    particlesArray = [];
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
}
initParticles();
animateParticles();


/* ==========================================================================
   LÓGICA DEL CARRUSEL RESPONSIVA E INTELIGENTE
   ========================================================================== */
const carousel = document.getElementById('games-carousel');
const prevBtn = document.getElementById('carousel-prev');
const nextBtn = document.getElementById('carousel-next');

const isMobileDevice = window.matchMedia("(pointer: coarse)").matches;
let isCarouselHovered = false;
const scrollSpeedPixel = 0.6;

if (!isMobileDevice) {
    // COMPORTAMIENTO PC: LOOP INFINITO
    const originalCards = Array.from(carousel.children);
    originalCards.forEach(cardNode => {
        const clone = cardNode.cloneNode(true);
        carousel.appendChild(clone);
    });

    function autoScrollCarouselLoop() {
        if (!isCarouselHovered) {
            carousel.scrollLeft += scrollSpeedPixel;
            if (carousel.scrollLeft >= carousel.scrollWidth / 2) {
                carousel.scrollLeft = 0;
            }
        }
        requestAnimationFrame(autoScrollCarouselLoop);
    }
    requestAnimationFrame(autoScrollCarouselLoop);

    const pauseCarousel = () => isCarouselHovered = true;
    const resumeCarousel = () => isCarouselHovered = false;

    carousel.addEventListener('mouseenter', pauseCarousel);
    carousel.addEventListener('mouseleave', resumeCarousel);
    prevBtn.addEventListener('mouseenter', pauseCarousel);
    prevBtn.addEventListener('mouseleave', resumeCarousel);
    nextBtn.addEventListener('mouseenter', pauseCarousel);
    nextBtn.addEventListener('mouseleave', resumeCarousel);

} else {
    // COMPORTAMIENTO TELÉFONOS: SIN LOOP, SCROLL TÁCTIL SUAVE
    carousel.style.scrollSnapType = "x mandatory";
    Array.from(carousel.children).forEach(cardNode => {
        cardNode.style.scrollSnapAlign = "start";
    });
}

prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -120, behavior: 'smooth' });
    if (!isMobileDevice && carousel.scrollLeft <= 0) {
        carousel.scrollLeft = carousel.scrollWidth / 2;
    }
});

nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: 120, behavior: 'smooth' });
    if (!isMobileDevice && carousel.scrollLeft >= carousel.scrollWidth / 2) {
        carousel.scrollLeft = 0;
    }
});