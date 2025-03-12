import { terrain } from './environment.js';
import { timeSystem } from './TimeSystem.js';
import { player } from '../entity/player.js';

let terrainCacheCanvas = null;
export const terrainCache = {
    terrainCacheNeedsUpdate: true,
    newDiscoveries: []
};

function initializeTerrainCache() {
    terrainCacheCanvas = document.createElement('canvas');
    terrainCacheCanvas.width = terrain.terrainMapCanvas.width;
    terrainCacheCanvas.height = terrain.terrainMapCanvas.height;
    const ctx = terrainCacheCanvas.getContext('2d');
    
    // Draw the static terrain map
    ctx.drawImage(terrain.terrainMapCanvas, 0, 0);
    
    // Apply full fog initially (since nothing is known yet)
    ctx.globalAlpha = 0.5; // Semi-transparent fog
    ctx.fillStyle = 'rgb(102, 102, 102)';
    ctx.fillRect(0, 0, terrainCacheCanvas.width, terrainCacheCanvas.height);
    ctx.globalAlpha = 1.0; // Reset alpha
}

function renderTerrainToCanvas(canvas, terrain, player) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!terrainCacheCanvas) initializeTerrainCache();

    if (terrainCache.terrainCacheNeedsUpdate) {
        const cacheCtx = terrainCacheCanvas.getContext('2d');
        
        if (terrainCache.newDiscoveries && terrainCache.newDiscoveries.length > 0) {
            // Calculate segment size on the canvas
            const widthSegments = terrain.geometry.parameters.widthSegments;
            const heightSegments = terrain.geometry.parameters.heightSegments;
            const segWidth = terrainCacheCanvas.width / widthSegments;
            const segHeight = terrainCacheCanvas.height / heightSegments;

            // Update only the newly discovered segments
            terrainCache.newDiscoveries.forEach(({ x, z }) => {
                const canvasX = x * segWidth;
                const canvasY = z * segHeight;
                // Redraw the terrain segment to remove fog
                cacheCtx.drawImage(
                    terrain.terrainMapCanvas,
                    canvasX, canvasY, segWidth, segHeight, // Source rectangle
                    canvasX, canvasY, segWidth, segHeight  // Destination rectangle
                );
            });
            
            // Clear the discoveries list after processing
            terrainCache.newDiscoveries = [];
        }
        // Note: No else clause needed; initial full render is handled in initializeTerrainCache
        
        terrainCache.terrainCacheNeedsUpdate = false;
    }

    // Crop and draw to the minimap canvas (unchanged)
    const playerX = (player.object.position.x / terrain.width + 0.5) * terrainCacheCanvas.width;
    const playerZ = (player.object.position.z / terrain.height + 0.5) * terrainCacheCanvas.height;
    const viewWidth = canvas.width;
    const viewHeight = canvas.height;

    let srcX = playerX - viewWidth / 2;
    let srcY = playerZ - viewHeight / 2;
    srcX = Math.max(0, Math.min(srcX, terrainCacheCanvas.width - viewWidth));
    srcY = Math.max(0, Math.min(srcY, terrainCacheCanvas.height - viewHeight));

    ctx.drawImage(terrainCacheCanvas, srcX, srcY, viewWidth, viewHeight, 0, 0, viewWidth, viewHeight);
    drawPlayerIndicator(ctx, player, terrainCacheCanvas, srcX, srcY, viewWidth, viewHeight, viewWidth, viewHeight, { arrowSize: 10 });
}

function drawPlayerIndicator(ctx, player, terrainCanvas, srcX, srcY, srcW, srcH, viewWidth, viewHeight, options = {}) {
    // Default options with fallback values
    const {
        arrowSize = 20,
        arrowColor = 'red',
        coneDistance = 70,
        coneAngle = Math.PI / 2,
        coneColor = 'rgba(0, 0, 255, 0.3)',
        angleOffset = Math.PI / 2,
        showCone = true
    } = options;

    // Scale player position to terrainCanvas coordinates
    const playerX = (player.object.position.x / terrain.width + 0.5) * terrainCanvas.width;
    const playerZ = (player.object.position.z / terrain.height + 0.5) * terrainCanvas.height;
    const playerRotation = -player.object.rotation.y;

    let scaledX, scaledZ;

    // Adjust position based on whether it's a minimap or full map
    if (srcW !== viewWidth || srcH !== viewHeight) { // Minimap case (cropped view)
        scaledX = (playerX - srcX) * (viewWidth / srcW);
        scaledZ = (playerZ - srcY) * (viewHeight / srcH);
    } else { // Full map case (no cropping)
        scaledX = playerX * (viewWidth / terrainCanvas.width);
        scaledZ = playerZ * (viewHeight / terrainCanvas.height);
    }

    // Draw exploration cone
    if (showCone) {
        ctx.save();
        ctx.translate(scaledX, scaledZ);
        ctx.rotate(playerRotation + angleOffset); // Align cone with player direction

        const originalSize = 150;
        const originalScale = originalSize / terrain.width;
        const fixedConeRadius = coneDistance * originalScale;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, fixedConeRadius, -coneAngle / 2, coneAngle / 2);
        ctx.closePath();
        ctx.fillStyle = coneColor;
        ctx.fill();
        ctx.restore();
    }

    // Draw player arrow
    ctx.fillStyle = arrowColor;
    ctx.beginPath();
    ctx.save();
    ctx.translate(scaledX, scaledZ);
    ctx.rotate(playerRotation + angleOffset); // Adjust rotation for arrow direction
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize / 2, arrowSize / 2);
    ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

}

function setupMinimap() {
    const minimap = document.querySelector('.minimap');
    const timeFrame = document.querySelector('.time-frame');
    const defaultSize = 150; // Default minimap size when not expanded

    function updateTimeFramePosition(newSize = defaultSize) {
        const minimapRect = minimap.getBoundingClientRect();
        const timeFrameWidth = timeFrame.offsetWidth;

        const top = 5;
        const left = minimapRect.right - (newSize / 2) - (timeFrameWidth / 2);

        timeFrame.style.top = `${top}px`;
        timeFrame.style.left = `${left}px`;
    }

    minimap.addEventListener('click', () => {
        const isExpanded = minimap.classList.toggle('expanded');
        const newSize = isExpanded ? 500 : defaultSize;
        const canvas = document.querySelector('.map-frame canvas');
        if (canvas) {
            canvas.width = newSize;
            canvas.height = newSize;
        }
        updateTimeFramePosition(newSize);
        updateMinimap();
    });

    // Ensure DOM is ready before positioning
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        updateTimeFramePosition(defaultSize);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            updateTimeFramePosition(defaultSize);
        });
    }
}

function updateMinimap() {
    let canvas = document.querySelector(".map-frame canvas");
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        document.querySelector(".map-frame").appendChild(canvas);
    }
    renderTerrainToCanvas(canvas, terrain, player);

    // Update time display
    const timeDisplay = document.querySelector(".time-display");
    if (timeDisplay) {
        const hours = Math.floor(timeSystem.time / 60);
        const minutes = Math.floor(timeSystem.time % 60);
        timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
}

export { 
    updateMinimap,
    initializeTerrainCache, 
    setupMinimap
};