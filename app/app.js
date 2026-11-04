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
  var state = { me: null, tab: "products", lang: "ru", back: null };

  var TEXT = {
    ru: {
      products: "Продукты", support: "Поддержка", panel: "Панель", loading: "Загрузка…", failed: "Не удалось загрузить. Закрой и открой кабинет ещё раз.", onlyTelegram: "Кабинет открывается из бота в Telegram.",
      active: "Лицензия активна, навсегда", revoked: "Лицензия отозвана", licensedTo: "Лицензия на имя", change: "Изменить", computers: "Компьютеры", none: "Не активирована", since: "Куплена", installer: "Установщик и руководство",
      installNote: "Если система блокирует установщик. macOS: Системные настройки > Конфиденциальность и безопасность > «Всё равно открыть». Windows: в окне SmartScreen «Подробнее» > «Выполнить в любом случае».",
      keyNote: "Ключ показывается один раз: он в сообщении с покупкой в чате с ботом. Потерял, напиши в поддержку.",
      empty: "На этом аккаунте пока нет продуктов. Ключ придёт в чат с ботом сразу после оплаты.", buy: "Купить", haveKey: "Уже есть ключ", keyLabel: "Ключ лицензии", add: "Добавить", badKey: "Такой ключ не подходит. Если он точно верный, напиши в поддержку.",
      nameLabel: "Имя в плагине", nameNote: "Плагин покажет новое имя при следующем обновлении лицензии.", save: "Сохранить", cancel: "Отмена", saveFailed: "Не удалось сохранить.",
      questions: "Вопросы по покупке, ключу или активации", write: "Написать в поддержку", bug: "Что-то работает неправильно", bugText: "Бот попросит описание в чате. Туда же можно приложить скриншот, видео или аудио.", report: "Сообщить об ошибке", reportFailed: "Сначала нажми Start в чате с ботом.",
    },
    en: {
      products: "Products", support: "Support", panel: "Panel", loading: "Loading…", failed: "Could not load. Close your account and open it again.", onlyTelegram: "Your account opens from the bot in Telegram.",
      active: "License active, for life", revoked: "License revoked", licensedTo: "Licensed to", change: "Change", computers: "Computers", none: "Not activated", since: "Purchased", installer: "Installer and manual",
      installNote: "If the system blocks the installer. macOS: System Settings > Privacy & Security > Open Anyway. Windows: in the SmartScreen window, More info > Run anyway.",
      keyNote: "The key is shown only once, in your purchase message in the chat with the bot. Lost it? Write to support.",
      empty: "There are no products on this account yet. The key arrives in the chat with the bot right after payment.", buy: "Buy", haveKey: "Already have a key", keyLabel: "License key", add: "Add", badKey: "That key does not fit. If you are sure it is right, write to support.",
      nameLabel: "Name in the plug-in", nameNote: "The plug-in shows the new name at its next license refresh.", save: "Save", cancel: "Cancel", saveFailed: "Could not save.",
      questions: "Questions about a purchase, key or activation", write: "Write to support", bug: "Something not working right", bugText: "The bot asks for a description in the chat. Attach a screenshot, video or audio there too.", report: "Report a bug", reportFailed: "Press Start in the chat with the bot first.",
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
  function show() {
    view.textContent = "";
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) view.appendChild(arguments[i]);
    window.scrollTo(0, 0);
  }
  function button(text, onclick, className) { return h("button", { type: "button", className: "button " + (className || ""), text: text, onclick: onclick }); }
  function row(name, value) { return h("div", { className: "row" }, h("span", { text: name }), typeof value === "string" ? h("span", { text: value }) : value); }
  function date(seconds) { return new Date(seconds * 1000).toLocaleDateString(state.lang === "ru" ? "ru-RU" : "en-GB", { year: "numeric", month: "short", day: "numeric" }); }
  function haptic(kind) { if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred(kind); }

  function api(method, path, body) {
    return fetch(API + path, {
      method: method,
      headers: { authorization: "tma " + tg.initData, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) { var error = new Error(data.error || "error"); error.code = data.error; throw error; }
        return data;
      });
    });
  }

  function open(url) { if (url.indexOf("https://t.me/") === 0) tg.openTelegramLink(url); else tg.openLink(url); }
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
  // The owner's panel: Russian only, the owner's own tool. The Worker checks the owner on every call.

  function renderPanel() {
    setBack(null);
    var email = h("input", { id: "email", type: "email", placeholder: "buyer@example.com", autocapitalize: "none", autocomplete: "off" });
    var name = h("input", { id: "owner-name", placeholder: "Иван Петров", autocomplete: "off" });
    var result = h("div");
    var create = button("Создать лицензию", function () {
      create.disabled = true; result.textContent = "";
      api("POST", "/app/admin/licenses", { email: email.value, name: name.value }).then(function (r) {
        haptic("success"); email.value = ""; name.value = ""; create.disabled = false;
        result.appendChild(keyBlock(r.key, r.email));
      }).catch(function () {
        haptic("error"); create.disabled = false;
        result.appendChild(h("p", { className: "error", text: "Не создана: проверь почту." }));
      });
    }, "primary");

    var query = h("input", { id: "query", placeholder: "Почта, имя или id", autocomplete: "off" });
    var found = h("div");
    var search = button("Найти", function () { find(query.value, found); });

    var orders = h("div", null, h("p", { className: "dim small", text: "Загрузка…" }));
    show(h("h2", { text: "Новая лицензия" }), h("label", { for: "email", text: "Почта" }), email, h("label", { for: "owner-name", text: "Имя, необязательно" }), name, create, result,
      h("h2", { text: "Найти лицензию" }), query, search, found,
      h("h2", { text: "Заказы без ключа" }), orders);
    loadOrders(orders);
  }

  function keyBlock(key, email) {
    var copied = h("p", { className: "note", text: "Показан один раз. Лицензия на " + email + "; отправь ключ покупателю сам." });
    return h("div", { className: "well", style: "margin-top:12px" }, h("span", { className: "engraved", text: "Ключ" }), h("code", { className: "key", text: key }),
      button("Скопировать", function (e) {
        if (navigator.clipboard) navigator.clipboard.writeText(key).then(function () { e.target.textContent = "Скопирован"; });
      }), copied);
  }

  function find(q, into) {
    into.textContent = "";
    api("GET", "/app/admin/licenses?q=" + encodeURIComponent(q)).then(function (r) {
      if (!r.licenses.length) { into.appendChild(h("p", { className: "dim small", style: "margin-top:12px", text: "Ничего не найдено." })); return; }
      r.licenses.forEach(function (l) {
        into.appendChild(h("button", { type: "button", className: "list-item", onclick: function () { renderCard(l.id); } },
          document.createTextNode(l.customer_name),
          h("span", { className: l.status === "active" ? "" : "revoked", text: (l.email || "без почты") + (l.status === "active" ? "" : ", отозвана") })));
      });
    }).catch(function () { into.appendChild(h("p", { className: "error", text: "Поиск не сработал." })); });
  }

  function renderCard(id) {
    setBack(renderPanel);
    api("GET", "/app/admin/licenses?q=" + encodeURIComponent(id)).then(function (r) {
      var l = r.licenses[0];
      if (!l) { show(h("p", { text: "Лицензия не найдена." })); return; }
      function act(action, done) {
        return api("POST", "/app/admin/licenses/" + id + "/" + action).then(function () { haptic("success"); done && done(); renderCard(id); }).catch(function () { haptic("error"); });
      }
      var revoke = l.status === "active"
        ? button("Отозвать", function () { tg.showConfirm("Отозвать лицензию? Новая активация сразу перестанет работать, установленный плагин отключится при следующем обновлении токена.", function (yes) { if (yes) act("revoke"); }); }, "danger")
        : button("Вернуть", function () { act("unrevoke"); });
      show(h("div", { className: "well" }, h("div", { className: "product-name", text: l.product }),
          h("div", { className: "status" + (l.status === "active" ? "" : " revoked"), text: l.status === "active" ? "Активна" : "Отозвана" })),
        row("Имя", l.customer_name), row("Почта", l.email || "нет"), row("Компьютеры", l.activations + "/" + l.max_machines), row("Создана", date(l.created_at)),
        h("p", { className: "mono", style: "margin-top:12px", text: l.id }),
        button("Отвязать компьютеры", function () { act("reset"); }), revoke);
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
            api("POST", "/app/admin/orders/" + o.purchase_id + "/assign", { telegram_id: Number(input.value) }).then(function () { haptic("success"); loadOrders(into); }).catch(function () { haptic("error"); });
          }));
        }
      });
    }).catch(function () { into.textContent = ""; into.appendChild(h("p", { className: "error", text: "Заказы не загрузились." })); });
  }

  // -------------------------------------------------------------------------

  function renderTabs() {
    tabsEl.textContent = "";
    var tabs = ["products", "support"];
    if (state.me && state.me.is_owner) tabs.push("panel");
    tabs.forEach(function (id) {
      tabsEl.appendChild(h("button", { type: "button", role: "tab", "aria-selected": String(state.tab === id), text: t(id), onclick: function () { state.tab = id; render(); } }));
    });
    langButton.textContent = state.lang === "ru" ? "English" : "Русский";
    document.documentElement.lang = state.lang;
  }

  function render() {
    renderTabs();
    if (!state.me) return;
    if (state.tab === "support") renderSupport();
    else if (state.tab === "panel") renderPanel();
    else renderProducts();
  }

  function load() {
    return api("GET", "/app/me").then(function (me) {
      state.me = me;
      state.lang = /^(ru|uk|be)/.test(me.language || "") ? "ru" : "en";
      render();
    });
  }

  langButton.addEventListener("click", function () {
    state.lang = state.lang === "ru" ? "en" : "ru";
    render();
    api("POST", "/app/language", { language: state.lang }).catch(function () { haptic("error"); });
  });

  function applyTheme() {
    var chalk = tg.colorScheme === "light";
    document.documentElement.dataset.theme = chalk ? "chalk" : "graphite";
    var chassis = chalk ? "#e2e4e6" : "#232527";
    tg.setHeaderColor(chassis);
    tg.setBackgroundColor(chassis);
    if (tg.setBottomBarColor) tg.setBottomBarColor(chassis);
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
