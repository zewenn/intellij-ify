exports.messages = {
	admin: "Run VS Code with admin privileges so the changes can be applied.",
	enabled:
		"IntelliJ-ify enabled. Restart to take effect. " +
		"If Code complains about it is corrupted, CLICK DON'T SHOW AGAIN. " +
		"See README for more detail.",
	disabled: "IntelliJ-ify disabled and reverted to default. Restart to take effect.",
	already_disabled: "IntelliJ-ify already disabled.",
	somethingWrong: "Something went wrong: ",
	restartIde: "Restart Visual Studio Code",
	notfound: "IntelliJ-ify not found.",
	notConfigured:
		"IntelliJ-ify path not configured. " +
		'Please set "vscode_custom_css.imports" in your user settings.',
	reloadAfterVersionUpgrade:
		"Detected reloading CSS / JS after VSCode is upgraded. " + "Performing application only.",
	cannotLoad: url => `Cannot load '${url}'. Skipping.`
};
