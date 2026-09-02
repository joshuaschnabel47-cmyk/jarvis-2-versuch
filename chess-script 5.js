(function(){
"use strict";
const chessRootEl = document.getElementById('chessRoot') || document.body;
/* ============================================================
   HOLO CHESS — Engine, KI & Sprachsteuerung
   Reines Vanilla JS, keine Abhängigkeiten.
   ============================================================ */

/* ---------- Grundlagen / Hilfsfunktionen ---------- */

const FILES = ['a','b','c','d','e','f','g','h'];
const PIECE_GLYPH = {
  w: { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙' },
  b: { K:'♚', Q:'♛', R:'♜', B:'♝', N:'♞', P:'♟' }
};
const PIECE_NAME_DE = {
  K:'König', Q:'Dame', R:'Turm', B:'Läufer', N:'Springer', P:'Bauer'
};
const PIECE_VALUE = { P:100, N:320, B:330, R:500, Q:900, K:20000 };

function sq(row,col){ return FILES[col] + (8-row); }
function parseSq(name){ return { col: FILES.indexOf(name[0]), row: 8 - parseInt(name[1],10) }; }
function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }
function opposite(color){ return color==='w' ? 'b' : 'w'; }
function clonePiece(p){ return p ? { type:p.type, color:p.color } : null; }
function cloneBoard(board){ return board.map(row => row.map(clonePiece)); }

/* Piece-Square-Tables (aus Sicht Weiß, Reihe 0 = Rang 8) für etwas Stellungsgefühl */
const PST_PAWN = [
  [0,0,0,0,0,0,0,0],
  [50,50,50,50,50,50,50,50],
  [10,10,20,30,30,20,10,10],
  [5,5,10,25,25,10,5,5],
  [0,0,0,20,20,0,0,0],
  [5,-5,-10,0,0,-10,-5,5],
  [5,10,10,-20,-20,10,10,5],
  [0,0,0,0,0,0,0,0]
];
const PST_KNIGHT = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,0,0,0,0,-20,-40],
  [-30,0,10,15,15,10,0,-30],
  [-30,5,15,20,20,15,5,-30],
  [-30,0,15,20,20,15,0,-30],
  [-30,5,10,15,15,10,5,-30],
  [-40,-20,0,5,5,0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];
const PST_BISHOP = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,0,0,0,0,0,0,-10],
  [-10,0,5,10,10,5,0,-10],
  [-10,5,5,10,10,5,5,-10],
  [-10,0,10,10,10,10,0,-10],
  [-10,10,10,10,10,10,10,-10],
  [-10,5,0,0,0,0,5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];
const PST_KING = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20,20,0,0,0,0,20,20],
  [20,30,10,0,0,10,30,20]
];
function pst(type, row, col, color){
  const r = color==='w' ? row : 7-row;
  switch(type){
    case 'P': return PST_PAWN[r][col];
    case 'N': return PST_KNIGHT[r][col];
    case 'B': return PST_BISHOP[r][col];
    case 'K': return PST_KING[r][col];
    default: return 0;
  }
}

/* ---------- Spielzustand ---------- */

function createInitialState(){
  const back = ['R','N','B','Q','K','B','N','R'];
  const board = Array.from({length:8}, () => Array(8).fill(null));
  for(let c=0;c<8;c++){
    board[0][c] = { type: back[c], color:'b' };
    board[1][c] = { type:'P', color:'b' };
    board[6][c] = { type:'P', color:'w' };
    board[7][c] = { type: back[c], color:'w' };
  }
  return {
    board,
    turn: 'w',
    castling: { wK:true, wQ:true, bK:true, bQ:true },
    enPassant: null,
    history: [],
    captured: { w: [], b: [] } // captured[c] = vom Gegner geschlagene Steine der Farbe c
  };
}

function findKing(board,color){
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p = board[r][c];
    if(p && p.type==='K' && p.color===color) return {row:r,col:c};
  }
  return null;
}

/* Ist Feld (row,col) durch Farbe byColor angegriffen? */
function isSquareAttacked(board,row,col,byColor){
  // Bauern
  const pawnRow = byColor==='w' ? row+1 : row-1;
  for(const dc of [-1,1]){
    const pc = col+dc;
    if(inBounds(pawnRow,pc)){
      const p = board[pawnRow][pc];
      if(p && p.type==='P' && p.color===byColor) return true;
    }
  }
  // Springer
  const knightOffsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for(const [dr,dc] of knightOffsets){
    const r=row+dr,c=col+dc;
    if(inBounds(r,c)){
      const p = board[r][c];
      if(p && p.type==='N' && p.color===byColor) return true;
    }
  }
  // König
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
    if(dr===0 && dc===0) continue;
    const r=row+dr,c=col+dc;
    if(inBounds(r,c)){
      const p=board[r][c];
      if(p && p.type==='K' && p.color===byColor) return true;
    }
  }
  // Gleitfiguren: Turm/Dame horizontal-vertikal
  const rookDirs = [[0,1],[0,-1],[1,0],[-1,0]];
  for(const [dr,dc] of rookDirs){
    let r=row+dr,c=col+dc;
    while(inBounds(r,c)){
      const p = board[r][c];
      if(p){
        if(p.color===byColor && (p.type==='R' || p.type==='Q')) return true;
        break;
      }
      r+=dr; c+=dc;
    }
  }
  // Gleitfiguren: Läufer/Dame diagonal
  const bishopDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
  for(const [dr,dc] of bishopDirs){
    let r=row+dr,c=col+dc;
    while(inBounds(r,c)){
      const p = board[r][c];
      if(p){
        if(p.color===byColor && (p.type==='B' || p.type==='Q')) return true;
        break;
      }
      r+=dr; c+=dc;
    }
  }
  return false;
}

/* Pseudo-legale Züge einer Figur (ohne Prüfung auf eigenen Schach) */
function pseudoMovesForSquare(state,row,col){
  const board = state.board;
  const piece = board[row][col];
  if(!piece) return [];
  const moves = [];
  const color = piece.color;

  function addMove(toR,toC,extra={}){
    moves.push(Object.assign({
      from:{row,col}, to:{row:toR,col:toC}, piece: piece.type, color,
      isEnPassant:false, isCastle:null, promotion:null
    }, extra));
  }

  if(piece.type==='P'){
    const dir = color==='w' ? -1 : 1;
    const startRow = color==='w' ? 6 : 1;
    const promoRow = color==='w' ? 0 : 7;
    const oneR = row+dir;
    if(inBounds(oneR,col) && !board[oneR][col]){
      if(oneR===promoRow){
        for(const promo of ['Q','R','B','N']) addMove(oneR,col,{promotion:promo});
      } else {
        addMove(oneR,col);
        const twoR = row+2*dir;
        if(row===startRow && !board[twoR][col]) addMove(twoR,col,{isDouble:true});
      }
    }
    for(const dc of [-1,1]){
      const nc = col+dc, nr = row+dir;
      if(!inBounds(nr,nc)) continue;
      const target = board[nr][nc];
      if(target && target.color!==color){
        if(nr===promoRow){
          for(const promo of ['Q','R','B','N']) addMove(nr,nc,{promotion:promo, captured:target.type});
        } else {
          addMove(nr,nc,{captured:target.type});
        }
      } else if(state.enPassant && state.enPassant.row===nr && state.enPassant.col===nc){
        addMove(nr,nc,{isEnPassant:true, captured:'P'});
      }
    }
  }
  else if(piece.type==='N'){
    const offs = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for(const [dr,dc] of offs){
      const r=row+dr,c=col+dc;
      if(!inBounds(r,c)) continue;
      const target = board[r][c];
      if(!target) addMove(r,c);
      else if(target.color!==color) addMove(r,c,{captured:target.type});
    }
  }
  else if(piece.type==='K'){
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
      if(dr===0 && dc===0) continue;
      const r=row+dr,c=col+dc;
      if(!inBounds(r,c)) continue;
      const target = board[r][c];
      if(!target) addMove(r,c);
      else if(target.color!==color) addMove(r,c,{captured:target.type});
    }
    // Rochade
    const rights = state.castling;
    const homeRow = color==='w' ? 7 : 0;
    if(row===homeRow && col===4 && !isSquareAttacked(board,row,col,opposite(color))){
      const kSide = color==='w' ? rights.wK : rights.bK;
      const qSide = color==='w' ? rights.wQ : rights.bQ;
      if(kSide && !board[homeRow][5] && !board[homeRow][6] &&
         board[homeRow][7] && board[homeRow][7].type==='R' && board[homeRow][7].color===color &&
         !isSquareAttacked(board,homeRow,5,opposite(color)) &&
         !isSquareAttacked(board,homeRow,6,opposite(color))){
        addMove(homeRow,6,{isCastle:'K'});
      }
      if(qSide && !board[homeRow][3] && !board[homeRow][2] && !board[homeRow][1] &&
         board[homeRow][0] && board[homeRow][0].type==='R' && board[homeRow][0].color===color &&
         !isSquareAttacked(board,homeRow,3,opposite(color)) &&
         !isSquareAttacked(board,homeRow,2,opposite(color))){
        addMove(homeRow,2,{isCastle:'Q'});
      }
    }
  }
  else { // R, B, Q — Gleitfiguren
    let dirs = [];
    if(piece.type==='R') dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    else if(piece.type==='B') dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
    else dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
    for(const [dr,dc] of dirs){
      let r=row+dr,c=col+dc;
      while(inBounds(r,c)){
        const target = board[r][c];
        if(!target){ addMove(r,c); }
        else {
          if(target.color!==color) addMove(r,c,{captured:target.type});
          break;
        }
        r+=dr; c+=dc;
      }
    }
  }
  return moves;
}

function allPseudoMoves(state,color){
  const moves = [];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p = state.board[r][c];
    if(p && p.color===color) moves.push(...pseudoMovesForSquare(state,r,c));
  }
  return moves;
}

/* Zug ausführen (mutiert state), liefert Undo-Info wird intern im move gespeichert */
function makeMove(state, move){
  const board = state.board;
  const piece = board[move.from.row][move.from.col];
  const snapshot = {
    move,
    prevCastling: { ...state.castling },
    prevEnPassant: state.enPassant,
    capturedPiece: null,
    capturedSquare: null
  };

  // En passant: geschlagener Bauer steht NICHT auf dem Zielfeld
  if(move.isEnPassant){
    const capRow = move.from.row;
    const capCol = move.to.col;
    snapshot.capturedPiece = board[capRow][capCol];
    snapshot.capturedSquare = {row:capRow,col:capCol};
    board[capRow][capCol] = null;
  } else if(board[move.to.row][move.to.col]){
    snapshot.capturedPiece = board[move.to.row][move.to.col];
    snapshot.capturedSquare = {row:move.to.row,col:move.to.col};
  }

  // Figur versetzen (ggf. mit Umwandlung als neues Objekt)
  const movedPiece = { type: move.promotion || piece.type, color: piece.color };
  board[move.to.row][move.to.col] = movedPiece;
  board[move.from.row][move.from.col] = null;

  // Rochade: Turm mitbewegen
  if(move.isCastle){
    const homeRow = move.from.row;
    if(move.isCastle==='K'){
      board[homeRow][5] = board[homeRow][7];
      board[homeRow][7] = null;
    } else {
      board[homeRow][3] = board[homeRow][0];
      board[homeRow][0] = null;
    }
  }

  // Rochaderechte aktualisieren
  const c = state.castling;
  if(piece.type==='K'){
    if(piece.color==='w'){ c.wK=false; c.wQ=false; } else { c.bK=false; c.bQ=false; }
  }
  if(piece.type==='R'){
    if(piece.color==='w'){
      if(move.from.row===7 && move.from.col===0) c.wQ=false;
      if(move.from.row===7 && move.from.col===7) c.wK=false;
    } else {
      if(move.from.row===0 && move.from.col===0) c.bQ=false;
      if(move.from.row===0 && move.from.col===7) c.bK=false;
    }
  }
  // Wenn ein Turm auf seinem Startfeld geschlagen wird
  if(snapshot.capturedPiece && snapshot.capturedPiece.type==='R' && snapshot.capturedSquare){
    const s = snapshot.capturedSquare;
    if(s.row===7 && s.col===0) c.wQ=false;
    if(s.row===7 && s.col===7) c.wK=false;
    if(s.row===0 && s.col===0) c.bQ=false;
    if(s.row===0 && s.col===7) c.bK=false;
  }

  // En-passant-Zielfeld setzen
  if(move.isDouble){
    state.enPassant = { row:(move.from.row+move.to.row)/2, col:move.from.col };
  } else {
    state.enPassant = null;
  }

  state.turn = opposite(state.turn);
  state.history.push(snapshot);
  return snapshot;
}

function undoMove(state){
  const snap = state.history.pop();
  if(!snap) return;
  const board = state.board;
  const { move } = snap;

  state.turn = opposite(state.turn);
  state.castling = snap.prevCastling;
  state.enPassant = snap.prevEnPassant;

  // Figur zurücksetzen (Umwandlung rückgängig -> wieder Bauer)
  const piece = board[move.to.row][move.to.col];
  const restoredPiece = { type: move.promotion ? 'P' : move.piece, color: move.color };
  board[move.from.row][move.from.col] = restoredPiece;
  board[move.to.row][move.to.col] = null;

  if(move.isEnPassant && snap.capturedSquare){
    board[snap.capturedSquare.row][snap.capturedSquare.col] = snap.capturedPiece;
  } else if(snap.capturedPiece && snap.capturedSquare){
    board[snap.capturedSquare.row][snap.capturedSquare.col] = snap.capturedPiece;
  }

  if(move.isCastle){
    const homeRow = move.from.row;
    if(move.isCastle==='K'){
      board[homeRow][7] = board[homeRow][5];
      board[homeRow][5] = null;
    } else {
      board[homeRow][0] = board[homeRow][3];
      board[homeRow][3] = null;
    }
  }
}

/* Legale Züge = pseudo-legale Züge, die den eigenen König nicht im Schach lassen */
function generateLegalMoves(state,color){
  const pseudo = allPseudoMoves(state,color);
  const legal = [];
  for(const m of pseudo){
    makeMove(state,m);
    const kingPos = findKing(state.board,color);
    const stillInCheck = kingPos ? isSquareAttacked(state.board,kingPos.row,kingPos.col,opposite(color)) : false;
    undoMove(state);
    if(!stillInCheck) legal.push(m);
  }
  return legal;
}

function isInCheck(state,color){
  const k = findKing(state.board,color);
  if(!k) return false;
  return isSquareAttacked(state.board,k.row,k.col,opposite(color));
}

function gameStatus(state){
  const color = state.turn;
  const moves = generateLegalMoves(state,color);
  const check = isInCheck(state,color);
  if(moves.length===0){
    return check ? { over:true, result: opposite(color) } : { over:true, result:'draw' };
  }
  return { over:false, check, moves };
}

/* ---------- Bewertung & KI ---------- */

function evaluateBoard(board){
  let score = 0;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p = board[r][c];
    if(!p) continue;
    const val = PIECE_VALUE[p.type] + pst(p.type,r,c,p.color);
    score += p.color==='w' ? val : -val;
  }
  return score;
}

function orderMoves(moves){
  return moves.slice().sort((a,b) => {
    const av = a.captured ? (PIECE_VALUE[a.captured] - PIECE_VALUE[a.piece]/100) : -1;
    const bv = b.captured ? (PIECE_VALUE[b.captured] - PIECE_VALUE[b.piece]/100) : -1;
    return bv - av;
  });
}

const MATE_SCORE = 1000000;

function negamax(state, depth, alpha, beta){
  const color = state.turn;
  const moves = generateLegalMoves(state,color);
  if(moves.length===0){
    if(isInCheck(state,color)) return -MATE_SCORE - depth; // je näher, desto schlechter für den Ziehenden
    return 0; // Patt
  }
  if(depth===0){
    return evaluateBoard(state.board) * (color==='w'?1:-1);
  }
  const ordered = orderMoves(moves);
  let best = -Infinity;
  for(const m of ordered){
    makeMove(state,m);
    const score = -negamax(state, depth-1, -beta, -alpha);
    undoMove(state);
    if(score>best) best = score;
    if(best>alpha) alpha = best;
    if(alpha>=beta) break;
  }
  return best;
}

function scoreAllMoves(state, depth){
  const color = state.turn;
  const moves = generateLegalMoves(state,color);
  if(moves.length===0) return [];
  const ordered = orderMoves(moves);
  const scored = [];
  let alpha = -Infinity, beta = Infinity;
  for(const m of ordered){
    makeMove(state,m);
    const score = -negamax(state, depth-1, -beta, -alpha);
    undoMove(state);
    scored.push({ move:m, score });
    if(score>alpha) alpha = score;
  }
  scored.sort((a,b) => b.score - a.score);
  return scored;
}

function findBestMove(state, depth, difficulty){
  const scored = scoreAllMoves(state, depth);
  if(scored.length===0) return null;

  if(difficulty==='leicht'){
    // Wähle zufällig unter den Zügen, die nicht viel schlechter sind als der beste (macht Fehler = schlagbar)
    const bestScore = scored[0].score;
    const margin = 120; // Centipawn-Toleranz
    const pool = scored.filter(s => bestScore - s.score <= margin);
    return pool[Math.floor(Math.random()*pool.length)].move;
  }
  return scored[0].move;
}

const DIFFICULTY_DEPTH = { leicht:1, mittel:2, schwer:3 };

/* ============================================================
   SFX — synthetische Soundeffekte via Web Audio API (keine Audiodateien nötig)
   ============================================================ */
const SFX = (() => {
  let ctx = null;
  function ensureCtx(){
    if(!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(AC) ctx = new AC();
    }
    if(ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type='sine', gainPeak=0.18){
    const c = ensureCtx();
    if(!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(0, c.currentTime + start);
    gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.02);
  }
  function noiseBurst(start, dur, gainPeak=0.12){
    const c = ensureCtx();
    if(!c) return;
    const bufferSize = c.sampleRate * dur;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * (1 - i/bufferSize);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(gainPeak, c.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1200;
    src.connect(filter); filter.connect(gain); gain.connect(c.destination);
    src.start(c.currentTime + start);
  }
  return {
    move(){ tone(720, 0, 0.09, 'sine', 0.14); tone(980, 0.03, 0.07, 'sine', 0.08); },
    capture(){ noiseBurst(0, 0.12, 0.16); tone(320, 0.01, 0.1, 'triangle', 0.15); },
    check(){ tone(500, 0, 0.1, 'square', 0.12); tone(760, 0.09, 0.14, 'square', 0.12); },
    checkmate(){ tone(440, 0, 0.18, 'sawtooth', 0.13); tone(330, 0.16, 0.22, 'sawtooth', 0.13); tone(220, 0.34, 0.35, 'sawtooth', 0.14); },
    ui(){ tone(1100, 0, 0.05, 'sine', 0.08); },
    error(){ tone(180, 0, 0.16, 'sawtooth', 0.1); },
  };
})();

/* ============================================================
   UI-Layer
   ============================================================ */

let state = createInitialState();
let selected = null; // {row,col}
let legalTargets = []; // Züge ab selected
let currentDifficulty = 'mittel';
let playerColor = 'w'; // Farbe des Menschen im 1-Spieler-Modus (KI spielt die andere)
let vsAI = true; // false = 2 Spieler lokal, beide Seiten menschlich
let trainerMode = false; // Trainer: Analyse & Feedback nach jedem Menschzug
let aiThinking = false;
let pendingPromotion = null; // move ohne promotion, wartet auf Auswahl
let gameOver = false;

// Schachuhr
let clockMinutes = 0; // 0 = aus
let clockTime = { w: 0, b: 0 }; // Sekunden
let clockIntervalId = null;

function isHumanTurn(){
  return !vsAI || state.turn === playerColor;
}

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status-text');
const turnBadge = document.getElementById('turn-badge');
const historyEl = document.getElementById('move-history');
const capturedWEl = document.getElementById('captured-w');
const capturedBEl = document.getElementById('captured-b');
const promoModal = document.getElementById('promo-modal');
const promoOptions = document.getElementById('promo-options');
const voiceBtn = document.getElementById('voice-btn');
const assistantToggleBtn = document.getElementById('assistant-toggle-btn');
const voiceLog = document.getElementById('voice-log');
const difficultyBtns = document.querySelectorAll('.diff-btn:not(.view-btn):not(.menu-diff-btn)');
const viewBtns = document.querySelectorAll('.view-btn');
const boardStage = document.getElementById('board-stage');
const boardFrameEl = document.getElementById('board-frame');
const resetViewBtn = document.getElementById('reset-view-btn');
const newGameBtn = document.getElementById('new-game-btn');
const undoBtn = document.getElementById('undo-btn');
const helpBtn = document.getElementById('help-btn');
const menuBtn = document.getElementById('menu-btn');
const difficultyBlock = document.getElementById('difficulty-block');
const modeTagline = document.getElementById('mode-tagline');
const hintBtn = document.getElementById('hint-btn');
const pgnBtn = document.getElementById('pgn-btn');
const announceToggle = document.getElementById('announce-toggle');
const fxLayer = document.getElementById('fx-layer');
const evalBarFill = document.getElementById('eval-bar-fill');
const evalBarLabel = document.getElementById('eval-bar-label');
const trainerBlock = document.getElementById('trainer-block');
const trainerFeedbackEl = document.getElementById('trainer-feedback');
const cameraRow = document.getElementById('camera-row');
const camBtns = document.querySelectorAll('.cam-btn');
const clockRow = document.getElementById('clock-row');
const clockWTimeEl = document.getElementById('clock-w-time');
const clockBTimeEl = document.getElementById('clock-b-time');

function buildBoardDOM(){
  boardEl.innerHTML = '';
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const cell = document.createElement('div');
      cell.className = 'square ' + ((r+c)%2===0 ? 'light' : 'dark');
      cell.dataset.row = r;
      cell.dataset.col = c;
      if(c===0){
        const rl = document.createElement('span');
        rl.className = 'coord rank-label';
        rl.textContent = 8-r;
        cell.appendChild(rl);
      }
      if(r===7){
        const fl = document.createElement('span');
        fl.className = 'coord file-label';
        fl.textContent = FILES[c];
        cell.appendChild(fl);
      }
      cell.addEventListener('click', () => onSquareClick(r,c));
      boardEl.appendChild(cell);
    }
  }
}

function render(){
  const cells = boardEl.children;
  for(let i=0;i<cells.length;i++){
    const cell = cells[i];
    const r = parseInt(cell.dataset.row,10), c = parseInt(cell.dataset.col,10);
    cell.classList.remove('selected','legal-move','legal-capture','in-check','last-from','last-to','has-piece');
    let glyph = cell.querySelector('.piece');
    if(glyph) glyph.remove();

    const piece = state.board[r][c];
    if(piece){
      const span = document.createElement('span');
      span.className = 'piece ' + (piece.color==='w' ? 'piece-w' : 'piece-b');
      span.textContent = PIECE_GLYPH[piece.color][piece.type];
      cell.appendChild(span);
      cell.classList.add('has-piece');
    }

    if(selected && selected.row===r && selected.col===c) cell.classList.add('selected');
    if(legalTargets.some(m => m.to.row===r && m.to.col===c)){
      const hasPiece = !!piece;
      cell.classList.add(hasPiece ? 'legal-capture' : 'legal-move');
    }

    const lastMove = state.history.length ? state.history[state.history.length-1].move : null;
    if(lastMove){
      if(lastMove.from.row===r && lastMove.from.col===c) cell.classList.add('last-from');
      if(lastMove.to.row===r && lastMove.to.col===c) cell.classList.add('last-to');
    }
  }

  // Schach-Highlight
  if(!gameOver){
    const kingPos = findKing(state.board, state.turn);
    if(kingPos && isInCheck(state,state.turn)){
      const idx = kingPos.row*8 + kingPos.col;
      cells[idx].classList.add('in-check');
    }
  }

  turnBadge.textContent = state.turn==='w' ? 'WEISS' : 'SCHWARZ';
  turnBadge.className = 'turn-badge ' + (state.turn==='w' ? 'turn-w' : 'turn-b');
  renderCaptured();
  updateEvalBar();
  updateClockUI();
  sync3D();
}

function renderCaptured(){
  capturedWEl.innerHTML = state.captured.b.map(t => `<span class="cap-piece cap-w">${PIECE_GLYPH.w[t]}</span>`).join('');
  capturedBEl.innerHTML = state.captured.w.map(t => `<span class="cap-piece cap-b">${PIECE_GLYPH.b[t]}</span>`).join('');
}

function setStatus(text, tone='info'){
  statusEl.textContent = text;
  statusEl.className = 'status-text status-' + tone;
}

function logMove(move, moverColor, preMoveLegal, suffix=''){
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const num = Math.ceil(state.history.length/2);
  const notation = moveToNotation(move, preMoveLegal) + suffix;
  entry.innerHTML = `<span class="log-num">${moverColor==='w'?num+'.':''}</span><span class="log-move ${moverColor==='w'?'log-w':'log-b'}">${notation}</span>`;
  historyEl.appendChild(entry);
  historyEl.scrollTop = historyEl.scrollHeight;
}

function moveToNotation(move, preMoveLegal){
  if(move.isCastle==='K') return 'O-O';
  if(move.isCastle==='Q') return 'O-O-O';
  const pieceLetter = move.piece==='P' ? '' : move.piece;
  const capture = move.captured ? 'x' : '';
  const promo = move.promotion ? '='+move.promotion : '';

  let disambig = '';
  if(move.piece !== 'P' && preMoveLegal){
    const rivals = preMoveLegal.filter(m =>
      m.piece===move.piece && m.to.row===move.to.row && m.to.col===move.to.col &&
      !(m.from.row===move.from.row && m.from.col===move.from.col)
    );
    if(rivals.length>0){
      const sameFile = rivals.some(m => m.from.col===move.from.col);
      const sameRank = rivals.some(m => m.from.row===move.from.row);
      if(!sameFile) disambig = FILES[move.from.col];
      else if(!sameRank) disambig = String(8-move.from.row);
      else disambig = FILES[move.from.col] + String(8-move.from.row);
    }
  }

  const fromSq = move.piece==='P' && move.captured ? FILES[move.from.col] : '';
  return `${pieceLetter}${disambig}${fromSq}${capture}${sq(move.to.row,move.to.col)}${promo}`;
}

function computeCheckSuffix(stateAfter){
  const turn = stateAfter.turn;
  if(!isInCheck(stateAfter, turn)) return '';
  const moves = generateLegalMoves(stateAfter, turn);
  return moves.length===0 ? '#' : '+';
}

function describeMoveSpoken(move){
  if(move.isCastle==='K') return 'kurze Rochade';
  if(move.isCastle==='Q') return 'lange Rochade';
  let text = `${PIECE_NAME_DE[move.piece]} von ${sq(move.from.row,move.from.col)} nach ${sq(move.to.row,move.to.col)}`;
  if(move.captured) text += ', schlägt';
  if(move.promotion) text += `, wird zur ${PIECE_NAME_DE[move.promotion]}`;
  return text;
}

function onSquareClick(r,c){
  if(gameOver || aiThinking || pendingPromotion) return;
  if(!isHumanTurn()) return;

  const piece = state.board[r][c];

  if(selected){
    const target = legalTargets.find(m => m.to.row===r && m.to.col===c);
    if(target){
      executePlayerMove(target);
      return;
    }
  }

  if(piece && piece.color===state.turn){
    selected = {row:r,col:c};
    legalTargets = generateLegalMoves(state,state.turn).filter(m => m.from.row===r && m.from.col===c);
    SFX.ui();
  } else {
    selected = null;
    legalTargets = [];
  }
  render();
}

function executePlayerMove(move){
  if(move.promotion && !move.chosenPromotion){
    // mehrere Umwandlungsvarianten in legalTargets -> Modal zur Auswahl anzeigen
    const promoMoves = legalTargets.filter(m => m.from.row===move.from.row && m.from.col===move.from.col && m.to.row===move.to.row && m.to.col===move.to.col);
    openPromotionModal(promoMoves);
    return;
  }
  finalizeMove(move);
}

function openPromotionModal(promoMoves){
  pendingPromotion = promoMoves;
  promoOptions.innerHTML = '';
  const order = ['Q','R','B','N'];
  const promoColor = promoMoves[0].color;
  for(const type of order){
    const m = promoMoves.find(pm => pm.promotion===type);
    if(!m) continue;
    const btn = document.createElement('button');
    btn.className = 'promo-btn';
    btn.textContent = PIECE_GLYPH[promoColor][type];
    btn.title = PIECE_NAME_DE[type];
    btn.addEventListener('click', () => {
      promoModal.classList.remove('open');
      pendingPromotion = null;
      finalizeMove(m);
    });
    promoOptions.appendChild(btn);
  }
  promoModal.classList.add('open');
}

function finalizeMove(move){
  const moverColor = state.turn;
  const preMoveLegal = generateLegalMoves(state, moverColor);
  const wasCapture = !!state.board[move.to.row][move.to.col] || move.isEnPassant;

  // Trainer-Analyse braucht die Stellung VOR dem Zug
  let trainerAnalysis = null;
  if(trainerMode && isHumanTurn()){
    trainerAnalysis = analyzeMoveQuality(state, move);
  }

  const snap = makeMove(state, move);
  if(snap.capturedPiece){
    state.captured[snap.capturedPiece.color].push(snap.capturedPiece.type);
  }
  const suffix = computeCheckSuffix(state);
  selected = null;
  legalTargets = [];
  logMove(move, moverColor, preMoveLegal, suffix);

  (wasCapture ? SFX.capture : SFX.move)();
  if(suffix==='+') SFX.check();

  render();
  playMoveFx(move, wasCapture);
  if(trainerAnalysis) showTrainerFeedback(trainerAnalysis);
  saveGame();
  afterMove();
}

function afterMove(){
  const status = gameStatus(state);
  if(status.over){
    gameOver = true;
    stopClock();
    if(status.result==='draw'){
      setStatus('Patt — Remis.', 'warn');
      speak('Patt. Das Spiel endet remis.');
    } else {
      const winner = status.result==='w' ? 'Weiß' : 'Schwarz';
      setStatus(`Schachmatt — ${winner} gewinnt!`, 'danger');
      speak(`Schachmatt. ${winner} gewinnt.`);
      SFX.checkmate();
    }
    saveGame();
    render();
    return;
  }
  if(status.check){
    setStatus(`Schach! ${state.turn==='w'?'Weiß':'Schwarz'} am Zug.`, 'warn');
  } else {
    setStatus(`${state.turn==='w'?'Weiß':'Schwarz'} am Zug.`, 'info');
  }
  if(state.turn !== playerColor && vsAI){
    triggerAiMove();
  }
}

function triggerAiMove(){
  aiThinking = true;
  setStatus('KI denkt nach …', 'thinking');
  boardEl.classList.add('thinking');
  setTimeout(() => {
    const depth = DIFFICULTY_DEPTH[currentDifficulty];
    const preMoveLegal = generateLegalMoves(state, state.turn);
    const move = findBestMove(state, depth, currentDifficulty);
    boardEl.classList.remove('thinking');
    aiThinking = false;
    if(!move){ return; }
    const moverColor = state.turn;
    const wasCapture = !!state.board[move.to.row][move.to.col] || move.isEnPassant;
    const snap = makeMove(state, move);
    if(snap.capturedPiece){
      state.captured[snap.capturedPiece.color].push(snap.capturedPiece.type);
    }
    const suffix = computeCheckSuffix(state);
    logMove(move, moverColor, preMoveLegal, suffix);

    (wasCapture ? SFX.capture : SFX.move)();
    if(suffix==='+') SFX.check();
    if(announceToggle.checked){
      speak(describeMoveSpoken(move) + (suffix==='#' ? '. Schachmatt.' : suffix==='+' ? '. Schach.' : '.'));
    }

    render();
    playMoveFx(move, wasCapture);
    saveGame();
    afterMove();
  }, 260);
}

/* ---------- Trainer-Analyse ---------- */
function analyzeMoveQuality(preState, playedMove){
  const depth = 2;
  const scored = scoreAllMoves(preState, depth);
  if(scored.length===0) return null;
  const bestScore = scored[0].score;
  const bestMove = scored[0].move;
  const playedEntry = scored.find(s =>
    s.move.from.row===playedMove.from.row && s.move.from.col===playedMove.from.col &&
    s.move.to.row===playedMove.to.row && s.move.to.col===playedMove.to.col &&
    s.move.promotion===playedMove.promotion
  );
  if(!playedEntry) return null;
  const loss = bestScore - playedEntry.score;
  const isBest = loss <= 1;

  let tier, label;
  if(isBest){ tier='good'; label='✓ Bester Zug!'; }
  else if(loss <= 40){ tier='good'; label='✓ Sehr guter Zug.'; }
  else if(loss <= 100){ tier='ok'; label='Guter Zug.'; }
  else if(loss <= 250){ tier='ok'; label='Ungenau.'; }
  else if(loss <= 500){ tier='bad'; label='Fehler.'; }
  else { tier='bad'; label='Grober Fehler!'; }

  let detail = '';
  if(!isBest){
    detail = ` Stärker war ${moveToNotation(bestMove, generateLegalMoves(preState, preState.turn))}.`;
  }
  return { tier, text: label + detail };
}

function showTrainerFeedback(analysis){
  if(!analysis || !trainerFeedbackEl) return;
  trainerFeedbackEl.textContent = analysis.text;
  trainerFeedbackEl.className = 'trainer-feedback fb-' + analysis.tier;
}

/* ---------- Zug-Animation & Partikel (2D) ---------- */
function playMoveFx(move, wasCapture){
  if(currentView !== 'v2d' || !fxLayer) return;
  const fromCell = boardEl.children[move.from.row*8 + move.from.col];
  const toCell = boardEl.children[move.to.row*8 + move.to.col];
  const piece = state.board[move.to.row][move.to.col];
  if(!fromCell || !toCell || !piece) return;

  const fxRect = fxLayer.getBoundingClientRect();
  const fromRect = fromCell.getBoundingClientRect();
  const toRect = toCell.getBoundingClientRect();

  const ghost = document.createElement('span');
  ghost.className = 'ghost-piece ' + (piece.color==='w' ? 'piece-w' : 'piece-b');
  ghost.textContent = PIECE_GLYPH[piece.color][piece.type];
  ghost.style.left = (fromRect.left - fxRect.left) + 'px';
  ghost.style.top = (fromRect.top - fxRect.top) + 'px';
  ghost.style.width = fromRect.width + 'px';
  ghost.style.height = fromRect.height + 'px';
  fxLayer.appendChild(ghost);

  requestAnimationFrame(() => {
    const dx = toRect.left - fromRect.left;
    const dy = toRect.top - fromRect.top;
    ghost.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  setTimeout(() => ghost.remove(), 320);

  if(wasCapture){
    spawnParticles(toRect, fxRect, piece.color==='w' ? '#00e5ff' : '#cf42ff');
  }
}

function spawnParticles(targetRect, fxRect, color){
  const cx = targetRect.left - fxRect.left + targetRect.width/2;
  const cy = targetRect.top - fxRect.top + targetRect.height/2;
  const count = 14;
  for(let i=0;i<count;i++){
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i/count) * Math.PI*2 + Math.random()*0.4;
    const dist = 26 + Math.random()*30;
    p.style.setProperty('--particle-end', `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`);
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.background = color;
    fxLayer.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

/* ---------- Bewertungsleiste ---------- */
function updateEvalBar(){
  if(!evalBarFill) return;
  const raw = evaluateBoard(state.board); // >0 = Vorteil Weiß, in Centipawns
  const capped = Math.max(-800, Math.min(800, raw));
  const percent = 50 + (capped/800)*50;
  evalBarFill.style.height = percent + '%';
  const pawns = (raw/100).toFixed(1);
  evalBarLabel.textContent = (raw>=0?'+':'') + pawns;
}

/* ---------- Schachuhr ---------- */
function formatClock(sec){
  const m = Math.floor(sec/60), s = Math.max(0,sec)%60;
  return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}
function updateClockUI(){
  if(!clockRow) return;
  if(clockMinutes<=0){ clockRow.classList.add('hidden'); return; }
  clockRow.classList.remove('hidden');
  clockWTimeEl.textContent = formatClock(clockTime.w);
  clockBTimeEl.textContent = formatClock(clockTime.b);
  const wBox = clockRow.querySelector('.clock-w');
  const bBox = clockRow.querySelector('.clock-b');
  wBox.classList.toggle('clock-active', state.turn==='w' && !gameOver);
  bBox.classList.toggle('clock-active', state.turn==='b' && !gameOver);
  wBox.classList.toggle('clock-low', clockTime.w<=30);
  bBox.classList.toggle('clock-low', clockTime.b<=30);
}
function stopClock(){
  if(clockIntervalId){ clearInterval(clockIntervalId); clockIntervalId = null; }
}
function startClockIfNeeded(){
  stopClock();
  if(clockMinutes<=0) return;
  clockIntervalId = setInterval(() => {
    if(gameOver){ stopClock(); return; }
    clockTime[state.turn] = Math.max(0, clockTime[state.turn]-1);
    updateClockUI();
    if(clockTime[state.turn]<=0){
      stopClock();
      gameOver = true;
      const winner = state.turn==='w' ? 'Schwarz' : 'Weiß';
      setStatus(`Zeit abgelaufen — ${winner} gewinnt!`, 'danger');
      speak(`Die Zeit ist abgelaufen. ${winner} gewinnt.`);
      SFX.checkmate();
      saveGame();
      render();
    }
  }, 1000);
}

/* ---------- Speichern & Laden ---------- */
const SAVE_KEY = 'holochess_save_v1';

function saveGame(){
  try{
    const payload = {
      state: {
        board: state.board, turn: state.turn, castling: state.castling,
        enPassant: state.enPassant, history: state.history, captured: state.captured
      },
      vsAI, currentDifficulty, playerColor, trainerMode,
      clockMinutes, clockTime, currentView
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }catch(e){ /* Speicher evtl. nicht verfügbar — ignorieren */ }
}
function hasSavedGame(){
  try{ return !!localStorage.getItem(SAVE_KEY); }catch(e){ return false; }
}
function loadGame(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    const payload = JSON.parse(raw);
    state = payload.state;
    vsAI = payload.vsAI;
    currentDifficulty = payload.currentDifficulty || 'mittel';
    playerColor = payload.playerColor || 'w';
    trainerMode = !!payload.trainerMode;
    clockMinutes = payload.clockMinutes || 0;
    clockTime = payload.clockTime || { w:0, b:0 };
    if(payload.currentView) currentView = payload.currentView;
    return true;
  }catch(e){ return false; }
}
function clearSavedGame(){
  try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
}

function rebuildHistoryDOM(){
  historyEl.innerHTML = '';
  const temp = createInitialState();
  for(const snap of state.history){
    const preLegal = generateLegalMoves(temp, temp.turn);
    const moverColor = temp.turn;
    makeMove(temp, snap.move);
    const suffix = computeCheckSuffix(temp);
    logMove(snap.move, moverColor, preLegal, suffix);
  }
}

function newGame(){
  stopClock();
  state = createInitialState();
  selected = null;
  legalTargets = [];
  gameOver = false;
  aiThinking = false;
  pendingPromotion = null;
  historyEl.innerHTML = '';
  if(trainerFeedbackEl){
    trainerFeedbackEl.textContent = 'Spiele einen Zug, um Feedback zu erhalten.';
    trainerFeedbackEl.className = 'trainer-feedback';
  }
  clockTime = { w: clockMinutes*60, b: clockMinutes*60 };
  setStatus('Neues Spiel — Weiß beginnt.', 'info');
  render();
  startClockIfNeeded();
  if(vsAI && state.turn !== playerColor && !gameOver){
    triggerAiMove();
  }
}

function undoLastRound(){
  if(aiThinking) return;
  // Im 1-Spieler-Modus einen vollen Zug zurück (Mensch + KI), im 2-Spieler-Modus nur einen Halbzug
  let count = 0;
  const steps = vsAI ? 2 : 1;
  while(state.history.length>0 && count<steps){
    const last = state.history[state.history.length-1];
    if(last.capturedPiece){
      const arr = state.captured[last.capturedPiece.color];
      const idx = arr.lastIndexOf(last.capturedPiece.type);
      if(idx>-1) arr.splice(idx,1);
    }
    undoMove(state);
    count++;
    const removed = historyEl.lastElementChild;
    if(removed) removed.remove();
  }
  gameOver = false;
  selected = null;
  legalTargets = [];
  setStatus('Zug zurückgenommen.', 'info');
  saveGame();
  render();
}

/* ---------- Tipp-Funktion ---------- */
function giveHint(){
  if(gameOver || aiThinking || !isHumanTurn()){
    addVoiceLog('Kein Tipp möglich (nicht dein Zug oder Spiel beendet).');
    return;
  }
  const scored = scoreAllMoves(state, 3);
  if(scored.length===0) return;
  const best = scored[0].move;
  selected = { row: best.from.row, col: best.from.col };
  legalTargets = generateLegalMoves(state, state.turn).filter(m => m.from.row===best.from.row && m.from.col===best.from.col);
  render();
  setStatus(`💡 Tipp: ${PIECE_NAME_DE[best.piece]} ${sq(best.from.row,best.from.col)} → ${sq(best.to.row,best.to.col)}`, 'info');
  speak(`Tipp: ${describeMoveSpoken(best)}`);
}

/* ---------- PGN-Export ---------- */
function exportPGN(){
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'.');
  const white = vsAI ? (playerColor==='w' ? 'Mensch' : 'KI') : 'Spieler 1';
  const black = vsAI ? (playerColor==='b' ? 'Mensch' : 'KI') : 'Spieler 2';
  let result = '*';
  if(gameOver){
    if(!isInCheck(state,state.turn) && generateLegalMoves(state,state.turn).length===0) result = '1/2-1/2';
    else if(isInCheck(state,state.turn)) result = state.turn==='w' ? '0-1' : '1-0';
  }
  const headers = `[Event "Holo Chess"]\n[Site "Lokal"]\n[Date "${dateStr}"]\n[White "${white}"]\n[Black "${black}"]\n[Result "${result}"]\n\n`;

  const entries = Array.from(historyEl.querySelectorAll('.log-entry'));
  let movetext = '';
  let moveNum = 1;
  entries.forEach(entry => {
    const moveSpan = entry.querySelector('.log-move');
    if(moveSpan.classList.contains('log-w')){ movetext += `${moveNum}. ${moveSpan.textContent} `; }
    else { movetext += `${moveSpan.textContent} `; moveNum++; }
  });
  movetext += result;

  const pgn = headers + movetext.trim() + '\n';
  const blob = new Blob([pgn], {type:'application/x-chess-pgn'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `holochess_${Date.now()}.pgn`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- Schwierigkeit ---------- */
difficultyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    difficultyBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDifficulty = btn.dataset.level;
    setStatus(`Schwierigkeit: ${btn.textContent.trim()}`, 'info');
  });
});

newGameBtn.addEventListener('click', () => { clearSavedGame(); SFX.ui(); newGame(); });
undoBtn.addEventListener('click', () => { SFX.ui(); undoLastRound(); });
helpBtn.addEventListener('click', showHelp);
hintBtn.addEventListener('click', giveHint);
pgnBtn.addEventListener('click', exportPGN);

function showHelp(){
  addVoiceLog('Züge: "e2 e4" oder "Springer f3" · Befehle: "neues Spiel" · "Zug zurück" · "Tipp" · "leicht/mittel/schwer" · "2D"/"3D" · Sag "Jarvis", um mich zu wecken.');
}

/* ============================================================
   3D-Ansicht: echte Three.js-Szene (board3d.js) <-> 2D-DOM-Brett
   ============================================================ */

let currentView = 'v3d'; // 'v2d' | 'v3d'
let threeInitialized = false;
const threeContainer = document.getElementById('three-container');

function ensureThreeInit(){
  if(threeInitialized) return;
  Board3D.init(threeContainer, (r,c) => onSquareClick(r,c));
  threeInitialized = true;
}

function setView(view){
  currentView = view;
  boardStage.classList.toggle('view-2d', view==='v2d');
  boardStage.classList.toggle('view-3d', view==='v3d');
  viewBtns.forEach(b => b.classList.toggle('active', b.dataset.view === (view==='v2d'?'2d':'3d')));
  if(view==='v3d'){
    ensureThreeInit();
    Board3D.setActive(true);
    Board3D.handleResize();
    sync3D();
  } else {
    Board3D.setActive(false);
  }
}

viewBtns.forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view==='2d' ? 'v2d' : 'v3d'));
});

resetViewBtn.addEventListener('click', () => {
  if(threeInitialized) Board3D.resetCamera();
});

camBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if(threeInitialized) Board3D.setCameraPreset(btn.dataset.cam);
  });
});

function sync3D(){
  if(!threeInitialized) return;
  const lastSnap = state.history.length ? state.history[state.history.length-1] : null;
  const lastMove = lastSnap ? lastSnap.move : null;
  const wasCapture = lastSnap ? !!lastSnap.capturedPiece : false;
  let checkSquare = null;
  if(!gameOver && isInCheck(state, state.turn)){
    checkSquare = findKing(state.board, state.turn);
  }
  Board3D.sync(state, { selected, legalTargets, lastMove, checkSquare, moveSeq: state.history.length, wasCapture });
}


/* ============================================================
   Sprachsteuerung (Web Speech API) — mit "Jarvis"-Weckwort
   ============================================================ */

const NUMBER_WORDS = {
  '0': '0',
  'eins': '1', 'ein': '1', 'eine': '1',
  'zwei': '2', 'zwo': '2', 'zwoe': '2',
  'drei': '3',
  'vier': '4',
  'fünf': '5', 'funf': '5', 'fuenf': '5',
  'sechs': '6',
  'sieben': '7',
  'acht': '8'
};

const LETTER_WORDS = {
  'a':'a', 'ah':'a', 'aa':'a',
  'b':'b', 'be':'b', 'beh':'b', 'bee':'b',
  'c':'c', 'ce':'c', 'seh':'c',
  'd':'d', 'de':'d', 'dee':'d',
  'e':'e', 'eh':'e',
  'f':'f', 'ef':'f', 'eff':'f',
  'g':'g', 'ge':'g', 'geh':'g',
  'h':'h', 'ha':'h', 'ahh':'h'
};

// Figurennamen für Sprachzüge wie "Springer f3" oder "Dame e7 e8"
const PIECE_NAME_TO_TYPE = {
  dame:'Q', königin:'Q', koenigin:'Q',
  turm:'R', türme:'R', turme:'R',
  läufer:'B', laeufer:'B', laufer:'B',
  springer:'N', pferd:'N', ritter:'N',
  bauer:'P', bauern:'P',
  könig:'K', koenig:'K'
};

// Varianten des Weckworts "Jarvis" (inkl. typischer Fehlerkennungen der Spracherkennung)
const WAKE_WORDS = [
  'hey jarvis','ok jarvis','hallo jarvis','servus jarvis',
  'jarvis','yarvis','jarviz','tscharwis','charvis','harvis','scharwis'
];

function normalizeTranscript(transcript) {
  return transcript
    .toLowerCase()
    .replace(/[.,!?;:]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => LETTER_WORDS[word] || NUMBER_WORDS[word] || word)
    .join(' ');
}

let recognition = null;
let recognitionActive = false;
let assistantEnabled = false;
let voiceMode = 'off'; // 'off' | 'wake' | 'command'
let commandTimeoutId = null;

function initSpeech(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    voiceBtn.disabled = true;
    assistantToggleBtn.disabled = true;
    voiceBtn.title = 'Spracherkennung wird von diesem Browser nicht unterstützt (Chrome/Edge empfohlen)';
    addVoiceLog('Spracherkennung nicht verfügbar — bitte Chrome/Edge verwenden.');
    return;
  }
  recognition = new SR();
  recognition.lang = 'de-DE';
  recognition.maxAlternatives = 4;
  // WICHTIG: continuous=true hängt sich in Chrome nach dem ersten Satz häufig auf
  // (bekannter Browser-Bug: die Session bleibt "aktiv", liefert aber keine weiteren
  // Ergebnisse mehr). Robuster: nach jedem einzelnen Satz sauber neu starten.
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => { recognitionActive = true; };

  recognition.onresult = (event) => {
    for(let i = event.resultIndex; i < event.results.length; i++){
      const result = event.results[i];
      if(!result.isFinal) continue;
      const alternatives = [];
      for(let j=0; j<result.length; j++) alternatives.push(result[j].transcript);
      processFinalTranscript(alternatives);
    }
  };

  recognition.onerror = (event) => {
    addVoiceLog('⚠️ Fehler: ' + event.error);
    if(event.error==='not-allowed' || event.error==='service-not-allowed'){
      assistantEnabled = false;
      addVoiceLog('Mikrofonzugriff verweigert — bitte in den Browser-Einstellungen erlauben.');
    }
    // 'no-speech' und 'aborted' sind normal (z.B. Stille) — onend kümmert sich um den Neustart
  };

  recognition.onend = () => {
    recognitionActive = false;
    // Während Jarvis spricht, nicht sofort neu starten (verhindert, dass sich das
    // Mikrofon selbst hört) — utter.onend in speak() übernimmt den Neustart danach.
    if(window.speechSynthesis && window.speechSynthesis.speaking) return;
    setTimeout(resumeListeningIfNeeded, 150);
  };
}

function resumeListeningIfNeeded(){
  if(recognitionActive) return;
  if(voiceMode === 'command'){
    // Weckwort wurde gehört, wir warten noch auf den eigentlichen Befehl -> sofort weiterhören
    startRecognitionSession();
    return;
  }
  if(assistantEnabled){
    voiceMode = 'wake';
    updateVoiceUI();
    startRecognitionSession();
  } else {
    voiceMode = 'off';
    updateVoiceUI();
  }
}

function startRecognitionSession(){
  if(!recognition || recognitionActive) return;
  try{
    recognition.start();
  }catch(e){ /* Session läuft ggf. schon */ }
}

function updateVoiceUI(){
  assistantToggleBtn.classList.toggle('active', assistantEnabled);
  assistantToggleBtn.textContent = assistantEnabled ? '🛰️ Jarvis: AN' : '🛰️ Jarvis aktivieren';

  voiceBtn.classList.remove('listening-wake','listening-command');
  if(voiceMode==='command'){
    voiceBtn.classList.add('listening-command');
    voiceBtn.textContent = '🎙️ Ich höre deinen Befehl …';
  } else if(voiceMode==='wake'){
    voiceBtn.classList.add('listening-wake');
    voiceBtn.textContent = '🛰️ Warte auf „Jarvis" …';
  } else {
    voiceBtn.textContent = '🎤 Sofort-Befehl';
  }
}

function armCommandTimeout(){
  clearCommandTimeout();
  commandTimeoutId = setTimeout(() => {
    addVoiceLog('⏱️ Kein Befehl erkannt, warte wieder auf „Jarvis".');
    voiceMode = assistantEnabled ? 'wake' : 'off';
    updateVoiceUI();
  }, 7000);
}
function clearCommandTimeout(){
  if(commandTimeoutId){ clearTimeout(commandTimeoutId); commandTimeoutId = null; }
}

function detectWakeWord(lowerText){
  for(const variant of WAKE_WORDS){
    const idx = lowerText.indexOf(variant);
    if(idx !== -1){
      const remainder = (lowerText.slice(0, idx) + ' ' + lowerText.slice(idx + variant.length)).trim();
      return { found:true, remainder };
    }
  }
  return { found:false, remainder:'' };
}

function processFinalTranscript(alternatives){
  const primary = alternatives[0];
  addVoiceLog('🎙️ „' + primary + '"');

  if(voiceMode==='wake'){
    const wake = detectWakeWord(primary.toLowerCase());
    if(!wake.found) return; // solange ignorieren, bis das Weckwort fällt
    addVoiceLog('🛰️ Jarvis aktiviert.');
    if(wake.remainder.replace(/\s/g,'').length >= 2){
      // Befehl direkt im selben Satz, z.B. "Jarvis neues Spiel"
      tryExecuteCommand([wake.remainder, ...alternatives.map(stripWakeWord)]);
      voiceMode = assistantEnabled ? 'wake' : 'off';
      updateVoiceUI();
    } else {
      speak('Ja?');
      voiceMode = 'command';
      updateVoiceUI();
      armCommandTimeout();
    }
    return;
  }

  if(voiceMode==='command'){
    clearCommandTimeout();
    tryExecuteCommand(alternatives);
    voiceMode = assistantEnabled ? 'wake' : 'off';
    updateVoiceUI();
    return;
  }
}

function stripWakeWord(text){
  const wake = detectWakeWord(text.toLowerCase());
  return wake.found ? wake.remainder : text;
}

/* ---------- Manuelle Bedienung ---------- */
assistantToggleBtn.addEventListener('click', () => {
  assistantEnabled = !assistantEnabled;
  if(assistantEnabled){
    voiceMode = 'wake';
    updateVoiceUI();
    startRecognitionSession();
    addVoiceLog('Jarvis-Modus aktiv — sag "Jarvis", um einen Befehl zu geben.');
  } else {
    voiceMode = 'off';
    clearCommandTimeout();
    updateVoiceUI();
    if(recognition && recognitionActive){ try{ recognition.stop(); }catch(e){} }
    addVoiceLog('Jarvis-Modus deaktiviert.');
  }
});

voiceBtn.addEventListener('click', () => {
  if(!recognition || voiceMode==='command') return;
  if(assistantEnabled && recognitionActive){
    // Dauerhafte Session läuft schon -> direkt in den Befehlsmodus springen
    voiceMode = 'command';
    updateVoiceUI();
    armCommandTimeout();
    return;
  }
  voiceMode = 'command';
  updateVoiceUI();
  startRecognitionSession();
});

function addVoiceLog(text){
  const line = document.createElement('div');
  line.className = 'voice-log-entry';
  line.textContent = text;
  voiceLog.appendChild(line);
  voiceLog.scrollTop = voiceLog.scrollHeight;
  while(voiceLog.children.length > 14) voiceLog.removeChild(voiceLog.firstChild);
}

function speak(text){
  if(!window.speechSynthesis){ setTimeout(resumeListeningIfNeeded, 50); return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'de-DE';
  utter.rate = 1.02;
  utter.onend = () => setTimeout(resumeListeningIfNeeded, 150);
  utter.onerror = () => setTimeout(resumeListeningIfNeeded, 150);
  // Mikrofon während der Ansage stummschalten, sonst hört Jarvis sich selbst reden
  if(recognition && recognitionActive){ try{ recognition.stop(); }catch(e){} }
  window.speechSynthesis.speak(utter);
}

/* ---------- Verständnis natürlicher Sprachbefehle ---------- */

function interpretUtterance(rawText){
  const t = rawText.toLowerCase();

  if(/\bneue[sr]?\s*(partie|spiel)\b|\bneustart\b/.test(t)) return { type:'cmd', action:'new' };
  if(/\b(zug\s*)?(zurück|zurueck|rückgängig|rueckgaengig)\b/.test(t)) return { type:'cmd', action:'undo' };
  if(/\b(hilfe|befehle|was kannst du|optionen)\b/.test(t)) return { type:'cmd', action:'help' };
  if(/\b(stopp?|pause|aufhören|aufhoeren)\b/.test(t)) return { type:'cmd', action:'stop' };
  if(/\b(tipp|hinweis|hilf mir|zeig mir einen zug)\b/.test(t)) return { type:'cmd', action:'hint' };
  if(/\bleicht\b|\beinfach\b/.test(t)) return { type:'cmd', action:'diff', level:'leicht' };
  if(/\bschwer\b|\bschwierig\b|\bhart\b/.test(t)) return { type:'cmd', action:'diff', level:'schwer' };
  if(/\bmittel\b|\bnormal\b/.test(t)) return { type:'cmd', action:'diff', level:'mittel' };
  if(/\b(2d|zwei ?d)\b/.test(t)) return { type:'cmd', action:'view', view:'v2d' };
  if(/\b(3d|drei ?d)\b/.test(t)) return { type:'cmd', action:'view', view:'v3d' };

  const normalized = normalizeTranscript(rawText);
  const coordinateRegex = /([a-h])\s*([1-8])/g;
  const squares = [];
  let match;
  while((match = coordinateRegex.exec(normalized)) !== null){
    squares.push(match[1] + match[2]);
  }

  let pieceHint = null, promoHint = null;
  for(const word in PIECE_NAME_TO_TYPE){
    if(t.includes(word)){
      if(pieceHint===null) pieceHint = PIECE_NAME_TO_TYPE[word];
      else if(word !== 'bauer' && word !== 'bauern') promoHint = PIECE_NAME_TO_TYPE[word];
    }
  }

  if(squares.length>=2){
    return { type:'move', from:squares[0], to:squares[1], pieceHint, promoHint };
  }
  if(squares.length===1 && pieceHint){
    return { type:'move-target-only', to:squares[0], pieceHint };
  }
  return null;
}

function tryExecuteCommand(candidateTexts){
  const seen = new Set();
  for(const raw of candidateTexts){
    if(!raw) continue;
    const key = raw.toLowerCase().trim();
    if(!key || seen.has(key)) continue;
    seen.add(key);
    const interp = interpretUtterance(raw);
    if(!interp) continue;
    if(executeInterpretation(interp)) return true;
  }
  addVoiceLog('❓ Konnte den Befehl nicht eindeutig erkennen.');
  speak('Das habe ich nicht verstanden.');
  return false;
}

function executeInterpretation(interp){
  if(interp.type==='cmd'){
    switch(interp.action){
      case 'new':
        newGame(); speak('Neues Spiel gestartet.'); return true;
      case 'undo':
        undoLastRound(); speak('Zug zurückgenommen.'); return true;
      case 'help':
        showHelp();
        speak('Sage zum Beispiel Springer f3, oder e2 e4. Auch neues Spiel, Zug zurück, leicht, mittel, schwer, 2D und 3D funktionieren.');
        return true;
      case 'diff':
        setDifficultyByVoice(interp.level); return true;
      case 'view':
        setView(interp.view);
        speak(interp.view==='v3d' ? 'Wechsle in die 3D-Ansicht.' : 'Wechsle in die 2D-Ansicht.');
        return true;
      case 'stop':
        if(assistantEnabled) assistantToggleBtn.click();
        addVoiceLog('Sprachassistent gestoppt.');
        return true;
      case 'hint':
        giveHint();
        return true;
    }
    return false;
  }

  if(gameOver){ addVoiceLog('Das Spiel ist bereits beendet.'); return false; }
  if(aiThinking){ addVoiceLog('Die KI denkt noch nach.'); return false; }
  if(!isHumanTurn()){ addVoiceLog('Die KI ist noch am Zug.'); return false; }

  if(interp.type==='move'){
    const from = parseSq(interp.from), to = parseSq(interp.to);
    const legal = generateLegalMoves(state, state.turn);
    let candidates = legal.filter(m => m.from.row===from.row && m.from.col===from.col && m.to.row===to.row && m.to.col===to.col);

    if(candidates.length===0){
      addVoiceLog(`Zug ${interp.from}–${interp.to} ist nicht gültig.`);
      return false;
    }
    if(interp.pieceHint){
      const withHint = candidates.filter(m => m.piece===interp.pieceHint);
      if(withHint.length>0) candidates = withHint;
    }
    let chosen = candidates[0];
    if(candidates.length>1){
      chosen = (interp.promoHint && candidates.find(m => m.promotion===interp.promoHint))
        || candidates.find(m => m.promotion==='Q')
        || candidates[0];
    }
    finalizeMove(chosen);
    speak(chosen.promotion ? `Zug ausgeführt, Bauer wird zur ${PIECE_NAME_DE[chosen.promotion]}.` : 'Zug ausgeführt.');
    return true;
  }

  if(interp.type==='move-target-only'){
    const to = parseSq(interp.to);
    const legal = generateLegalMoves(state, state.turn)
      .filter(m => m.to.row===to.row && m.to.col===to.col && m.piece===interp.pieceHint);

    if(legal.length===0){
      addVoiceLog(`Kein ${PIECE_NAME_DE[interp.pieceHint]} kann nach ${interp.to} ziehen.`);
      return false;
    }
    if(legal.length>1){
      addVoiceLog(`Mehrere ${PIECE_NAME_DE[interp.pieceHint]} können nach ${interp.to} ziehen — bitte auch das Ausgangsfeld nennen (z. B. "b1 f3").`);
      speak('Das ist mehrdeutig. Bitte nenne auch das Ausgangsfeld.');
      return false;
    }
    finalizeMove(legal[0]);
    speak('Zug ausgeführt.');
    return true;
  }
  return false;
}

function setDifficultyByVoice(level){
  currentDifficulty = level;
  difficultyBtns.forEach(b => b.classList.toggle('active', b.dataset.level===level));
  setStatus(`Schwierigkeit: ${level}`, 'info');
  speak(`Schwierigkeit auf ${level} gestellt.`);
}

/* ============================================================
   Boot-Sequenz
   ============================================================ */

const bootScreen = document.getElementById('boot-screen');
const bootTitleEl = document.getElementById('boot-title');
const bootLogEl = document.getElementById('boot-log');
const bootBarFill = document.getElementById('boot-bar-fill');
const bootPercentEl = document.getElementById('boot-percent');

const BOOT_TITLE = 'HOLO CHESS';
const BOOT_LINES = [
  'Initialisiere Quanten-Renderer …',
  'Kalibriere Holo-Projektionsfeld …',
  'Lade Schachengine (Minimax/α-β) …',
  'Verbinde Sprachmodul „Jarvis" …',
  'Synchronisiere 64 Feldsektoren …',
  'System bereit.'
];

function typeTitle(){
  return new Promise(resolve => {
    let i = 0;
    bootTitleEl.innerHTML = '<span class="cursor">▋</span>';
    const iv = setInterval(() => {
      i++;
      bootTitleEl.innerHTML = BOOT_TITLE.slice(0, i) + '<span class="cursor">▋</span>';
      if(i >= BOOT_TITLE.length){ clearInterval(iv); resolve(); }
    }, 65);
  });
}

function addBootLine(text){
  const line = document.createElement('div');
  line.className = 'boot-line';
  line.textContent = text;
  bootLogEl.appendChild(line);
}

function runBootSequence(){
  return new Promise(async (resolve) => {
    await typeTitle();
    let progress = 0;
    for(let i=0;i<BOOT_LINES.length;i++){
      await new Promise(r => setTimeout(r, 260));
      addBootLine(BOOT_LINES[i]);
      progress = Math.round(((i+1) / BOOT_LINES.length) * 100);
      bootBarFill.style.width = progress + '%';
      bootPercentEl.textContent = progress + '%';
    }
    await new Promise(r => setTimeout(r, 400));
    bootScreen.classList.add('boot-hidden');
    setTimeout(() => { bootScreen.style.display = 'none'; resolve(); }, 650);
  });
}

/* ============================================================
   Startmenü: 1/2 Spieler, Schachtrainer, Farbe, Schwierigkeit, Uhr
   ============================================================ */

const startMenu = document.getElementById('start-menu');
const mode1pBtn = document.getElementById('mode-1p-btn');
const mode2pBtn = document.getElementById('mode-2p-btn');
const modeTrainerBtn = document.getElementById('mode-trainer-btn');
const menuDifficultyBlock = document.getElementById('menu-difficulty');
const menuDiffBtns = document.querySelectorAll('.menu-diff-btn');
const menuColorBlock = document.getElementById('menu-color');
const menuColorBtns = document.querySelectorAll('.menu-color-btn');
const menuClockBlock = document.getElementById('menu-clock');
const menuClockBtns = document.querySelectorAll('.menu-clock-btn');
const startGameBtn = document.getElementById('start-game-btn');
const continueBtn = document.getElementById('continue-btn');

let menuSelectedMode = null; // '1p' | '2p' | 'trainer'
let menuSelectedDifficulty = 'mittel';
let menuSelectedColor = 'w';
let menuSelectedClock = 0;

function selectMenuMode(mode){
  menuSelectedMode = mode;
  mode1pBtn.classList.toggle('active', mode==='1p');
  mode2pBtn.classList.toggle('active', mode==='2p');
  modeTrainerBtn.classList.toggle('active', mode==='trainer');

  const needsAiOptions = mode==='1p' || mode==='trainer';
  menuDifficultyBlock.classList.toggle('hidden', !needsAiOptions);
  menuColorBlock.classList.toggle('hidden', !needsAiOptions);
  menuClockBlock.classList.remove('hidden');
  startGameBtn.disabled = false;
}

mode1pBtn.addEventListener('click', () => selectMenuMode('1p'));
mode2pBtn.addEventListener('click', () => selectMenuMode('2p'));
modeTrainerBtn.addEventListener('click', () => selectMenuMode('trainer'));

menuDiffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    menuSelectedDifficulty = btn.dataset.level;
    menuDiffBtns.forEach(b => b.classList.toggle('active', b===btn));
  });
});
menuColorBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    menuSelectedColor = btn.dataset.color;
    menuColorBtns.forEach(b => b.classList.toggle('active', b===btn));
  });
});
menuClockBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    menuSelectedClock = parseInt(btn.dataset.clock,10);
    menuClockBtns.forEach(b => b.classList.toggle('active', b===btn));
  });
});

function showStartMenu(){
  startMenu.classList.add('menu-visible');
  chessRootEl.classList.add('pre-game');
  continueBtn.classList.toggle('hidden', !hasSavedGame());
  stopClock();
}

function applyModeUI(){
  difficultyBtns.forEach(b => b.classList.toggle('active', b.dataset.level===currentDifficulty));
  difficultyBlock.style.display = vsAI ? '' : 'none';
  trainerBlock.style.display = trainerMode ? '' : 'none';
  modeTagline.textContent = vsAI
    ? (trainerMode ? 'Taktisches Projektionssystem · Schachtrainer' : 'Taktisches Projektionssystem · Mensch gegen KI')
    : 'Taktisches Projektionssystem · 2 Spieler lokal';
  boardEl.classList.toggle('flipped', vsAI && playerColor==='b');
}

startGameBtn.addEventListener('click', () => {
  if(!menuSelectedMode) return;
  vsAI = menuSelectedMode !== '2p';
  trainerMode = menuSelectedMode === 'trainer';
  currentDifficulty = vsAI ? menuSelectedDifficulty : currentDifficulty;
  playerColor = menuSelectedMode==='2p' ? 'w' : menuSelectedColor;
  clockMinutes = menuSelectedClock;
  clockTime = { w: clockMinutes*60, b: clockMinutes*60 };

  startMenu.classList.remove('menu-visible');
  chessRootEl.classList.remove('pre-game');
  clearSavedGame();
  startGame();
});

continueBtn.addEventListener('click', () => {
  if(!loadGame()) return;
  startMenu.classList.remove('menu-visible');
  chessRootEl.classList.remove('pre-game');
  startGameFromLoadedState();
});

menuBtn.addEventListener('click', () => {
  if(assistantEnabled) assistantToggleBtn.click();
  showStartMenu();
});

/* ---------- Spielstart (nach Menüwahl) ---------- */
let gameStarted = false;

function ensureGameBuilt(){
  if(gameStarted) return;
  buildBoardDOM();
  initSpeech();
  gameStarted = true;
}

function startGame(){
  ensureGameBuilt();
  applyModeUI();
  setView(currentView);
  if(currentView==='v3d' && vsAI && playerColor==='b') Board3D.setCameraPreset('black');
  updateVoiceUI();
  newGame(); // setzt Zustand zurück, startet die Uhr & ggf. den ersten KI-Zug
}

function startGameFromLoadedState(){
  ensureGameBuilt();
  selected = null; legalTargets = []; gameOver = false; aiThinking = false; pendingPromotion = null;
  applyModeUI();
  rebuildHistoryDOM();
  setView(currentView || 'v3d');
  if(threeInitialized) Board3D.primeAnimationState(state.history.length);
  if(currentView==='v3d' && vsAI && playerColor==='b') Board3D.setCameraPreset('black');
  updateVoiceUI();
  setStatus('Spiel fortgesetzt.', 'info');
  render();
  startClockIfNeeded();
  if(vsAI && state.turn !== playerColor && !gameOver) triggerAiMove();
}

/* ---------- Start ---------- */
runBootSequence().then(showStartMenu);
})();
