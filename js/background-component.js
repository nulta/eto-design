// DEVELOPER: 프론트의 /src/components/background/Background.tsx를 단순히 web component로 옮긴 것입니다.
// 적용 시에는 이 파일을 무시하고 <Background>를 사용하면 됩니다.

// DEVELOPER: 단! <body>에 적절한 background color를 설정하도록 했으니, 캔버스 자체에 background color를 설정하는 부분은 제거해도 좋습니다.

const COLOR_DEFS_LIGHT = [
    { varName: '--color-primary-100', alpha: 0.35 },
    { varName: '--color-primary-200', alpha: 0.35 },
    { varName: '--color-primary-300', alpha: 0.35 },
    { varName: '--color-primary-400', alpha: 0.35 },
    { varName: '--color-primary-500', alpha: 0.35 },
    { varName: '--color-primary-600', alpha: 0.35 },
    { varName: '--color-primary-700', alpha: 0.35 },
    { varName: '--color-neutral-100', alpha: 0.35 },
    { varName: '--color-neutral-200', alpha: 0.35 },
    { varName: '--color-neutral-300', alpha: 0.35 },
    { varName: '--color-neutral-400', alpha: 0.35 },
    { varName: '--color-neutral-500', alpha: 0.35 },
    { varName: '--color-neutral-600', alpha: 0.35 },
    { varName: '--color-neutral-700', alpha: 0.35 },
];

const COLOR_DEFS_DARK = [
    { varName: '--color-primary-900', alpha: 0.35 },
    { varName: '--color-primary-800', alpha: 0.35 },
    { varName: '--color-primary-700', alpha: 0.35 },
    { varName: '--color-primary-600', alpha: 0.35 },
    { varName: '--color-primary-500', alpha: 0.35 },
    { varName: '--color-primary-400', alpha: 0.35 },
    { varName: '--color-primary-300', alpha: 0.35 },
    { varName: '--color-neutral-900', alpha: 0.35 },
    { varName: '--color-neutral-800', alpha: 0.35 },
    { varName: '--color-neutral-700', alpha: 0.35 },
    { varName: '--color-neutral-600', alpha: 0.35 },
    { varName: '--color-neutral-500', alpha: 0.35 },
    { varName: '--color-neutral-400', alpha: 0.35 },
    { varName: '--color-neutral-300', alpha: 0.35 },
];

const resolveColors = (defs) => {
    const style = getComputedStyle(document.documentElement);
    return defs
    .map(({ varName, alpha }) => ({
        hex: style.getPropertyValue(varName).trim(),
        alpha,
    }))
    .filter((c) => c.hex !== '');
};

const rand = (min, max) => Math.random() * (max - min) + min;
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const createDiamond = (canvasW, canvasH, colors) => {
    const palette = pickRandom(colors);
    const filled = Math.random() > 0.35;
    const size = filled ? rand(20, 60) : rand(20, 80);

    return {
        x: rand(0, canvasW),
        y: rand(-canvasH * 0.1, canvasH * 1.1),
        size,
        speed: rand(0.05, 0.2) * (Math.random() > 0.5 ? -1 : 1),
        color: palette.hex,
        alpha: filled ? palette.alpha : palette.alpha * 0.8,
        filled,
        lineWidth: filled ? 0 : rand(1, 2),
    };
};

function densityForWidth(w) {
    if (w < 600) return 0.000045;
    if (w < 1200) return 0.000055;
    return 0.000058;
}

const darkModeQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
function isDarkMode() {
    return darkModeQuery.matches;
}

class BackgroundComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.style.display = 'contents';
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        Object.assign(this.canvas.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '-1',
            pointerEvents: 'none',
            maxWidth: '100vw',
            maxHeight: '100vh',
            overflow: 'clip',
        });

        this.shadowRoot.appendChild(this.canvas);

        this.diamonds = [];
        this.rafId = 0;
        this.w = 0;
        this.h = 0;

        this.resize = this.resize.bind(this);
        this.onThemeChange = this.onThemeChange.bind(this);
        this.draw = this.draw.bind(this);
    }

    connectedCallback() {
        this.resize();
        window.addEventListener('resize', this.resize);
        darkModeQuery.addEventListener('change', this.onThemeChange);
        this.rafId = requestAnimationFrame(this.draw);
    }

    disconnectedCallback() {
        cancelAnimationFrame(this.rafId);
        window.removeEventListener('resize', this.resize);
        darkModeQuery.removeEventListener('change', this.onThemeChange);
    }

    regenerate() {
        const dark = isDarkMode();
        const defs = dark ? COLOR_DEFS_DARK : COLOR_DEFS_LIGHT;
        const colors = resolveColors(defs);

        const count = Math.max(20, Math.round(this.w * this.h * densityForWidth(this.w)));
        this.diamonds = Array.from({ length: count }, () => createDiamond(this.w, this.h, colors));
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.w = window.visualViewport.width;
        this.h = window.visualViewport.height;

        this.canvas.width = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.canvas.style.width = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.regenerate();
    }

    onThemeChange() {
        this.regenerate();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.w, this.h);

        for (const d of this.diamonds) {
            d.y += d.speed;

            const pad = d.size + 4;
            if (d.speed < 0 && d.y < -pad) d.y = this.h + pad;
            if (d.speed > 0 && d.y > this.h + pad) d.y = -pad;

            this.ctx.save();
            this.ctx.translate(d.x, d.y);
            this.ctx.rotate(Math.PI / 4);
            this.ctx.globalAlpha = d.alpha;

            if (d.filled) {
                this.ctx.fillStyle = d.color;
                this.ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
            } else {
                this.ctx.strokeStyle = d.color;
                this.ctx.lineWidth = d.lineWidth;
                this.ctx.strokeRect(-d.size / 2, -d.size / 2, d.size, d.size);
            }

            this.ctx.restore();
        }

        this.rafId = requestAnimationFrame(this.draw);
    }
}

customElements.define('background-component', BackgroundComponent);