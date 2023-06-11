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
const platform = {
  color: "blue",
  // height, width
  w: 20,
  h: 5,
  // position (top left corner)
  x: 0,
  y: 0,
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

const ship = {
  color: "black",
  // height, width
  w: 8,
  h: 22,
  // position (of ship center)
  x: 0,
  y: 0,
  // velocity
  dx: 0,
  dy: 0,
  mainEngine: false,
  leftEngine: false,
  rightEngine: false,
  crashed: false,
  landed: false,
};

function initShip() {
  // position
  ship.x = 150 + Math.random() * 100;
  ship.y = 150 + Math.random() * 100;
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

  platform.top = platform.y;
  platform.bottom = platform.y + platform.h;
  platform.left = platform.x;
  platform.right = platform.x + platform.w;
}

function drawPlatform() {
  ctx.fillStyle = platform.color;
  ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
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

function drawLine(a, b, style) {
  ctx.beginPath();
  // draw a triange from three points a, b, and c.
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.strokeStyle = style;
  ctx.stroke();
}

function drawShip() {
  ctx.save();
  ctx.beginPath();
  ctx.translate(ship.x, ship.y);
  ctx.rect(ship.w * -0.5, ship.h * -0.5, ship.w, ship.h);
  ctx.fillStyle = ship.color;
  ctx.fill();
  ctx.closePath();

  if (ship.landed) {
    // draw landing struts
    drawLine(
      [ship.w * -0.5, ship.h * 0.5],
      [ship.w * -0.5, ship.h * 0.5 + lzBuffer],
      ship.color
    );
    drawLine(
      [ship.w * 0.5, ship.h * 0.5],
      [ship.w * 0.5, ship.h * 0.5 + lzBuffer],
      ship.color
    );
  } else {
    // Draw the flame if engine is on
    if (ship.mainEngine) {
      drawTriangle(
        [ship.w * -0.5, ship.h * 0.5],
        [ship.w * 0.5, ship.h * 0.5],
        [0, ship.h * 0.5 + Math.random() * 10],
        "orange"
      );
    }
    if (ship.rightEngine) {
      drawTriangle(
        [ship.w * 0.5, ship.h * -0.25],
        [ship.w * 0.5 + Math.random() * 10, 0],
        [ship.w * 0.5, ship.h * 0.25],
        "orange"
      );
    }
    if (ship.leftEngine) {
      drawTriangle(
        [ship.w * -0.5, ship.h * -0.25],
        [ship.w * -0.5 - Math.random() * 10, 0],
        [ship.w * -0.5, ship.h * 0.25],
        "orange"
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

function checkCollision() {
  const top = ship.y - ship.h / 2;
  const bottom = ship.y + ship.h / 2;
  const left = ship.x - ship.w / 2;
  const right = ship.x + ship.w / 2;

  // check if hit the canvas walls
  if (left < 0 || right > canvas.width || top < 0 || bottom > canvas.height) {
    ship.crashed = true;
    return;
  }

  // check if hit platform
  const notOverlappingPlatform =
    bottom < platform.top ||
    left > platform.right ||
    right < platform.left ||
    top > platform.bottom;
  if (!notOverlappingPlatform) {
    // crashed into the platform!
    ship.crashed = true;
    return;
  }

  if (
    // ship is not moving too fast
    ship.dy < 0.1 &&
    ship.dx < 0.1 &&
    // ship is between the platform
    platform.left <= left &&
    right <= platform.right &&
    // the ship is above the platform
    bottom < platform.top &&
    // the ship is within lzBuffer distance above the platform
    platform.top - bottom < lzBuffer
  ) {
    ship.landed = true;
    return;
  }
}

function gameLoop() {
  updateShip();

  checkCollision();
  if (ship.crashed) {
    statusDiv.innerHTML = "GAME OVER - crashed";
    endGame();
  } else if (ship.landed) {
    statusDiv.innerHTML = "LANDED - you win!";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShip();
    drawPlatform();
    endGame();
  } else {
    // Clear entire screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShip();
    drawPlatform();
    requestAnimationFrame(gameLoop);
  }
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

function start() {
  // console.log("start", ship);
  startBtn.disabled = true;
  statusDiv.innerHTML = "";
  initShip();
  initPlatform();

  document.addEventListener("keyup", keyLetGo);
  document.addEventListener("keydown", keyPressed);
  requestAnimationFrame(gameLoop);
}

function endGame() {
  // console.log("endGame", ship);
  startBtn.disabled = false;
  document.removeEventListener("keyup", keyLetGo);
  document.removeEventListener("keydown", keyPressed);
}
