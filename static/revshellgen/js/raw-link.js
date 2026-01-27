/**
 * Generates a RawLink for the reverse shell generator. If the user hasn't changed
 * the default generated shell command, the generated URL will contain the original
 * parameters to generate the required command on demand.
 *
 * Otherwise a unique URL is created which inlined the current user provided command.
 */
const RawLink = {
    generate: (rsg) => {
        const commandSelector = rsg.uiElements[rsg.commandType].command;
        const currentCommandElement = document.querySelector(commandSelector);
        const defaultGeneratedCommand = rsg.generateReverseShellCommand();
        const isUserProvidedCommand = currentCommandElement.innerHTML != RawLink.escapeHTML(defaultGeneratedCommand);

        // "Raw mode" in the original project is implemented via a serverless function (Netlify),
        // so the generated URL can be fetched via curl/wget and returns text/plain.
        //
        // When this app is embedded into this repo's Hugo site, it's served as static files
        // under `/revshellgen/` with no backend routes. In that case, fall back to a `data:`
        // URL that shows the raw command as plain text in the browser.
        const isEmbeddedStatic = window.location.pathname.includes('/revshellgen/');
        if (isEmbeddedStatic) {
            const rawText = isUserProvidedCommand ? currentCommandElement.innerText : defaultGeneratedCommand;
            return RawLink.asDataUrl(rawText);
        }

        if (isUserProvidedCommand) {
            return RawLink.withCustomValue(currentCommandElement.innerText)
        }
        return RawLink.withDefaultPayload(rsg);
    },

    escapeHTML(html) {
        var element = document.createElement('div');
        element.innerHTML = html;
        return element.innerHTML;
    },

    asDataUrl: (value) => {
        // Use encodeURIComponent to safely embed newlines/special chars.
        return `data:text/plain;charset=utf-8,${encodeURIComponent(value)}`;
    },

    withDefaultPayload: (rsg) => {
        const name = rsg.selectedValues[rsg.commandType];
        const queryParams = new URLSearchParams();
        queryParams.set('ip', rsg.getIP());
        queryParams.set('port', rsg.getPort());
        queryParams.set('shell', rsg.getShell());
        queryParams.set('encoding', rsg.getEncoding());

        return `/${encodeURIComponent(name)}?${queryParams}`
    },

    withCustomValue: (value) => {
        const queryParams = new URLSearchParams();
        queryParams.set('value', value)
        return `/raw?${queryParams}`
    },
}
