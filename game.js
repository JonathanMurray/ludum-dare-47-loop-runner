console.log("Start of game.js");

const STATE_PLAYING = "__PLAYING__";
const STATE_BETWEEN_LOOPS = "__BETWEEN_LOOPS__";
const STATE_BETWEEN_MAPS = "__BETWEEN_MAPS__";

const TRANSITION_DELAY = 700;

var elapsed_time_since_transition_started = 0;

var player_movement = [0, 0];
var loop_index = 0;

setup_input_handler(
  function () { player_movement = [1, 0] },
  function () { player_movement = [0, -1] },
  function () { player_movement = [-1, 0] },
  function () { player_movement = [0, 1] },
  function () {
    if (current_state == STATE_BETWEEN_LOOPS && elapsed_time_since_transition_started > TRANSITION_DELAY) {
      var ghost_movement_plans = game_state.ghost_movement_plans;
      ghost_movement_plans.push(recorded_player_moves);
      game_state = get_current_map_game_state(ghost_movement_plans);
      recorded_player_moves = [];
      current_state = STATE_PLAYING;
      loop_index++;
      document.getElementById("loop-text").textContent = loop_index + 1;
      update_move_bars_between_loops();
    } else if (current_state == STATE_BETWEEN_MAPS && elapsed_time_since_transition_started > TRANSITION_DELAY) {
      current_map_index++;
      reset_game();
    }
  }
);

var current_map_index = 0;

const MAP_FACTORY_FUNCTIONS = [
  intro_map,
  loop_intro_map,
  learn_button_map,
  learn_fire_map,
  learn_box_map,
  intermediate_box_button_map,
  box_button_combination_map,
  intermediate_ghost_interaction_map,
  intermediate_timing_map,
  learn_order_map,
  advanced_order_map,
];

function get_current_map_game_state(ghost_movement_plans) {
  return MAP_FACTORY_FUNCTIONS[current_map_index](ghost_movement_plans);
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var figure_image = new Image();
figure_image.src = "assets/figure.svg";

var fire1_image = new Image();
fire1_image.src = "assets/fire1.svg";

var fire2_image = new Image();
fire2_image.src = "assets/fire2.svg";

var key_image = new Image();
key_image.src = "assets/key.svg";

var button_image = new Image();
button_image.src = "assets/button.svg";

var button_pushed_image = new Image();
button_pushed_image.src = "assets/button_pushed.svg";

var door_image = new Image();
door_image.src = "assets/door.svg";

var box_image = new Image();
box_image.src = "assets/box.svg";

var flag_image = new Image();
flag_image.src = "assets/flag.svg";

var move_sound = new Audio('assets/move.wav');
var move_into_immovable_sound = new Audio('assets/move_into_immovable.wav');
var death_sound = new Audio('assets/explosion.mp3');
var victory_sound = new Audio('assets/victory_2.wav');

var w = 400;
var h = 400;
var cell_w = 40;
const MAX_NUM_MOVES = 10;

const CHARACTER_MOVES_BARS_CONTAINER = document.getElementById("character-moves-bars-container");
const CHARACTER_MOVES_BARS = document.getElementsByClassName("character-moves-bar");


// This list is filled up with moves as you play, and then used for ghost
recorded_player_moves = [];

reset_game();

function draw(game_state) {
  ctx.clearRect(0, 0, w, h);

  ctx.drawImage(
    flag_image, (game_state.goal_position.x + .1) * cell_w,
    (game_state.goal_position.y + .1) * cell_w, cell_w * .8, cell_w * .9);

  ctx.fillStyle = "#000000";
  game_state.obstacles.forEach(o => {
    ctx.fillRect(o.x * cell_w, o.y * cell_w, cell_w, cell_w, cell_w);
  });

 
  game_state.traps.forEach(o => {
    ctx.drawImage(game_state.use_fire1 ? fire1_image : fire2_image, o.x * cell_w, o.y * cell_w, cell_w, cell_w);
  });
  game_state.key_door_pairs.forEach(p => {
    ctx.drawImage(key_image, p.key.x * cell_w, p.key.y * cell_w, cell_w, cell_w);
    ctx.drawImage(door_image, p.door.x * cell_w, p.door.y * cell_w, cell_w, cell_w);
  });
  game_state.button_door_pairs.forEach(p => {
    if (!p.is_open) {
      ctx.drawImage(button_image, p.button.x * cell_w, p.button.y * cell_w, cell_w, cell_w);
      ctx.drawImage(door_image, p.door.x * cell_w, p.door.y * cell_w, cell_w, cell_w);
    } else {
      ctx.drawImage(button_pushed_image, p.button.x * cell_w, p.button.y * cell_w, cell_w, cell_w);
    }
  });
  game_state.boxes.forEach(b => {
    ctx.drawImage(box_image, b.x * cell_w, b.y * cell_w, cell_w, cell_w);
  });

  game_state.characters.forEach(c => {
    if (c.is_alive) {
      ctx.fillStyle = c.is_player ? "#DDFFBB" : "#FFDDBB";
      ctx.beginPath();
      ctx.arc(c.position.x * cell_w + cell_w/2, c.position.y * cell_w + cell_w/2, cell_w/3,
        0, 2 * Math.PI);
      ctx.fill();
      ctx.drawImage(
        figure_image, c.position.x * cell_w, c.position.y * cell_w, cell_w, cell_w);
    }
  });

  // Draw grid
  for (var i = 0; i <= game_state.grid_w; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell_w, 0);
    ctx.lineTo(i * cell_w, game_state.grid_h * cell_w);
    ctx.stroke();
  }
  for (var j = 0; j <= game_state.grid_h; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * cell_w);
    ctx.lineTo(game_state.grid_w * cell_w, j * cell_w);
    ctx.stroke();
  }
}

function update_move_cell_graphics(move_cell, movement) {
  move_cell.classList.add("move-cell-visited");
  if (movement[0] == 1 && movement[1] == 0) {
    move_cell.textContent = ">";
  } else if (movement[0] == -1 && movement[1] == 0) {
    move_cell.textContent = "<";
  } else if (movement[0] == 0 && movement[1] == 1) {
    move_cell.textContent = "v";
  } else if (movement[0] == 0 && movement[1] == -1) {
    move_cell.textContent = "^";
  } else {
    move_cell.textContent = "";
  }
}

function update_move_bars_between_loops() {
  for (var i = 0; i < CHARACTER_MOVES_BARS.length; i++) {
    var bar = CHARACTER_MOVES_BARS[i];
    for (var j = 0; j < bar.children.length; j++) {
      var cell = bar.children[j];
      cell.classList = [];
    }
    //clear_move_cell_graphics(PLAYER_MOVES_BAR.children[i]);
  }
  var last_bar = CHARACTER_MOVES_BARS[CHARACTER_MOVES_BARS.length - 1];
  var cloned_bar = last_bar.cloneNode(true);

  for (var j = 0; j < cloned_bar.children.length; j++) {
    var cell = cloned_bar.children[j];
    cell.classList = [];
    cell.textContent = "";
  }

  CHARACTER_MOVES_BARS_CONTAINER.appendChild(cloned_bar);
}

function clear_move_cell_graphics(move_cell) {
  move_cell.classList = [];
  move_cell.textContent = "";
}

function play_sound(sound) {
  sound.pause();
  sound.currentTime = 0;
  sound.play();
}

function handle_character_movement(game_state, character_i, movement) {
  var is_player = game_state.characters[character_i].is_player;

  if (!game_state.characters[character_i].is_alive) {
    update_character_and_move_index(game_state);
    return;
  }

  if (is_player && movement[0] == 0 && movement[1] == 0) {
    return;
  }

  var move_result = perform_character_movement(game_state, character_i, movement[0], movement[1]);
  if (move_result == MOVEMENT_NOT_READY) {
    return;
  }

  if (is_player) {
    recorded_player_moves.push(movement);
  }
  move_cell = CHARACTER_MOVES_BARS[character_i].children[game_state.move_index];
  update_move_cell_graphics(move_cell, movement);

  if (move_result == TRAP_COLLISION) {
    play_sound(move_sound);
    play_sound(death_sound);
  } else if (move_result == GOAL_COLLISION) {
    console.log("YOU WIN");
    game_state.has_won = true;
    play_sound(move_sound);
    play_sound(victory_sound);
  } else if (move_result == IMMOVABLE_COLLISION) {
    play_sound(move_into_immovable_sound);
  } else {
    play_sound(move_sound);
  }

  update_character_and_move_index(game_state);


}

function update_character_and_move_index(game_state) {
  game_state.active_character_i = (game_state.active_character_i + 1) % game_state.characters.length;
  if (game_state.active_character_i == 0) {
    game_state.move_index++;
  }
}

function update_playing(elapsed_time) {

  if (game_state.has_won) {
    ctx.font = '24px serif';
    ctx.fillStyle = "#000000";
    ctx.fillText("Map cleared!", 50, 320);

    // completed the last map
    if (current_map_index == MAP_FACTORY_FUNCTIONS.length - 1) {
      window.location.href = "ending.html";
    }
    current_state = STATE_BETWEEN_MAPS;
    elapsed_time_since_transition_started = 0;
    return;
  } else {
    if (are_all_characters_dead(game_state) || game_state.move_index == MAX_NUM_MOVES) {
      ctx.font = '24px serif';
      ctx.fillStyle = "#000000";
      ctx.fillText("Out of moves...", 50, 320);

      current_state = STATE_BETWEEN_LOOPS;
      elapsed_time_since_transition_started = 0;
      return;
    }

    var active_character = game_state.characters[game_state.active_character_i];
    if (active_character.is_player) {
      var movement = player_movement;
    } else {
      if (game_state.move_index < active_character.movement_plan.length) {
        var movement = active_character.movement_plan[game_state.move_index];
      } else {
        var movement = [0, 0];
      }
    }

    handle_character_movement(game_state, game_state.active_character_i, movement);

    if (active_character.is_player) {
      player_movement = [0, 0];
    }
  }
  update_objects(game_state, elapsed_time);
  draw(game_state);
}

function are_all_characters_dead(game_state) {
  for (var i = 0; i < game_state.characters.length; i++) {
    if (game_state.characters[i].is_alive) {
      return false;
    }
  }
  return true;
}

function update_during_loop_transition(elapsed_time) {
  if (elapsed_time_since_transition_started < TRANSITION_DELAY
      && elapsed_time_since_transition_started + elapsed_time >= TRANSITION_DELAY){
    ctx.fillText("press any key to start next loop", 50, 350);
  }
  elapsed_time_since_transition_started += elapsed_time;
}

function update_during_map_transition(elapsed_time) {
  if (elapsed_time_since_transition_started < TRANSITION_DELAY
      && elapsed_time_since_transition_started + elapsed_time >= TRANSITION_DELAY){
    ctx.fillText("press any key to go to next map", 50, 350);
  }
  elapsed_time_since_transition_started += elapsed_time;
}

function loop(timestamp) {
  var elapsed_time = timestamp - lastRender;

  if (current_state == STATE_PLAYING) {
    update_playing(elapsed_time);
  } else if (current_state == STATE_BETWEEN_LOOPS) {
    update_during_loop_transition(elapsed_time);
  } else if (current_state == STATE_BETWEEN_MAPS) {
    update_during_map_transition(elapsed_time);
  } else {
    console.error("Invalid current state: " + current_state);
  }

  lastRender = timestamp;
  window.requestAnimationFrame(loop);
}

function reset_game() {
  recorded_player_moves = [];
  current_state = STATE_PLAYING;
  game_state = get_current_map_game_state([]);

  document.getElementById("mapname-text").textContent = "Map " + (current_map_index + 1) + ": " + game_state.map_name;
  loop_index = 0;
  document.getElementById("loop-text").textContent = loop_index + 1;

  // Remove all ghost moves bars
  while (CHARACTER_MOVES_BARS_CONTAINER.children.length > 1) {
    console.log(CHARACTER_MOVES_BARS_CONTAINER);
    console.log("removing one");
    CHARACTER_MOVES_BARS_CONTAINER.removeChild(CHARACTER_MOVES_BARS_CONTAINER.lastChild);
  }

  var cells = CHARACTER_MOVES_BARS[0].children;
  for (var i = 0; i < cells.length; i ++) {
    clear_move_cell_graphics(cells[i]);
  }
}

lastRender = 0
window.requestAnimationFrame(loop)

document.getElementById("btn-reset").onclick = function (e) {
  reset_game();
}

console.log("End of game.js");