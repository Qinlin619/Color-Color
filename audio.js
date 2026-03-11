export class AudioController {
    constructor() {
        this.ctx = null;
        this.isMuted = localStorage.getItem('audio_muted') === 'true';
        this.bgmBuffer = null;
        this.bgmSource = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, volume = 0.1) {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playClick() {
        this.init();
        this.playTone(800, 'sine', 0.1, 0.1);
    }

    playSelect() {
        this.init();
        this.playTone(600, 'sine', 0.15, 0.1);
    }

    playMatch() {
        this.init();
        const now = this.ctx.currentTime;
        this.playTone(523.25, 'sine', 0.2, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.3, 0.1), 100); // E5

        // Reward vibration: two short pulses
        if ('vibrate' in navigator) {
            navigator.vibrate([30, 50, 30]);
        }
    }

    playMismatch() {
        this.init();
        // Short, clean low tone
        this.playTone(150, 'sine', 0.1, 0.08);
        
        // Haptic vibration for mobile devices (if supported)
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }

    playLevelComplete() {
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 'sine', 0.4, 0.1), i * 150);
        });

        // More celebratory vibration
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
    }

    playWin() {
        this.init();
        const melody = [523.25, 659.25, 783.99, 659.25, 1046.50];
        melody.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 'sine', 0.5, 0.1), i * 200);
        });

        // Grand finale vibration
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 100, 50, 500]);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('audio_muted', this.isMuted);
        if (this.isMuted) {
            this.stopBGM();
        } else {
            this.playBGM();
        }
        return this.isMuted;
    }

    // A cheerful, structured melodic loop
    playBGM() {
        this.init();
        if (this.isMuted || this.bgmInterval) return;
        this.resume();

        let step = 0;
        const melody = [
            523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0, // C5, E5, G5, E5
            587.33, 0, 698.46, 0, 880.00, 0, 783.99, 0, // D5, F5, A5, G5
            523.25, 0, 659.25, 0, 783.99, 0, 1046.50, 0, // C5, E5, G5, C6
            987.77, 0, 880.00, 0, 783.99, 0, 587.33, 0   // B5, A5, G5, D5
        ];

        const bass = [
            130.81, 130.81, 130.81, 130.81, // C3
            146.83, 146.83, 146.83, 146.83, // D3
            130.81, 130.81, 130.81, 130.81, // C3
            196.00, 196.00, 196.00, 196.00  // G3
        ];
        
        const tempo = 200; // ms per step (0.2s)

        const playStep = () => {
            if (this.isMuted) return;
            
            // Play melody note if not 0
            const freq = melody[step % melody.length];
            if (freq > 0) {
                this.playTone(freq, 'sine', 0.2, 0.02);
            }

            // Play bass every 4 steps
            if (step % 4 === 0) {
                const bassFreq = bass[Math.floor(step / 4) % bass.length];
                this.playTone(bassFreq, 'triangle', 0.4, 0.015);
            }

            step++;
        };

        this.bgmInterval = setInterval(playStep, tempo);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
}

export const audio = new AudioController();
