const enabledControl = document.getElementById("enabled");
const visibilityControl = document.getElementById("visibility");
const positionControl = document.getElementById("position");
const status = document.getElementById("status");
const appVersion = document.getElementById("app-version");
const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];

function showError(message) {
  status.textContent = message;
}

// Version Footer Text
fetch(chrome.runtime.getURL("src/version.json"))
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed with HTTP ${response.status}`);
    }
    return response.json();
  })
  .then((versionInfo) => {
    if (typeof versionInfo.version !== "string" || !versionInfo.version.trim()) {
      throw new Error("version.json does not contain a valid version");
    }

    appVersion.textContent = versionInfo.version;
  })
  .catch((error) => {
    console.error("Ro-QuickPlay could not load the version:", error);
  });

chrome.storage.local.get(
  { enabled: true, visibility: "hover", position: "top-left" },
  (settings) => {
    if (chrome.runtime.lastError) {
      showError(`Could not load settings: ${chrome.runtime.lastError.message}`);
      return;
    }

    enabledControl.checked = settings.enabled !== false;
    visibilityControl.value =
      settings.visibility === "always" ? "always" : "hover";
    positionControl.value = positions.includes(settings.position)
      ? settings.position
      : "top-left";
  },
);

function saveSettings() {
  chrome.storage.local.set(
    {
      enabled: enabledControl.checked,
      visibility: visibilityControl.value,
      position: positionControl.value,
    },
    () => {
      if (chrome.runtime.lastError) {
        showError(`Could not save settings: ${chrome.runtime.lastError.message}`);
        return;
      }

      status.textContent = "";
    },
  );
}

enabledControl.addEventListener("change", saveSettings);
visibilityControl.addEventListener("change", saveSettings);
positionControl.addEventListener("change", saveSettings);
