export class Game {
    constructor(config) {
        this.rows = config.rows;
        this.cols = config.cols;
        this.pairs = config.pairs;
        this.customColors = config.colors || null;
        
        this.grid = [];
        this.selected = null;
        this.score = config.score || 0;
        this.init();
    }

    init() {
        let boardColors = [];
        
        if (this.customColors) {
            // Use provided colors
            for (let i = 0; i < this.pairs; i++) {
                const color = this.customColors[i % this.customColors.length];
                boardColors.push(color, color);
            }
        } else {
            // Default distinct colors
            const colors = [
                '#ff4b2b', '#6366f1', '#22c55e', '#eab308', 
                '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'
            ];
            for (let i = 0; i < this.pairs; i++) {
                const color = colors[i % colors.length];
                boardColors.push(color, color);
            }
        }

        boardColors.sort(() => Math.random() - 0.5);

        this.grid = Array.from({ length: this.rows + 1 }, () => 
            Array.from({ length: this.cols + 1 }, () => null)
        );

        let index = 0;
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (index < boardColors.length) {
                    this.grid[r][c] = {
                        color: boardColors[index++],
                        r, c,
                        id: `block-${r}-${c}`
                    };
                }
            }
        }
    }

    select(r, c) {
        const block = this.grid[r][c];
        if (!block) return null;

        if (!this.selected) {
            this.selected = block;
            return { action: 'select', block };
        } else {
            if (this.selected.r === r && this.selected.c === c) {
                this.selected = null;
                return { action: 'deselect' };
            }

            if (this.selected.color === block.color) {
                const prevSelected = this.selected;
                this.grid[this.selected.r][this.selected.c] = null;
                this.grid[r][c] = null;
                this.selected = null;
                this.score += 10;
                
                const isComplete = this.checkComplete();
                return { action: 'match', score: this.score, isComplete, blocks: [prevSelected, block] };
            } else {
                this.selected = block;
                return { action: 'select', block };
            }
        }
    }

    checkComplete() {
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.grid[r][c] !== null) return false;
            }
        }
        return true;
    }

    shuffle() {
        let currentBlocks = [];
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.grid[r][c]) currentBlocks.push(this.grid[r][c].color);
            }
        }
        currentBlocks.sort(() => Math.random() - 0.5);
        let index = 0;
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.grid[r][c]) {
                    this.grid[r][c].color = currentBlocks[index++];
                }
            }
        }
    }
}
