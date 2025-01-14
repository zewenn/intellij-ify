const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const msg = require("./messages").messages;
const uuid = require("uuid");
const fetch = require("node-fetch");
const Url = require("url");

function activate(context) {
	const appDir = path.dirname(require.main.filename);
	const base = path.join(appDir, "vs", "code");
	const htmlFile = path.join(base, "electron-sandbox", "workbench", "workbench.html");
	const BackupFilePath = uuid =>
		path.join(base, "electron-sandbox", "workbench", `workbench.${uuid}.bak-custom-css`);
	const patchToken = "VSCODE-CUSTOM-CSS";
	const dynamicPatchTokenPatterns = {
		"SessionID" : new RegExp(`<!-- !! ${patchToken}-SESSION-ID ([0-9a-fA-F-]+) !! -->`),
		"HTMLPart" : new RegExp(`<!-- !! ${patchToken}-SESSION-ID ([0-9a-fA-F-]+) !! -->`),
		"SessionIDWhitespace" : new RegExp(`<!-- !! ${patchToken}-SESSION-ID [\\w-]+ !! -->\\n*`, 'g')
	};

	async function getContent(url) {
		if (/^file:/.test(url)) {
			const fp = Url.fileURLToPath(url);
			return await fs.promises.readFile(fp);
		} else {
			const response = await fetch(url);
			return response.buffer();
		}
	}

	// ####  main commands ######################################################

	async function cmdInstall() {
		const uuidSession = uuid.v4();
		await createBackup(uuidSession);
		await performPatch(uuidSession);
	}

	async function cmdReinstall() {
		await uninstallImpl();
		await cmdInstall();
	}

	async function cmdUninstall() {
		await uninstallImpl();
		disabledRestart();
	}

	async function uninstallImpl() {
		const backupUuid = await getBackupUuid(htmlFile);
		if (!backupUuid) return;
		const backupPath = BackupFilePath(backupUuid);
		await restoreBackup(backupPath);
		await deleteBackupFiles();
	}

	// #### Backup ################################################################

	async function getBackupUuid(htmlFilePath) {
		try {
			const htmlContent = await fs.promises.readFile(htmlFilePath, "utf-8");
			const m = htmlContent.match(
				dynamicPatchTokenPatterns.SessionID
			);
			if (!m) return null;
			else return m[1];
		} catch (e) {
			vscode.window.showInformationMessage(msg.somethingWrong + e);
			throw e;
		}
	}

	async function createBackup(uuidSession) {
		try {
			let html = await fs.promises.readFile(htmlFile, "utf-8");
			html = clearExistingPatches(html);
			await fs.promises.writeFile(BackupFilePath(uuidSession), html, "utf-8");
		} catch (e) {
			vscode.window.showInformationMessage(msg.admin);
			throw e;
		}
	}

	async function restoreBackup(backupFilePath) {
		try {
			if (fs.existsSync(backupFilePath)) {
				await fs.promises.unlink(htmlFile);
				await fs.promises.copyFile(backupFilePath, htmlFile);
			}
		} catch (e) {
			vscode.window.showInformationMessage(msg.admin);
			throw e;
		}
	}

	async function deleteBackupFiles() {
		const htmlDir = path.dirname(htmlFile);
		const htmlDirItems = await fs.promises.readdir(htmlDir);
		for (const item of htmlDirItems) {
			if (item.endsWith(".bak-custom-css")) {
				await fs.promises.unlink(path.join(htmlDir, item));
			}
		}
	}

	// #### Patching ##############################################################

	async function performPatch(uuidSession) {
		// const config = vscode.workspace.getConfiguration("vscode_custom_css");
		// if (!patchIsProperlyConfigured(config)) {
		// 	return vscode.window.showInformationMessage(msg.notConfigured);
		// }

		let html = await fs.promises.readFile(htmlFile, "utf-8");
		html = clearExistingPatches(html);

		html = html.replace(/<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/, "");

		let indicatorJS = "";
		indicatorJS = await getIndicatorJs();

		html = html.replace(
			/(<\/html>)/,
			`<!-- !! ${patchToken}-SESSION-ID ${uuidSession} !! -->\n` +
				`<!-- !! ${patchToken}-START !! -->\n` +
				indicatorJS +
				`<script>

/**
 * @typedef {Array.<number>} NumberList
 * @typedef {Array.<NumberList>} Matrix2D 
 */


/**
 * @type {Matrix2D}
 */
let colours = [
    [255, 122, 0],
    [221, 55, 235],
    [0, 178, 255],
    [0, 209, 255],
    [16, 79, 240],
    [98, 39, 240],
    [241, 39, 160],
    [56, 202, 88],
    [245, 162, 36],
    [255, 72, 14],
    [135, 97, 248]
]

/**
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * @param {Array} array 
 */
function get_random_array_element(array) {
    return array[randomIntFromInterval(0, array.length - 1)]
}

window.addEventListener("load", () => {
    const body = document.body;
    
    /**
     * @type {NumberList}
     */
    let colour = get_random_array_element(colours)

    body.style.setProperty("--cccs-color-r", colour[0])
    body.style.setProperty("--cccs-color-g", colour[1])
    body.style.setProperty("--cccs-color-b", colour[2])
})


</script>` + `<style>
.monaco-workbench .part.titlebar {
	position: relative;
}
.monaco-workbench .part.titlebar::before {
	content: "";
	position: absolute;
	top: 50%;
	left: -2%;
	transform: translate(0%, -50%);
	width: 25vw;
	height: 100px;
	background: radial-gradient(
		circle,
		rgba(var(--cccs-color-r), var(--cccs-color-g), var(--cccs-color-b), 0.15),
		rgba(0, 0, 0, 0.05)
	);
	border-radius: 50%;
	filter: blur(10px);
}
.monaco-workbench
	.part.titlebar
	> .titlebar-container
	> .titlebar-left
	> .window-appicon:not(.codicon) {
	background-image: url('data:image/svg+xml,<svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12.5" y="12.5" width="375" height="375" fill="black"/><rect x="12.5" y="12.5" width="375" height="375" stroke="%23087CFA" stroke-width="25"/><path d="M115.4 212L77 87.4H104.6L126.8 169.8L147.6 87.4H174.6L136.6 212H115.4ZM222.8 214.4C214.4 214.4 206.267 213.267 198.4 211C190.667 208.6 184.4 204.933 179.6 200L193.2 177.4L194.2 175.8L196.2 177C196.467 177.933 196.8 178.933 197.2 180C197.733 180.933 198.867 182.133 200.6 183.6C203.8 185.733 207.267 187.533 211 189C214.733 190.467 218.6 191.267 222.6 191.4C225.4 191.4 227.867 191.2 230 190.8C232.267 190.4 234.2 189.733 235.8 188.8C237.4 187.867 238.6 186.6 239.4 185C240.333 183.267 240.8 181.2 240.8 178.8C240.8 177.6 240.6 176.4 240.2 175.2C239.933 173.867 239.4 172.6 238.6 171.4C237.8 170.067 236.533 168.733 234.8 167.4C233.2 166.067 231.133 164.6 228.6 163C226.067 161.4 222.867 159.733 219 158C210.467 153.867 203.667 149.933 198.6 146.2C193.667 142.467 190.067 138.4 187.8 134C185.667 129.467 184.6 124.067 184.6 117.8C184.6 111.667 186.4 106.133 190 101.2C193.733 96.2667 198.733 92.3333 205 89.4C211.267 86.4667 218.133 85 225.6 85C231.333 85 236.533 85.6 241.2 86.8C246 88 250.4 89.8 254.4 92.2C258.533 94.6 262.333 97.6667 265.8 101.4L248.8 119.8L247.6 121.2L245.8 119.6C245.667 118.533 245.467 117.533 245.2 116.6C244.933 115.533 244.067 114.2 242.6 112.6C240.467 110.733 238.2 109.533 235.8 109C233.4 108.333 230.6 108 227.4 108C225.133 108 223.067 108.267 221.2 108.8C219.333 109.2 217.733 109.867 216.4 110.8C215.067 111.6 214 112.533 213.2 113.6C212.533 114.667 212.2 115.8 212.2 117C212.2 118.2 212.333 119.333 212.6 120.4C212.867 121.333 213.4 122.333 214.2 123.4C215 124.467 216.2 125.6 217.8 126.8C219.533 128 221.733 129.4 224.4 131C227.2 132.467 230.667 134.2 234.8 136.2C241.2 139.4 246.6 142.467 251 145.4C255.4 148.333 258.867 151.4 261.4 154.6C264.067 157.667 265.933 161.067 267 164.8C268.2 168.533 268.8 172.8 268.8 177.6C268.8 183.867 267.2 189.8 264 195.4C260.8 201 255.8 205.6 249 209.2C242.2 212.667 233.467 214.4 222.8 214.4Z" fill="white"/><rect x="75" y="300" width="150" height="25" fill="white"/></svg>') !important;
}
.window-appicon {
	margin-left: 8px !important;
}
.monaco-workbench.vs-dark
	.part.editor
	> .content
	.editor-group-container
	.editor-group-watermark
	> .letterpress {
	background-image: url('data:image/svg+xml,<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_10_27" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512"><rect width="512" height="512" fill="%23712828"/></mask><g mask="url(%23mask0_10_27)"><mask id="mask1_10_27" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="18" y="5" width="465" height="501"><path d="M28.5047 160.648C41.4788 146.666 62.7648 144.364 78.4277 155.25L402.728 380.632C451.932 414.828 433.564 491.636 374.213 499.871C354.675 502.582 334.951 496.387 320.472 482.993L30.5704 214.803C15.0294 200.426 14.1041 176.167 28.5047 160.648Z" fill="white"/><path d="M29.8639 347.129C14.2163 330.743 15.6213 304.557 32.9323 289.94L346.393 25.2547C393.345 -14.3915 465.52 14.6379 471.945 75.7529C475.117 105.926 460.175 135.127 433.847 150.205L77.8338 354.093C62.1448 363.078 42.3504 360.205 29.8639 347.129Z" fill="white"/><path d="M403.99 5.76538C449.253 5.76538 485.105 44.0004 482.196 89.1697L460.292 429.252C456.346 490.526 388.841 525.798 336.287 494.047C309.627 477.94 294.42 448.098 297.057 417.063L325.904 77.4991C329.35 36.9357 363.281 5.76538 403.99 5.76538Z" fill="white"/></mask><g mask="url(%23mask1_10_27)"><rect x="-10.8215" y="-18.7144" width="548.571" height="548.571" fill="url(%23paint0_radial_10_27)"/><mask id="mask2_10_27" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="-11" y="-19" width="549" height="549"><rect x="-10.8215" y="-18.7144" width="548.571" height="548.571" fill="url(%23paint1_radial_10_27)"/></mask><g mask="url(%23mask2_10_27)"><rect x="-10.8215" y="-18.7144" width="548.571" height="548.571" fill="url(%23paint2_linear_10_27)"/></g></g><rect x="96" y="96" width="320" height="320" rx="30" fill="url(%23paint3_radial_10_27)"/><path d="M182.36 276L147.8 163.86H172.64L192.62 238.02L211.34 163.86H235.64L201.44 276H182.36ZM279.02 278.16C271.46 278.16 264.14 277.14 257.06 275.1C250.1 272.94 244.46 269.64 240.14 265.2L252.38 244.86L253.28 243.42L255.08 244.5C255.32 245.34 255.62 246.24 255.98 247.2C256.46 248.04 257.48 249.12 259.04 250.44C261.92 252.36 265.04 253.98 268.4 255.3C271.76 256.62 275.24 257.34 278.84 257.46C281.36 257.46 283.58 257.28 285.5 256.92C287.54 256.56 289.28 255.96 290.72 255.12C292.16 254.28 293.24 253.14 293.96 251.7C294.8 250.14 295.22 248.28 295.22 246.12C295.22 245.04 295.04 243.96 294.68 242.88C294.44 241.68 293.96 240.54 293.24 239.46C292.52 238.26 291.38 237.06 289.82 235.86C288.38 234.66 286.52 233.34 284.24 231.9C281.96 230.46 279.08 228.96 275.6 227.4C267.92 223.68 261.8 220.14 257.24 216.78C252.8 213.42 249.56 209.76 247.52 205.8C245.6 201.72 244.64 196.86 244.64 191.22C244.64 185.7 246.26 180.72 249.5 176.28C252.86 171.84 257.36 168.3 263 165.66C268.64 163.02 274.82 161.7 281.54 161.7C286.7 161.7 291.38 162.24 295.58 163.32C299.9 164.4 303.86 166.02 307.46 168.18C311.18 170.34 314.6 173.1 317.72 176.46L302.42 193.02L301.34 194.28L299.72 192.84C299.6 191.88 299.42 190.98 299.18 190.14C298.94 189.18 298.16 187.98 296.84 186.54C294.92 184.86 292.88 183.78 290.72 183.3C288.56 182.7 286.04 182.4 283.16 182.4C281.12 182.4 279.26 182.64 277.58 183.12C275.9 183.48 274.46 184.08 273.26 184.92C272.06 185.64 271.1 186.48 270.38 187.44C269.78 188.4 269.48 189.42 269.48 190.5C269.48 191.58 269.6 192.6 269.84 193.56C270.08 194.4 270.56 195.3 271.28 196.26C272 197.22 273.08 198.24 274.52 199.32C276.08 200.4 278.06 201.66 280.46 203.1C282.98 204.42 286.1 205.98 289.82 207.78C295.58 210.66 300.44 213.42 304.4 216.06C308.36 218.7 311.48 221.46 313.76 224.34C316.16 227.1 317.84 230.16 318.8 233.52C319.88 236.88 320.42 240.72 320.42 245.04C320.42 250.68 318.98 256.02 316.1 261.06C313.22 266.1 308.72 270.24 302.6 273.48C296.48 276.6 288.62 278.16 279.02 278.16Z" fill="white"/><rect x="146" y="346" width="120" height="20" fill="white"/></g><defs><radialGradient id="paint0_radial_10_27" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(44.8928 354.411) rotate(-37.7193) scale(527.576 768.226)"><stop stop-color="%2300D1FF"/><stop offset="0.380908" stop-color="%23104FF0"/><stop offset="1" stop-color="%236227F0"/></radialGradient><radialGradient id="paint1_radial_10_27" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(441.321 65.125) rotate(101.051) scale(721.049 721.049)"><stop stop-color="white"/><stop offset="1" stop-color="%23D9D9D9" stop-opacity="0"/></radialGradient><linearGradient id="paint2_linear_10_27" x1="484.446" y1="-18.7144" x2="373.018" y2="529.857" gradientUnits="userSpaceOnUse"><stop stop-color="%23FF7A00"/><stop offset="0.55" stop-color="%23DD37EB"/><stop offset="1" stop-color="%2300B3FF"/></linearGradient><radialGradient id="paint3_radial_10_27" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(96 96) rotate(45) scale(452.548)"><stop stop-color="%23393939"/><stop offset="1"/></radialGradient></defs></svg>');
}

</style>` +
				`<!-- !! ${patchToken}-END !! -->\n</html>`
		);
		try {
			await fs.promises.writeFile(htmlFile, html, "utf-8");
		} catch (e) {
			vscode.window.showInformationMessage(msg.admin);
			disabledRestart();
		}
		enabledRestart();
	}
	/**
	 * @param {string} html 
	 * @returns {string}
	 */
	function clearExistingPatches(html) {
		html = html.replace(
			dynamicPatchTokenPatterns.HTMLPart,
			""
		);
		html = html.replace(dynamicPatchTokenPatterns.SessionIDWhitespace, "");
		return html;
	}

	function patchIsProperlyConfigured(config) {
		return config && config.imports && config.imports instanceof Array;
	}

	async function patchHtml(config) {
		let res = "";
		for (const item of config.imports) {
			const imp = await patchHtmlForItem(item);
			if (imp) res += imp;
		}
		return res;
	}
	async function patchHtmlForItem(url) {
		if (!url) return "";
		if (typeof url !== "string") return "";

		// Copy the resource to a staging directory inside the extension dir
		let parsed = new Url.URL(url);
		const ext = path.extname(parsed.pathname);

		try {
			const fetched = await getContent(url);
			if (ext === ".css") {
				return `<style>${fetched}</style>`;
			} else if (ext === ".js") {
				return `<script>${fetched}</script>`;
			} else {
				console.log(`Unsupported extension type: ${ext}`);
			}
		} catch (e) {
			console.error(e);
			vscode.window.showWarningMessage(msg.cannotLoad(url));
			return "";
		}
	}
	async function getIndicatorJs() {
		let indicatorJsPath;
		let ext = vscode.extensions.getExtension("be5invis.vscode-custom-css");
		if (ext && ext.extensionPath) {
			indicatorJsPath = path.resolve(ext.extensionPath, "src/statusbar.js");
		} else {
			indicatorJsPath = path.resolve(__dirname, "statusbar.js");
		}
		const indicatorJsContent = await fs.promises.readFile(indicatorJsPath, "utf-8");
		return `<script>${indicatorJsContent}</script>`;
	}

	function reloadWindow() {
		// reload vscode-window
		vscode.commands.executeCommand("workbench.action.reloadWindow");
	}
	function enabledRestart() {
		vscode.window
			.showInformationMessage(msg.enabled, { title: msg.restartIde })
			.then(reloadWindow);
	}
	function disabledRestart() {
		vscode.window
			.showInformationMessage(msg.disabled, { title: msg.restartIde })
			.then(reloadWindow);
	}

	const installIntelliJify = vscode.commands.registerCommand(
		"extension.installIntelliJify",
		cmdInstall
	);
	const uninstallIntelliJify = vscode.commands.registerCommand(
		"extension.uninstallIntelliJify",
		cmdUninstall
	);
	const updateIntelliJify = vscode.commands.registerCommand(
		"extension.updateIntelliJify",
		cmdReinstall
	);

	context.subscriptions.push(installIntelliJify);
	context.subscriptions.push(uninstallIntelliJify);
	context.subscriptions.push(updateIntelliJify);

	console.log("vscode-custom-css is active!");
	console.log("Application directory", appDir);
	console.log("Main HTML file", htmlFile);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
