// --- UTILITY FUNCTIONS ---
const $ = (selector) => document.querySelector(selector);
const on = (element, event, handler) => element.addEventListener(event, handler);
const $$ = (selector) => document.querySelectorAll(selector);

// --- CLASSES ---

class Food { /* ... (no changes) ... */
    constructor(x, y, energy) {
        this.x = x;
        this.y = y;
        this.energy = energy;
        this.size = 3;
    }
    draw(ctx) {
        ctx.fillStyle = '#68D391';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Blob {
    constructor(config) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = config.x;
        this.y = config.y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.energy = config.energy || 100;
        this.isDead = false;

        this.traits = {
            speed: config.speed, size: config.size, sense: config.sense,
            color: config.color || `hsl(${Math.random() * 360}, 80%, 60%)`,
            efficiency: config.efficiency,
        };

        this.homeEdge = config.homeEdge;
        this.state = 'foraging'; // foraging, returning, at_home, hunting, fleeing
        this.target = null;
        this.wanderAngle = Math.random() * Math.PI * 2;
    }

    update(sim) {
        if (this.isDead || this.state === 'at_home') return;
        this.updateState(sim);
        this.move(sim.width, sim.height);
        this.consumeEnergy();
        if (this.energy <= 0) this.die();
    }

    updateState(sim) {
        // State transition logic based on user feedback
        if (this.energy >= 100) {
            this.energy = 100;
            this.state = 'returning';
        } else if (this.state === 'returning' && this.energy < 75) {
            this.state = 'foraging';
        }

        if (this.state === 'returning' && this.isAtHomeEdge(sim.width, sim.height)) {
            this.state = 'at_home';
            return;
        }

        if (this.state === 'foraging' || this.state === 'hunting' || this.state === 'fleeing') {
            const predator = this.findClosest(sim.blobs, (b) => !b.isDead && b.traits.size > this.traits.size * 1.25);
            if (predator && this.distanceTo(predator) < this.traits.sense) {
                this.state = 'fleeing';
                this.target = predator;
                return;
            }

            const prey = this.findClosest(sim.blobs, (b) => !b.isDead && this.traits.size > b.traits.size * 1.25);
            if (prey && this.distanceTo(prey) < this.traits.sense) {
                this.state = 'hunting';
                this.target = prey;
                return;
            }

            const food = this.findClosest(sim.food);
            if (food && this.distanceTo(food) < this.traits.sense) {
                this.state = 'foraging';
                this.target = food;
                return;
            }

            this.target = null;
        }
    }

    move(worldWidth, worldHeight) {
        if (this.state === 'at_home') return;

        let targetAngle;
        switch (this.state) {
            case 'foraging':
                if (this.target) {
                    targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                } else {
                    this.wanderAngle += (Math.random() - 0.5) * 0.5;
                    targetAngle = this.wanderAngle;
                }
                break;
            case 'hunting':
            case 'fleeing':
                if (this.target && !this.target.isDead) {
                    const angleToBase = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                    targetAngle = this.state === 'hunting' ? angleToBase : angleToBase + Math.PI;
                } else {
                    this.state = 'foraging';
                }
                break;
            case 'returning':
                const homeTarget = this.getHomeCoordinates(worldWidth, worldHeight);
                targetAngle = Math.atan2(homeTarget.y - this.y, homeTarget.x - this.x);
                break;
        }

        if (targetAngle !== undefined) {
            this.vx = Math.cos(targetAngle);
            this.vy = Math.sin(targetAngle);
        }

        this.x += this.vx * this.traits.speed;
        this.y += this.vy * this.traits.speed;

        if (this.x < this.traits.size) { this.x = this.traits.size; this.wanderAngle = 0; }
        if (this.x > worldWidth - this.traits.size) { this.x = worldWidth - this.traits.size; this.wanderAngle = Math.PI; }
        if (this.y < this.traits.size) { this.y = this.traits.size; this.wanderAngle = Math.PI / 2; }
        if (this.y > worldHeight - this.traits.size) { this.y = worldHeight - this.traits.size; this.wanderAngle = -Math.PI / 2; }
    }

    consumeEnergy() {
        const energyCost = 0.02 + (this.traits.size * 0.002) + (this.traits.speed * 0.008);
        this.energy -= energyCost;
    }

    die() { this.isDead = true; }

    isAtHomeEdge(w, h) {
        const margin = 20;
        switch(this.homeEdge) {
            case 'top': return this.y < margin;
            case 'bottom': return this.y > h - margin;
            case 'left': return this.x < margin;
            case 'right': return this.x > w - margin;
        }
        return false;
    }

    getHomeCoordinates(w, h) {
        // Target a point slightly inside the edge
        switch(this.homeEdge) {
            case 'top': return { x: this.x, y: 10 };
            case 'bottom': return { x: this.x, y: h - 10 };
            case 'left': return { x: 10, y: this.y };
            case 'right': return { x: w - 10, y: this.y };
        }
    }

    findClosest(items, filter = () => true) {
        let closest = null;
        let minDistance = Infinity;
        for (const item of items) {
            if (filter(item) && item.id !== this.id) {
                const d = this.distanceTo(item);
                if (d < minDistance) {
                    minDistance = d;
                    closest = item;
                }
            }
        }
        return closest;
    }

    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    draw(ctx, isSelected) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.traits.sense, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = this.traits.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.traits.size, 0, Math.PI * 2);
        ctx.fill();

        if (isSelected) {
            ctx.strokeStyle = '#63B3ED';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.lineWidth = 1;
        }

        const energyPercentage = this.energy / 100;
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(this.x - this.traits.size, this.y - this.traits.size - 8, this.traits.size * 2, 4);
        ctx.fillStyle = energyPercentage > 0.75 ? '#48BB78' : (energyPercentage > 0.25 ? '#F6E05E' : '#F56565');
        ctx.fillRect(this.x - this.traits.size, this.y - this.traits.size - 8, this.traits.size * 2 * Math.max(0, energyPercentage), 4);
    }
}

class Simulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.reset();
    }

    reset() {
        this.isRunning = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

        this.settings = this.getSettingsFromUI();
        this.width = this.settings.planeWidth;
        this.height = this.settings.planeHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.day = 0;
        this.daysToRun = 0;
        this.selectedBlob = null;
        this.currentFoodCount = this.settings.foodCount;
        this.statsHistory = { population: [], avgSpeed: [], avgSize: [], avgSense: [], avgEfficiency: [] };

        this.blobs = Array.from({ length: this.settings.initialPop }, () => new Blob(this.getInitialBlobConfig()));
        this.food = [];

        this.updateStats();
        this.updateCharts();
        this.draw();

        $('#start-day-btn').textContent = 'Start Day 1';
        $('#start-day-btn').disabled = false;
        $('#status-stat').textContent = 'Ready';
        $('#status-stat').className = 'font-bold text-blue-300';
    }

    getSettingsFromUI() {
        return {
            planeWidth: +$('#plane-width').value, planeHeight: +$('#plane-height').value,
            simSpeed: +$('#sim-speed').value, foodCount: +$('#food-count').value,
            foodEnergy: +$('#food-energy').value, foodDecrease: +$('#food-decrease').value,
            initialPop: +$('#initial-pop').value, startSpeed: +$('#start-speed').value,
            startSize: +$('#start-size').value, startSense: +$('#start-sense').value,
            startEfficiency: +$('#start-efficiency').value, mutationRate: +$('#mutation-rate').value,
        };
    }

    getInitialBlobConfig() {
        const edge = Math.floor(Math.random() * 4);
        let x, y, homeEdge;
        const margin = 25; // Start slightly away from the edge
        switch (edge) {
            case 0: x = Math.random() * this.width; y = margin; homeEdge = 'top'; break;
            case 1: x = this.width - margin; y = Math.random() * this.height; homeEdge = 'right'; break;
            case 2: x = Math.random() * this.width; y = this.height - margin; homeEdge = 'bottom'; break;
            case 3: x = margin; y = Math.random() * this.height; homeEdge = 'left'; break;
        }
        return {
            x, y, homeEdge,
            speed: this.settings.startSpeed, size: this.settings.startSize,
            sense: this.settings.startSense, efficiency: this.settings.startEfficiency,
        };
    }

    startDay() {
        if (this.isRunning) return;
        this.day++;

        if (this.day > 1) {
            this.blobs = this.blobs.filter(b => b.energy >= 25);
            this.performMating();
        }

        if(this.blobs.length === 0) {
            this.endSimulation("EXTINCTION");
            return;
        }

        this.blobs.forEach(b => {
            const startPos = this.getInitialBlobConfig();
            b.x = startPos.x;
            b.y = startPos.y;
            b.homeEdge = startPos.homeEdge;
            b.state = 'foraging'; // IMPORTANT: Reset state for all blobs
        });

        this.spawnFood();
        this.recordStats();

        this.isRunning = true;
        $('#start-day-btn').disabled = true;
        $('#status-stat').textContent = 'Running';
        $('#status-stat').className = 'font-bold text-green-400';

        this.loop();
    }

    performMating() {
        const parents = this.blobs.filter(b => b.energy > 75);
        const newBlobs = [];
        const edgeGroups = { top: [], bottom: [], left: [], right: [] };
        parents.forEach(p => edgeGroups[p.homeEdge].push(p));

        for (const group of Object.values(edgeGroups)) {
            for (let i = 0; i < Math.floor(group.length / 2); i++) {
                const p1 = group[i*2];
                const p2 = group[i*2 + 1];
                p1.energy -= 50;
                p2.energy -= 50;

                const offspringConfig = this.getInitialBlobConfig();
                const mutate = (val) => val * (1 + (Math.random() - 0.5) * 2 * this.settings.mutationRate);

                offspringConfig.speed = mutate((p1.traits.speed + p2.traits.speed) / 2);
                offspringConfig.size = Math.max(5, mutate((p1.traits.size + p2.traits.size) / 2));
                offspringConfig.sense = mutate((p1.traits.sense + p2.traits.sense) / 2);
                offspringConfig.efficiency = mutate((p1.traits.efficiency + p2.traits.efficiency) / 2);

                const c1 = p1.traits.color.match(/\d+/g).map(Number);
                const c2 = p2.traits.color.match(/\d+/g).map(Number);
                offspringConfig.color = `hsl(${(c1[0] + c2[0]) / 2 % 360}, 80%, 60%)`;

                newBlobs.push(new Blob(offspringConfig));
            }
        }
        this.blobs.push(...newBlobs);
    }

    spawnFood() {
        if (this.day > 1) {
            this.currentFoodCount = Math.max(0, this.currentFoodCount - this.settings.foodDecrease);
        }
        this.food = [];
        for (let i = 0; i < this.currentFoodCount; i++) {
            const x = Math.random() * (this.width - 40) + 20;
            const y = Math.random() * (this.height - 40) + 20;
            this.food.push(new Food(x, y, this.settings.foodEnergy));
        }
    }

    loop() {
        if (!this.isRunning) return;
        for (let i = 0; i < this.settings.simSpeed; i++) this.update();
        this.draw();
        this.updateStats();
        if (this.checkDayEnd()) {
            this.endDay();
        } else {
            this.animationFrameId = requestAnimationFrame(() => this.loop());
        }
    }

    update() {
        this.blobs.forEach(blob => blob.update(this));
        for (let i = this.blobs.length - 1; i >= 0; i--) {
            const blob = this.blobs[i];
            if (blob.isDead) continue;
            for (let j = this.food.length - 1; j >= 0; j--) {
                if (blob.distanceTo(this.food[j]) < blob.traits.size) {
                    blob.energy += this.food[j].energy * blob.traits.efficiency;
                    this.food.splice(j, 1);
                }
            }
            for (let k = this.blobs.length - 1; k >= 0; k--) {
                if (i === k) continue;
                const other = this.blobs[k];
                if (other.isDead) continue;
                if (blob.traits.size > other.traits.size * 1.25 && blob.distanceTo(other) < blob.traits.size) {
                    blob.energy += other.energy * 0.5;
                    other.die();
                }
            }
        }
        this.blobs = this.blobs.filter(b => !b.isDead);
    }

    checkDayEnd() {
        if (this.blobs.length === 0) return true;
        return this.blobs.every(b => b.state === 'at_home');
    }

    endDay() {
        this.isRunning = false;
        $('#status-stat').textContent = 'Day Ended';
        $('#status-stat').className = 'font-bold text-yellow-300';
        $('#start-day-btn').textContent = `Start Day ${this.day + 1}`;
        $('#start-day-btn').disabled = false;

        if (this.daysToRun > 0) {
            this.daysToRun--;
            if (this.daysToRun > 0) setTimeout(() => this.startDay(), 200);
            else this.endSimulation("Finished Run");
        }
    }

    endSimulation(message) {
        this.isRunning = false;
        $('#status-stat').textContent = message;
        $('#status-stat').className = 'font-bold text-red-500';
        $('#start-day-btn').disabled = true;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.food.forEach(f => f.draw(this.ctx));
        this.blobs.forEach(b => b.draw(this.ctx, b === this.selectedBlob));
    }

    updateStats() {
        $('#day-stat').textContent = this.day;
        $('#blob-count-stat').textContent = this.blobs.length;
        $('#food-count-stat').textContent = this.food.length;
        if(this.selectedBlob) this.displayBlobStats(this.selectedBlob);
    }

    recordStats() { /* ... (no changes) ... */
        if (this.blobs.length === 0) return;
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        this.statsHistory.population.push(this.blobs.length);
        this.statsHistory.avgSpeed.push(avg(this.blobs.map(b => b.traits.speed)));
        this.statsHistory.avgSize.push(avg(this.blobs.map(b => b.traits.size)));
        this.statsHistory.avgSense.push(avg(this.blobs.map(b => b.traits.sense)));
        this.statsHistory.avgEfficiency.push(avg(this.blobs.map(b => b.traits.efficiency)));
        this.updateCharts();
    }

    updateCharts() { /* ... (no changes) ... */
        const container = $('#charts-container');
        const createChart = (title, data) => {
            const maxValue = Math.max(...data, 1);
            const bars = data.map(d => `<div class="bg-blue-500 h-2 rounded chart-bar" style="width:${(d/maxValue)*100}%"></div>`).join('');
            return `
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <span>${title}</span>
                        <span class="font-mono">${data.length > 0 ? data[data.length-1].toFixed(2) : 'N/A'}</span>
                    </div>
                    <div class="bg-gray-700 rounded p-1 flex items-center space-x-px">${bars}</div>
                </div>`;
        };
        container.innerHTML = `
            ${createChart('Population', this.statsHistory.population)}
            ${createChart('Avg Speed', this.statsHistory.avgSpeed)}
            ${createChart('Avg Size', this.statsHistory.avgSize)}
            ${createChart('Avg Sense', this.statsHistory.avgSense)}
            ${createChart('Avg Efficiency', this.statsHistory.avgEfficiency)}
        `;
    }

    handleCanvasClick(event) { /* ... (no changes) ... */
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        let clickedBlob = null;
        for (const blob of this.blobs) {
            if (blob.distanceTo({x, y}) < blob.traits.size) {
                clickedBlob = blob;
                break;
            }
        }
        this.selectedBlob = clickedBlob;
        this.displayBlobStats(this.selectedBlob);
        this.draw();
    }

    displayBlobStats(blob) { /* ... (no changes) ... */
        const panel = $('#selected-blob-panel');
        const statsDiv = $('#selected-blob-stats');
        if (blob) {
            if(blob.isDead) {
                this.selectedBlob = null;
                panel.classList.add('hidden');
                return;
            }
            statsDiv.innerHTML = `
                <div><strong>ID:</strong> <span class="font-mono">${blob.id}</span></div>
                <div><strong>Status:</strong> <span class="font-semibold">${blob.state}</span></div>
                <div><strong>Energy:</strong> <span class="font-semibold">${blob.energy.toFixed(1)} / 100</span></div>
                <div><strong>Speed:</strong> <span>${blob.traits.speed.toFixed(2)}</span></div>
                <div><strong>Size:</strong> <span>${blob.traits.size.toFixed(2)}</span></div>
                <div><strong>Sense:</strong> <span>${blob.traits.sense.toFixed(2)}</span></div>
                <div><strong>Efficiency:</strong> <span>${blob.traits.efficiency.toFixed(2)}</span></div>
            `;
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }
}


// --- MAIN SCRIPT EXECUTION ---
window.addEventListener('load', () => {
    const sim = new Simulation($('#simulationCanvas'));

    // --- EVENT LISTENERS ---
    on($('#start-day-btn'), 'click', () => sim.startDay());
    on($('#reset-btn'), 'click', () => sim.reset());
    on($('#run-for-x-days-btn'), 'click', () => {
        sim.daysToRun = parseInt($('#run-for-x-days-input').value, 10);
        if (sim.daysToRun > 0 && !sim.isRunning) sim.startDay();
    });
    on(sim.canvas, 'click', (e) => sim.handleCanvasClick(e));

    // Tab Controls (FIXED)
    $$('.tab-btn').forEach(button => {
        on(button, 'click', () => {
            $$('.tab-btn').forEach(btn => {
                btn.classList.remove('active-tab', 'border-blue-400', 'text-blue-300');
                btn.classList.add('border-transparent', 'text-gray-400', 'hover:text-gray-200', 'hover:border-gray-400');
            });
            button.classList.add('active-tab', 'border-blue-400', 'text-blue-300');
            button.classList.remove('border-transparent', 'text-gray-400', 'hover:text-gray-200', 'hover:border-gray-400');

            $$('.tab-content').forEach(content => content.classList.add('hidden'));
            $(`#${button.dataset.tab}-tab`).classList.remove('hidden');
        });
    });

    // Input Sliders with Value Display
    const sliders = [
        'plane-width', 'plane-height', 'sim-speed', 'food-count', 'food-energy', 'food-decrease',
        'initial-pop', 'start-speed', 'start-size', 'start-sense', 'start-efficiency', 'mutation-rate'
    ];
    sliders.forEach(id => {
        const slider = $(`#${id}`);
        const display = $(`#${id}-val`);
        if(slider && display) on(slider, 'input', () => { display.textContent = slider.value; });
    });

    const resetTriggers = ['plane-width', 'plane-height', 'initial-pop', 'start-speed', 'start-size', 'start-sense', 'start-efficiency'];
    resetTriggers.forEach(id => on($(`#${id}`), 'change', () => sim.reset()));
});