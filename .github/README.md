# Ro-QuickPlay - WebExtension

Ro-QuickPlay is a local Chrome extension that adds quick launch controls to Roblox game cards.

___

### Contents

<details>
<summary>Features</summary>

- Adds a square Play button to Roblox game thumbnails.
- Lets you choose the button's corner position and whether it appears on hover or stays visible.
- Adds **Play this Roblox game** and **Play from random server** to the right-click menu on Roblox pages and game links.
- Saves extension settings locally using Chrome extension storage.

</details>

<details>
<summary>Getting Started</summary>

Ro-QuickPlay is not currently distributed through the Chrome Web Store. To load it locally:

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose the repository folder containing `manifest.json`.

After updating the extension files, select **Reload** on the Ro-QuickPlay card in `chrome://extensions`.

</details>

<details>
<summary>Usage</summary>

Open a page on `www.roblox.com`:

- Hover over a game card to reveal its Play button, or change **Button visibility** to **Always show** in the extension popup.
- Use **Button position** in the popup to place the button in any thumbnail corner.
- Right-click a Roblox game link or game page and select **Play this Roblox game** to launch it in the current tab.
- Select **Play from random server** to choose a public server and open it using the Roblox desktop protocol. Your browser or operating system may ask you to confirm opening the Roblox app.

The random-server action requests up to 100 public servers and randomly selects from the available results. It requires a game URL with a valid place ID and an available public server. The Play button switches to the Roblox loading animation while a launch is in progress or a random server is being located.

</details>

<details>
<summary>Permissions and Privacy</summary>

- **Storage**: saves the button enabled state, visibility, and position in Chrome's local extension storage.
- **Context menus**: adds the two Roblox game actions to the browser's right-click menu.
- **games.roblox.com host access**: retrieves the public server list when you choose **Play from random server**.
- **Roblox page access**: detects game cards, displays the Play button, and handles the random-server launch.

Ro-QuickPlay does not include an analytics service or send settings to an extension developer-operated server. Roblox is contacted to retrieve public server data when you choose the random-server action.

</details>

<details>
<summary>Development</summary>

This repository contains a Manifest V3 extension and has no build step. Load the repository folder as an unpacked extension to test local changes.

</details>

___

Public publication of this plugin on hosting web-extension websites, such as the [Chrome Web Store](https://ssl.gstatic.com/chrome/webstore/intl/en/gallery_tos.html), is not allowed.