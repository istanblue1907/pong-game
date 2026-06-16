// Canvas setup
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas sizing
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    game.width = canvas.width;
    game.height = canvas.height;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});

// Detect device type
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Game objects
const game = {
    width: canvas.width,
    height: canvas.height,
    score: {
        player: 0,
        computer: 0
    },
    isRunning: false,
    isPaused: false
};

// Paddle properties
const paddleHeight = game.height * 0.2;
const paddleWidth = game.width * 0.015;

const player = {
    x: game.width * 0.01,
    y: game.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: game.height * 0.015,
    touchY: 0,
    lastTouchY: 0,
    useMouseControl: true
};

const computer = {
    x: game.width - paddleWidth - game.width * 0.01,
    y: game.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: game.height * 0.012
};

// Ball properties
const ball = {
    x: game.width / 2,
    y: game.height / 2,
    radius: game.width * 0.008,
    dx: game.width * 0.0062,
    dy: game.width * 0.0062,
    speed: game.width * 0.0062
};

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    Space: false
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') keys.ArrowUp = true;
    if (e.key === 'ArrowDown') keys.ArrowDown = true;
    if (e.key === ' ') {
        e.preventDefault();
        toggleGameState();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
});

// Mouse tracking for player paddle
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.touchY = e.clientY - rect.top;
});

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!game.isRunning) {
        toggleGameState();
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        player.touchY = e.touches[0].clientY - rect.top;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
});

// Game state toggle
function toggleGameState() {
    if (!game.isRunning) {
        game.isRunning = true;
        game.isPaused = false;
        gameLoop();
    } else {
        game.isPaused = !game.isPaused;
    }
}

// Update player paddle position
function updatePlayerPaddle() {
    if (keys.ArrowUp) {
        player.dy = -player.speed;
    } else if (keys.ArrowDown) {
        player.dy = player.speed;
    } else {
        player.dy = 0;
    }

    // Allow touch/mouse control
    if (player.touchY !== 0) {
        const targetY = player.touchY - player.height / 2;
        const diff = targetY - player.y;
        
        if (Math.abs(diff) > 5) {
            player.dy = Math.max(-player.speed, Math.min(player.speed, diff / 4));
        }
    }

    player.y += player.dy;

    // Collision with walls
    if (player.y < 0) {
        player.y = 0;
    }
    if (player.y + player.height > game.height) {
        player.y = game.height - player.height;
    }
}

// Update computer paddle position (AI)
function updateComputerPaddle() {
    const computerCenter = computer.y + computer.height / 2;
    const ballCenter = ball.y;
    const diff = ballCenter - computerCenter;

    // AI difficulty adjustment
    if (Math.abs(diff) > game.height * 0.1) {
        if (diff > 0) {
            computer.y += computer.speed;
        } else {
            computer.y -= computer.speed;
        }
    } else {
        computer.y += computer.speed * (diff / (game.height * 0.15));
    }

    // Collision with walls
    if (computer.y < 0) {
        computer.y = 0;
    }
    if (computer.y + computer.height > game.height) {
        computer.y = game.height - computer.height;
    }
}

// Update ball position
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > game.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(game.height - ball.radius, ball.y));
    }

    // Collision with player paddle
    if (
        ball.x - ball.radius < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx = -ball.dx;
        ball.x = player.x + player.width + ball.radius;
        const hitPos = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        ball.dy = hitPos * ball.speed;
    }

    // Collision with computer paddle
    if (
        ball.x + ball.radius > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.dx = -ball.dx;
        ball.x = computer.x - ball.radius;
        const hitPos = (ball.y - (computer.y + computer.height / 2)) / (computer.height / 2);
        ball.dy = hitPos * ball.speed;
    }

    // Ball out of bounds (scoring)
    if (ball.x < 0) {
        game.score.computer++;
        resetBall();
    }
    if (ball.x > game.width) {
        game.score.player++;
        resetBall();
    }
}

// Reset ball to center
function resetBall() {
    ball.x = game.width / 2;
    ball.y = game.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() * 2 - 1) * ball.speed;
}

// Draw functions
function drawPaddle(paddle) {
    ctx.fillStyle = '#667eea';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#667eea';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawCenter() {
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(game.width / 2, 0);
    ctx.lineTo(game.width / 2, game.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, game.width, game.height);
    drawCenter();
    drawPaddle(player);
    drawPaddle(computer);
    drawBall();

    if (game.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, game.width, game.height);
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold ' + (game.width * 0.1) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', game.width / 2, game.height / 2);
    }
}

// Update scores display
function updateScoreboard() {
    document.getElementById('playerScore').textContent = game.score.player;
    document.getElementById('computerScore').textContent = game.score.computer;
}

// Game loop
function gameLoop() {
    if (!game.isPaused) {
        updatePlayerPaddle();
        updateComputerPaddle();
        updateBall();
        updateScoreboard();
    }

    draw();

    if (game.isRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Start screen message
function drawStartScreen() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, game.width, game.height);
    drawCenter();

    ctx.fillStyle = '#667eea';
    ctx.font = 'bold ' + (game.width * 0.12) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PONG', game.width / 2, game.height / 2 - game.height * 0.1);

    ctx.font = (game.width * 0.04) + 'px Arial';
    const startText = isMobile ? 'Tap to start' : 'Press SPACE to start';
    ctx.fillText(startText, game.width / 2, game.height / 2 + game.height * 0.1);
}

draw();
drawStartScreen();
