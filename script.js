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

// Loop de actualización de presencia cada 5 segundos
updateDiscordStatus();
setInterval(updateDiscordStatus, 5000);


/* ==========================================================================
   SISTEMA DE INTERACCIÓN PARALLAX / TILT (PC Y DISPOSITIVOS MÓVILES)
   ========================================================================== */
const card = document.getElementById('discord-card');
const MAX_TILT_DEG = 8; // Ángulo máximo muy sutil para que no se incline de forma exagerada

// 1. EFECTO PARALLAX DE ESCRITORIO (MOUSEMOVE)
card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    
    // Calcular coordenadas del cursor relativas al centro de la tarjeta (-0.5 a 0.5)
    const positionX = (e.clientX - rect.left) / rect.width - 0.5;
    const positionY = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Calcular rotaciones físicas (El eje Y maneja la inclinación horizontal, el eje X la vertical)
    const rotateY = (positionX * MAX_TILT_DEG * 2).toFixed(2);
    const rotateX = (-positionY * MAX_TILT_DEG * 2).toFixed(2);
    
    // Aplicar transformación 3D instantánea suavizada por el CSS transition
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    card.style.boxShadow = `${-rotateY}px ${rotateX}px 50px rgba(0, 0, 0, 0.55)`;
});

// REGRESO AUTOMÁTICO: Cuando el mouse sale de la tarjeta, vuelve perfectamente a su origen
card.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    card.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.4)';
});


// 2. EFECTO GIROSCOPIO DE TELÉFONOS (DEVICE ORIENTATION)
window.addEventListener('deviceorientation', (e) => {
    // Si el dispositivo no tiene soporte físico de giroscopio o los datos vienen vacíos
    if (e.beta === null || e.gamma === null) return;
    
    // beta representa la inclinación hacia adelante/atrás (-180 a 180). Normal holding ~60deg.
    // gamma representa la inclinación hacia izquierda/derecha (-90 a 90). Normal holding ~0deg.
    const clampedBeta = Math.min(Math.max(e.beta - 60, -25), 25); 
    const clampedGamma = Math.min(Math.max(e.gamma, -25), 25);
    
    // Multiplicador bajo (0.25) para lograr un desplazamiento muy sutil al mover el móvil
    const rotateX = (clampedBeta * 0.25).toFixed(2);
    const rotateY = (clampedGamma * 0.25).toFixed(2);
    
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    card.style.boxShadow = `${-rotateY}px ${rotateX}px 45px rgba(0, 0, 0, 0.45)`;
});