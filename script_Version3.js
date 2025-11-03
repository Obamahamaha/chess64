// Basic integration: chess.js for rules, chessboard.js for UI
// Added a lightweight AI (minimax + alpha-beta) with adjustable "ELO-like" strength.

let board = null;
let game = new Chess();

const statusEl = () => document.getElementById('statusText');
const moveListEl = () => document.getElementById('moveList');
const playAICheck = () => document.getElementById('playAI');
const aiSideSelect = () => document.getElementById('aiSide');
const aiStrengthEl = () => document.getElementById('aiStrength');
const eloLabelEl = () => document.getElementById('eloLabel');

const config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  pieceTheme: 'https://unpkg.com/chessboardjs@1.0.0/img/chesspieces/wikipedia/{piece}.png'
};

function onDragStart(source, piece, position, orientation) {
  if (game.game_over()) return false;

  if (playAICheck().checked && ((game.turn() === 'w' && aiSideSelect().value === 'white') ||
      (game.turn() === 'b' && aiSideSelect().value === 'black'))) {
    return false;
  }

  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop(source, target) {
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  if (move === null) return 'snapback';

  updateStatus();
  updateMoveList();

  if (playAICheck().checked && !game.game_over()) {
    const turn = game.turn() === 'w' ? 'white' : 'black';
    if (turn === aiSideSelect().value) {
      setTimeout(() => makeAIMove(), 250);
    }
  }
}

function onSnapEnd() {
  board.position(game.fen());
}

function updateStatus() {
  let status = '';

  if (game.in_checkmate()) {
    status = 'Checkmate. ' + (game.turn() === 'w' ? 'Black' : 'White') + ' wins';
  } else if (game.in_draw()) {
    status = 'Draw';
  } else {
    status = (game.turn() === 'w' ? 'White' : 'Black') + ' to move';
    if (game.in_check()) {
      status += ' — check';
    }
  }
  statusEl().textContent = status;
}

function updateMoveList() {
  const ol = moveListEl();
  ol.innerHTML = '';
  const history = game.history({ verbose: true });
  for (let i = 0; i < history.length; i += 2) {
    const li = document.createElement('li');
    const moveNum = (i / 2) + 1;
    const white = history[i] ? history[i].san : '';
    const black = history[i + 1] ? history[i + 1].san : '';
    li.innerHTML = `<strong>${moveNum}.</strong> ${white} ${black ? ' ' + black : ''}`;
    ol.appendChild(li);
  }
  ol.scrollTop = ol.scrollHeight;
}

function onUndo() {
  if (playAICheck().checked) {
    game.undo();
  }
  game.undo();
  board.position(game.fen());
  updateStatus();
  updateMoveList();
}

function onReset() {
  game.reset();
  board.start();
  updateStatus();
  updateMoveList();
}

function onOrientationChange(value) {
  board.orientation(value);
}

const pieceValue = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

function evaluateBoard(chess) {
  if (chess.in_checkmate()) {
    return chess.turn() === 'w' ? -999999 : 999999;
  }
  if (chess.in_draw() || chess.in_stalemate() || chess.in_threefold_repetition()) {
    return 0;
  }

  const board = chess.board();
  let value = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (piece != null) {
        const v = pieceValue[piece.type] || 0;
        value += (piece.color === 'w') ? v : -v;
      }
    }
  }
  return value;
}

function eloToParams(elo) {
  let depth = 2;
  let randomness = 0.25;

  if (elo < 900) { depth = 1; randomness = 0.7; }
  else if (elo < 1100) { depth = 2; randomness = 0.5; }
  else if (elo < 1400) { depth = 2; randomness = 0.35; }
  else if (elo < 1700) { depth = 3; randomness = 0.2; }
  else if (elo < 2000) { depth = 4; randomness = 0.12; }
  else if (elo < 2300) { depth = 5; randomness = 0.06; }
  else { depth = 6; randomness = 0.02; }

  return { depth, randomness };
}

function getBestMove(chess, maxDepth, aiColor) {
  const moves = chess.moves();
  if (moves.length === 0) return null;

  let bestMove = null;
  let bestScore = -Infinity;

  function orderMoves(movesList) {
    return movesList.sort((a, b) => {
      const isCapA = a.includes('x') ? 1 : 0;
      const isCapB = b.includes('x') ? 1 : 0;
      return isCapB - isCapA;
    });
  }

  const ordered = orderMoves(moves);

  for (let i = 0; i < ordered.length; i++) {
    const move = ordered[i];
    chess.move(move);
    const score = -negamax(chess, maxDepth - 1, -Infinity, Infinity, switchColor(aiColor));
    chess.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { move: bestMove, score: bestScore };
}

function negamax(chess, depth, alpha, beta, perspectiveColor) {
  if (depth === 0 || chess.game_over()) {
    const evalScore = evaluateBoard(chess);
    return perspectiveColor === 'w' ? evalScore : -evalScore;
  }

  let max = -Infinity;
  const moves = chess.moves();
  moves.sort((a, b) => (b.includes('x') ? 1 : 0) - (a.includes('x') ? 1 : 0));

  for (let i = 0; i < moves.length; i++) {
    chess.move(moves[i]);
    const score = -negamax(chess, depth - 1, -beta, -alpha, perspectiveColor);
    chess.undo();

    if (score > max) max = score;
    if (max > alpha) alpha = max;
    if (alpha >= beta) break;
  }
  return max;
}

function switchColor(color) {
  return color === 'w' ? 'b' : 'w';
}

function makeAIMove() {
  if (game.game_over()) return;

  const elo = parseInt(aiStrengthEl().value, 10);
  const params = eloToParams(elo);
  const aiColor = aiSideSelect().value === 'white' ? 'w' : 'b';
  const perspective = aiColor;

  const moves = game.moves();
  if (moves.length === 0) return;

  const best = getBestMove(game, params.depth, perspective);
  if (!best || !best.move) {
    const m = moves[Math.floor(Math.random() * moves.length)];
    game.move(m);
    board.position(game.fen());
    updateStatus();
    updateMoveList();
    return;
  }

  if (Math.random() < params.randomness) {
    const k = Math.min(4, moves.length);
    const scored = [];
    for (let i = 0; i < moves.length; i++) {
      const mv = moves[i];
      game.move(mv);
      const sc = evaluateBoard(game) * (perspective === 'w' ? 1 : -1);
      game.undo();
      scored.push({ move: mv, score: sc });
    }
    scored.sort((a, b) => b.score - a.score);
    const pick = scored[Math.floor(Math.random() * Math.min(k, scored.length))].move;
    game.move(pick);
  } else {
    game.move(best.move);
  }

  board.position(game.fen());
  updateStatus();
  updateMoveList();
}

document.addEventListener('DOMContentLoaded', () => {
  board = Chessboard('board', config);
  updateStatus();
  updateMoveList();

  document.getElementById('undoBtn').addEventListener('click', onUndo);
  document.getElementById('resetBtn').addEventListener('click', onReset);
  document.getElementById('orientation').addEventListener('change', (e) => onOrientationChange(e.target.value));

  playAICheck().addEventListener('change', () => {
    if (playAICheck().checked) {
      setTimeout(() => {
        const turn = game.turn() === 'w' ? 'white' : 'black';
        if (turn === aiSideSelect().value && !game.game_over()) {
          makeAIMove();
        }
      }, 250);
    }
  });

  aiStrengthEl().addEventListener('input', () => {
    eloLabelEl().textContent = aiStrengthEl().value;
  });

  eloLabelEl().textContent = aiStrengthEl().value;
});