"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// frontend/src/games/uno-flex/rules.ts
var rules_exports = {};
__export(rules_exports, {
  COLORS: () => COLORS,
  COLOR_LABEL: () => COLOR_LABEL,
  LABELS: () => LABELS,
  applyFlex: () => applyFlex,
  buildFlexDeck: () => buildFlexDeck,
  canPlay: () => canPlay,
  initialFlex: () => initialFlex,
  shuffle: () => shuffle
});
module.exports = __toCommonJS(rules_exports);
var COLORS = ["red", "yellow", "green", "blue"];
var LABELS = { number: "", skip: "Vahele", reverse: "Suund", draw2: "+2", wild_flip: "J\xF5ud \u21BB", wild_target2: "Siht +2", wild_draw4: "+4", wild_all2: "K\xF5ik +2" };
var COLOR_LABEL = { red: "Punane", yellow: "Kollane", green: "Roheline", blue: "Sinine" };
function shuffle(cards) {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function buildFlexDeck() {
  const cards = [];
  let id = 0;
  const add = (card) => cards.push({ ...card, id: `f${++id}` });
  COLORS.forEach((color, ci) => {
    for (let n = 1; n <= 8; n++) {
      add({ kind: "number", color, number: n, flip: n === 1 || n === 5 });
      add({ kind: "number", color, number: n, flexColor: COLORS[(ci + n % 3 + 1) % 4] });
    }
    for (const kind of ["skip", "reverse", "draw2"]) {
      add({ kind, color });
      add({ kind, color, flex: true });
    }
  });
  for (let i = 0; i < 4; i++) for (const kind of ["wild_flip", "wild_target2", "wild_draw4", "wild_all2"]) add({ kind, color: "wild", flex: kind !== "wild_flip" });
  return shuffle(cards);
}
function initialFlex(code, hostToken, tokens, startHand = 7) {
  return { game_type: "uno_flex", code, hostToken, phase: "lobby", players: tokens.map((token, i) => ({ token, name: `M\xE4ngija ${i + 1}`, hand: [], power: true, uno: false })), deck: [], discard: [], current: 0, direction: 1, color: "red", revision: 0, requests: [], log: [], packData: { startHand: Number.isFinite(Number(startHand)) ? Math.max(3, Math.min(10, Math.floor(Number(startHand)))) : 7 } };
}
function next(s, steps = 1) {
  return (s.current + s.direction * steps % s.players.length + s.players.length) % s.players.length;
}
function replenish(s) {
  if (!s.deck.length && s.discard.length > 1) {
    const top = s.discard.pop();
    s.deck = shuffle(s.discard);
    s.discard = [top];
  }
}
function take(s, index, count) {
  const cards = [];
  for (let n = 0; n < count; n++) {
    replenish(s);
    const card = s.deck.pop();
    if (!card) break;
    cards.push(card);
    s.players[index].hand.push(card);
  }
  if (s.players[index].hand.length !== 1) s.players[index].uno = false;
  return cards;
}
function refreshPower(s) {
  if (s.players.every((p) => !p.power)) s.players.forEach((p) => p.power = true);
}
function canPlay(s, index, card, flex = false) {
  if (s.phase !== "turn" || index !== s.current || s.drawnId && s.drawnId !== card.id) return false;
  if (flex && (!s.players[index].power || !card.flex && !card.flexColor)) return false;
  const top = s.discard[s.discard.length - 1];
  if (card.color === "wild") return true;
  const color = flex && card.flexColor ? card.flexColor : card.color;
  return color === s.color || !!top && (card.kind === "number" ? top.kind === "number" && card.number === top.number : card.kind === top.kind);
}
function applyFlex(input, token, cmd, requestId) {
  var _a, _b;
  if (input.requests.includes(requestId)) return input;
  const host = token === input.hostToken;
  const actor = input.players.findIndex((p) => p.token === token);
  if (!host && actor < 0) throw new Error("See m\xE4ngijalink ei kuulu sessioonile");
  const s = JSON.parse(JSON.stringify(input));
  let message = "";
  let played;
  function fail(m) {
    throw new Error(m);
  }
  if (["start", "reset", "add", "remove", "rename"].includes(cmd.type)) {
    if (!host) fail("Seda teeb m\xE4ngujuht");
    if (cmd.type === "reset") {
      s.phase = "lobby";
      s.players.forEach((p) => {
        p.hand = [];
        p.power = true;
        p.uno = false;
      });
      s.deck = [];
      s.discard = [];
      s.winner = void 0;
      s.challenge = void 0;
      s.vulnerable = void 0;
      s.drawnId = void 0;
      s.log = [];
      message = "Uus m\xE4ng";
    } else if (cmd.type === "start") {
      if (s.phase !== "lobby" && s.phase !== "over") fail("M\xE4ng juba k\xE4ib");
      if (s.players.length < 2 || s.players.length > 8) fail("Vaja on 2\u20138 m\xE4ngijat");
      s.deck = buildFlexDeck();
      const opening = s.deck.splice(s.deck.findIndex((c) => c.kind === "number"), 1)[0];
      s.discard = [];
      s.players.forEach((p) => {
        p.hand = [];
        p.power = true;
        p.uno = false;
      });
      s.players.forEach((_, i) => take(s, i, s.packData.startHand));
      s.discard = [opening];
      s.color = opening.color;
      s.current = 0;
      s.direction = 1;
      s.phase = "turn";
      s.winner = void 0;
      s.drawnId = void 0;
      s.vulnerable = void 0;
      s.challenge = void 0;
      message = "Kaardid jagatud. M\xE4ng algab!";
    } else {
      if (s.phase !== "lobby") fail("M\xE4ngijaid saab muuta ooteruumis");
      if (cmd.type === "add") {
        if (s.players.length >= 8) fail("Maksimaalselt 8 m\xE4ngijat");
        s.players.push({ token: `${requestId}-player`, name: `M\xE4ngija ${s.players.length + 1}`, hand: [], power: true, uno: false });
        message = "M\xE4ngija lisatud";
      }
      if (cmd.type === "remove") {
        if (s.players.length <= 2 || !s.players[cmd.index]) fail("V\xE4hemalt kaks m\xE4ngijat");
        s.players.splice(cmd.index, 1);
        message = "M\xE4ngija eemaldatud";
      }
      if (cmd.type === "rename") {
        if (!s.players[cmd.index] || !cmd.name.trim()) fail("Sisesta m\xE4ngija nimi");
        s.players[cmd.index].name = cmd.name.trim().slice(0, 40);
        message = "Nimi muudetud";
      }
    }
  } else {
    if (actor < 0) fail("Ava oma m\xE4ngijalink");
    if (cmd.type === "uno") {
      if (s.phase === "lobby" || s.phase === "over" || s.players[actor].hand.length < 1 || s.players[actor].hand.length > 2) fail("UNO saab teatada \xFChe v\xF5i kahe kaardiga");
      s.players[actor].uno = true;
      if (s.vulnerable === actor) s.vulnerable = void 0;
      message = `${s.players[actor].name}: UNO!`;
    } else if (cmd.type === "catch") {
      if (s.phase !== "turn" && s.phase !== "draw4" || s.vulnerable !== cmd.target || cmd.target === actor || ((_a = s.players[cmd.target]) == null ? void 0 : _a.hand.length) !== 1 || s.players[cmd.target].uno) fail("UNO tabamiseks pole p\xF5hjust");
      take(s, cmd.target, 2);
      s.vulnerable = void 0;
      message = `${s.players[cmd.target].name} unustas UNO: +2 kaarti`;
    } else if (cmd.type === "accept" || cmd.type === "challenge") {
      const c = s.challenge;
      if (s.phase !== "draw4" || !c || actor !== c.to) fail("Praegu pole sinu +4 otsus");
      if (cmd.type === "challenge" && c.illegal) {
        take(s, c.from, 4);
        s.current = c.to;
        message = "Vaidlustus \xF5nnestus: +4 m\xE4nginud vastane v\xF5tab 4 kaarti";
      } else {
        take(s, c.to, cmd.type === "challenge" ? 6 : 4);
        s.current = (c.to + s.direction + s.players.length) % s.players.length;
        message = cmd.type === "challenge" ? "Vaidlustus eba\xF5nnestus: +6 ja k\xE4ik vahele" : "V\xF5etud +4, k\xE4ik vahele";
      }
      s.challenge = void 0;
      s.phase = "turn";
      if (!s.players[c.from].hand.length) {
        s.winner = c.from;
        s.phase = "over";
      }
    } else {
      if (s.phase !== "turn" || s.current !== actor) fail("Oota oma k\xE4iku");
      if (cmd.type === "pass") {
        if (!s.drawnId) fail("K\xF5igepealt v\xF5ta kaart");
        s.drawnId = void 0;
        s.current = next(s);
        s.vulnerable = void 0;
        message = `${s.players[actor].name} j\xE4tab k\xE4igu vahele`;
      } else if (cmd.type === "draw") {
        if (s.drawnId) fail("Sellel k\xE4igul on kaart juba v\xF5etud");
        s.vulnerable = void 0;
        const drawn = take(s, actor, 1)[0];
        s.drawnId = drawn == null ? void 0 : drawn.id;
        if (!drawn || !canPlay(s, actor, drawn) && !canPlay(s, actor, drawn, true)) {
          s.drawnId = void 0;
          s.current = next(s);
        }
        message = `${s.players[actor].name} v\xF5ttis kaardi`;
      } else if (cmd.type === "play") {
        const p = s.players[actor];
        const card = p.hand.find((c) => c.id === cmd.cardId);
        if (!card || !canPlay(s, actor, card, !!cmd.flex)) fail("See kaart ei sobi praegu");
        if (card.color === "wild" && !COLORS.includes(cmd.color)) fail("Vali j\xE4rgmine v\xE4rv");
        const targeted = !!cmd.flex && (card.kind === "wild_target2" || card.kind === "wild_draw4");
        if (targeted && (!Number.isInteger(cmd.target) || cmd.target === actor || !s.players[cmd.target])) fail("Vali vastane");
        const illegal = card.kind === "wild_draw4" && !cmd.flex && p.hand.some((c) => c.id !== card.id && (c.color === s.color || c.color === "wild"));
        s.vulnerable = void 0;
        s.drawnId = void 0;
        p.hand = p.hand.filter((c) => c.id !== card.id);
        s.discard.push(card);
        s.color = card.color === "wild" ? cmd.color : card.color;
        if (cmd.flex) p.power = false;
        if (card.flip) p.power = !p.power;
        let steps = 1;
        if (card.kind === "reverse") {
          s.direction = s.direction === 1 ? -1 : 1;
          steps = cmd.flex || s.players.length === 2 ? 2 : 1;
        }
        if (card.kind === "skip") steps = cmd.flex ? s.players.length : 2;
        if (card.kind === "draw2") {
          if (cmd.flex) s.players.forEach((_, i) => {
            if (i !== actor) take(s, i, 1);
          });
          else {
            take(s, next(s), 2);
            steps = 2;
          }
        }
        if (card.kind === "wild_flip") s.players.forEach((other) => other.power = !other.power);
        if (card.kind === "wild_target2" && cmd.flex) take(s, cmd.target, 2);
        if (card.kind === "wild_all2" && cmd.flex) s.players.forEach((_, i) => {
          if (i !== actor) take(s, i, 2);
        });
        if (card.kind === "wild_draw4") {
          if (cmd.flex) take(s, cmd.target, 4);
          else {
            s.challenge = { from: actor, to: next(s), illegal };
            s.phase = "draw4";
          }
        }
        refreshPower(s);
        if (p.hand.length === 1 && !p.uno) s.vulnerable = actor;
        else if (p.hand.length !== 1) p.uno = false;
        s.current = next(s, steps);
        played = card;
        message = `${p.name} m\xE4ngis ${card.kind === "number" ? card.number : LABELS[card.kind]}${cmd.flex ? " \xB7 FLEX" : ""}`;
        if (!p.hand.length && s.phase !== "draw4") {
          s.phase = "over";
          s.winner = actor;
          message = `${p.name} v\xF5itis!`;
        }
      } else fail("Tundmatu tegevus");
    }
  }
  s.revision = input.revision + 1;
  s.requests = [...input.requests, requestId].slice(-64);
  s.hostBeat = Date.now();
  s.log = [message, ...s.log].slice(0, 12);
  s.lastMove = { id: requestId, actor: actor >= 0 ? (_b = s.players[actor]) == null ? void 0 : _b.name : "M\xE4ngujuht", message, card: played, flex: cmd.type === "play" && cmd.flex };
  return s;
}
