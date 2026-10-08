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

// frontend/src/games/kinnistu-deal/logic.ts
var logic_exports = {};
__export(logic_exports, {
  applyDealCommand: () => applyDealCommand,
  checkWin: () => checkWin,
  confirmSelectedPay: () => confirmSelectedPay,
  defendWithNo: () => defendWithNo,
  discardHand: () => discardHand,
  emptyPlayer: () => emptyPlayer,
  endTurn: () => endTurn,
  hostMoveProperty: () => hostMoveProperty,
  pickProperty: () => pickProperty,
  pickRentColor: () => pickRentColor,
  pickTarget: () => pickTarget,
  playCard: () => playCard,
  prepareTurnEnd: () => prepareTurnEnd,
  resolvePay: () => resolvePay,
  skipDefend: () => skipDefend,
  startGame: () => startGame,
  startRentAll: () => startRentAll,
  tickTurnEnd: () => tickTurnEnd,
  togglePayCard: () => togglePayCard
});
module.exports = __toCommonJS(logic_exports);

// frontend/src/games/kinnistu-deal/types.ts
var SET_SIZE = {
  brown: 2,
  mint: 3,
  pink: 3,
  orange: 3,
  red: 3,
  yellow: 3,
  green: 3,
  blue: 2,
  rail: 4,
  util: 2
};
var RENT_BY_COUNT = {
  brown: [0, 1, 2],
  mint: [0, 1, 2, 3],
  pink: [0, 1, 2, 4],
  orange: [0, 1, 3, 5],
  red: [0, 2, 3, 6],
  yellow: [0, 2, 4, 6],
  green: [0, 2, 4, 7],
  blue: [0, 3, 8],
  rail: [0, 1, 2, 3, 4],
  util: [0, 1, 2]
};
var HOUSE_RENT_BONUS = 3;
var HOTEL_RENT_BONUS = 4;
var COLOR_STYLE = {
  brown: { bg: "#6b3a2a", label: "Pruun" },
  mint: { bg: "#7dd3c0", label: "M\xFCnt" },
  pink: { bg: "#e879a9", label: "Roosa" },
  orange: { bg: "#f59e0b", label: "Oran\u017E" },
  red: { bg: "#ef4444", label: "Punane" },
  yellow: { bg: "#eab308", label: "Kollane" },
  green: { bg: "#22c55e", label: "Roheline" },
  blue: { bg: "#3b82f6", label: "Sinine" },
  rail: { bg: "#1e293b", label: "Raudtee" },
  util: { bg: "#94a3b8", label: "Kommunaal" }
};
function completeSets(p) {
  let n = 0;
  for (const c of Object.keys(SET_SIZE)) {
    if ((p.props[c] || []).length >= SET_SIZE[c]) n++;
  }
  return n;
}
function rentForSet(p, color) {
  var _a, _b;
  const count = (p.props[color] || []).length;
  if (count <= 0) return 0;
  const table = RENT_BY_COUNT[color];
  const base = (_a = table[Math.min(count, table.length - 1)]) != null ? _a : 0;
  const b = (_b = p.buildings) == null ? void 0 : _b[color];
  if (b === "hotel") return base + HOTEL_RENT_BONUS;
  if (b === "house") return base + HOUSE_RENT_BONUS;
  return base;
}
function makeToken() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let t = "";
  for (let i = 0; i < 8; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}
function looseProperties(p) {
  const out = [];
  for (const col of Object.keys(SET_SIZE)) {
    const arr = p.props[col] || [];
    if (arr.length > 0 && arr.length < SET_SIZE[col]) out.push(...arr);
  }
  return out;
}
function fullSetColors(p) {
  return Object.keys(SET_SIZE).filter(
    (c) => (p.props[c] || []).length >= SET_SIZE[c]
  );
}
function colorsWithAny(p) {
  return Object.keys(SET_SIZE).filter((c) => (p.props[c] || []).length > 0);
}
function actionLabel(a) {
  const map = {
    pass_go: "Mine edasi",
    rent: "N\xF5ua \xFC\xFCri",
    debt: "V\xF5lan\xF5ue",
    birthday: "S\xFCnnip\xE4ev!",
    sly_deal: "Salakaup",
    forced_deal: "Sunnitud tehing",
    deal_breaker: "Tehingumurdja",
    just_say_no: "Ei, ait\xE4h",
    house: "Maja",
    hotel: "Hotell"
  };
  return map[a];
}

// frontend/src/games/kinnistu-deal/deck.ts
var seq = 0;
function id(prefix) {
  seq += 1;
  return `${prefix}${seq}${Math.random().toString(36).slice(2, 6)}`;
}
function money(value, n) {
  return Array.from({ length: n }, () => ({ id: id("m"), kind: "money", value }));
}
function props(color, names, value) {
  return names.map((name) => ({
    id: id("p"),
    kind: "property",
    color,
    name,
    value
  }));
}
function action(kind, name, value, n) {
  return Array.from({ length: n }, () => ({
    id: id("a"),
    kind: "action",
    action: kind,
    name,
    value
  }));
}
var THEME_PROPS = {
  classic: {
    brown: { names: ["Kalamaja", "Pelgulinn"], value: 1 },
    mint: { names: ["Kadriorg", "Pirita", "N\xF5mme"], value: 1 },
    pink: { names: ["Telliskivi", "Kopli", "Kristiine"], value: 2 },
    orange: { names: ["\xDClemiste", "Mustam\xE4e", "Lasnam\xE4e"], value: 2 },
    red: { names: ["Vanalinn", "Rotermann", "Sibulak\xFCla"], value: 3 },
    yellow: { names: ["Haabersti", "\xD5ism\xE4e", "Kakum\xE4e"], value: 3 },
    green: { names: ["Tartu kesklinn", "Supilinn", "Annelinn"], value: 4 },
    blue: { names: ["Toompea", "Rocca al Mare"], value: 4 },
    rail: { names: ["Balti jaam", "\xDClemiste jaam", "Lennujaam", "Sadama D"], value: 2 },
    util: { names: ["Elektriv\xF5rk", "Veev\xE4rk"], value: 2 }
  },
  pulm: {
    brown: { names: ["Kirikupink", "Pulmamaja esik"], value: 1 },
    mint: { names: ["Lilletuba", "Fotosein", "K\xFClalisteraamat"], value: 1 },
    pink: { names: ["Pruutneitsi laud", "\u0160ampanjabaar", "Tort"], value: 2 },
    orange: { names: ["Tantsup\xF5rand", "DJ pult", "Photobooth"], value: 2 },
    red: { names: ["Pealaud", "S\xF5bramehe k\xF5ne", "Esimene tants"], value: 3 },
    yellow: { names: ["Mesin\xE4dalad", "Hommikuhommik", "Kingikott"], value: 3 },
    green: { names: ["Aiapeo", "V\xE4literrass", "\xD5htune tuli"], value: 4 },
    blue: { names: ["Suur saal", "Privaatsviit"], value: 4 },
    rail: { names: ["Limusiin", "Takso", "Buss", "Jalutusk\xE4ik"], value: 2 },
    util: { names: ["Lillepood", "Fotograaf"], value: 2 }
  },
  tartu: {
    brown: { names: ["Supilinn", "Karlova"], value: 1 },
    mint: { names: ["Toomem\xE4gi", "Botaanikaaed", "Emaj\xF5gi"], value: 1 },
    pink: { names: ["R\xFC\xFCtli", "K\xFC\xFCtri", "\xDClikooli peahoone"], value: 2 },
    orange: { names: ["Tasku", "L\xF5unakeskus", "Annelinn"], value: 2 },
    red: { names: ["Raekoja plats", "Aparaaditehas", "Genialistide klubi"], value: 3 },
    yellow: { names: ["T\xE4htvere", "Veeriku", "Jaamam\xF5isa"], value: 3 },
    green: { names: ["Ihaste", "Ropka", "Kvissentali"], value: 4 },
    blue: { names: ["Tigutorn", "AHHAA"], value: 4 },
    rail: { names: ["Tartu jaam", "Bussijaam", "Lennujaam", "Parvlaev"], value: 2 },
    util: { names: ["Tartu Vesi", "Elektriv\xF5rk"], value: 2 }
  },
  kontor: {
    brown: { names: ["Kohvinurk", "Printeriruum"], value: 1 },
    mint: { names: ["Open space", "Meeting room", "Vaikne tsoon"], value: 1 },
    pink: { names: ["HR laud", "Reception", "Puhkeruum"], value: 2 },
    orange: { names: ["M\xFC\xFCgitiim", "Turundus", "Support"], value: 2 },
    red: { names: ["Juhi kabinet", "Boardroom", "Serveriruum"], value: 3 },
    yellow: { names: ["Parkla", "Terrass", "S\xF6\xF6kla"], value: 3 },
    green: { names: ["Filiaal Tartu", "Filiaal P\xE4rnu", "Remote hub"], value: 4 },
    blue: { names: ["Peakontor", "Rooftop"], value: 4 },
    rail: { names: ["Lift A", "Lift B", "Trepikoda", "Parklahoone"], value: 2 },
    util: { names: ["WiFi", "Kohvimasin"], value: 2 }
  }
};
function buildDeck(theme = "classic") {
  seq = 0;
  const tp = THEME_PROPS[theme] || THEME_PROPS.classic;
  const propCards = [];
  for (const color of Object.keys(tp)) {
    const block = tp[color];
    propCards.push(...props(color, block.names, block.value));
  }
  const cards = [
    ...money(1, 6),
    ...money(2, 5),
    ...money(3, 3),
    ...money(4, 3),
    ...money(5, 2),
    ...money(10, 1),
    ...propCards,
    ...action("pass_go", "Mine edasi", 1, 10),
    ...action("rent", "N\xF5ua \xFC\xFCri", 1, 6),
    ...action("debt", "V\xF5lan\xF5ue", 3, 3),
    ...action("birthday", "S\xFCnnip\xE4ev!", 2, 3),
    ...action("sly_deal", "Salakaup", 3, 3),
    ...action("forced_deal", "Sunnitud tehing", 3, 3),
    ...action("deal_breaker", "Tehingumurdja", 5, 2),
    ...action("just_say_no", "Ei, ait\xE4h", 4, 3),
    ...action("house", "Maja", 3, 3),
    ...action("hotel", "Hotell", 4, 2)
  ];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
function drawFrom(deck, n) {
  const d = [...deck];
  const cards = [];
  for (let i = 0; i < n; i++) {
    if (!d.length) break;
    cards.push(d.pop());
  }
  return { cards, deck: d };
}

// frontend/src/games/kinnistu-deal/logic.ts
function ensureDeck(s) {
  if (s.deck.length > 0) return s;
  if (!s.discard.length) return s;
  const reshuffle = [...s.discard];
  for (let i = reshuffle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [reshuffle[i], reshuffle[j]] = [reshuffle[j], reshuffle[i]];
  }
  return { ...s, deck: reshuffle, discard: [] };
}
function checkWin(s) {
  var _a, _b;
  const need = (_b = (_a = s.packData) == null ? void 0 : _a.winSets) != null ? _b : 3;
  for (let i = 0; i < s.players.length; i++) {
    if (completeSets(s.players[i]) >= need) {
      return {
        ...s,
        phase: "over",
        winner: i,
        confettiAt: Date.now(),
        log: [`\u{1F3C6} ${s.players[i].name} v\xF5itis m\xE4ngu!`, ...s.log].slice(0, 16)
      };
    }
  }
  return s;
}
function emptyPlayer(name) {
  return { token: makeToken(), name, hand: [], bank: [], props: {}, buildings: {} };
}
function startGame(s) {
  var _a, _b;
  if (s.phase !== "lobby" && s.phase !== "over" || s.players.length < 2 || s.players.length > 5) return s;
  const theme = ((_a = s.packData) == null ? void 0 : _a.theme) || "classic";
  let deck = buildDeck(theme);
  const startHand = Math.max(1, Math.min(10, Math.floor(Number((_b = s.packData) == null ? void 0 : _b.startHand) || 5)));
  const players = s.players.map((p) => {
    const drawn = drawFrom(deck, startHand);
    deck = drawn.deck;
    return { ...p, hand: drawn.cards, bank: [], props: {}, buildings: {} };
  });
  const first = drawFrom(deck, 2);
  deck = first.deck;
  players[0] = { ...players[0], hand: [...players[0].hand, ...first.cards] };
  return {
    ...s,
    players,
    deck,
    discard: [],
    current: 0,
    playsLeft: 3,
    turnCount: 0,
    turnEndAt: void 0,
    paySelected: [],
    lastEvent: null,
    phase: "turn",
    pending: null,
    winner: void 0,
    payFrom: void 0,
    payAmount: void 0,
    confettiAt: void 0,
    log: [`\u{1F3B2} M\xE4ng algas \xB7 ${players.map((p) => p.name).join(" \xB7 ")}`]
  };
}
function prepareTurnEnd(s, now = Date.now()) {
  var _a;
  if (s.phase !== "turn") return s.turnEndAt == null ? s : { ...s, turnEndAt: void 0 };
  const hand = (_a = s.players[s.current]) == null ? void 0 : _a.hand;
  if (!hand || s.playsLeft > 0 && hand.length > 0) return s.turnEndAt == null ? s : { ...s, turnEndAt: void 0 };
  if (hand.length > 7) return { ...s, phase: "discard_hand", turnEndAt: void 0 };
  return s.turnEndAt == null ? { ...s, turnEndAt: now + 5e3 } : s;
}
function tickTurnEnd(s, now = Date.now()) {
  const ready = prepareTurnEnd(s, now);
  if (ready.phase === "turn" && ready.turnEndAt != null && now >= ready.turnEndAt) return endTurn(ready);
  return ready;
}
function discardHand(s, playerIdx, ids) {
  if (s.phase !== "discard_hand" || playerIdx !== s.current) return s;
  const p = s.players[playerIdx];
  const chosen = new Set(ids);
  if (chosen.size !== ids.length || chosen.size !== p.hand.length - 7 || ids.some((id2) => !p.hand.some((c) => c.id === id2))) return s;
  const cards = p.hand.filter((c) => chosen.has(c.id));
  return prepareTurnEnd({
    ...s,
    phase: "turn",
    playsLeft: 0,
    players: s.players.map((x, i) => i === playerIdx ? { ...x, hand: x.hand.filter((c) => !chosen.has(c.id)) } : x),
    discard: [...s.discard, ...cards],
    turnEndAt: void 0,
    lastEvent: { id: `${Date.now()}-${Math.random()}`, kind: "hand_discarded", actorIndex: playerIdx, actorName: p.name, message: `${p.name} viskas \xE4ra ${cards.length} kaarti`, timestamp: Date.now() },
    log: [`${p.name} viskas \xE4ra ${cards.length} kaarti; k\xE4es 7`, ...s.log].slice(0, 16)
  });
}
function drawCards(s, count) {
  let state = s;
  const cards = [];
  for (let i = 0; i < count; i++) {
    state = ensureDeck(state);
    const drawn = drawFrom(state.deck, 1);
    state = { ...state, deck: drawn.deck };
    cards.push(...drawn.cards);
    if (!drawn.cards.length) break;
  }
  return { state, cards };
}
function endTurn(s) {
  if (s.phase !== "turn") return s;
  if (s.players[s.current].hand.length > 7) return { ...s, phase: "discard_hand", playsLeft: 0, turnEndAt: void 0 };
  const next = (s.current + 1) % s.players.length;
  const drawn = drawCards(s, s.players[next].hand.length ? 2 : 5);
  const np = { ...s.players[next], hand: [...s.players[next].hand, ...drawn.cards] };
  return {
    ...drawn.state,
    players: s.players.map((x, i) => i === next ? np : x),
    current: next,
    playsLeft: 3,
    phase: "turn",
    pending: null,
    payFrom: void 0,
    payAmount: void 0,
    paySelected: [],
    turnEndAt: void 0,
    turnCount: (s.turnCount || 0) + 1,
    log: [`\u2192 ${np.name} k\xE4ik \xB7 v\xF5ttis ${drawn.cards.length} kaarti`, ...s.log].slice(0, 16)
  };
}
function responseWindow(s, target) {
  return {
    ...s,
    phase: "defend",
    payFrom: void 0,
    payAmount: void 0,
    paySelected: [],
    turnEndAt: void 0,
    pending: { ...s.pending, target, responseIndex: target, cancelled: false },
    log: [`${s.players[target].name} vastab tegevusele`, ...s.log].slice(0, 16)
  };
}
function afterTarget(st, target) {
  const card = st.discard.find((c) => {
    var _a;
    return c.id === ((_a = st.pending) == null ? void 0 : _a.cardId);
  });
  return responseWindow({ ...st, lastEvent: { id: `${Date.now()}-${Math.random()}`, kind: "card_played", actorIndex: st.pending.from, actorName: st.players[st.pending.from].name, targetIndex: target, targetName: st.players[target].name, card, message: `${actionLabel(st.pending.action)} \u2192 ${st.players[target].name}`, timestamp: Date.now() } }, target);
}
function beginMultiPay(s, from, amount, action2, color, cardId) {
  const targets = s.players.map((_, i) => i).filter((i) => i !== from);
  if (!targets.length) return { ...s, phase: "turn", pending: null };
  const first = targets[0];
  const rest = targets.slice(1);
  const pending = {
    action: action2,
    from,
    cardId: cardId || "",
    color,
    rentMode: "all",
    rentTargets: rest,
    target: first
  };
  return responseWindow({ ...s, pending }, first);
}
function playCardCore(s, playerIdx, cardId, asBank = false) {
  if (s.phase !== "turn" || s.current !== playerIdx || s.playsLeft <= 0) return s;
  const me = s.players[playerIdx];
  const card = me.hand.find((c) => c.id === cardId);
  if (!card) return s;
  if (asBank && card.kind === "action") return {
    ...s,
    players: s.players.map((p2, i) => i === playerIdx ? { ...p2, hand: p2.hand.filter((c) => c.id !== card.id), bank: [...p2.bank, card] } : p2),
    playsLeft: s.playsLeft - 1,
    lastEvent: { id: `${Date.now()}-${Math.random()}`, kind: "money_bank", actorName: me.name, actorIndex: playerIdx, card, amount: card.value, message: `Pani tegevuskaardi panka (${card.value}M)`, timestamp: Date.now() },
    log: [`${me.name} pani tegevuskaardi panka (${card.value}M)`, ...s.log].slice(0, 16)
  };
  if (card.kind === "action") {
    const targets = s.players.filter((_, i) => i !== playerIdx);
    if (card.action === "sly_deal" && !targets.some((p2) => looseProperties(p2).length) || card.action === "forced_deal" && (!looseProperties(me).length || !targets.some((p2) => looseProperties(p2).length)) || card.action === "deal_breaker" && !targets.some((p2) => fullSetColors(p2).length)) return s;
  }
  if (card.kind === "action") {
    if (card.action === "rent" && !colorsWithAny(me).length) {
      return {
        ...s,
        log: [`\u26A0\uFE0F \xDC\xFCri ei saa \u2014 sul pole kinnistuid`, ...s.log].slice(0, 16)
      };
    }
    if (card.action === "house") {
      const eligible = fullSetColors(me).filter((c) => {
        var _a;
        return c !== "rail" && c !== "util" && !((_a = me.buildings) == null ? void 0 : _a[c]);
      });
      if (!eligible.length) {
        return {
          ...s,
          log: [`\u26A0\uFE0F Maja vajab t\xE4iskomplekti ilma majata`, ...s.log].slice(0, 16)
        };
      }
    }
    if (card.action === "hotel") {
      const eligible = fullSetColors(me).filter((c) => {
        var _a;
        return c !== "rail" && c !== "util" && ((_a = me.buildings) == null ? void 0 : _a[c]) === "house";
      });
      if (!eligible.length) {
        return {
          ...s,
          log: [`\u26A0\uFE0F Hotell vajab komplekti, millel on juba maja`, ...s.log].slice(0, 16)
        };
      }
    }
  }
  let st = {
    ...s,
    lastEvent: { id: `${Date.now()}-${Math.random()}`, kind: "card_played", actorName: me.name, actorIndex: playerIdx, card, message: `${me.name} m\xE4ngis ${card.kind === "action" ? actionLabel(card.action) : card.kind === "property" ? card.name : `${card.value}M`}`, timestamp: Date.now() },
    players: s.players.map(
      (p2, i) => i === playerIdx ? { ...p2, hand: p2.hand.filter((c) => c.id !== cardId) } : p2
    )
  };
  const p = { ...st.players[playerIdx], buildings: { ...st.players[playerIdx].buildings || {} } };
  if (card.kind === "money") {
    p.bank = [...p.bank, card];
    st.players = st.players.map((x, i) => i === playerIdx ? p : x);
    st.playsLeft -= 1;
    st.log = [`\u{1F4B0} ${p.name} \u2192 pank ${card.value}M`, ...st.log].slice(0, 16);
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: "money_bank",
      actorName: p.name,
      actorIndex: playerIdx,
      card,
      amount: card.value,
      message: `Pani panka ${card.value}M`,
      timestamp: Date.now()
    };
    return st;
  }
  if (card.kind === "property") {
    const col = card.color;
    p.props = { ...p.props, [col]: [...p.props[col] || [], card] };
    st.players = st.players.map((x, i) => i === playerIdx ? p : x);
    st.playsLeft -= 1;
    const done = (p.props[col] || []).length >= SET_SIZE[col];
    st.log = [
      `\u{1F3E0} ${p.name} \xB7 ${card.name}${done ? " \u2713 komplekt!" : ""}`,
      ...st.log
    ].slice(0, 16);
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: "prop_placed",
      actorName: p.name,
      actorIndex: playerIdx,
      card,
      propName: card.name,
      propColor: col,
      message: done ? `T\xC4ISKOMPLEKT! M\xE4ngis: ${card.name}` : `M\xE4ngis kinnistu: ${card.name}`,
      timestamp: Date.now()
    };
    return checkWin(st);
  }
  if (card.action === "pass_go") {
    const drawn = drawCards(st, 2);
    st = drawn.state;
    p.hand = [...p.hand, ...drawn.cards];
    st.discard = [...st.discard, card];
    st.players = st.players.map((x, i) => i === playerIdx ? p : x);
    st.playsLeft -= 1;
    st.log = [`\u{1F4DC} ${p.name} \xB7 Mine edasi (+2 kaarti)`, ...st.log].slice(0, 16);
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: "pass_go",
      actorName: p.name,
      actorIndex: playerIdx,
      card,
      message: `Mine edasi! V\xF5ttis pakist 2 kaarti`,
      timestamp: Date.now()
    };
    return st;
  }
  if (card.action === "just_say_no") {
    p.bank = [...p.bank, card];
    st.players = st.players.map((x, i) => i === playerIdx ? p : x);
    st.playsLeft -= 1;
    st.log = [`${p.name} pani \u201EEi, ait\xE4h\u201C panka (${card.value}M)`, ...st.log].slice(0, 16);
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: "money_bank",
      actorName: p.name,
      actorIndex: playerIdx,
      card,
      amount: card.value,
      message: `Pani \u201EEi, ait\xE4h\u201C panka (${card.value}M)`,
      timestamp: Date.now()
    };
    return st;
  }
  if (card.action === "birthday") {
    st.players = st.players.map((x, i) => i === playerIdx ? p : x);
    st.discard = [...st.discard, card];
    st.playsLeft -= 1;
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: "birthday",
      actorName: p.name,
      actorIndex: playerIdx,
      card,
      amount: 2,
      message: `\u{1F382} S\xDCNNIP\xC4EV! K\xF5ik teised maksavad 2M!`,
      timestamp: Date.now()
    };
    return beginMultiPay(st, playerIdx, 2, "birthday", void 0, card.id);
  }
  if (card.action === "house" || card.action === "hotel") {
    st.players = st.players.map((x, i) => i === playerIdx ? p : x);
    st.discard = [...st.discard, card];
    st.playsLeft -= 1;
    st.pending = { action: card.action, from: playerIdx, cardId: card.id };
    st.phase = "pick_rent_color";
    st.log = [
      `\u{1F3D7}\uFE0F ${p.name}: ${actionLabel(card.action)} \u2014 vali komplekt`,
      ...st.log
    ].slice(0, 16);
    return st;
  }
  if (card.action === "rent") {
    st.players = st.players.map((x, i) => i === playerIdx ? p : x);
    st.discard = [...st.discard, card];
    st.playsLeft -= 1;
    st.pending = { action: "rent", from: playerIdx, cardId: card.id };
    st.phase = "pick_rent_color";
    st.log = [`\u{1F511} ${p.name} n\xF5uab \xFC\xFCri \u2014 vali v\xE4rv`, ...st.log].slice(0, 16);
    return st;
  }
  st.players = st.players.map((x, i) => i === playerIdx ? p : x);
  st.discard = [...st.discard, card];
  st.playsLeft -= 1;
  st.pending = { action: card.action, from: playerIdx, cardId: card.id };
  st.phase = "pick_target";
  st.log = [`\u{1F3AF} ${p.name}: ${actionLabel(card.action)}`, ...st.log].slice(0, 16);
  return st;
}
function pickRentColorCore(s, color) {
  var _a, _b;
  if (s.phase !== "pick_rent_color" || !s.pending || !Object.prototype.hasOwnProperty.call(SET_SIZE, color)) return s;
  const act = s.pending.action;
  const from = s.players[s.pending.from];
  if (act === "house" || act === "hotel") {
    if (color === "rail" || color === "util" || (from.props[color] || []).length < SET_SIZE[color]) return s;
    const buildings = { ...from.buildings || {} };
    if (act === "house") {
      if (buildings[color]) return s;
      buildings[color] = "house";
    } else {
      if (buildings[color] !== "house") return s;
      buildings[color] = "hotel";
    }
    const rent = rentForSet({ ...from, buildings }, color);
    const colorLabel = ((_a = COLOR_STYLE[color]) == null ? void 0 : _a.label) || color;
    return {
      ...s,
      players: s.players.map(
        (x, i) => i === s.pending.from ? { ...from, buildings } : x
      ),
      phase: "turn",
      pending: null,
      lastEvent: {
        id: `${Date.now()}-${Math.random()}`,
        kind: act === "hotel" ? "hotel_built" : "house_built",
        actorName: from.name,
        actorIndex: s.pending.from,
        propColor: color,
        amount: rent,
        message: `${from.name} ehitas ${act === "hotel" ? "HOTELLI \u{1F3E8}" : "MAJA \u{1F3E0}"} (${colorLabel})! \xDC\xFCr n\xFC\xFCd ${rent}M`,
        timestamp: Date.now()
      },
      log: [
        `\u{1F3D7}\uFE0F ${from.name} \xB7 ${act === "hotel" ? "hotell" : "maja"} (${color}) \xB7 \xFC\xFCr n\xFC\xFCd ${rent}M`,
        ...s.log
      ].slice(0, 16)
    };
  }
  if (act !== "rent") return s;
  if (!(from.props[color] || []).length) return s;
  const amount = rentForSet(from, color);
  return {
    ...s,
    pending: { ...s.pending, color },
    phase: "pick_target",
    log: [
      `\u{1F511} \xDC\xFCr ${color}: ${amount}M (${(from.props[color] || []).length} t\xE4navat${((_b = from.buildings) == null ? void 0 : _b[color]) ? " + " + from.buildings[color] : ""}) \u2014 vali maksja v\xF5i \u201Ek\xF5igile\u201C`,
      ...s.log
    ].slice(0, 16)
  };
}
function startRentAllCore(s) {
  if (s.phase !== "pick_target" || !s.pending || s.pending.action !== "rent") return s;
  const from = s.pending.from;
  const color = s.pending.color;
  const amount = color ? rentForSet(s.players[from], color) : 3;
  return beginMultiPay(
    { ...s, pending: null },
    from,
    amount,
    "rent",
    color,
    s.pending.cardId
  );
}
function pickTargetCore(s, target) {
  if (s.phase !== "pick_target" || !s.pending) return s;
  if (!Number.isInteger(target) || !s.players[target] || target === s.pending.from) return s;
  const p = s.players[target];
  if ((s.pending.action === "sly_deal" || s.pending.action === "forced_deal") && !looseProperties(p).length) return s;
  if (s.pending.action === "deal_breaker" && !fullSetColors(p).length) return s;
  return afterTarget(s, target);
}
function defendWithNoCore(s, playerIdx) {
  var _a;
  if (s.phase !== "defend" || !s.pending || ((_a = s.pending.responseIndex) != null ? _a : s.pending.target) !== playerIdx) return s;
  const p = s.players[playerIdx];
  const noCard = p.hand.find((c) => c.kind === "action" && c.action === "just_say_no");
  if (!noCard) return s;
  const nextResponse = playerIdx === s.pending.from ? s.pending.target : s.pending.from;
  return {
    ...s,
    players: s.players.map((x, i) => i === playerIdx ? { ...x, hand: x.hand.filter((c) => c.id !== noCard.id) } : x),
    discard: [...s.discard, noCard],
    pending: { ...s.pending, cancelled: !s.pending.cancelled, responseIndex: nextResponse },
    lastEvent: {
      id: `${Date.now()}-${Math.random()}`,
      kind: "just_say_no",
      actorName: p.name,
      actorIndex: playerIdx,
      targetIndex: nextResponse,
      targetName: s.players[nextResponse].name,
      card: noCard,
      message: `${p.name}: \u201EEi, ait\xE4h!\u201C`,
      timestamp: Date.now()
    },
    log: [`${p.name} m\xE4ngis \u201EEi, ait\xE4h\u201C \xB7 ${s.players[nextResponse].name} vastab`, ...s.log].slice(0, 16)
  };
}
function skipDefendCore(s, playerIdx) {
  var _a;
  if (s.phase !== "defend" || !s.pending || ((_a = s.pending.responseIndex) != null ? _a : s.pending.target) !== playerIdx) return s;
  if (!s.pending.cancelled) return applyEffect(s);
  const queue = s.pending.rentTargets || [];
  if (s.pending.rentMode === "all" && queue.length) {
    return responseWindow({ ...s, pending: { ...s.pending, rentTargets: queue.slice(1) } }, queue[0]);
  }
  return {
    ...s,
    phase: "turn",
    pending: null,
    payFrom: void 0,
    payAmount: void 0,
    paySelected: [],
    log: ["Tegevus t\xFChistatud", ...s.log].slice(0, 16)
  };
}
function pickPropertyCore(s, propertyId) {
  if (s.phase !== "pick_property" || !s.pending || s.pending.target == null) return s;
  const owner = s.pending.giveStep ? s.players[s.pending.from] : s.players[s.pending.target];
  const eligible = s.pending.action === "deal_breaker" ? fullSetColors(owner).flatMap((c) => owner.props[c] || []) : looseProperties(owner);
  if (!eligible.some((c) => c.id === propertyId)) return s;
  if (s.pending.action === "forced_deal" && s.pending.giveStep) {
    return finishForcedDeal(s, s.pending.propertyId, propertyId);
  }
  return applyEffect({ ...s, pending: { ...s.pending, propertyId } });
}
function finishForcedDeal(s, takeId, giveId) {
  const act = s.pending;
  const from = s.players[act.from];
  const to = s.players[act.target];
  const theirLoose = looseProperties(to);
  const myLoose = looseProperties(from);
  const take = theirLoose.find((c) => c.id === takeId);
  const give = myLoose.find((c) => c.id === giveId);
  if (!take || take.kind !== "property" || !give || give.kind !== "property") return s;
  const toProps = { ...to.props };
  const fromProps = { ...from.props };
  toProps[take.color] = (toProps[take.color] || []).filter((c) => c.id !== take.id);
  fromProps[take.color] = [...fromProps[take.color] || [], take];
  let giveName = "";
  if (give && give.kind === "property" && give.id !== take.id) {
    fromProps[give.color] = (fromProps[give.color] || []).filter((c) => c.id !== give.id);
    toProps[give.color] = [...toProps[give.color] || [], give];
    giveName = ` \u21C4 ${give.name}`;
  }
  return checkWin({
    ...s,
    players: s.players.map((x, i) => {
      if (i === act.from) return { ...from, props: fromProps };
      if (i === act.target) return { ...to, props: toProps };
      return x;
    }),
    phase: "turn",
    pending: null,
    lastEvent: {
      id: `${Date.now()}-${Math.random()}`,
      kind: "forced_deal",
      cards: [take, give],
      actorName: from.name,
      actorIndex: act.from,
      targetName: to.name,
      targetIndex: act.target,
      propName: `${take.name}${giveName}`,
      message: `\u{1F504} SUNNITUD TEHING! ${from.name} vahetas: ${take.name}${giveName}`,
      timestamp: Date.now()
    },
    log: [`\u{1F504} Sunnitud tehing: ${take.name} \u2192 ${from.name}${giveName}`, ...s.log].slice(0, 16)
  });
}
function applyEffect(s) {
  var _a, _b, _c;
  const act = s.pending;
  if (!act || act.target == null) return { ...s, phase: "turn", pending: null };
  const from = s.players[act.from];
  const to = s.players[act.target];
  let st = { ...s };
  if (act.action === "birthday") {
    return {
      ...st,
      phase: "pay",
      payFrom: act.target,
      payAmount: 2,
      paySelected: [],
      log: [`\u{1F382} ${to.name} \u2192 2M ${from.name}`, ...st.log].slice(0, 16)
    };
  }
  if (act.action === "debt") {
    return {
      ...st,
      phase: "pay",
      payFrom: act.target,
      payAmount: 5,
      paySelected: [],
      lastEvent: {
        id: `${Date.now()}-${Math.random()}`,
        kind: "debt",
        actorName: from.name,
        actorIndex: act.from,
        targetName: to.name,
        targetIndex: act.target,
        amount: 5,
        message: `\u{1F4B8} V\xD5LAN\xD5UE! ${to.name} peab maksma 5M m\xE4ngijale ${from.name}!`,
        timestamp: Date.now()
      },
      log: [`\u{1F4B8} V\xF5lan\xF5ue: ${to.name} maksab 5M \u2192 ${from.name}`, ...st.log].slice(0, 16)
    };
  }
  if (act.action === "rent") {
    const color = act.color;
    const amount = color ? rentForSet(from, color) : 3;
    const colorLabel = color ? ((_a = COLOR_STYLE[color]) == null ? void 0 : _a.label) || color : "";
    return {
      ...st,
      phase: "pay",
      payFrom: act.target,
      payAmount: amount,
      paySelected: [],
      lastEvent: {
        id: `${Date.now()}-${Math.random()}`,
        kind: "rent_charged",
        actorName: from.name,
        actorIndex: act.from,
        targetName: to.name,
        targetIndex: act.target,
        amount,
        propColor: color,
        message: `\u{1F511} \xDC\xDCRIN\xD5UE (${colorLabel})! ${to.name} peab maksma ${amount}M!`,
        timestamp: Date.now()
      },
      log: [`\u{1F511} ${to.name} maksab \xFC\xFCri ${amount}M \u2192 ${from.name}`, ...st.log].slice(0, 16)
    };
  }
  if (act.action === "sly_deal") {
    const loose = looseProperties(to);
    if (!loose.length) {
      return {
        ...st,
        phase: "turn",
        pending: null,
        log: [`Salakaup eba\xF5nnestus \u2014 ${to.name}l pole vaba kinnistut`, ...st.log].slice(0, 16)
      };
    }
    if (!act.propertyId && loose.length > 1) {
      return {
        ...st,
        phase: "pick_property",
        pending: act,
        log: [`Vali kinnistu ${to.name}lt`, ...st.log].slice(0, 16)
      };
    }
    const chosen = act.propertyId ? loose.find((c) => c.id === act.propertyId) || loose[0] : loose[0];
    if (chosen.kind !== "property") return { ...st, phase: "turn", pending: null };
    const toProps = { ...to.props };
    toProps[chosen.color] = (toProps[chosen.color] || []).filter((c) => c.id !== chosen.id);
    const toBuildings = { ...to.buildings || {} };
    if ((toProps[chosen.color] || []).length < SET_SIZE[chosen.color]) {
      delete toBuildings[chosen.color];
    }
    const fromProps = { ...from.props };
    fromProps[chosen.color] = [...fromProps[chosen.color] || [], chosen];
    st.players = st.players.map((x, i) => {
      if (i === act.from) return { ...from, props: fromProps };
      if (i === act.target) return { ...to, props: toProps, buildings: toBuildings };
      return x;
    });
    st.phase = "turn";
    st.pending = null;
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: "sly_deal",
      card: chosen,
      actorName: from.name,
      actorIndex: act.from,
      targetName: to.name,
      targetIndex: act.target,
      propName: chosen.name,
      propColor: chosen.color,
      message: `\u{1F575}\uFE0F SALAKAUP! ${from.name} varastas kinnistu: ${chosen.name}!`,
      timestamp: Date.now()
    };
    st.log = [`\u{1F575}\uFE0F Salakaup: ${chosen.name} \u2192 ${from.name}`, ...st.log].slice(0, 16);
    return checkWin(st);
  }
  if (act.action === "deal_breaker") {
    const full = fullSetColors(to);
    if (!full.length) {
      return {
        ...st,
        phase: "turn",
        pending: null,
        log: [`Tehingumurdja eba\xF5nnestus \u2014 pole t\xE4iskomplekti`, ...st.log].slice(0, 16)
      };
    }
    let taken = full[0];
    if (act.propertyId) {
      for (const col of full) {
        if ((to.props[col] || []).some((c) => c.id === act.propertyId)) {
          taken = col;
          break;
        }
      }
    } else if (full.length > 1) {
      return {
        ...st,
        phase: "pick_property",
        pending: act,
        log: [`Vali komplekt ${to.name}lt`, ...st.log].slice(0, 16)
      };
    }
    const setCards = [...to.props[taken] || []];
    const toProps = { ...to.props };
    delete toProps[taken];
    const toBuildings = { ...to.buildings || {} };
    const building = toBuildings[taken];
    delete toBuildings[taken];
    const fromProps = { ...from.props, [taken]: [...from.props[taken] || [], ...setCards] };
    const fromBuildings = { ...from.buildings || {} };
    if (building) fromBuildings[taken] = building;
    st.players = st.players.map((x, i) => {
      if (i === act.from) return { ...from, props: fromProps, buildings: fromBuildings };
      if (i === act.target) return { ...to, props: toProps, buildings: toBuildings };
      return x;
    });
    st.phase = "turn";
    st.pending = null;
    const colorLabel = ((_b = COLOR_STYLE[taken]) == null ? void 0 : _b.label) || taken;
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: "deal_breaker",
      cards: setCards,
      actorName: from.name,
      actorIndex: act.from,
      targetName: to.name,
      targetIndex: act.target,
      propColor: taken,
      message: `\u{1F4A5} TEHINGUMURDJA! ${from.name} varastas terve komplekti (${colorLabel}) m\xE4ngijalt ${to.name}!`,
      timestamp: Date.now()
    };
    st.log = [`\u{1F4A5} Tehingumurdja: ${taken} \u2192 ${from.name}`, ...st.log].slice(0, 16);
    return checkWin(st);
  }
  if (act.action === "forced_deal") {
    const myLoose = looseProperties(from);
    const theirLoose = looseProperties(to);
    if (!theirLoose.length || !myLoose.length) {
      return {
        ...st,
        phase: "turn",
        pending: null,
        log: [`Sunnitud tehing eba\xF5nnestus \u2014 vastasel pole vaba kinnistut`, ...st.log].slice(0, 16)
      };
    }
    if (!act.propertyId && theirLoose.length > 1) {
      return {
        ...st,
        phase: "pick_property",
        pending: act,
        log: [`Vali kinnistu, mille v\xF5tad ${to.name}lt`, ...st.log].slice(0, 16)
      };
    }
    const take = act.propertyId ? theirLoose.find((c) => c.id === act.propertyId) || theirLoose[0] : theirLoose[0];
    if (take.kind !== "property") return { ...st, phase: "turn", pending: null };
    if (myLoose.length > 1) {
      return {
        ...st,
        phase: "pick_property",
        pending: { ...act, propertyId: take.id, ...{ giveStep: true } },
        log: [`Vali oma kinnistu, mille annad vastutasuks`, ...st.log].slice(0, 16)
      };
    }
    return finishForcedDeal(
      { ...st, pending: { ...act, propertyId: take.id } },
      take.id,
      ((_c = myLoose[0]) == null ? void 0 : _c.id) || ""
    );
  }
  return { ...st, phase: "turn", pending: null };
}
function togglePayCard(s, playerIdx, cardId) {
  if (s.phase !== "pay" || s.payFrom !== playerIdx) return s;
  const sel = new Set(s.paySelected || []);
  if (sel.has(cardId)) sel.delete(cardId);
  else sel.add(cardId);
  return { ...s, paySelected: [...sel] };
}
function confirmSelectedPayCore(s) {
  var _a;
  if (s.phase !== "pay" || s.payFrom == null || s.payAmount == null || !s.pending) return s;
  const payerI = s.payFrom;
  const recvI = s.pending.from;
  const selected = new Set(s.paySelected || []);
  const assets = [...s.players[payerI].bank, ...Object.values(s.players[payerI].props).flatMap((cards) => cards || [])];
  if ([...selected].some((id2) => !assets.some((c) => c.id === id2))) return s;
  const sum = assets.filter((c) => selected.has(c.id)).reduce((total2, c) => total2 + c.value, 0);
  const total = assets.reduce((total2, c) => total2 + c.value, 0);
  const required = Math.min(s.payAmount, total);
  if (sum < required) return { ...s, log: [`\u26A0\uFE0F Vali v\xE4hemalt ${required}M v\xE4\xE4rtuses vara`, ...s.log].slice(0, 16) };
  const payerBank = s.players[payerI].bank.filter((c) => !selected.has(c.id));
  const recvBank = [...s.players[recvI].bank];
  for (const c of s.players[payerI].bank) {
    if (selected.has(c.id)) recvBank.push(c);
  }
  const payerProps = {};
  const payerBuildings = { ...s.players[payerI].buildings || {} };
  const recvProps = { ...s.players[recvI].props };
  for (const col of Object.keys(SET_SIZE)) {
    const stay = [];
    for (const c of s.players[payerI].props[col] || []) {
      if (selected.has(c.id) && c.kind === "property") {
        recvProps[c.color] = [...recvProps[c.color] || [], c];
      } else stay.push(c);
    }
    if (stay.length) payerProps[col] = stay;
    if (stay.length < SET_SIZE[col]) delete payerBuildings[col];
  }
  const payer = {
    ...s.players[payerI],
    bank: payerBank,
    props: payerProps,
    buildings: payerBuildings
  };
  const recv = {
    ...s.players[recvI],
    bank: recvBank,
    props: recvProps
  };
  const basePlayers = s.players.map((x, i) => {
    if (i === payerI) return payer;
    if (i === recvI) return recv;
    return x;
  });
  const payEvent = {
    id: `${Date.now()}-${Math.random()}`,
    kind: "pay_completed",
    cards: assets.filter((c) => selected.has(c.id)),
    actorName: s.players[payerI].name,
    actorIndex: payerI,
    targetName: s.players[recvI].name,
    targetIndex: recvI,
    amount: sum,
    message: `\u{1F4B5} ${s.players[payerI].name} maksis ${sum}M m\xE4ngijale ${s.players[recvI].name}!`,
    timestamp: Date.now()
  };
  const queue = s.pending.rentTargets || [];
  if (s.pending.rentMode === "all" && queue.length > 0) {
    const next = queue[0];
    const rest = queue.slice(1);
    const amount = s.payAmount;
    const pending = { ...s.pending, target: next, rentTargets: rest };
    const st = {
      ...s,
      players: basePlayers,
      pending,
      lastEvent: payEvent,
      paySelected: [],
      log: [
        `\u2705 ${s.players[payerI].name} maksis ${sum}M \xB7 j\xE4rgmine: ${(_a = s.players[next]) == null ? void 0 : _a.name}`,
        ...s.log
      ].slice(0, 16)
    };
    return checkWin(responseWindow(st, next));
  }
  return checkWin({
    ...s,
    players: basePlayers,
    phase: "turn",
    pending: null,
    payFrom: void 0,
    payAmount: void 0,
    paySelected: [],
    lastEvent: payEvent,
    log: [`\u2705 ${s.players[payerI].name} maksis ${sum}M`, ...s.log].slice(0, 16)
  });
}
function hostMoveProperty(s, fromIdx, toIdx, cardId) {
  if (fromIdx === toIdx) return s;
  const from = s.players[fromIdx];
  const to = s.players[toIdx];
  let found = null;
  let foundCol = null;
  for (const col of Object.keys(SET_SIZE)) {
    const c = (from.props[col] || []).find((x) => x.id === cardId);
    if (c) {
      found = c;
      foundCol = col;
      break;
    }
  }
  if (!found || found.kind !== "property" || !foundCol) return s;
  const fromProps = { ...from.props };
  fromProps[foundCol] = (fromProps[foundCol] || []).filter((c) => c.id !== cardId);
  const fromBuildings = { ...from.buildings || {} };
  if ((fromProps[foundCol] || []).length < SET_SIZE[foundCol]) delete fromBuildings[foundCol];
  const toProps = {
    ...to.props,
    [found.color]: [...to.props[found.color] || [], found]
  };
  return {
    ...s,
    players: s.players.map((x, i) => {
      if (i === fromIdx) return { ...from, props: fromProps, buildings: fromBuildings };
      if (i === toIdx) return { ...to, props: toProps };
      return x;
    }),
    log: [`\u{1F6E0}\uFE0F Host: ${found.name} ${from.name} \u2192 ${to.name}`, ...s.log].slice(0, 16)
  };
}
function resolvePayCore(s) {
  var _a;
  if (s.phase !== "pay" || s.payFrom == null || s.payAmount == null || !s.pending) return s;
  const payerI = s.payFrom;
  const recvI = s.pending.from;
  let left = s.payAmount;
  let payer = {
    ...s.players[payerI],
    bank: [...s.players[payerI].bank],
    buildings: { ...s.players[payerI].buildings || {} },
    props: { ...s.players[payerI].props }
  };
  let recv = {
    ...s.players[recvI],
    bank: [...s.players[recvI].bank],
    props: { ...s.players[recvI].props }
  };
  const sorted = [...payer.bank].sort((a, b) => b.value - a.value);
  const keep = [];
  let paid = 0;
  for (const c of sorted) {
    if (left > 0 && c.value <= left) {
      left -= c.value;
      paid += c.value;
      recv.bank.push(c);
    } else keep.push(c);
  }
  if (left > 0) {
    const rest = [...keep].sort((a, b) => a.value - b.value);
    const keep2 = [];
    for (const c of rest) {
      if (left > 0) {
        left -= c.value;
        paid += c.value;
        recv.bank.push(c);
      } else keep2.push(c);
    }
    payer.bank = keep2;
  } else {
    payer.bank = keep;
  }
  while (left > 0) {
    const loose = Object.values(payer.props).flatMap((cards) => cards || []);
    if (!loose.length || loose[0].kind !== "property") break;
    const prop = loose[0];
    const props2 = { ...payer.props };
    props2[prop.color] = (props2[prop.color] || []).filter((c) => c.id !== prop.id);
    if ((props2[prop.color] || []).length < SET_SIZE[prop.color]) {
      const b = { ...payer.buildings || {} };
      delete b[prop.color];
      payer = { ...payer, props: props2, buildings: b };
    } else {
      payer = { ...payer, props: props2 };
    }
    recv.props = {
      ...recv.props,
      [prop.color]: [...recv.props[prop.color] || [], prop]
    };
    paid += prop.value;
    left -= prop.value;
  }
  const basePlayers = s.players.map((x, i) => {
    if (i === payerI) return payer;
    if (i === recvI) return recv;
    return x;
  });
  const queue = s.pending.rentTargets || [];
  if (s.pending.rentMode === "all" && queue.length > 0) {
    const next = queue[0];
    const rest = queue.slice(1);
    const amount = s.payAmount;
    const pending = { ...s.pending, target: next, rentTargets: rest };
    const st = {
      ...s,
      players: basePlayers,
      pending,
      paySelected: [],
      log: [
        `\u2705 ${s.players[payerI].name} tasus ~${paid}M \xB7 j\xE4rgmine: ${(_a = s.players[next]) == null ? void 0 : _a.name}`,
        ...s.log
      ].slice(0, 16)
    };
    return checkWin(responseWindow(st, next));
  }
  return checkWin({
    ...s,
    players: basePlayers,
    phase: "turn",
    pending: null,
    payFrom: void 0,
    payAmount: void 0,
    paySelected: [],
    log: [`\u2705 ${s.players[payerI].name} tasus ~${paid}M`, ...s.log].slice(0, 16)
  });
}
function playCard(s, playerIdx, cardId, asBank = false) {
  const next = playCardCore(s, playerIdx, cardId, asBank);
  return next === s ? s : prepareTurnEnd(next);
}
function pickRentColor(s, color) {
  const next = pickRentColorCore(s, color);
  return next === s ? s : prepareTurnEnd(next);
}
function startRentAll(s) {
  const next = startRentAllCore(s);
  return next === s ? s : prepareTurnEnd(next);
}
function pickTarget(s, target) {
  const next = pickTargetCore(s, target);
  return next === s ? s : prepareTurnEnd(next);
}
function defendWithNo(s, playerIdx) {
  const next = defendWithNoCore(s, playerIdx);
  return next === s ? s : prepareTurnEnd(next);
}
function skipDefend(s, playerIdx) {
  const next = skipDefendCore(s, playerIdx);
  return next === s ? s : prepareTurnEnd(next);
}
function pickProperty(s, propertyId) {
  const next = pickPropertyCore(s, propertyId);
  return next === s ? s : prepareTurnEnd(next);
}
function confirmSelectedPay(s) {
  const next = confirmSelectedPayCore(s);
  return next === s ? s : prepareTurnEnd(next);
}
function resolvePay(s) {
  const next = resolvePayCore(s);
  return next === s ? s : prepareTurnEnd(next);
}
function applyDealCommand(s, token, command, requestId) {
  var _a, _b;
  if ((_a = s.processedMoves) == null ? void 0 : _a.includes(requestId)) return s;
  const actor = s.players.findIndex((p) => p.token === token);
  if (actor < 0) throw new Error("See m\xE4ngijalink ei kuulu sessioonile");
  const ownsAction = ((_b = s.pending) == null ? void 0 : _b.from) === actor;
  let next = s;
  switch (command.type) {
    case "play":
      next = playCard(s, actor, command.cardId, !!command.bank);
      break;
    case "target":
      if (ownsAction) next = pickTarget(s, command.target);
      break;
    case "rent_color":
      if (ownsAction) next = pickRentColor(s, command.color);
      break;
    case "property":
      if (ownsAction) next = pickProperty(s, command.cardId);
      break;
    case "rent_all":
      if (ownsAction) next = startRentAll(s);
      break;
    case "defend":
      next = defendWithNo(s, actor);
      break;
    case "accept":
      next = skipDefend(s, actor);
      break;
    case "pay":
      if (s.payFrom === actor) next = confirmSelectedPay(s);
      break;
    case "toggle_pay":
      next = togglePayCard(s, actor, command.cardId);
      break;
    case "discard":
      next = discardHand(s, actor, command.ids);
      break;
    case "end":
      if (s.current === actor) next = endTurn(s);
      break;
    case "rename": {
      const name = command.name.trim().slice(0, 40);
      if (!name) throw new Error("Sisesta nimi");
      next = { ...s, players: s.players.map((p, i) => i === actor ? { ...p, name } : p) };
      break;
    }
    default:
      throw new Error("Tundmatu k\xE4ik");
  }
  if (next === s) throw new Error("See k\xE4ik ei ole praegu lubatud");
  return { ...next, hostBeat: Date.now(), processedMoves: [...s.processedMoves || [], requestId].slice(-64) };
}
