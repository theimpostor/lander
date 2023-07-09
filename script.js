const startBtn = document.getElementById("startBtn");
const statusDiv = document.getElementById("status");
const canvas = document.getElementById("game-area");
const ctx = canvas.getContext("2d");

// Set the canvas size to 400x400
canvas.width = 400;
canvas.height = 400;

const gravity = 0.01;
const sideEngineThrust = 0.01;
const mainEngineThrust = 0.03;
const lzBuffer = 4;
// projectiles
const prjs = [];

const terrain = [];

class Rect {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  get top() {
    return this.y;
  }
  get bottom() {
    return this.y + this.h;
  }
  get left() {
    return this.x;
  }
  get right() {
    return this.x + this.w;
  }
  get center() {
    return { x: this.x + this.w * 0.5, y: this.y + this.h * 0.5 };
  }
  // returns true if this Rect overlaps the other Rect
  overlaps(other) {
    return !(
      this.bottom < other.top ||
      this.left > other.right ||
      this.right < other.left ||
      this.top > other.bottom
    );
  }
}

const platform = new Rect(-100, -100, 20, 5);
platform.color = "blue";

const ship = new Rect(-100, -100, 8, 22);
ship.color = "black";

function initShip() {
  // position
  ship.x = Math.floor(150 + Math.random() * 100);
  ship.y = Math.floor(150 + Math.random() * 100);
  // velocity
  ship.dx = Math.random();
  ship.dy = Math.random();
  ship.mainEngine = false;
  ship.leftEngine = false;
  ship.rightEngine = false;
  ship.crashed = false;
  ship.landed = false;
}

function initPlatform() {
  // place randomly somwhere near the bottom near the center
  platform.x = Math.floor(Math.random() * 200) + 100;
  platform.y = Math.floor(Math.random() * 50) + 340;
}

function initTerrain() {
  terrain.length = 0;
  terrain.push([0, 390]);
  terrain.push([100, 280]);
  terrain.push([platform.x, platform.y + platform.h]);
  terrain.push([platform.x + platform.w, platform.y + platform.h]);
  terrain.push([300, 340]);
  terrain.push([400, 270]);
}

function initMeteors() {
  // truncate existing projectiles
  prjs.length = 0;
  for (let i = 0; i < 10; i++) {
    const prj = new Rect(Math.floor(Math.random() * 400), 0, 4, 4);
    prj.color = "brown";
    // velocity
    prj.dx = 2 - Math.random() * 4;
    prj.dy = Math.random() * 3;
    prjs.push(prj);
  }
}

function drawTriangle(a, b, c, fillStyle) {
  ctx.beginPath();
  // draw a triange from three points a, b, and c.
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function drawLine(a, b, style) {
  ctx.beginPath();
  // draw a line from a to b
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.strokeStyle = style;
  ctx.stroke();
}

function drawPlatform() {
  ctx.fillStyle = platform.color;
  ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
}

function drawTerrain() {
  ctx.beginPath();
  ctx.moveTo(0, 400);
  for (let i = 0; i < terrain.length; i++) {
    ctx.lineTo(terrain[i][0], terrain[i][1]);
  }
  ctx.lineTo(400, 400);
  ctx.closePath();
  ctx.fillStyle = "gray";
  ctx.fill();
}

function drawMeteors() {
  for (let i = 0; i < prjs.length; i++) {
    ctx.fillStyle = prjs[i].color;
    ctx.fillRect(prjs[i].x, prjs[i].y, prjs[i].w, prjs[i].h);
  }
}

function drawShip() {
  ctx.save();
  ctx.beginPath();
  ctx.translate(ship.center.x, ship.center.y);
  ctx.rect(ship.w * -0.5, ship.h * -0.5, ship.w, ship.h);
  ctx.fillStyle = ship.color;
  ctx.fill();
  ctx.closePath();

  if (ship.landed) {
    // draw landing struts
    drawLine(
      [ship.w * -0.5, ship.h * 0.5],
      [ship.w * -0.5, ship.h * 0.5 + lzBuffer],
      ship.color,
    );
    drawLine(
      [ship.w * 0.5, ship.h * 0.5],
      [ship.w * 0.5, ship.h * 0.5 + lzBuffer],
      ship.color,
    );
  } else {
    // Draw the flame if engine is on
    if (ship.mainEngine) {
      drawTriangle(
        [ship.w * -0.5, ship.h * 0.5],
        [ship.w * 0.5, ship.h * 0.5],
        [0, ship.h * 0.5 + Math.random() * 10],
        "orange",
      );
    }
    if (ship.rightEngine) {
      drawTriangle(
        [ship.w * 0.5, ship.h * -0.25],
        [ship.w * 0.5 + Math.random() * 10, 0],
        [ship.w * 0.5, ship.h * 0.25],
        "orange",
      );
    }
    if (ship.leftEngine) {
      drawTriangle(
        [ship.w * -0.5, ship.h * -0.25],
        [ship.w * -0.5 - Math.random() * 10, 0],
        [ship.w * -0.5, ship.h * 0.25],
        "orange",
      );
    }
  }
  ctx.restore();
}

function updateShip() {
  // gravity is always acting on the ship
  ship.dy += gravity;

  // what other forces acting on the ship?
  if (ship.rightEngine) {
    ship.dx -= sideEngineThrust;
  }
  if (ship.leftEngine) {
    ship.dx += sideEngineThrust;
  }
  if (ship.mainEngine) {
    ship.dy -= mainEngineThrust;
  }

  // after calculating velocity, update our position
  ship.x += ship.dx;
  ship.y += ship.dy;
}

function updateMeteors() {
  let j = 0;
  for (let i = 0; i < prjs.length; i++) {
    let prj = prjs[i];
    prj.dy += gravity;
    // after calculating velocity, update our position
    prj.x += prj.dx;
    prj.y += prj.dy;

    // if it's still on screen, keep it in the list
    if (0 <= prj.x && prj.x <= canvas.width && prj.y <= canvas.height) {
      prjs[j++] = prj;
    }
  }
  prjs.length = j;
}

function checkCollision() {
  // check if hit the canvas walls
  if (
    ship.left < 0 ||
    ship.right > canvas.width ||
    ship.top < 0 ||
    ship.bottom > canvas.height
  ) {
    ship.crashed = true;
    return;
  }

  if (ship.overlaps(platform)) {
    // crashed into the platform!
    ship.crashed = true;
    return;
  }

  // check if hit meteor
  for (let i = 0; i < prjs.length; i++) {
    if (ship.overlaps(prjs[i])) {
      // crashed into the meteor!
      ship.crashed = true;
      return;
    }
  }

  // check if hit terrain
  for (let i = 0; i < terrain.length - 1; i++) {
    const collideLen = distance(terrain[i], terrain[i + 1]) + 0.2;
    if (
      collideLen >
        distance(terrain[i], [ship.left, ship.bottom]) +
          distance(terrain[i + 1], [ship.left, ship.bottom]) ||
      collideLen >
        distance(terrain[i], [ship.right, ship.bottom]) +
          distance(terrain[i + 1], [ship.right, ship.bottom])
    ) {
      // crashed into terrain!
      ship.crashed = true;
      return;
    }
  }

  if (
    // ship is not moving too fast
    ship.dy < 0.1 &&
    ship.dx < 0.1 &&
    // ship is between the platform
    platform.left <= ship.left &&
    ship.right <= platform.right &&
    // the ship is above the platform
    ship.bottom < platform.top &&
    // the ship is within lzBuffer distance above the platform
    platform.top - ship.bottom < lzBuffer
  ) {
    ship.landed = true;
    return;
  }
}

function gameLoop() {
  if (startBtn.disabled) {
    // game is running
    updateMeteors();
    updateShip();

    checkCollision();
    if (ship.crashed) {
      statusDiv.innerHTML = "GAME OVER - crashed";
      for (let i = 0; i < 10; i++) {
        const prj = new Rect(ship.center.x, ship.center.y, 4, 4);
        prj.color = `rgb(${Math.floor(Math.random() * 256)}, 0, 0)`;
        const speed = Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        prj.dx = ship.dx + Math.cos(angle) * speed;
        prj.dy = ship.dx + Math.sin(angle) * speed;
        prjs.push(prj);
      }
      endGame();
    } else if (ship.landed) {
      statusDiv.innerHTML = "LANDED - you win!";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawMeteors();
      drawShip();
      drawPlatform();
      drawTerrain();
      endGame();
    } else {
      // Clear entire screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawMeteors();
      drawShip();
      drawPlatform();
      drawTerrain();
    }
  } else {
    // game has ended/stopped

    updateMeteors();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMeteors();
    if (ship.landed) {
      drawShip();
    }
    drawPlatform();
    drawTerrain();
  }

  requestAnimationFrame(gameLoop);
}

function keyLetGo(event) {
  switch (event.keyCode) {
    case 37: // Left Arrow key
      ship.leftEngine = false;
      break;
    case 39: // Right Arrow key
      ship.rightEngine = false;
      break;
    case 40: // Down Arrow key
      ship.mainEngine = false;
      break;
    default:
      return;
  }
  // don't let arrow keys move screen around
  event.preventDefault();
}

function keyPressed(event) {
  switch (event.keyCode) {
    case 37: // Left Arrow key
      ship.leftEngine = true;
      break;
    case 39: // Right Arrow key
      ship.rightEngine = true;
      break;
    case 40: // Down Arrow key
      ship.mainEngine = true;
      break;
    default:
      return;
  }
  // don't let arrow keys move screen around
  event.preventDefault();
}

document.addEventListener("keyup", function (event) {
  if (event.keyCode == 32 /* Space */) {
    startBtn.click();
  }
});

function start() {
  statusDiv.innerHTML = "";
  initShip();
  initPlatform();
  initTerrain();
  initMeteors();

  document.addEventListener("keyup", keyLetGo);
  document.addEventListener("keydown", keyPressed);

  startBtn.disabled = true;
}

function endGame() {
  startBtn.disabled = false;

  document.removeEventListener("keyup", keyLetGo);
  document.removeEventListener("keydown", keyPressed);
}

requestAnimationFrame(gameLoop);
