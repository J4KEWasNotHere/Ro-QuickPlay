const PLAY_CONTEXT_MENU_ID = "roquickplay-play-game";
const RANDOM_PLAY_CONTEXT_MENU_ID = "roquickplay-play-random-server";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error(
        "Ro-QuickPlay could not reset context menus:",
        chrome.runtime.lastError.message,
      );
      return;
    }

    // Right-click menu popup items
    const menuItems = [
      {
        id: PLAY_CONTEXT_MENU_ID,
        title: "Play this Roblox game",
      },
      {
        id: RANDOM_PLAY_CONTEXT_MENU_ID,
        title: "Play from random server",
      },
    ];

    for (const item of menuItems) {
      chrome.contextMenus.create(
        {
          ...item,
          contexts: ["link", "page"],
          documentUrlPatterns: ["https://www.roblox.com/*"],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Ro-QuickPlay could not create a context menu:",
              chrome.runtime.lastError.message,
            );
          }
        },
      );
    }
  });
});

function sendTabMessage(tabId, message, callback) {
  const wrapped = () => {
    if (chrome.runtime.lastError) {
      // This is common when the content script is not yet ready or is torn down
      // during a Roblox navigation. Ignore it for fire-and-forget updates.
    }

    callback?.();
  };

  if (!callback) {
    chrome.tabs.sendMessage(tabId, message, wrapped);
    return;
  }

  chrome.tabs.sendMessage(tabId, message, wrapped);
}

function getPlaceId(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.origin !== "https://www.roblox.com") {
    return null;
  }

  const queryPlaceId = url.searchParams.get("placeId");
  const pathMatch = url.pathname.match(/\/games\/(\d+)(?:\/|$)/);
  const placeId = queryPlaceId || pathMatch?.[1];

  return placeId && /^\d+$/.test(placeId) ? placeId : null;
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (
    (info.menuItemId !== PLAY_CONTEXT_MENU_ID &&
      info.menuItemId !== RANDOM_PLAY_CONTEXT_MENU_ID) ||
    tab.id === undefined
  ) {
    return;
  }

  const targetUrl = info.linkUrl || info.pageUrl || tab.url;
  const placeId = getPlaceId(targetUrl);
  if (!placeId) {
    return;
  }

  if (info.menuItemId === RANDOM_PLAY_CONTEXT_MENU_ID) {
    playFromRandomServer(tab.id, placeId);
    return;
  }

  sendTabMessage(
    tab.id,
    { type: "roquickplay-show-loading", placeId, timeoutMs: 10000 },
    () => startGameInTab(tab.id, placeId),
  );
});

function startGameInTab(tabId, placeId) {
  chrome.tabs.update(
    tabId,
    {
      url: `https://www.roblox.com/games/start?placeId=${encodeURIComponent(placeId)}`,
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Ro-QuickPlay could not start the game:",
          chrome.runtime.lastError.message,
        );
        sendTabMessage(tabId, { type: "roquickplay-clear-loading", placeId });
      }
    },
  );
}

async function playFromRandomServer(tabId, placeId) {
  sendTabMessage(tabId, {
    type: "roquickplay-show-loading",
    placeId,
    timeoutMs: 30000,
  });

  try {
    const response = await fetch(
      `https://games.roblox.com/v1/games/${encodeURIComponent(placeId)}/servers/Public?limit=100`,
    );
    if (!response.ok) {
      throw new Error(`Roblox server request failed with HTTP ${response.status}`);
    }

    const serverList = await response.json();
    const servers = Array.isArray(serverList.data)
      ? serverList.data.filter(
          (server) => typeof server.id === "string" && server.id.length > 0,
        )
      : [];

    if (servers.length === 0) {
      throw new Error("Roblox returned no available public servers");
    }

    const server = servers[Math.floor(Math.random() * servers.length)];
    sendTabMessage(tabId, {
      type: "roquickplay-launch-server",
      placeId,
      serverId: server.id,
    });
  } catch (error) {
    sendTabMessage(tabId, { type: "roquickplay-clear-loading", placeId });
    console.error("Ro-QuickPlay could not find a random server:", error);
  }
}
