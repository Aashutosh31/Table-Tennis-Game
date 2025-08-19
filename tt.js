// Table Tennis Game - Full Featured Implementation
class TableTennisGame {
    constructor() {
        // Canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.gameRunning = false;
        this.animationId = null;

        // Game settings
        this.settings = {
            matchFormat: 5, // Best of 5
            pointsToWin: 11,
            serveSwitchPoints: 2,
            deuceServeSwitchPoints: 1,
            difficulty: 'medium'
        };

        // Game objects
        this.ball = {
            x: 400,
            y: 200,
            radius: 8,
            speedX: 0,
            speedY: 0,
            maxSpeed: 8,
            color: '#fff'
        };

        this.paddle1 = {
            x: 20,
            y: 150,
            width: 15,
            height: 100,
            speed: 8,
            color: '#3498db'
        };

        this.paddle2 = {
            x: 765,
            y: 150,
            width: 15,
            height: 100,
            speed: 8,
            color: '#e74c3c'
        };

        // Score and game tracking
        this.score = {
            player1: 0,
            player2: 0
        };

        this.sets = {
            player1: 0,
            player2: 0
        };

        this.gameStats = {
            currentSet: 1,
            currentRound: 1,
            totalPoints: 0,
            setsHistory: []
        };

        // Serving system
        this.serving = {
            currentServer: 1,
            pointsInService: 0,
            isDeuce: false
        };

        // Input handling
        this.keys = {};
        this.setupEventListeners();

        // AI difficulty settings
        this.aiSettings = {
            easy: { speed: 0.05, accuracy: 0.7, reactionTime: 20 },
            medium: { speed: 0.08, accuracy: 0.85, reactionTime: 15 },
            hard: { speed: 0.12, accuracy: 0.95, reactionTime: 8 }
        };

        // Initialize game
        this.initializeGame();
        this.setupUI();
        this.resizeCanvas();

        // Start game loop
        this.gameLoop();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Game controls
            if (e.key === ' ') {
                e.preventDefault();
                this.togglePause();
            } else if (e.key.toLowerCase() === 'r') {
                this.resetGame();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Button events
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('apply-settings').addEventListener('click', () => {
            this.applySettings();
        });

        document.getElementById('new-game').addEventListener('click', () => {
            this.newGame();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }

    setupUI() {
        // Update initial UI elements
        this.updateScoreboard();
        this.updateServeIndicator();
        this.updateMatchHistory();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const aspectRatio = 800 / 400;

        let newWidth = Math.min(containerWidth - 40, 800);
        let newHeight = newWidth / aspectRatio;

        this.canvas.style.width = newWidth + 'px';
        this.canvas.style.height = newHeight + 'px';

        // Keep internal resolution consistent
        this.canvas.width = 800;
        this.canvas.height = 400;
    }

    initializeGame() {
        this.resetBall();
        this.resetPaddles();
        this.resetServing();
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;

        // Random serve direction
        const angle = (Math.random() - 0.5) * Math.PI / 3; // ±30 degrees
        const speed = 4;

        this.ball.speedX = Math.cos(angle) * speed * (this.serving.currentServer === 1 ? 1 : -1);
        this.ball.speedY = Math.sin(angle) * speed;
    }

    resetPaddles() {
        this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;
        this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;
    }

    resetServing() {
        this.serving.pointsInService = 0;
        this.serving.isDeuce = this.isDeuce();
        this.updateServeIndicator();
    }

    startGame() {
        this.gameState = 'playing';
        this.gameRunning = true;
        document.getElementById('game-overlay').classList.add('hidden');
        this.resetBall();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.gameRunning = false;
            this.showOverlay('Game Paused', 'Press SPACE to resume');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameRunning = true;
            document.getElementById('game-overlay').classList.add('hidden');
        }
    }

    showOverlay(title, message, showButton = false) {
        document.getElementById('overlay-title').textContent = title;
        document.getElementById('overlay-message').textContent = message;
        document.getElementById('start-btn').style.display = showButton ? 'block' : 'none';
        document.getElementById('game-overlay').classList.remove('hidden');
    }

    applySettings() {
        // Update player names
        const player1Name = document.getElementById('player1-input').value || 'Player 1';
        const player2Name = document.getElementById('player2-input').value || 'Player 2';

        document.getElementById('player1-name').textContent = player1Name;
        document.getElementById('player2-name').textContent = player2Name;

        // Update match format
        this.settings.matchFormat = parseInt(document.getElementById('match-type').value);
        document.getElementById('match-format').textContent = `Best of ${this.settings.matchFormat}`;

        // Update difficulty
        this.settings.difficulty = document.getElementById('difficulty').value;

        this.showNotification('Settings applied successfully!');
    }

    newGame() {
        this.score = { player1: 0, player2: 0 };
        this.sets = { player1: 0, player2: 0 };
        this.gameStats = {
            currentSet: 1,
            currentRound: 1,
            totalPoints: 0,
            setsHistory: []
        };
        this.serving.currentServer = 1;
        this.initializeGame();
        this.updateScoreboard();
        this.updateMatchHistory();
        this.gameState = 'menu';
        this.gameRunning = false;
        this.showOverlay('New Game Ready!', 'Press SPACE to start', true);
    }

    resetGame() {
        this.score = { player1: 0, player2: 0 };
        this.initializeGame();
        this.updateScoreboard();
        this.gameState = 'menu';
        this.gameRunning = false;
        this.showOverlay('Game Reset', 'Press SPACE to start', true);
    }

    update() {
        if (!this.gameRunning) return;

        this.updatePaddles();
        this.updateBall();
        this.checkCollisions();
        this.updateAI();
    }

    updatePaddles() {
        // Player 1 controls (W/S keys)
        if (this.keys['w'] && this.paddle1.y > 0) {
            this.paddle1.y -= this.paddle1.speed;
        }
        if (this.keys['s'] && this.paddle1.y < this.canvas.height - this.paddle1.height) {
            this.paddle1.y += this.paddle1.speed;
        }

        // Player 2 controls (Arrow keys)
        if (this.keys['arrowup'] && this.paddle2.y > 0) {
            this.paddle2.y -= this.paddle2.speed;
        }
        if (this.keys['arrowdown'] && this.paddle2.y < this.canvas.height - this.paddle2.height) {
            this.paddle2.y += this.paddle2.speed;
        }
    }

    updateAI() {
        // Simple AI for paddle2 if no manual control
        if (!this.keys['arrowup'] && !this.keys['arrowdown']) {
            const aiConfig = this.aiSettings[this.settings.difficulty];
            const paddleCenter = this.paddle2.y + this.paddle2.height / 2;
            const ballY = this.ball.y;

            const difference = ballY - paddleCenter;
            const moveAmount = difference * aiConfig.speed;

            // Add some randomness for realism
            const randomFactor = (Math.random() - 0.5) * (1 - aiConfig.accuracy) * 50;

            const newY = this.paddle2.y + moveAmount + randomFactor;

            // Keep paddle within bounds
            this.paddle2.y = Math.max(0, Math.min(newY, this.canvas.height - this.paddle2.height));
        }
    }

    updateBall() {
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;

        // Ball collision with top and bottom walls
        if (this.ball.y <= this.ball.radius || this.ball.y >= this.canvas.height - this.ball.radius) {
            this.ball.speedY = -this.ball.speedY;
            this.ball.y = Math.max(this.ball.radius, Math.min(this.ball.y, this.canvas.height - this.ball.radius));
        }

        // Ball out of bounds (scoring)
        if (this.ball.x < -this.ball.radius) {
            // Player 2 scores
            this.scorePoint(2);
        } else if (this.ball.x > this.canvas.width + this.ball.radius) {
            // Player 1 scores
            this.scorePoint(1);
        }
    }

    checkCollisions() {
        // Paddle 1 collision
        if (this.ball.x - this.ball.radius <= this.paddle1.x + this.paddle1.width &&
            this.ball.x + this.ball.radius >= this.paddle1.x &&
            this.ball.y >= this.paddle1.y &&
            this.ball.y <= this.paddle1.y + this.paddle1.height &&
            this.ball.speedX < 0) {

            this.handlePaddleCollision(this.paddle1);
        }

        // Paddle 2 collision
        if (this.ball.x + this.ball.radius >= this.paddle2.x &&
            this.ball.x - this.ball.radius <= this.paddle2.x + this.paddle2.width &&
            this.ball.y >= this.paddle2.y &&
            this.ball.y <= this.paddle2.y + this.paddle2.height &&
            this.ball.speedX > 0) {

            this.handlePaddleCollision(this.paddle2);
        }
    }

    handlePaddleCollision(paddle) {
        // Calculate hit position on paddle (0 to 1)
        const relativeIntersectY = (this.ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);

        // Calculate angle based on where ball hits paddle
        const maxAngle = Math.PI / 3; // 60 degrees
        const angle = relativeIntersectY * maxAngle;

        // Determine direction based on which paddle
        const direction = paddle === this.paddle1 ? 1 : -1;

        // Calculate new speeds
        const speed = Math.sqrt(this.ball.speedX * this.ball.speedX + this.ball.speedY * this.ball.speedY);
        const newSpeed = Math.min(speed * 1.05, this.ball.maxSpeed); // Slightly increase speed each hit

        this.ball.speedX = Math.cos(angle) * newSpeed * direction;
        this.ball.speedY = Math.sin(angle) * newSpeed;

        // Move ball away from paddle to prevent multiple collisions
        if (direction === 1) {
            this.ball.x = paddle.x + paddle.width + this.ball.radius;
        } else {
            this.ball.x = paddle.x - this.ball.radius;
        }
    }

    scorePoint(player) {
        if (player === 1) {
            this.score.player1++;
        } else {
            this.score.player2++;
        }

        this.gameStats.totalPoints++;
        this.updateScoreboard();
        this.updateServing();

        // Check for set win
        if (this.checkSetWin()) {
            this.endSet();
        } else {
            this.resetBall();
        }

        // Add score animation
        const scoreElement = document.getElementById(`player${player}-score`);
        scoreElement.classList.add('score-animation');
        setTimeout(() => {
            scoreElement.classList.remove('score-animation');
        }, 500);
    }

    checkSetWin() {
        const p1Score = this.score.player1;
        const p2Score = this.score.player2;

        // Need at least 11 points and 2 point lead
        return (p1Score >= this.settings.pointsToWin && p1Score - p2Score >= 2) ||
               (p2Score >= this.settings.pointsToWin && p2Score - p1Score >= 2);
    }

    endSet() {
        const winner = this.score.player1 > this.score.player2 ? 1 : 2;

        // Update sets won
        if (winner === 1) {
            this.sets.player1++;
        } else {
            this.sets.player2++;
        }

        // Record set history
        this.gameStats.setsHistory.push({
            set: this.gameStats.currentSet,
            player1Score: this.score.player1,
            player2Score: this.score.player2,
            winner: winner
        });

        // Check for match win
        const setsToWin = Math.ceil(this.settings.matchFormat / 2);
        if (this.sets.player1 >= setsToWin || this.sets.player2 >= setsToWin) {
            this.endMatch();
            return;
        }

        // Prepare for next set
        this.gameStats.currentSet++;
        this.score = { player1: 0, player2: 0 };
        this.serving.currentServer = this.serving.currentServer === 1 ? 2 : 1; // Alternate serve

        this.updateScoreboard();
        this.updateMatchHistory();
        this.showSetWinMessage(winner);
    }

    endMatch() {
        const matchWinner = this.sets.player1 > this.sets.player2 ? 1 : 2;
        const winnerName = document.getElementById(`player${matchWinner}-name`).textContent;

        this.gameState = 'gameOver';
        this.gameRunning = false;

        // Add win animation
        document.querySelector('.scoreboard').classList.add('game-won');
        setTimeout(() => {
            document.querySelector('.scoreboard').classList.remove('game-won');
        }, 1000);

        this.showOverlay(
            `🏆 ${winnerName} Wins! 🏆`,
            `Final Score: ${this.sets.player1} - ${this.sets.player2}`,
            true
        );

        this.updateMatchHistory();
    }

    showSetWinMessage(winner) {
        const winnerName = document.getElementById(`player${winner}-name`).textContent;
        const setScore = `${this.gameStats.setsHistory[this.gameStats.setsHistory.length - 1].player1Score} - ${this.gameStats.setsHistory[this.gameStats.setsHistory.length - 1].player2Score}`;

        this.gameRunning = false;
        this.showOverlay(
            `Set ${this.gameStats.currentSet - 1} Winner: ${winnerName}`,
            `Score: ${setScore}`,
            true
        );
    }

    updateServing() {
        this.serving.pointsInService++;

        const wasDeuce = this.serving.isDeuce;
        this.serving.isDeuce = this.isDeuce();

        // Check if serve should switch
        let shouldSwitch = false;

        if (this.serving.isDeuce && !wasDeuce) {
            // Just entered deuce
            this.serving.pointsInService = 0;
        }

        if (this.serving.isDeuce) {
            // In deuce, switch every point
            shouldSwitch = this.serving.pointsInService >= this.settings.deuceServeSwitchPoints;
        } else {
            // Normal serving
            shouldSwitch = this.serving.pointsInService >= this.settings.serveSwitchPoints;
        }

        if (shouldSwitch) {
            this.serving.currentServer = this.serving.currentServer === 1 ? 2 : 1;
            this.serving.pointsInService = 0;
        }

        this.updateServeIndicator();
    }

    isDeuce() {
        return this.score.player1 >= this.settings.pointsToWin - 1 && 
               this.score.player2 >= this.settings.pointsToWin - 1;
    }

    updateServeIndicator() {
        const player1Serve = document.getElementById('player1-serve');
        const player2Serve = document.getElementById('player2-serve');

        player1Serve.classList.toggle('active', this.serving.currentServer === 1);
        player2Serve.classList.toggle('active', this.serving.currentServer === 2);
    }

    updateScoreboard() {
        document.getElementById('player1-score').textContent = this.score.player1;
        document.getElementById('player2-score').textContent = this.score.player2;
        document.getElementById('player1-sets').textContent = this.sets.player1;
        document.getElementById('player2-sets').textContent = this.sets.player2;
        document.getElementById('current-set').textContent = this.gameStats.currentSet;
        document.getElementById('current-round').textContent = this.gameStats.currentRound;
    }

    updateMatchHistory() {
        const historyContainer = document.getElementById('sets-history');
        historyContainer.innerHTML = '';

        this.gameStats.setsHistory.forEach((set, index) => {
            const setElement = document.createElement('div');
            setElement.className = 'set-result';

            const player1Name = document.getElementById('player1-name').textContent;
            const player2Name = document.getElementById('player2-name').textContent;

            setElement.innerHTML = `
                <h4>Set ${set.set}</h4>
                <div class="score">${set.player1Score} - ${set.player2Score}</div>
                <div class="winner">${set.winner === 1 ? player1Name : player2Name}</div>
            `;

            if (set.winner === 1) {
                setElement.classList.add('won');
            } else {
                setElement.classList.add('lost');
            }

            historyContainer.appendChild(setElement);
        });
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.drawBackground();

        // Draw game objects
        this.drawPaddles();
        this.drawBall();
        this.drawNet();
        this.drawCenterLine();
    }

    drawBackground() {
        // Table surface
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(1, '#27ae60');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Table edges
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);
    }

    drawNet() {
        // Net post and net
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.canvas.width / 2 - 2, 0, 4, this.canvas.height);

        // Net pattern
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;

        for (let y = 10; y < this.canvas.height; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width / 2 - 15, y);
            this.ctx.lineTo(this.canvas.width / 2 + 15, y);
            this.ctx.stroke();
        }
    }

    drawCenterLine() {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);

        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawPaddles() {
        // Paddle 1
        this.ctx.fillStyle = this.paddle1.color;
        this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);

        // Paddle 1 highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width / 3, this.paddle1.height);

        // Paddle 2
        this.ctx.fillStyle = this.paddle2.color;
        this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

        // Paddle 2 highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(this.paddle2.x + (this.paddle2.width * 2/3), this.paddle2.y, this.paddle2.width / 3, this.paddle2.height);
    }

    drawBall() {
        // Ball shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x + 2, this.ball.y + 2, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Ball
        this.ctx.fillStyle = this.ball.color;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Ball highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x - 2, this.ball.y - 2, this.ball.radius / 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            font-weight: bold;
            transition: all 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new TableTennisGame();

    // Make game globally accessible for debugging
    window.tableTennisGame = game;
});

// Additional utility functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Service Worker registration for offline play (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}