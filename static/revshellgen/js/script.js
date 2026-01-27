
// Element selectors
const ipInput = document.querySelector("#ip");
const portInput = document.querySelector("#port");
const listenerSelect = document.querySelector("#listener-selection");
const shellSelect = document.querySelector("#shell");
const operatingSystemSelect = document.querySelector("#os-options");
const encodingSelect = document.querySelector('#encoding');
const searchBox = document.querySelector('#searchBox');
const listenerCommand = document.querySelector("#listener-command");
const reverseShellCommand = document.querySelector("#reverse-shell-command");
const reverseShellResults = document.querySelector("#reverse-shell-results");
const bindShellCommand = document.querySelector("#bind-shell-command");
const bindShellResults = document.querySelector("#bind-shell-results");
const msfVenomCommand = document.querySelector("#msfvenom-command");
const hoaxShellCommand = document.querySelector("#hoaxshell-command");

const FilterOperatingSystemType = {
    'All': 'all',
    'Windows': 'windows',
    'Linux': 'linux',
    'Mac': 'mac'
};

// Protocol buckets for Reverse/Bind UI (best-effort categorization).
const Protocol = {
    Bash: 'bash',
    Python: 'python',
    PHP: 'php',
    PowerShell: 'powershell',
    Perl: 'perl',
    Ruby: 'ruby',
    Java: 'java',
    Golang: 'golang',
    NodeJS: 'nodejs',
    Socat: 'socat',
    Netcat: 'netcat',
    Lua: 'lua',
    Other: 'other',
};

const PROTOCOL_ORDER = [
    Protocol.Bash,
    Protocol.Python,
    Protocol.PHP,
    Protocol.PowerShell,
    Protocol.Perl,
    Protocol.Ruby,
    Protocol.Java,
    Protocol.Golang,
    Protocol.NodeJS,
    Protocol.Socat,
    Protocol.Netcat,
    Protocol.Lua,
    Protocol.Other,
];

const PROTOCOL_LABEL = {
    [Protocol.Bash]: 'Bash',
    [Protocol.Python]: 'Python',
    [Protocol.PHP]: 'PHP',
    [Protocol.PowerShell]: 'PowerShell',
    [Protocol.Perl]: 'Perl',
    [Protocol.Ruby]: 'Ruby',
    [Protocol.Java]: 'Java',
    [Protocol.Golang]: 'Golang',
    [Protocol.NodeJS]: 'NodeJS',
    [Protocol.Socat]: 'Socat',
    [Protocol.Netcat]: 'Netcat',
    [Protocol.Lua]: 'Lua',
    [Protocol.Other]: 'Other',
};

const inferProtocol = (item) => {
    const name = String(item?.name || '').trim();
    const nameLower = name.toLowerCase();
    const commandLower = String(item?.command || '').toLowerCase();

    // 1) Direct/obvious by name prefix (case-insensitive)
    if (nameLower.startsWith('bash')) return Protocol.Bash;
    if (nameLower.startsWith('python') || nameLower.startsWith('python3')) return Protocol.Python;
    if (nameLower.startsWith('php')) return Protocol.PHP;
    if (nameLower.startsWith('powershell')) return Protocol.PowerShell;
    if (nameLower.startsWith('perl')) return Protocol.Perl;
    if (nameLower.startsWith('ruby')) return Protocol.Ruby;
    if (nameLower.startsWith('java') || nameLower.startsWith('jsp') || nameLower.startsWith('war')) return Protocol.Java;
    if (nameLower.startsWith('golang') || /^go\b/.test(nameLower)) return Protocol.Golang;
    if (nameLower.startsWith('node.js') || nameLower.startsWith('javascript')) return Protocol.NodeJS;
    if (nameLower.startsWith('socat')) return Protocol.Socat;
    if (nameLower.startsWith('lua')) return Protocol.Lua;
    // 2) Netcat bucket (ambiguous utilities folded in)
    if (
        nameLower === 'curl' ||
        /\b(nc|ncat|netcat|rustcat)\b/.test(nameLower) ||
        nameLower.includes('busybox nc') ||
        nameLower.includes('mkfifo') ||
        nameLower.includes('mknod')
    ) {
        return Protocol.Netcat;
    }

    // 3) Fallback by command string (best-effort)
    if (commandLower.includes('<?php')) return Protocol.PHP;
    if (commandLower.includes('powershell')) return Protocol.PowerShell;
    if (commandLower.includes('/dev/tcp/')) return Protocol.Bash;
    if (
        /\b(nc|ncat|netcat|rcat|rustcat)\b/.test(commandLower) ||
        commandLower.includes('telnet://') ||
        commandLower.includes('mkfifo')
    ) {
        return Protocol.Netcat;
    }

    return Protocol.Other;
};

const hoaxshell_listener_types = {
	"Windows CMD cURL" : "cmd-curl",
	"PowerShell IEX" : "ps-iex",
	"PowerShell IEX Constr Lang Mode" : "ps-iex-cm",
	"PowerShell Outfile" : "ps-outfile",
	"PowerShell Outfile Constr Lang Mode" : "ps-outfile-cm",
	"Windows CMD cURL https" : "cmd-curl -c /your/cert.pem -k /your/key.pem",
	"PowerShell IEX https" : "ps-iex -c /your/cert.pem -k /your/key.pem",
	"PowerShell IEX Constr Lang Mode https" : "ps-iex-cm -c /your/cert.pem -k /your/key.pem",
	"PowerShell Outfile https" : "ps-outfile -c /your/cert.pem -k /your/key.pem",
	"PowerShell Outfile Constr Lang Mode https" : "ps-outfile-cm -c /your/cert.pem -k /your/key.pem"
};

operatingSystemSelect.addEventListener("change", (event) => {
    const selectedOS = event.target.value;
    rsg.setState({
        filterOperatingSystem: selectedOS,
    });
});

document.querySelector("#reverse-tab").addEventListener("click", () => {
    rsg.setState({
        commandType: CommandType.ReverseShell,
    });
})

document.querySelector("#bind-tab").addEventListener("click", () => {
    rsg.setState({
        commandType: CommandType.BindShell,
        encoding: "None"
});
})

document.querySelector("#bind-tab").addEventListener("click", () => {
    document.querySelector("#bind-shell-selection").innerHTML = "";
    rsg.setState({
        commandType: CommandType.BindShell

    });
})

document.querySelector("#msfvenom-tab").addEventListener("click", () => {
    document.querySelector("#msfvenom-selection").innerHTML = "";
    rsg.setState({
        commandType: CommandType.MSFVenom,
encoding: "None"
    });
});


document.querySelector("#hoaxshell-tab").addEventListener("click", () => {
    document.querySelector("#hoaxshell-selection").innerHTML = "";
    rsg.setState({
        commandType: CommandType.HoaxShell,
		encoding: "None"
    });
});

// Raw button functionality removed

const filterCommandData = function (data, { commandType, filterOperatingSystem = FilterOperatingSystemType.All, filterText = '' }) {
    return data.filter(item => {

        if (!item.meta.includes(commandType)) {
            return false;
        }

        var hasOperatingSystemMatch = (filterOperatingSystem === FilterOperatingSystemType.All) || item.meta.includes(filterOperatingSystem);
        var hasTextMatch = item.name.toLowerCase().indexOf(filterText.toLowerCase()) >= 0;
        return hasOperatingSystemMatch && hasTextMatch;
    });
}

const query = new URLSearchParams(location.hash.substring(1));

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
const fixedEncodeURIComponent = function (str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
}

const parsePortOrDefault = function (value, defaultPort = 9001) {
    if (value === null || value === undefined) return defaultPort;

    const number = Number(value);
    const isValidPort = (Number.isSafeInteger(number) && number >= 0 && number <= 65535);
    return isValidPort ? number : defaultPort;
};

const rsg = {
    ip: (query.get('ip') || localStorage.getItem('ip') || '10.10.10.10').replace(/[^a-zA-Z0-9.\-]/g, ''),
    port: parsePortOrDefault(query.get('port') || localStorage.getItem('port')),
    payload: query.get('payload') || localStorage.getItem('payload') || 'windows/x64/meterpreter/reverse_tcp',
    payload: query.get('type') || localStorage.getItem('type') || 'cmd-curl',
    shell: query.get('shell') || localStorage.getItem('shell') || rsgData.shells[0],
    listener: query.get('listener') || localStorage.getItem('listener') || rsgData.listenerCommands[0][1],
    encoding: query.get('encoding') || localStorage.getItem('encoding') || 'None',
    protocolReverseShell: query.get('protocolReverseShell') || localStorage.getItem('protocolReverseShell') || Protocol.Bash,
    protocolBindShell: query.get('protocolBindShell') || localStorage.getItem('protocolBindShell') || Protocol.Netcat,
    selectedValues: {
        [CommandType.ReverseShell]: filterCommandData(rsgData.reverseShellCommands, { commandType: CommandType.ReverseShell })[0].name,
        [CommandType.BindShell]: filterCommandData(rsgData.reverseShellCommands, { commandType: CommandType.BindShell })[0].name,
        [CommandType.MSFVenom]: filterCommandData(rsgData.reverseShellCommands, { commandType: CommandType.MSFVenom })[0].name,
        [CommandType.HoaxShell]: filterCommandData(rsgData.reverseShellCommands, { commandType: CommandType.HoaxShell })[0].name,
    },
    commandType: CommandType.ReverseShell,
    filterOperatingSystem: query.get('filterOperatingSystem') || localStorage.getItem('filterOperatingSystem') || FilterOperatingSystemType.All,
    filterText: query.get('filterText') || localStorage.getItem('filterText') || '',

    uiElements: {
        [CommandType.ReverseShell]: {
            listSelection: '#reverse-shell-selection',
            command: '#reverse-shell-command'
        },
        [CommandType.BindShell]: {
            listSelection: '#bind-shell-selection',
            command: '#bind-shell-command',
        },
        [CommandType.MSFVenom]: {
            listSelection: '#msfvenom-selection',
            command: '#msfvenom-command'
        },
        [CommandType.HoaxShell]: {
            listSelection: '#hoaxshell-selection',
            command: '#hoaxshell-command'
        }
    },

    copyToClipboard: (text) => {
        if (navigator ?.clipboard ?.writeText) {
            navigator.clipboard.writeText(text)
            $('#clipboard-toast').toast('show')
        } else if (window ?.clipboardData ?.setData) {
            window.clipboardData.setData('Text', text);
            $('#clipboard-toast').toast('show')
        } else {
            $('#clipboard-failure-toast').toast('show')
        }
    },

    escapeHTML: (text) => {
        let element = document.createElement('p');
        element.textContent = text;
        return element.innerHTML;
    },

    getIP: () => rsg.ip,

    getPort: () => parsePortOrDefault(rsg.port),

    getShell: () => rsg.shell,

    getEncoding: () => rsg.encoding,

    getSelectedCommandName: () => {
        return rsg.selectedValues[rsg.commandType];
    },

    getSelectedProtocol: () => {
        switch (rsg.commandType) {
            case CommandType.ReverseShell:
                return rsg.protocolReverseShell;
            case CommandType.BindShell:
                return rsg.protocolBindShell;
            default:
                return null;
        }
    },

    setSelectedProtocol: (protocolKey) => {
        if (!protocolKey) return;
        switch (rsg.commandType) {
            case CommandType.ReverseShell:
                rsg.setState({ protocolReverseShell: protocolKey });
                break;
            case CommandType.BindShell:
                rsg.setState({ protocolBindShell: protocolKey });
                break;
        }
    },

    getReverseShellCommand: () => {
        const reverseShellData = rsgData.reverseShellCommands.find((item) => item.name === rsg.getSelectedCommandName());
        return reverseShellData.command;
    },

    // Render a command for an arbitrary item (used by Reverse/Bind results list).
    // Returns { html, text } where html may include highlighted <span> wrappers.
    generateCommandForItem: (item) => {
        const name = item?.name;

        let template;
        // Preserve existing special-case behavior.
        if (name === 'PowerShell #3 (Base64)') {
            const encoder = (text) => text;
            const payload = rsg.insertParameters(rsgData.specialCommands['PowerShell payload'], encoder);
            const toBinary = (string) => {
                const codeUnits = new Uint16Array(string.length);
                for (let i = 0; i < codeUnits.length; i++) codeUnits[i] = string.charCodeAt(i);
                const charCodes = new Uint8Array(codeUnits.buffer);
                let result = '';
                for (let i = 0; i < charCodes.byteLength; i++) result += String.fromCharCode(charCodes[i]);
                return result;
            };
            const rendered = "powershell -e " + btoa(toBinary(payload));
            return { html: rendered, text: rendered };
        }

        template = String(item?.command ?? '');

        const encoding = rsg.getEncoding();
        if (encoding === 'Base64') {
            const rendered = btoa(rsg.insertParameters(template, (text) => text));
            return { html: rendered, text: rendered };
        }

        const encoder = (string) => {
            let result = string;
            switch (encoding) {
                case 'encodeURLDouble':
                    result = fixedEncodeURIComponent(result);
                // fall-through
                case 'encodeURL':
                    result = fixedEncodeURIComponent(result);
                    break;
            }
            return result;
        };

        // Plain text version (no highlighting spans).
        const text = rsg.insertParameters(encoder(template), encoder);

        // HTML version with highlighted placeholders (then replaced with values).
        let html = rsg.escapeHTML(encoder(template));
        html = rsg.insertParameters(rsg.highlightParameters(html, encoder), encoder);
        return { html, text };
    },

    getPayload: () => {
        if (rsg.commandType === 'MSFVenom') {
            let cmd = rsg.getReverseShellCommand();
            // msfvenom -p windows/x64/meterpreter_reverse_tcp ...
            let regex = /\s+-p\s+(?<payload>[a-zA-Z0-9/_]+)/;
            let match = regex.exec(cmd);
            if (match) {
                return match.groups.payload;
            }
        }

        return 'windows/x64/meterpreter/reverse_tcp'

    },

    getType: () => {
        if (rsg.commandType === 'HoaxShell') {
            let cmd_name = rsg.getSelectedCommandName();
            return hoaxshell_listener_types[cmd_name];
        }

        return 'cmd-curl'

    },

    generateReverseShellCommand: () => {
        let command
        if (rsg.getSelectedCommandName() === 'PowerShell #3 (Base64)') {
            const encoder = (text) => text;
            const payload = rsg.insertParameters(rsgData.specialCommands['PowerShell payload'], encoder)
                command = "powershell -e " + btoa(toBinary(payload))
            function toBinary(string) {
                const codeUnits = new Uint16Array(string.length);
                for (let i = 0; i < codeUnits.length; i++) {
                codeUnits[i] = string.charCodeAt(i);
                }
                const charCodes = new Uint8Array(codeUnits.buffer);
                let result = '';
                for (let i = 0; i < charCodes.byteLength; i++) {
                result += String.fromCharCode(charCodes[i]);
                }
                return result;
            }
        } else {
            command = rsg.getReverseShellCommand()
        }

        const encoding = rsg.getEncoding();
        if (encoding === 'Base64') {
            command = rsg.insertParameters(command, (text) => text)
            command = btoa(command)
        } else {
            function encoder(string) {
                let result = string;
                switch (encoding) {
                    case 'encodeURLDouble':
                        result = fixedEncodeURIComponent(result);
                        // fall-through
                    case 'encodeURL':
                        result = fixedEncodeURIComponent(result);
                        break;
                }
                return result;
            }
            command = rsg.escapeHTML(encoder(command));
            // NOTE: Assumes encoder doesn't produce HTML-escaped characters in parameters
            command = rsg.insertParameters(rsg.highlightParameters(command, encoder), encoder);
        }

        return command;
    },

    highlightParameters: (text, encoder) => {
        const parameters = ['{ip}', '{port}', '{shell}', encodeURI('{ip}'), encodeURI('{port}'),
            encodeURI('{shell}')
        ];

        parameters.forEach((param) => {
            if (encoder) param = encoder(param)
            text = text.replace(param, `<span class="highlighted-parameter">${param}</span>`)
        })
        return text
    },

    init: () => {
        rsg.initListenerSelection()
        rsg.initShells()
    },

    initListenerSelection: () => {
        rsgData.listenerCommands.forEach((listenerData, i) => {
            const type = listenerData[0];
            const command = listenerData[1];

            const option = document.createElement("option");

            option.value = command;
            option.selected = rsg.listener === option.value;
            option.classList.add("listener-option");
            option.innerText = type;

            listenerSelect.appendChild(option);
        })
    },

    initShells: () => {
        rsgData.shells.forEach((shell, i) => {
            const option = document.createElement("option");

            option.selected = rsg.shell === shell;
            option.classList.add("shell-option");
            option.innerText = shell;

            shellSelect.appendChild(option);
        })
    },

    // Updates the rsg state, and forces a re-render
    setState: (newState = {}) => {
        Object.keys(newState).forEach((key) => {
            const value = newState[key];
            rsg[key] = value;
            localStorage.setItem(key, value)
        });
        Object.assign(rsg, newState);

        rsg.update();
    },

    insertParameters: (command, encoder) => {
        return command
            .replaceAll(encoder('{ip}'), encoder(rsg.getIP()))
            .replaceAll(encoder('{port}'), encoder(String(rsg.getPort())))
            .replaceAll(encoder('{shell}'), encoder(rsg.getShell()))
    },

    update: () => {
        rsg.updateListenerCommand()
        rsg.updateTabList()
        rsg.updateReverseShellCommand()
        rsg.updateValues()
    },

    updateValues: () => {
        const listenerOptions = listenerSelect.querySelectorAll(".listener-option");
        listenerOptions.forEach((option)  => {
            option.selected = rsg.listener === option.value;
        });

        const shellOptions = shellSelect.querySelectorAll(".shell-option");
        shellOptions.forEach((option) => {
            option.selected = rsg.shell === option.value;
        });

        const encodingOptions = encodingSelect.querySelectorAll("option");
        encodingOptions.forEach((option) => {
            option.selected = rsg.encoding === option.value;
        });

        ipInput.value = rsg.ip;
        portInput.value = rsg.port;
        operatingSystemSelect.value = rsg.filterOperatingSystem;
        searchBox.value = rsg.filterText;
    },

    updateTabList: () => {
        const data = rsgData.reverseShellCommands;
        const filteredItems = filterCommandData(
            data,
            {
                filterOperatingSystem:  rsg.filterOperatingSystem,
                filterText: rsg.filterText,
                commandType: rsg.commandType
            }
        );

        // Reverse/Bind use protocol list + results list instead of a flat command selection list.
        if (rsg.commandType === CommandType.ReverseShell || rsg.commandType === CommandType.BindShell) {
            rsg.updateProtocolList(filteredItems);
            rsg.updateResultsList(filteredItems);
            return;
        }

        const documentFragment = document.createDocumentFragment();
        if (filteredItems.length === 0) {
            const emptyMessage = document.createElement("button");
            emptyMessage.innerText = "No results found";
            emptyMessage.classList.add("list-group-item", "list-group-item-action", "disabled");

            documentFragment.appendChild(emptyMessage);
        }
        filteredItems.forEach((item, index) => {
            const {
                name,
                command
            } = item;

            const selectionButton = document.createElement("button");

            if (rsg.getSelectedCommandName() === item.name) {
                selectionButton.classList.add("active");
            }

            const clickEvent = () => {
                rsg.selectedValues[rsg.commandType] = name;
                rsg.update();
            }

            selectionButton.innerText = name;
            selectionButton.classList.add("list-group-item", "list-group-item-action");
            selectionButton.addEventListener("click", clickEvent);

            documentFragment.appendChild(selectionButton);
        })

        const listSelectionSelector = rsg.uiElements[rsg.commandType].listSelection;
        document.querySelector(listSelectionSelector).replaceChildren(documentFragment)
    },

    updateProtocolList: (filteredItems) => {
        const protocolCounts = new Map();
        filteredItems.forEach((item) => {
            const p = inferProtocol(item);
            protocolCounts.set(p, (protocolCounts.get(p) || 0) + 1);
        });

        // Ensure selected protocol is valid for current filtered set.
        const current = rsg.getSelectedProtocol();
        const hasCurrent = current && protocolCounts.has(current);
        if (!hasCurrent) {
            const first = PROTOCOL_ORDER.find((p) => protocolCounts.has(p)) || Protocol.Other;
            // Set without forcing localStorage churn for every keystroke if already correct.
            if (rsg.commandType === CommandType.ReverseShell) rsg.protocolReverseShell = first;
            if (rsg.commandType === CommandType.BindShell) rsg.protocolBindShell = first;
        }

        const selected = rsg.getSelectedProtocol();
        const list = document.querySelector(rsg.uiElements[rsg.commandType].listSelection);
        if (!list) return;

        const fragment = document.createDocumentFragment();
        const visibleProtocols = PROTOCOL_ORDER.filter((p) => protocolCounts.has(p));

        if (visibleProtocols.length === 0) {
            const emptyMessage = document.createElement("button");
            emptyMessage.innerText = "No results found";
            emptyMessage.classList.add("list-group-item", "list-group-item-action", "disabled");
            fragment.appendChild(emptyMessage);
            list.replaceChildren(fragment);
            return;
        }

        visibleProtocols.forEach((p) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'justify-content-between', 'align-items-center');
            if (p === selected) btn.classList.add('active');

            const label = document.createElement('span');
            label.innerText = PROTOCOL_LABEL[p] || p;

            const badge = document.createElement('span');
            badge.classList.add('badge', 'badge-pill', p === selected ? 'badge-light' : 'badge-secondary');
            badge.innerText = String(protocolCounts.get(p) || 0);

            btn.appendChild(label);
            btn.appendChild(badge);

            btn.addEventListener('click', () => rsg.setSelectedProtocol(p));
            fragment.appendChild(btn);
        });

        list.replaceChildren(fragment);
    },

    updateResultsList: (filteredItems) => {
        const container = (rsg.commandType === CommandType.ReverseShell) ? reverseShellResults : bindShellResults;
        if (!container) return;

        const selectedProtocol = rsg.getSelectedProtocol() || Protocol.Other;
        const results = filteredItems.filter((item) => inferProtocol(item) === selectedProtocol);

        // Ensure selected command is valid.
        const selectedName = rsg.getSelectedCommandName();
        const hasSelected = results.some((i) => i.name === selectedName);
        if (!hasSelected && results.length > 0) {
            rsg.selectedValues[rsg.commandType] = results[0].name;
        }
        // Keep the hidden pre in sync.
        rsg.updateReverseShellCommand();

        const fragment = document.createDocumentFragment();
        if (results.length === 0) {
            const empty = document.createElement('div');
            empty.classList.add('text-muted', 'small', 'p-3');
            empty.innerText = 'No shells found for this protocol.';
            fragment.appendChild(empty);
            container.replaceChildren(fragment);
            return;
        }

        const selectedNow = rsg.getSelectedCommandName();
        results.forEach((item) => {
            const row = document.createElement('div');
            row.classList.add('rsg-result-row', 'border', 'rounded', 'p-3', 'mb-3');
            if (item.name === selectedNow) row.classList.add('rsg-result-row-selected');

            const header = document.createElement('div');
            header.classList.add('d-flex', 'align-items-center', 'justify-content-between', 'mb-2');

            const title = document.createElement('button');
            title.type = 'button';
            title.classList.add('btn', 'btn-link', 'p-0', 'text-left');
            title.innerText = item.name;
            title.addEventListener('click', () => {
                rsg.selectedValues[rsg.commandType] = item.name;
                rsg.update();
            });

            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.classList.add('btn', 'btn-sm', 'btn-secondary', 'rsg-copy-btn');
            copyBtn.setAttribute('data-toggle', 'tooltip');
            copyBtn.setAttribute('title', 'Copy to clipboard');
            copyBtn.innerHTML = `<span aria-hidden="true">⧉</span>`;
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rendered = rsg.generateCommandForItem(item);
                rsg.copyToClipboard(rendered.text);
            });

            header.appendChild(title);
            header.appendChild(copyBtn);

            const pre = document.createElement('pre');
            pre.classList.add('bg-dark', 'text-wrap', 'text-break', 'p-3', 'mb-0', 'rsg-command-preview');
            const rendered = rsg.generateCommandForItem(item);
            pre.innerHTML = rendered.html;

            row.appendChild(header);
            row.appendChild(pre);
            fragment.appendChild(row);
        });

        container.replaceChildren(fragment);
        // Re-init tooltips for dynamically added buttons.
        if (window.$) {
            window.$(function () {
                window.$('[data-toggle="tooltip"]').tooltip();
            });
        }
    },

    updateListenerCommand: () => {
        const privilegeWarning = document.querySelector("#port-privileges-warning");
        let command = listenerSelect.value;
        command = rsg.highlightParameters(command)
        command = command.replace('{port}', rsg.getPort())
        command = command.replace('{ip}', rsg.getIP())
        command = command.replace('{payload}', rsg.getPayload())
        command = command.replace('{type}', rsg.getType())

        if (rsg.getPort() < 1024) {
            privilegeWarning.style.visibility = "visible";
            command = `<span class="highlighted-warning">sudo</span> ${command}`
        } else {
            privilegeWarning.style.visibility = "hidden";
        }

        listenerCommand.innerHTML = command;
    },

    updateReverseShellSelection: () => {
        document.querySelector(".list-group-item.active") ?.classList.remove("active");
        const elements = Array.from(document.querySelectorAll(".list-group-item"));
        const selectedElement = elements.find((item) => item.innerText === rsg.currentCommandName);
        selectedElement?.classList.add("active");
    },

    updateReverseShellCommand: () => {
        const command = rsg.generateReverseShellCommand();
        const commandSelector = rsg.uiElements[rsg.commandType].command;
        document.querySelector(commandSelector).innerHTML = command;
    },

    updateSwitchStates: () => {
        $('#listener-advanced').collapse($('#listener-advanced-switch').prop('checked') ? 'show' :
            'hide')
        $('#revshell-advanced').collapse($('#revshell-advanced-switch').prop('checked') ? 'show' :
            'hide')
    }
}

/*
    * Init
    */
rsg.init();
rsg.update();

/*
    * Event handlers/functions
    */
ipInput.addEventListener("input", (e) => {
    rsg.setState({
        ip: e.target.value
        })
});

portInput.addEventListener("input", (e) => {
    const value = e.target.value.length === 0 ? '0' : e.target.value;
    rsg.setState({
        port: parsePortOrDefault(value, rsg.getPort())
    })
});

listenerSelect.addEventListener("change", (e) => {
    rsg.setState({
        listener: e.target.value
    })
});

shellSelect.addEventListener("change", (e) => {
    rsg.setState({
        shell: e.target.value
    })
});

encodingSelect.addEventListener("change", (e) => {
    rsg.setState({
        encoding: e.target.value
    })
});

searchBox.addEventListener("input", (e) => {
    rsg.setState({
        filterText: e.target.value
    })
});

document.querySelector('#inc-port').addEventListener('click', () => {
    rsg.setState({
        port: rsg.getPort() + 1
    })
})

document.querySelector('#listener-advanced-switch').addEventListener('change', rsg.updateSwitchStates);
document.querySelector('#revshell-advanced-switch').addEventListener('change', rsg.updateSwitchStates);

setInterval(rsg.updateSwitchStates, 500) // fix switch changes in rapid succession

document.querySelector('#copy-listener').addEventListener('click', () => {
    rsg.copyToClipboard(listenerCommand.innerText)
})

document.querySelector('#copy-reverse-shell-command').addEventListener('click', () => {
    if (!reverseShellCommand) return;
    rsg.copyToClipboard(reverseShellCommand.innerText)
})

document.querySelector('#copy-bind-shell-command').addEventListener('click', () => {
    if (!bindShellCommand) return;
    rsg.copyToClipboard(bindShellCommand.innerText)
})

document.querySelector('#copy-msfvenom-command').addEventListener('click', () => {
    rsg.copyToClipboard(msfVenomCommand.innerText)
})

document.querySelector('#copy-hoaxshell-command').addEventListener('click', () => {
    rsg.copyToClipboard(hoaxShellCommand.innerText)
})

// Download payload functionality removed

// Popper tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});

// TODO: add a random fifo for netcat mkfifo
//let randomId = Math.random().toString(36).substring(2, 4);

