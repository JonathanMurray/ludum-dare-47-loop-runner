console.log("Start of game.js");

// WASD
var KEY_RIGHT = 68;
var KEY_UP = 87;
var KEY_LEFT = 65;
var KEY_DOWN = 83;

var round_number = 1;

INPUT = {
  right_held: false,
  up_held: false,
  left_held: false,
  down_held: false,
  onkeydown: function (e) {
    var e = e || window.event;
    var code = e.keyCode;

    if (code == KEY_RIGHT && !INPUT.right_held) {
      INPUT.right_held = true;
      player_dx = 1;
      player_dy = 0;
    } else if (code == KEY_UP && !INPUT.up_held) {
      INPUT.up_held = true;
      player_dx = 0;
      player_dy = -1;
    } else if (code == KEY_LEFT && !INPUT.left_held) {
      INPUT.left_held = true;
      player_dx = -1;
      player_dy = 0;
    } else if (code == KEY_DOWN && !INPUT.down_held) {
      INPUT.down_held = true;
      player_dx = 0;
      player_dy = 1;
    }

  },
  onkeyup: function (e) {
    var e = e || window.event;
    var code = e.keyCode;

    if (code == KEY_RIGHT) {
      INPUT.right_held = false;
    } else if (code == KEY_UP) {
      INPUT.up_held = false;
    } else if (code == KEY_LEFT) {
      INPUT.left_held = false;
    } else if (code == KEY_DOWN) {
      INPUT.down_held = false;
    }
  }
}

var player_dx = 0;
var player_dy = 0;

document.onkeydown = INPUT.onkeydown;
document.onkeyup = INPUT.onkeyup;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var figure = new Image();
figure.src = "figure.svg";

time_since_movement = 0;

var w = 400;
var h = 400;
var cell_w = 40;

const player_position = new_position(0, 0)

function update(elapsed_time) {
  if(player_dx != 0 || player_dy != 0){
    round_number ++;
    document.getElementById("round_text").innerText = round_number;
  }
  player_position.x += player_dx;
  player_position.y += player_dy;
  player_dx = player_dy = 0;
  obstacles.forEach(o => {
    if (player_occupies(o)) {
      console.log("YOU LOSE!");
      game_over = true;
    }
  });
  if (player_occupies(goal_position)) {
    console.log("YOU WIN!");
    game_over = true;
  }
}

function player_occupies(pos) {
  return player_position.x == pos.x && player_position.y == pos.y;
}

var obstacles = [new_position(3, 2), new_position(5, 5)];

let goal_position = new_position(5, 0);

function new_position(x, y) {
  return { "x": x, "y": y };
}

ctx.fillRect(player_position.x * cell_w, player_position.y * cell_w, cell_w, cell_w);

function draw() {
  ctx.clearRect(0, 0, w, h);

  for (x = 0; x < w; x += cell_w) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (y = 0; y < h; y += cell_w) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#00FF00";
  ctx.fillRect(goal_position.x * cell_w, goal_position.y, cell_w, cell_w, cell_w);

  ctx.fillStyle = "#000000";
  obstacles.forEach(o => {
    ctx.fillRect(o.x * cell_w, o.y * cell_w, cell_w, cell_w);
  });

  ctx.drawImage(figure, player_position.x * cell_w, player_position.y * cell_w, cell_w, cell_w);
}

var game_over = false;

function loop(timestamp) {
  var elapsed_time = timestamp - lastRender;

  if (!game_over) {
    update(elapsed_time);
    draw();
  }

  lastRender = timestamp;
  window.requestAnimationFrame(loop);
}

lastRender = 0
window.requestAnimationFrame(loop)

console.log("End of game.js");