// The cabinet in Telegram: a customer's licenses and support; the owner also gets the panel.
// Everything shown comes from the Worker (worker/src/app.ts), which checks Telegram's signature on the
// launch data with each request. Text goes into the page only through textContent.
(function () {
  "use strict";
  var API = "https://license.monaro.workers.dev";
  var tg = window.Telegram && window.Telegram.WebApp;
  var view = document.getElementById("view");
  var tabsEl = document.getElementById("tabs");
  var langButton = document.getElementById("lang");
  var state = { me: null, tab: "products", lang: "ru", back: null, contracts: [], deepLink: null, deepSeen: false, deepInvalid: false, expired: false };
  // ?contract=: any case, normalised to upper case; present but not a contract code shows a notice
  var deep = /[?&]contract=([^&#]*)/i.exec(location.search);
  if (deep) {
    var deepCode = deep[1].toUpperCase();
    state.deepSeen = true;
    if (/^LC-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(deepCode)) state.deepLink = deepCode; else state.deepInvalid = true;
  }
  var swipesLocked = false;

  var TEXT = {
    ru: {
      products: "Продукты", contracts: "Договоры", support: "Поддержка", panel: "Панель", loading: "Загрузка…", failed: "Не удалось загрузить. Закройте и откройте приложение ещё раз.", onlyTelegram: "Приложение открывается из бота в Telegram.",
      active: "Лицензия активна, навсегда", revoked: "Лицензия отозвана", licensedTo: "Лицензия на имя", change: "Изменить", computers: "Компьютеры", none: "Не активирована", since: "Куплена", installer: "Установщик и руководство",
      installNote: "Если система блокирует установщик. macOS: Системные настройки > Конфиденциальность и безопасность > «Всё равно открыть». Windows: в окне SmartScreen «Подробнее» > «Выполнить в любом случае».",
      keyNote: "Ключ показывается один раз, в сообщении о покупке в чате с ботом. Если ключ потерян, напишите в поддержку.",
      empty: "На этом аккаунте пока нет продуктов. Ключ придёт в чат с ботом сразу после оплаты.", buy: "Купить", haveKey: "Уже есть ключ", keyLabel: "Ключ лицензии", add: "Добавить", badKey: "Такой ключ не подходит. Если он точно верный, напишите в поддержку.",
      nameLabel: "Имя в плагине", nameNote: "Плагин покажет новое имя при следующем обновлении лицензии.", save: "Сохранить", cancel: "Отмена", saveFailed: "Не удалось сохранить.",
      questions: "Вопросы по покупке, ключу или активации", write: "Написать в поддержку", bug: "Что-то работает неправильно", bugText: "Бот попросит описание в чате. Туда же можно приложить скриншот, видео или аудио.", report: "Сообщить об ошибке", reportFailed: "Сначала нажмите Start в чате с ботом.",
      st_awaiting: "Ожидает подписи", st_signed: "Подписан", st_revoked: "Отозван", st_cancelled: "Отменён", currency: "грн",
      contractsEmpty: "Договоров пока нет.", contractNo: "Договор №", beat: "Бит", dateLabel: "Дата", amount: "Сумма", statusLabel: "Статус", licensee: "Лицензиат",
      sendPdf: "Прислать PDF в чат", pdfSent: "PDF отправлен в чат с ботом.", pdfFailed: "Не удалось отправить. Сначала нажмите Start в чате с ботом.", signAction: "Подписать",
      readFirst: "Договор пришёл в чат с ботом: прочитайте его перед подписью.", yourSignature: "Ваша подпись", clear: "Очистить", agree: "Я прочитал(а) договор № {n} и подписываю его",
      signedDone: "Подписано. Подписанный экземпляр отправлен в чат.", alreadySigned: "Этот договор уже подписан.", notSignable: "Этот договор уже нельзя подписать.",
      notFound: "Договор не найден. Возможно, ссылка открыта с другого аккаунта Telegram.", rateLimited: "Слишком много попыток. Подождите немного и повторите.", needSignature: "Поставьте подпись в поле.", needAgree: "Отметьте, что прочитал(а) договор.",
      netFailed: "Не получилось. Проверьте сеть и повторите.", toContracts: "К договорам",
      badLink: "Ссылка на договор неверная", serverDown: "Сервер не ответил, попробуйте позже", sigTooLong: "Подпись слишком длинная: очистите и нарисуйте короче",
    },
    en: {
      products: "Products", contracts: "Contracts", support: "Support", panel: "Panel", loading: "Loading…", failed: "Could not load. Close your account and open it again.", onlyTelegram: "Your account opens from the bot in Telegram.",
      active: "License active, for life", revoked: "License revoked", licensedTo: "Licensed to", change: "Change", computers: "Computers", none: "Not activated", since: "Purchased", installer: "Installer and manual",
      installNote: "If the system blocks the installer. macOS: System Settings > Privacy & Security > Open Anyway. Windows: in the SmartScreen window, More info > Run anyway.",
      keyNote: "The key is shown only once, in your purchase message in the chat with the bot. Lost it? Write to support.",
      empty: "There are no products on this account yet. The key arrives in the chat with the bot right after payment.", buy: "Buy", haveKey: "Already have a key", keyLabel: "License key", add: "Add", badKey: "That key does not fit. If you are sure it is right, write to support.",
      nameLabel: "Name in the plug-in", nameNote: "The plug-in shows the new name at its next license refresh.", save: "Save", cancel: "Cancel", saveFailed: "Could not save.",
      questions: "Questions about a purchase, key or activation", write: "Write to support", bug: "Something not working right", bugText: "The bot asks for a description in the chat. Attach a screenshot, video or audio there too.", report: "Report a bug", reportFailed: "Press Start in the chat with the bot first.",
      st_awaiting: "Awaiting signature", st_signed: "Signed", st_revoked: "Revoked", st_cancelled: "Cancelled", currency: "UAH",
      contractsEmpty: "No contracts yet.", contractNo: "Contract No.", beat: "Beat", dateLabel: "Date", amount: "Amount", statusLabel: "Status", licensee: "Licensee",
      sendPdf: "Send the PDF to the chat", pdfSent: "The PDF is sent to the chat with the bot.", pdfFailed: "Could not send. Press Start in the chat with the bot first.", signAction: "Sign",
      readFirst: "The contract arrived in the chat with the bot: read it before signing.", yourSignature: "Your signature", clear: "Clear", agree: "I have read contract No. {n} and sign it",
      signedDone: "Signed. The signed copy is sent to the chat.", alreadySigned: "This contract is already signed.", notSignable: "This contract can no longer be signed.",
      notFound: "Contract not found. The link may be opened from another Telegram account.", rateLimited: "Too many attempts. Wait a moment and try again.", needSignature: "Draw your signature in the box.", needAgree: "Tick that you have read the contract.",
      netFailed: "It did not work. Check the network and try again.", toContracts: "Contracts",
      badLink: "The contract link is invalid", serverDown: "The server did not respond, try again later", sigTooLong: "The signature is too long: clear it and draw a shorter one",
    },
  };
  function t(key) { return TEXT[state.lang][key]; }

  function h(tag, props) {
    var el = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === "text") el.textContent = props[k];
      else if (k === "onclick") el.addEventListener("click", props[k]);
      else if (k === "className") el.className = props[k];
      else el.setAttribute(k, props[k]);
    });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) el.appendChild(arguments[i]);
    return el;
  }
  // Once the launch data has expired nothing may replace the expired screen.
  function show() { if (!state.expired) draw(Array.prototype.slice.call(arguments)); }
  function draw(nodes) {
    view.textContent = "";
    for (var i = 0; i < nodes.length; i++) if (nodes[i]) view.appendChild(nodes[i]);
    window.scrollTo(0, 0);
    // A signature pad on screen: a vertical swipe would close the app instead of drawing.
    var padShown = !!view.querySelector(".pad");
    if (padShown !== swipesLocked) {
      swipesLocked = padShown;
      if (padShown && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
      else if (!padShown && tg.enableVerticalSwipes) tg.enableVerticalSwipes();
    }
  }
  function button(text, onclick, className) { return h("button", { type: "button", className: "button " + (className || ""), text: text, onclick: onclick }); }
  function row(name, value) { return h("div", { className: "row" }, h("span", { text: name }), typeof value === "string" ? h("span", { text: value }) : value); }
  function date(seconds) { return new Date(seconds * 1000).toLocaleDateString(state.lang === "ru" ? "ru-RU" : "en-GB", { year: "numeric", month: "short", day: "numeric" }); }
  function haptic(kind) { if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred(kind); }

  // Launch data is valid for an hour and Telegram does not renew it while the app is open: a 401 asks to reopen it.
  // A request that hangs for 20 s is aborted and reaches the callers as a network error.
  function api(method, path, body) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, 20000);
    return fetch(API + path, {
      method: method,
      headers: { authorization: "tma " + tg.initData, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    }).then(function (response) {
      if (response.status === 401) {
        // The owner's changes need a session under 15 minutes old: that is not a dead session, the screen and the draft stay.
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (data.error === "auth_expired") { var error = new Error("auth_expired"); error.code = "auth_expired"; error.status = 401; throw error; }
          renderExpired();
          throw new Error("expired");
        });
      }
      return response.json().then(function (data) {
        if (!response.ok) { var error = new Error(data.error || "error"); error.code = data.error; error.field = data.field; error.status = response.status; throw error; }
        return data;
      });
    }).then(function (data) { clearTimeout(timer); return data; }, function (e) { clearTimeout(timer); throw e; });
  }

  function renderExpired() {
    state.expired = true;
    setBack(null);
    draw([h("p", { text: state.lang === "ru" ? "Сессия устарела. Закройте приложение и откройте его снова." : "This session has expired. Close the app and open it again." }),
      button(state.lang === "ru" ? "Закрыть" : "Close", function () { tg.close(); })]);
  }

  function authExpiredNote() {
    return h("div", null, h("p", { className: "error", text: "Сессия устарела для изменений: закройте и снова откройте приложение" }),
      tg.close ? button("Закрыть", function () { tg.close(); }) : h("span"));
  }

  function open(url) {
    if (!/^https:\/\//i.test(url || "")) return;
    if (url.indexOf("https://t.me/") === 0) tg.openTelegramLink(url); else tg.openLink(url);
  }
  function supportUrl() { return "https://t.me/" + encodeURIComponent(state.me.support.replace(/^@/, "")); }

  // Back: the header's own button in Telegram, for screens opened from a list.
  function setBack(fn) {
    if (state.back) tg.BackButton.offClick(state.back);
    state.back = fn;
    if (fn) { tg.BackButton.onClick(fn); tg.BackButton.show(); } else tg.BackButton.hide();
  }

  // -------------------------------------------------------------------------
  // Products

  function renderProducts() {
    setBack(null);
    var me = state.me;
    if (!me.licenses.length) return renderEmpty();
    var parts = [];
    me.licenses.forEach(function (l, i) {
      var machines = l.machines.length ? l.machines.map(function (m) { return m.label || "?"; }).join(", ") + " (" + l.machines.length + "/" + l.max_machines + ")" : t("none") + " (0/" + l.max_machines + ")";
      var name = h("button", { type: "button", className: "link", text: l.customer_name, onclick: function () { renderName(l); } });
      if (i) parts.push(h("div", { style: "height:32px" }));
      parts.push(h("div", { className: "well" },
        h("div", { className: "product-name", text: l.product_name }),
        h("div", { className: "status" + (l.status === "active" ? "" : " revoked"), text: t(l.status === "active" ? "active" : "revoked") })));
      parts.push(row(t("licensedTo"), name));
      parts.push(row(t("computers"), machines));
      parts.push(row(t("since"), date(l.created_at)));
      if (l.download) {
        parts.push(button(t("installer"), function () { open(l.download); }));
        parts.push(h("p", { className: "note", text: t("installNote") }));
      }
    });
    parts.push(h("p", { className: "note", text: t("keyNote") }));
    show.apply(null, parts);
  }

  function renderEmpty() {
    var input = h("input", { placeholder: "XXXX-XXXX-XXXX-XXXX", autocapitalize: "characters", autocomplete: "off", spellcheck: "false", id: "key" });
    var error = h("p", { className: "error" }); error.hidden = true;
    var add = button(t("add"), function () {
      add.disabled = true; error.hidden = true;
      api("POST", "/app/claim", { key: input.value }).then(function () { haptic("success"); return load(); }).catch(function () {
        haptic("error"); error.textContent = t("badKey"); error.hidden = false; add.disabled = false;
      });
    });
    var buys = state.me.buy.map(function (b) { return button(t("buy") + ": " + b.name, function () { open(b.url); }, "primary"); });
    show.apply(null, [h("p", { text: t("empty") })].concat(buys, [
      h("h2", { text: t("haveKey") }), h("label", { for: "key", text: t("keyLabel") }), input, add, error,
    ]));
  }

  function renderName(l) {
    setBack(function () { renderProducts(); });
    var input = h("input", { id: "name", maxlength: "80", value: l.customer_name, autocomplete: "off" });
    var error = h("p", { className: "error", text: t("saveFailed") }); error.hidden = true;
    var save = button(t("save"), function () {
      save.disabled = true; error.hidden = true;
      api("POST", "/app/licenses/" + l.id + "/name", { name: input.value }).then(function () { haptic("success"); return load(); }).catch(function () {
        haptic("error"); error.hidden = false; save.disabled = false;
      });
    }, "primary");
    show(h("h2", { text: l.product_name }), h("label", { for: "name", text: t("nameLabel") }), input, h("p", { className: "note", text: t("nameNote") }), save, error);
  }

  // -------------------------------------------------------------------------
  // Support

  function renderSupport() {
    setBack(null);
    var error = h("p", { className: "error", text: t("reportFailed") }); error.hidden = true;
    var report = button(t("report"), function () {
      report.disabled = true; error.hidden = true;
      api("POST", "/app/report").then(function (r) {
        if (r.sent) { tg.close(); return; }
        error.hidden = false; report.disabled = false;
      }).catch(function () { error.hidden = false; report.disabled = false; });
    });
    show(h("h2", { text: t("questions") }), button(t("write"), function () { open(supportUrl()); }),
      h("h2", { text: t("bug") }), h("p", { className: "dim", text: t("bugText") }), report);
  }

  // -------------------------------------------------------------------------
  // Signature pad: dark blue ink on a paper-light box. Points are stored as fractions of the box's width
  // (x = px / width, y = py / width, y down), the format the Worker draws into the PDF.

  function signaturePad(clearText, tooLongText) {
    var canvas = h("canvas", { className: "pad-canvas" });
    var ctx = canvas.getContext("2d");
    var strokes = [], current = null, count = 0, width = 0, over = false;
    var hint = h("p", { className: "error", text: tooLongText }); hint.hidden = true;
    function reset() { strokes = []; current = null; count = 0; over = false; hint.hidden = true; redraw(); }
    // The limits are 60 strokes and 4000 points; past them the pad stops drawing and says so.
    function overflow() { over = true; hint.hidden = false; }
    var el = h("div", null, h("div", { className: "pad" }, canvas, h("div", { className: "pad-line" })), hint,
      h("div", { className: "pad-tools" }, h("button", { type: "button", className: "link small", text: clearText, onclick: reset })));
    function ink() { ctx.strokeStyle = ctx.fillStyle = "#14246b"; ctx.lineWidth = 2.2; ctx.lineCap = ctx.lineJoin = "round"; }
    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ink();
      strokes.forEach(function (s) {
        ctx.beginPath();
        if (s.length === 1) { ctx.arc(s[0][0] * width, s[0][1] * width, 1.1, 0, 6.2832); ctx.fill(); return; }
        ctx.moveTo(s[0][0] * width, s[0][1] * width);
        for (var i = 1; i < s.length; i++) ctx.lineTo(s[i][0] * width, s[i][1] * width);
        ctx.stroke();
      });
    }
    function size() {
      var w = canvas.clientWidth;
      if (!w || w === width) return;
      var dpr = window.devicePixelRatio || 1;
      width = w; canvas.width = Math.round(w * dpr); canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    }
    function at(e) {
      var r = canvas.getBoundingClientRect();
      return [Math.round((e.clientX - r.left) / r.width * 10000) / 10000, Math.round((e.clientY - r.top) / r.width * 10000) / 10000];
    }
    canvas.addEventListener("pointerdown", function (e) {
      e.preventDefault(); size();
      if (strokes.length >= 60 || count >= 4000) { overflow(); return; }
      try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* the stroke still draws */ }
      current = [at(e)]; strokes.push(current); count++;
      ink(); ctx.beginPath(); ctx.arc(current[0][0] * width, current[0][1] * width, 1.1, 0, 6.2832); ctx.fill();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!current) return;
      if (count >= 4000) { overflow(); return; }
      var p = at(e), last = current[current.length - 1];
      if (Math.sqrt(Math.pow((p[0] - last[0]) * width, 2) + Math.pow((p[1] - last[1]) * width, 2)) < 1.5) return;
      current.push(p); count++;
      ink(); ctx.beginPath(); ctx.moveTo(last[0] * width, last[1] * width); ctx.lineTo(p[0] * width, p[1] * width); ctx.stroke();
    });
    function end() { current = null; }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    window.addEventListener("resize", size);
    setTimeout(size, 0);
    setTimeout(size, 300);
    return {
      el: el,
      strokes: function () { return strokes.map(function (s) { return s.slice(); }); },
      clear: reset,
      isEmpty: function () { return strokes.length === 0 || count < 8; },
      tooLong: function () { return over; },
    };
  }

  function debounce(fn, ms) { var timer; return function () { clearTimeout(timer); timer = setTimeout(fn, ms); }; }
  function dmy(iso) { return String(iso).split("-").reverse().join("."); }
  function money(c) { return c.amount + " " + (c.currency === "UAH" ? t("currency") : c.currency); }

  // -------------------------------------------------------------------------
  // Contracts for the customer: the list, a card, and the signing screen (opened from the bot's link too).

  function renderContracts() {
    setBack(null);
    show(h("p", { className: "dim", text: t("loading") }));
    api("GET", "/app/contracts").then(function (r) {
      state.contracts = r.contracts;
      if (!r.contracts.length) { show(h("p", { className: "dim", text: t("contractsEmpty") })); return; }
      var parts = r.contracts.map(function (c) {
        return h("button", { type: "button", className: "list-item", onclick: function () { openContract(c.id, false); } },
          document.createTextNode(t("contractNo") + " " + c.number + " · " + c.beat_name),
          h("span", { className: c.status === "signed" || c.status === "awaiting" ? "" : "revoked", text: dmy(c.contract_date) + " · " + money(c) + " · " + t("st_" + c.status) }));
      });
      show.apply(null, parts);
    }).catch(function () { show(h("p", { className: "error", text: t("failed") })); });
  }

  function contractError(e) {
    if (e.status === 404) return t("notFound");
    if (e.code === "rate_limited") return t("rateLimited");
    if (e.code === "already_signed") return t("alreadySigned");
    if (e.code === "not_signable") return t("notSignable");
    if (e.field === "signature") return t("sigTooLong");
    if (e.status === 400) return t("badLink");
    if (e.status >= 500) return t("serverDown");
    return t("netFailed");
  }

  function openContract(id, direct) {
    setBack(direct ? null : renderContracts);
    show(h("p", { className: "dim", text: t("loading") }));
    api("GET", "/app/contracts/" + id).then(function (c) {
      if (direct && c.status === "awaiting") renderSign(c); else renderClientCard(c);
    }).catch(function (e) {
      if (e.message === "expired") return;
      setBack(direct ? null : renderContracts);
      show(h("p", { className: "error", text: contractError(e) }), button(t("toContracts"), renderContracts));
    });
  }

  function renderClientCard(c) {
    setBack(renderContracts);
    var note = h("p", { className: "note" });
    var send = button(t("sendPdf"), function () {
      send.disabled = true; note.className = "note"; note.textContent = "";
      api("POST", "/app/contracts/" + c.id + "/send").then(function () { note.textContent = t("pdfSent"); send.disabled = false; })
        .catch(function () { note.className = "error"; note.textContent = t("pdfFailed"); send.disabled = false; });
    });
    show(h("div", { className: "well" }, h("div", { className: "product-name", text: t("contractNo") + " " + c.number }),
        h("div", { className: "status" + (c.status === "signed" || c.status === "awaiting" ? "" : " revoked"), text: t("st_" + c.status) })),
      row(t("beat"), c.beat_name), row(t("dateLabel"), dmy(c.contract_date)), row(t("amount"), money(c)),
      row(t("licensee"), state.lang === "ru" && c.licensee_ru ? c.licensee_ru : c.licensee),
      c.status === "awaiting" ? button(t("signAction"), function () { renderSign(c); }, "primary") : null, send, note);
  }

  function renderSign(c) {
    setBack(function () { renderClientCard(c); });
    var pad = signaturePad(t("clear"), t("sigTooLong"));
    var box = h("input", { type: "checkbox", id: "agree" });
    var error = h("p", { className: "error" }); error.hidden = true;
    function fail(text) { haptic("error"); error.textContent = text; error.hidden = false; sign.disabled = false; }
    var sign = button(t("signAction"), function () {
      error.hidden = true;
      if (pad.isEmpty()) { fail(t("needSignature")); return; }
      if (pad.tooLong()) { fail(t("sigTooLong")); return; }
      if (!box.checked) { fail(t("needAgree")); return; }
      sign.disabled = true;
      api("POST", "/app/contracts/" + c.id + "/sign", { agree: true, signature: pad.strokes() }).then(function () {
        haptic("success"); c.status = "signed"; setBack(renderContracts);
        show(h("p", { text: t("signedDone") }), button(t("toContracts"), renderContracts));
      }).catch(function (e) {
        if (e.message === "expired") return;
        if (e.code === "already_signed") { c.status = "signed"; setBack(renderContracts); show(h("p", { text: t("alreadySigned") }), button(t("toContracts"), renderContracts)); return; }
        fail(contractError(e));
      });
    }, "primary");
    show(h("h2", { text: t("contractNo") + " " + c.number }), row(t("beat"), c.beat_name), row(t("amount"), money(c)),
      row(t("licensee"), state.lang === "ru" && c.licensee_ru ? c.licensee_ru : c.licensee),
      h("p", { className: "note", text: t("readFirst") }),
      h("h2", { text: t("yourSignature") }), pad.el,
      h("label", { className: "check", for: "agree" }, box, h("span", { text: t("agree").replace("{n}", c.number) })),
      sign, error);
  }

  // -------------------------------------------------------------------------
  // The owner's panel: Russian only, the owner's own tool. The Worker checks the owner on every call.

  function renderPanel() {
    setBack(null);
    clearDraft(); // the contract draft lives only while the form is open
    var email = h("input", { id: "email", type: "email", placeholder: "buyer@example.com", autocapitalize: "none", autocomplete: "off" });
    var name = h("input", { id: "owner-name", placeholder: "Иван Петров", autocomplete: "off" });
    var result = h("div");
    var create = button("Создать лицензию", function () {
      create.disabled = true; result.textContent = "";
      api("POST", "/app/admin/licenses", { email: email.value, name: name.value }).then(function (r) {
        haptic("success"); email.value = ""; name.value = ""; create.disabled = false;
        result.appendChild(keyBlock(r.key, r.email));
      }).catch(function (e) {
        haptic("error"); create.disabled = false;
        if (e.code === "auth_expired") { result.appendChild(authExpiredNote()); return; }
        result.appendChild(h("p", { className: "error", text: "Не создана: проверь почту." }));
      });
    }, "primary");

    var query = h("input", { id: "query", placeholder: "Почта, имя или id", autocomplete: "off" });
    var found = h("div");
    var search = button("Найти", function () { find(query.value, found); });

    var orders = h("div", null, h("p", { className: "dim small", text: "Загрузка…" }));
    show(contractsSection(), h("h2", { text: "Новая лицензия" }), h("label", { for: "email", text: "Почта" }), email, h("label", { for: "owner-name", text: "Имя, необязательно" }), name, create, result,
      h("h2", { text: "Найти лицензию" }), query, search, found,
      h("h2", { text: "Заказы без ключа" }), orders);
    loadOrders(orders);
  }

  // Copying can be refused (no permission, no clipboard API): the text is selected for a manual copy instead.
  function copyText(text, node, e, done) {
    var btn = e.target;
    function manual() {
      btn.textContent = "Скопируй вручную";
      var range = document.createRange(), sel = window.getSelection();
      range.selectNodeContents(node); sel.removeAllRanges(); sel.addRange(range);
    }
    if (!navigator.clipboard) { manual(); return; }
    navigator.clipboard.writeText(text).then(function () { btn.textContent = done; }).catch(manual);
  }

  function keyBlock(key, email) {
    var copied = h("p", { className: "note", text: "Показан один раз. Лицензия на " + email + "; отправь ключ покупателю сам." });
    var code = h("code", { className: "key", text: key });
    return h("div", { className: "well", style: "margin-top:12px" }, h("span", { className: "engraved", text: "Ключ" }), code,
      button("Скопировать", function (e) { copyText(key, code, e, "Скопирован"); }), copied);
  }

  var findSeq = 0;
  function find(q, into) {
    var mine = ++findSeq;
    into.textContent = "";
    api("GET", "/app/admin/licenses?q=" + encodeURIComponent(q)).then(function (r) {
      if (mine !== findSeq) return;
      if (!r.licenses.length) { into.appendChild(h("p", { className: "dim small", style: "margin-top:12px", text: "Ничего не найдено." })); return; }
      r.licenses.forEach(function (l) {
        into.appendChild(h("button", { type: "button", className: "list-item", onclick: function () { renderCard(l.id); } },
          document.createTextNode(l.customer_name),
          h("span", { className: l.status === "active" ? "" : "revoked", text: (l.email || "без почты") + (l.status === "active" ? "" : ", отозвана") })));
      });
    }).catch(function () { if (mine === findSeq) into.appendChild(h("p", { className: "error", text: "Поиск не сработал." })); });
  }

  function renderCard(id) {
    setBack(renderPanel);
    api("GET", "/app/admin/licenses?q=" + encodeURIComponent(id)).then(function (r) {
      var l = r.licenses[0];
      if (!l) { show(h("p", { text: "Лицензия не найдена." })); return; }
      var out = h("div");
      function act(action, done) {
        return api("POST", "/app/admin/licenses/" + id + "/" + action).then(function () { haptic("success"); done && done(); renderCard(id); }).catch(function (e) {
          haptic("error");
          if (e.code === "auth_expired") { out.textContent = ""; out.appendChild(authExpiredNote()); }
        });
      }
      var revoke = l.status === "active"
        ? button("Отозвать", function () { tg.showConfirm("Отозвать лицензию? Новая активация сразу перестанет работать, установленный плагин отключится при следующем обновлении токена.", function (yes) { if (yes) act("revoke"); }); }, "danger")
        : button("Вернуть", function () { act("unrevoke"); });
      show(h("div", { className: "well" }, h("div", { className: "product-name", text: l.product }),
          h("div", { className: "status" + (l.status === "active" ? "" : " revoked"), text: l.status === "active" ? "Активна" : "Отозвана" })),
        row("Имя", l.customer_name), row("Почта", l.email || "нет"), row("Компьютеры", l.activations + "/" + l.max_machines), row("Создана", date(l.created_at)),
        h("p", { className: "mono", style: "margin-top:12px", text: l.id }),
        button("Отвязать компьютеры", function () { act("reset"); }), revoke, out);
    }).catch(function () { show(h("p", { className: "error", text: "Не удалось открыть." })); });
  }

  function loadOrders(into) {
    api("GET", "/app/admin/orders").then(function (r) {
      into.textContent = "";
      if (!r.orders.length) { into.appendChild(h("p", { className: "dim small", text: "Все оплаченные ключи выданы." })); return; }
      r.orders.forEach(function (o) {
        var who = o.telegram_username ? "@" + o.telegram_username : o.telegram_id ? "ID " + o.telegram_id : "без Telegram ID";
        var line = h("div", { className: "row" }, h("span", { text: o.purchase_id + ", " + date(o.created_at) }), h("span", { text: who }));
        into.appendChild(line);
        if (!o.telegram_id) {
          var input = h("input", { inputmode: "numeric", placeholder: "Telegram ID покупателя", style: "margin-top:12px" });
          into.appendChild(input);
          into.appendChild(button("Назначить покупателя", function () {
            api("POST", "/app/admin/orders/" + o.purchase_id + "/assign", { telegram_id: Number(input.value) }).then(function () { haptic("success"); loadOrders(into); }).catch(function (e) {
              haptic("error");
              if (e.code === "auth_expired") into.appendChild(authExpiredNote());
            });
          }));
        }
      });
    }).catch(function () { into.textContent = ""; into.appendChild(h("p", { className: "error", text: "Заказы не загрузились." })); });
  }

  // -------------------------------------------------------------------------
  // The owner's contracts (Russian only): list, card with actions, the form.

  var STATUS_RU = { awaiting: "Ожидает подписи", signed: "Подписан", revoked: "Отозван", cancelled: "Отменён" };
  var FIELD_LABELS = {
    date: "Дата", beat_name: "Название бита", beat_link: "Ссылка на оригинал", artist_name: "Имя артиста", client_name_ru: "ФИО клиента (рус.)", client_name_ua: "ФИО клиента (укр.)",
    citizenship: "Гражданство укр.", citizenship_ru: "Гражданство рус.", client_inn: "РНОКПП / ИНН", client_address_ua: "Адрес (укр.)", client_address_ru: "Адрес (рус.)",
    client_email: "Email", client_telegram: "Telegram клиента", amount_num: "Сумма", signature: "Подпись", template: "Тип договора", beat_message_id: "Бит из канала",
  };
  // [key, label, input type, only for the UA + RU template]
  var FORM_FIELDS = [
    ["date", "Дата", "date"], ["beat_name", "Название бита"], ["beat_link", "Ссылка на оригинал (необязательно)"], ["artist_name", "Имя артиста"],
    ["client_name_ru", "ФИО клиента (рус.)", "", true], ["client_name_ua", "ФИО клиента (укр.)"],
    ["citizenship", "Гражданство укр. (напр. «України»)", "", true], ["citizenship_ru", "Гражданство рус. (напр. «Украины»)", "", true],
    ["client_inn", "РНОКПП / ИНН"], ["client_address_ua", "Адрес (укр.)"], ["client_address_ru", "Адрес (рус.)", "", true],
    ["client_email", "Email", "email"], ["client_telegram", "Telegram клиента"], ["amount_num", "Сумма, грн", "numeric"],
  ];

  function kyivToday() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }

  function copyButton(text, node) {
    return button("Скопировать ссылку", function (e) { copyText(text, node, e, "Скопирована"); });
  }
  function shareButton(link) {
    return button("Отправить клиенту", function () { tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(link)); });
  }
  function linkBlock(link) {
    var shown = h("p", { className: "mono", text: link });
    return h("div", { style: "margin-top:12px" }, shown, copyButton(link, shown), shareButton(link));
  }

  function contractsSection() {
    var found = h("div");
    var query = h("input", { placeholder: "Номер, бит, клиент или код", autocomplete: "off" });
    var seq = 0;
    function load() {
      var mine = ++seq;
      api("GET", "/app/admin/contracts?q=" + encodeURIComponent(query.value)).then(function (r) {
        if (mine !== seq) return;
        found.textContent = "";
        if (!r.contracts.length) { found.appendChild(h("p", { className: "dim small", style: "margin-top:12px", text: "Договоров нет." })); return; }
        r.contracts.forEach(function (c) {
          found.appendChild(h("button", { type: "button", className: "list-item", onclick: function () { adminContractCard(c.id); } },
            document.createTextNode(c.number + " · " + c.beat_name),
            h("span", { className: c.status === "signed" || c.status === "awaiting" ? "" : "revoked",
              text: c.licensee_short + (c.client_username ? " @" + c.client_username : "") + " · " + c.amount + " грн · " + STATUS_RU[c.status] })));
        });
      }).catch(function () { if (mine !== seq) return; found.textContent = ""; found.appendChild(h("p", { className: "error", text: "Договоры не загрузились." })); });
    }
    query.addEventListener("input", debounce(load, 300));
    load();
    return h("div", null, h("h2", { text: "Договоры" }), button("Новый договор", function () { renderContractForm(); }, "primary"),
      h("div", { style: "height:12px" }), query, found);
  }

  function adminContractCard(id) {
    setBack(renderPanel);
    api("GET", "/app/admin/contracts?q=" + encodeURIComponent(id)).then(function (r) {
      var c = r.contracts.filter(function (x) { return x.id === id; })[0];
      if (!c) { show(h("p", { text: "Договор не найден." })); return; }
      var out = h("div");
      function say(text, bad, e) {
        out.textContent = "";
        out.appendChild(e && e.code === "auth_expired" ? authExpiredNote() : h("p", { className: bad ? "error" : "note", text: text }));
      }
      function post(action, body) { return api("POST", "/app/admin/contracts/" + id + "/" + action, body); }
      var parts = [
        h("div", { className: "well" }, h("div", { className: "product-name", text: "№ " + c.number }),
          h("div", { className: "status" + (c.status === "signed" || c.status === "awaiting" ? "" : " revoked"), text: STATUS_RU[c.status] })),
        row("Бит", c.beat_name), row("Дата", dmy(c.contract_date)), row("Клиент", c.licensee_short + (c.client_username ? " @" + c.client_username : "")),
        row("Сумма", c.amount + " грн"), row("Создан", date(c.created_at)),
      ];
      if (c.client_signed_at) parts.push(row("Подписал клиент", date(c.client_signed_at)));
      if (c.revoked_at) parts.push(row(c.status === "cancelled" ? "Отменён" : "Отозван", date(c.revoked_at) + (c.revoke_reason ? ", " + c.revoke_reason : "")));
      parts.push(h("p", { className: "mono", style: "margin-top:12px", text: c.id }));
      parts.push(button("Прислать PDF в чат", function () {
        post("send").then(function () { haptic("success"); say("PDF отправлен в чат."); }).catch(function (e) { haptic("error"); say("Не отправлен.", true, e); });
      }));
      if (c.status === "awaiting") {
        function newLink() {
          post("link").then(function (l) { haptic("success"); out.textContent = ""; out.appendChild(linkBlock(l.link)); })
            .catch(function (e) { haptic("error"); say("Ссылку не создать.", true, e); });
        }
        parts.push(button("Новая ссылка", function () {
          if (!c.client_telegram_id) { newLink(); return; }
          tg.showConfirm("Ссылка сменится, текущий клиент отвяжется.", function (yes) { if (yes) newLink(); });
        }));
      }
      if (c.status === "awaiting") {
        parts.push(button("Отменить", function () {
          tg.showConfirm("Отменить неподписанный договор? Он останется в реестре как отменённый.", function (yes) {
            if (yes) post("cancel").then(function () { haptic("success"); adminContractCard(id); }).catch(function (e) { haptic("error"); say("Не отменён.", true, e); });
          });
        }, "danger"));
      }
      if (c.status === "awaiting" || c.status === "signed") {
        var reason = h("input", { placeholder: "Причина отзыва", maxlength: "200", autocomplete: "off", style: "margin-top:12px" });
        parts.push(reason);
        parts.push(button("Отозвать", function () {
          tg.showConfirm("Отозвать договор? Клиент получит уведомление, на странице проверки он станет отозванным.", function (yes) {
            if (yes) post("revoke", { reason: reason.value }).then(function () { haptic("success"); adminContractCard(id); }).catch(function (e) { haptic("error"); say("Не отозван.", true, e); });
          });
        }, "danger"));
      }
      parts.push(out);
      show.apply(null, parts);
    }).catch(function () { show(h("p", { className: "error", text: "Не удалось открыть." })); });
  }

  function clearDraft() { try { sessionStorage.removeItem("contractDraft"); } catch (e) { /* nothing to clear */ } }

  // One id per rendered form: a retry after a lost answer sends the same id, so the Worker returns the contract it already made.
  function newRequestId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var x = Array.prototype.map.call(b, function (v) { return ("0" + v.toString(16)).slice(-2); }).join("");
    return x.slice(0, 8) + "-" + x.slice(8, 12) + "-" + x.slice(12, 16) + "-" + x.slice(16, 20) + "-" + x.slice(20);
  }

  function renderContractForm() {
    setBack(renderPanel);
    var requestId = newRequestId();
    var draft = {};
    try { draft = JSON.parse(sessionStorage.getItem("contractDraft") || "{}") || {}; } catch (e) { draft = {}; }
    var template = draft.template === "L-RU" ? "L-RU" : "L-UA";
    var beatId = typeof draft.beat_message_id === "number" ? draft.beat_message_id : null;
    var inputs = {}, wraps = [];

    function saveDraft() {
      var d = { template: template, beat_message_id: beatId };
      FORM_FIELDS.forEach(function (f) { d[f[0]] = inputs[f[0]].value; });
      try { sessionStorage.setItem("contractDraft", JSON.stringify(d)); } catch (e) { /* the draft is a convenience */ }
    }

    var tUA = button("UA", function () { setTemplate("L-UA"); });
    var tRU = button("UA + RU", function () { setTemplate("L-RU"); });
    function setTemplate(name) {
      template = name;
      tUA.classList.toggle("primary", name === "L-UA"); tRU.classList.toggle("primary", name === "L-RU");
      wraps.forEach(function (w) { w.hidden = name !== "L-RU"; });
      saveDraft();
    }

    var beatQuery = h("input", { placeholder: "Поиск по названию", autocomplete: "off", id: "cf-beat-search" });
    var beatList = h("div");
    var beatSeq = 0;
    function searchBeats() {
      var mine = ++beatSeq;
      api("GET", "/app/admin/beats?q=" + encodeURIComponent(beatQuery.value)).then(function (r) {
        if (mine !== beatSeq) return;
        beatList.textContent = "";
        r.beats.forEach(function (b) {
          var meta = [b.bpm ? b.bpm + " BPM" : "", b.musical_key || ""].filter(Boolean).join(" ");
          beatList.appendChild(h("button", { type: "button", className: "list-item", onclick: function () {
            inputs.beat_name.value = b.name; beatId = b.message_id; beatList.textContent = "";
            beatList.appendChild(h("p", { className: "note", text: "Выбран бит из канала: " + b.name }));
            saveDraft();
          } }, document.createTextNode(b.name + (meta ? " · " + meta : ""))));
        });
      }).catch(function () { if (mine !== beatSeq) return; beatList.textContent = ""; beatList.appendChild(h("p", { className: "error", text: "Поиск не сработал." })); });
    }
    beatQuery.addEventListener("input", debounce(searchBeats, 300));

    var parts = [h("h2", { text: "Новый договор" }), h("div", { className: "buttons" }, tUA, tRU), h("label", { for: "cf-beat-search", text: "Бит из канала" }), beatQuery, beatList];
    FORM_FIELDS.forEach(function (f) {
      var input = h("input", { id: "cf-" + f[0], type: f[2] === "date" ? "date" : f[2] === "email" ? "email" : "text", autocomplete: "off", autocapitalize: "none" });
      if (f[2] === "numeric") input.setAttribute("inputmode", "numeric");
      if (f[2] === "date") input.max = kyivToday();
      input.value = typeof draft[f[0]] === "string" ? draft[f[0]] : f[0] === "date" ? kyivToday() : "";
      input.addEventListener("input", saveDraft);
      inputs[f[0]] = input;
      var wrap = h("div", null, h("label", { for: "cf-" + f[0], text: f[1] }), input);
      if (f[3]) wraps.push(wrap);
      parts.push(wrap);
    });
    inputs.beat_name.addEventListener("input", function () { beatId = null; saveDraft(); });

    var pad = signaturePad("Очистить", TEXT.ru.sigTooLong);
    var error = h("p", { className: "error" }); error.hidden = true;
    function fail(text) { haptic("error"); error.textContent = text; error.hidden = false; create.disabled = false; }
    var create = button("Создать и подписать", function () {
      error.hidden = true;
      if (pad.isEmpty()) { fail("Поставь подпись в поле."); return; }
      if (pad.tooLong()) { fail(TEXT.ru.sigTooLong); return; }
      var body = { template: template, signature: pad.strokes(), request_id: requestId };
      if (beatId !== null) body.beat_message_id = beatId;
      FORM_FIELDS.forEach(function (f) { body[f[0]] = inputs[f[0]].value.trim(); });
      body.amount_num = body.amount_num.replace(/\s/g, "");
      create.disabled = true;
      api("POST", "/app/admin/contracts", body).then(function (r) {
        haptic("success");
        clearDraft(); requestId = newRequestId();
        var linkArea = h("div");
        if (r.link) {
          linkArea.appendChild(h("p", { className: "dim small", style: "margin-top:12px", text: "Ссылка для подписи клиента, одноразовая:" }));
          linkArea.appendChild(linkBlock(r.link));
        } else {
          var again = h("div");
          again.appendChild(h("p", { className: "note", style: "margin-top:12px", text: "Договор уже был создан. Ссылка не сохраняется — создай новую." }));
          again.appendChild(button("Новая ссылка", function () {
            api("POST", "/app/admin/contracts/" + r.id + "/link").then(function (l) {
              haptic("success"); linkArea.textContent = "";
              linkArea.appendChild(h("p", { className: "dim small", style: "margin-top:12px", text: "Ссылка для подписи клиента, одноразовая:" }));
              linkArea.appendChild(linkBlock(l.link));
            }).catch(function (e2) {
              haptic("error");
              if (e2.message === "expired") return;
              again.appendChild(e2.code === "auth_expired" ? authExpiredNote() : h("p", { className: "error", text: "Ссылку не создать." }));
            });
          }));
          linkArea.appendChild(again);
        }
        show(h("h2", { text: "Договор создан" }), row("Номер", r.number), row("Код", r.id), linkArea, button("К договорам", renderPanel));
      }).catch(function (e) {
        if (e.message === "expired") return;
        if (e.code === "auth_expired") { haptic("error"); create.disabled = false; error.textContent = ""; error.appendChild(authExpiredNote()); error.hidden = false; return; }
        fail(e.code === "bad_request" && e.field === "signature" ? TEXT.ru.sigTooLong :
          e.code === "bad_request" ? "Проверь поле: " + (FIELD_LABELS[e.field] || e.field || "?") + "." : "Не создан. Проверь сеть и повтори.");
      });
    }, "primary");
    parts.push(h("h2", { text: "Твоя подпись" }), pad.el, create, error);
    show.apply(null, parts);
    setTemplate(template);
    if (beatId !== null) beatList.appendChild(h("p", { className: "note", text: "Выбран бит из канала, его ссылка подставится сама." }));
  }

  // -------------------------------------------------------------------------

  function renderTabs() {
    tabsEl.textContent = "";
    var tabs = ["products"];
    if (state.contracts.length || state.deepSeen) tabs.push("contracts");
    tabs.push("support");
    if (state.me && state.me.is_owner) tabs.push("panel");
    tabs.forEach(function (id) {
      tabsEl.appendChild(h("button", { type: "button", role: "tab", "aria-selected": String(state.tab === id), text: t(id), onclick: function () { if (state.expired) return; state.tab = id; render(); } }));
    });
    langButton.textContent = state.lang === "ru" ? "English" : "Русский";
    document.documentElement.lang = state.lang;
  }

  function render() {
    renderTabs();
    if (state.expired) { renderExpired(); return; }
    if (!state.me) return;
    clearDraft();
    if (state.tab === "contracts") renderContracts();
    else if (state.tab === "support") renderSupport();
    else if (state.tab === "panel") renderPanel();
    else renderProducts();
  }

  function load() {
    return api("GET", "/app/me").then(function (me) {
      state.me = me;
      state.lang = /^(ru|uk|be)/.test(me.language || "") ? "ru" : "en";
      return api("GET", "/app/contracts").then(function (r) { state.contracts = r.contracts; }, function () { state.contracts = []; });
    }).then(function () {
      if (state.deepInvalid) {
        state.deepInvalid = false; state.tab = "contracts"; renderTabs();
        show(h("p", { className: "error", text: t("badLink") }), button(t("toContracts"), renderContracts));
        return;
      }
      if (!state.deepLink) { render(); return; }
      var id = state.deepLink; state.deepLink = null; state.tab = "contracts";
      renderTabs(); show(h("p", { className: "dim", text: t("loading") }));
      openContract(id, true);
    });
  }

  langButton.addEventListener("click", function () {
    state.lang = state.lang === "ru" ? "en" : "ru";
    render();
    api("POST", "/app/language", { language: state.lang }).catch(function () { haptic("error"); });
  });

  // Always the site's dark room, whatever Telegram's colour scheme (app.css).
  function applyTheme() {
    var ground = "#0d0c10";
    tg.setHeaderColor(ground);
    tg.setBackgroundColor(ground);
    if (tg.setBottomBarColor) tg.setBottomBarColor(ground);
  }

  if (!tg || !tg.initData) {
    tabsEl.hidden = true; langButton.hidden = true;
    var ru = /^(ru|uk|be)/.test(navigator.language || "");
    show(h("p", { text: TEXT[ru ? "ru" : "en"].onlyTelegram }));
    return;
  }
  state.lang = /^(ru|uk|be)/.test((tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code) || "") ? "ru" : "en";
  applyTheme();
  tg.onEvent("themeChanged", applyTheme);
  tg.ready();
  tg.expand();
  renderTabs();
  show(h("p", { className: "dim", text: t("loading") }));
  load().catch(function () { show(h("p", { className: "error", text: t("failed") })); });
})();
