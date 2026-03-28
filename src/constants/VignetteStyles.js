/**
 * HTML-Vignette Stylings 
 * Shared CSS for high-fidelity previews across Web and Expo.
 */
export const VIGNETTE_CSS = `
:root {
    --vignette-width: 794px; /* A4 at 96 DPI */
    --vignette-height: 1123px;
    --glow-source: #a855f7; /* Purple */
    --glow-target: #0ea5e9; /* Sky Blue */
    --glow-amber: #f59e0b;  /* Amber */
    --glow-red: #ef4444;    /* Red */
}

.vignette-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 20px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    box-sizing: border-box;
}

.vignette-container {
    position: relative;
    width: 100%;
    max-width: var(--vignette-width);
    aspect-ratio: 1 / 1.4142;
    background: white;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    transform-origin: top center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: #1a1a1a;
    overflow: hidden;
}

/* Base "Paper" surface */
.vignette-sheet {
    width: 100%;
    height: 100%;
    padding: 40px; /* Standard margins */
    box-sizing: border-box;
    font-family: 'Helvetica', sans-serif;
    line-height: 1.5;
}

/* Contextual Glows */
.vignette-container.glow-source {
    box-shadow: 0 0 0 4px var(--glow-source), 0 20px 40px rgba(168, 85, 247, 0.3);
}

.vignette-container.glow-target {
    box-shadow: 0 0 0 4px var(--glow-target), 0 20px 40px rgba(14, 165, 233, 0.3);
}

.vignette-container.glow-amber {
    box-shadow: 0 0 0 4px var(--glow-amber), 0 20px 40px rgba(245, 158, 11, 0.3);
}

.vignette-container.glow-red {
    box-shadow: 0 0 0 4px var(--glow-red), 0 20px 40px rgba(239, 68, 68, 0.3);
}

/* Scaling utility for smaller viewports */
.vignette-scaled {
    transform: scale(var(--vignette-scale, 1));
}

/* Loading state */
.vignette-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    color: #666;
    font-style: italic;
}

@media (prefers-color-scheme: dark) {
    .vignette-wrapper {
        background: rgba(0, 0, 0, 0.3);
    }
}
`;
