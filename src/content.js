// Class names of each 'game card' class
const CARD_LINK_SELECTOR = ".game-card-container a.game-card-link";
const THUMBNAIL_SELECTOR =
  ".game-card-thumb-container, .featured-game-icon-container";

const DEFAULT_SETTINGS = {
  enabled: true,
  visibility: "hover",
  position: "top-left",
};

function safeRuntimeUrl(path) {
  try {
    return chrome.runtime.getURL(path);
  } catch {
    return "";
  }
}

function applySettings(settings) {
  document.documentElement.dataset.roquickplayEnabled = String(settings.enabled);
  document.documentElement.dataset.roquickplayVisibility = settings.visibility;
  document.documentElement.dataset.roquickplayPosition = settings.position;
}

function normalizeSettings(settings) {
  const positionOptions = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ];

  return {
    enabled: settings.enabled !== false,
    visibility: settings.visibility === "always" ? "always" : "hover",
    position: positionOptions.includes(settings.position)
      ? settings.position
      : "top-left",
  };
}

function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    if (chrome.runtime.lastError) {
      console.error("Ro-QuickPlay could not load settings:", chrome.runtime.lastError.message);
      return;
    }

    applySettings(normalizeSettings(settings));
  });
}

loadSettings();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "roquickplay-show-loading") {
    const timeoutMs =
      typeof message.timeoutMs === "number"
        ? Math.min(Math.max(message.timeoutMs, 1000), 60000)
        : 10000;
    setButtonsLoading(message.placeId, true, timeoutMs);
    sendResponse({ success: true });
    return;
  }

  if (message.type === "roquickplay-clear-loading") {
    setButtonsLoading(message.placeId, false);
    sendResponse({ success: true });
    return;
  }

  if (
    message.type !== "roquickplay-launch-server" ||
    typeof message.placeId !== "string" ||
    !/^\d+$/.test(message.placeId) ||
    typeof message.serverId !== "string" ||
    message.serverId.length === 0
  ) {
    return;
  }

  setButtonsLoading(message.placeId, true);
  sendResponse({ success: true });
  const launchUrl = new URL("roblox://experiences/start");
  launchUrl.searchParams.set("placeId", message.placeId);
  launchUrl.searchParams.set("gameInstanceId", message.serverId);
  window.location.assign(launchUrl.href);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    if (chrome.runtime.lastError) {
      console.error("Ro-QuickPlay could not update settings:", chrome.runtime.lastError.message);
      return;
    }

    applySettings(normalizeSettings(settings));
  });
});

function getPlaceId(link) {
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) {
    return null;
  }

  const queryPlaceId = url.searchParams.get("placeId");
  const pathMatch = url.pathname.match(/\/games\/(\d+)(?:\/|$)/);
  const placeId = queryPlaceId || pathMatch?.[1];

  return placeId && /^\d+$/.test(placeId) ? placeId : null;
}

function setButtonsLoading(placeId, isLoading, timeoutMs = 10000) {
  if (typeof placeId !== "string" || !/^\d+$/.test(placeId)) {
    return;
  }

  const iconUrl = isLoading
    ? safeRuntimeUrl("src/assets/play_button/roblox_loading.gif")
    : safeRuntimeUrl("src/assets/play_button/play128.png");

  document
    .querySelectorAll(
      `.roquickplay-play-button[data-place-id="${CSS.escape(placeId)}"]`,
    )
    .forEach((button) => {
      clearTimeout(button.loadingTimeout);
      button.classList.toggle("roquickplay-is-loading", isLoading);
      button.disabled = isLoading;
      button.setAttribute(
        "aria-label",
        isLoading ? "Connecting to Roblox game" : button.dataset.defaultLabel,
      );

      const img = button.querySelector("img");
      if (img && iconUrl) {
        img.src = iconUrl;
      }

      if (isLoading) {
        button.loadingTimeout = setTimeout(() => {
          setButtonsLoading(placeId, false);
        }, timeoutMs);
      }
    });
}

function addPlayButton(link) {
  const thumbnail = link.querySelector(THUMBNAIL_SELECTOR);
  if (!thumbnail || thumbnail.querySelector(".roquickplay-play-button")) {
    return;
  }

  const placeId = getPlaceId(link);
  if (!placeId) {
    return;
  }

  const title =
    link.querySelector(".game-card-name")?.textContent?.trim() ||
    link.querySelector("img[alt]")?.alt ||
    "game";
  const button = document.createElement("button");
  button.className = "roquickplay-play-button";
  button.type = "button";
  button.dataset.placeId = placeId;
  button.dataset.defaultLabel = `Play ${title}`;
  button.setAttribute("aria-label", button.dataset.defaultLabel);
  const icon = document.createElement("img");
  icon.className = "roquickplay-play-icon";
  icon.src = chrome.runtime.getURL("src/assets/play_button/play128.png");
  icon.alt = "";
  icon.draggable = false;
  button.append(icon);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setButtonsLoading(placeId, true);

    try {
      window.location.assign(
        `https://www.roblox.com/games/start?placeId=${encodeURIComponent(placeId)}`,
      );
    } catch (error) {
      console.error("Ro-QuickPlay could not launch the game:", error);
      setButtonsLoading(placeId, false);
    }
  });

  thumbnail.append(button);
}

function scanForGameCards(root) {
  if (root instanceof Element && root.matches(CARD_LINK_SELECTOR)) {
    addPlayButton(root);
  }

  root.querySelectorAll?.(CARD_LINK_SELECTOR).forEach(addPlayButton);
}

scanForGameCards(document);

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) {
        scanForGameCards(node);
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
