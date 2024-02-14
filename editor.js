const editorConfigs = {
    fontSize: 5,
    rootSize: 2,
    tabSpaces: 4,
    undoStackSize: 50,
    replaceSpace: false,
    showLines: true,
    theme: 'ocean',
    undoStack: [{ cursorPositionStart: 0, cursorPositionEnd: 0, value: '' }],
    redoStack: [],
    showOptions: false,
}

const configOptions = {
    editorFontSize: {
        '50%': 0.5,
        '60%': 0.6,
        '70%': 0.7,
        '80%': 0.8,
        '90%': 0.9,
        '100%': 1.0,
        '110%': 1.1,
        '120%': 1.2,
        '130%': 1.3,
        '140%': 1.4,
        '150%': 1.5,
    },
    rootFontSize: {
        '80%': 0.8,
        '90%': 0.9,
        '100%': 1.0,
        '110%': 1.1,
        '120%': 1.2,
        '130%': 1.3,
        '140%': 1.4,
        '150%': 1.5,
        '160%': 1.6,
        '170%': 1.7,
        '180%': 1.8,
    },
    tabSpaces: {
        min: 2,
        max: 16,
    },
    undoStackSize: {
        min: 0,
        max: 100,
        interval: 25,
    },
    theme: {
        'ocean': {
            darker: '#0A2647',
            dark: '#144272',
            light: '#205295',
            lighter: '#2C74B3',
            lighterRGB: [44, 116, 179],
        },
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('input');
    const transpileButton = document.getElementById('transpile-button');
    const dotIndicator = document.getElementById('dot-indicator');
    const lineCounter = document.getElementById('line-count-textarea');

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (document.activeElement === textarea)
                transpileButton.focus();
            else
                textarea.focus();
        }
    });

    textarea.addEventListener('scroll', function () {
        dotIndicator.scrollTop = textarea.scrollTop;
        dotIndicator.scrollLeft = textarea.scrollLeft;
        lineCounter.scrollTop = textarea.scrollTop;
    });

    textarea.addEventListener('input', function () {
        dotIndicator.scrollTop = textarea.scrollTop;
        dotIndicator.scrollLeft = textarea.scrollLeft;
        lineCounter.scrollTop = textarea.scrollTop;
        growUndoStack(this.selectionStart + 1, this.selectionStart, this.value);
        updateDots();
        updateLineCounter();
    });

    textarea.addEventListener('keydown', function (e) {
        const cursorPosition = this.selectionStart;
        const currentValue = this.value;

        if (e.key === 'Tab') {
            e.preventDefault();

            const rowsBeforeCursor = currentValue.substring(0, cursorPosition).split('\n');
            const row = rowsBeforeCursor.length;
            const col = rowsBeforeCursor[rowsBeforeCursor.length - 1].length;

            const beforeString = currentValue.substring(0, cursorPosition);
            const spacesAdded = editorConfigs.tabSpaces - (col % editorConfigs.tabSpaces) || editorConfigs.tabSpaces;
            this.value = beforeString + ' '.repeat(spacesAdded) + currentValue.substring(cursorPosition);

            this.selectionStart = cursorPosition + spacesAdded;
            this.selectionEnd = this.selectionStart;

            growUndoStack(this.selectionStart + 1, this.selectionStart, this.value);
        } else if (e.key === 'Backspace') {
            const rowsBeforeCursor = currentValue.substring(0, cursorPosition).split('\n');
            const row = rowsBeforeCursor.length;
            const col = rowsBeforeCursor[rowsBeforeCursor.length - 1].length;

            const tabStartPosition = Math.floor((col - 1) / editorConfigs.tabSpaces) * editorConfigs.tabSpaces;
            const extraSpaces = currentValue.substring(tabStartPosition, cursorPosition);

            if (this.selectionStart != this.selectionEnd) {
                e.preventDefault();

                const originalStart = this.selectionStart;
                const originalEnd = this.selectionEnd;

                const beforeSelection = currentValue.substring(0, this.selectionStart);
                this.value = beforeSelection + currentValue.substring(this.selectionEnd);
                this.selectionStart = beforeSelection.length;
                this.selectionEnd = this.selectionStart;

                growUndoStack(originalEnd, originalStart, this.value);
            } else if (extraSpaces.endsWith(' ')) {
                e.preventDefault();

                var spacesSubstring;
                const fullSpaces = ' '.repeat(editorConfigs.tabSpaces);
                for (let i = 0; i < fullSpaces.length; i++) {
                    spacesSubstring = fullSpaces.substring(i);
                    if (currentValue.substring(tabStartPosition, cursorPosition).endsWith(spacesSubstring)) {
                        break;
                    }
                }
                this.value = currentValue.substring(0, cursorPosition - spacesSubstring.length) + currentValue.substring(cursorPosition)

                this.selectionStart = cursorPosition - spacesSubstring.length;
                this.selectionEnd = this.selectionStart;

                growUndoStack(cursorPosition, this.selectionStart, this.value);
            }
        } else if (editorConfigs.replaceSpace && /^\S$/.test(e.key) && !(e.ctrlKey || e.metaKey) && currentValue[cursorPosition] === ' ') {
            e.preventDefault();
            this.value = currentValue.substring(0, cursorPosition) + e.key + currentValue.substring(cursorPosition + 1)
            this.selectionStart = cursorPosition + 1;
            this.selectionEnd = this.selectionStart;

            growUndoStack(cursorPosition, this.selectionStart, this.value);
        } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (editorConfigs.undoStack.length > 1) {
                lastState = editorConfigs.undoStack.pop();
                editorConfigs.redoStack.push(lastState);

                const oldText = editorConfigs.undoStack[editorConfigs.undoStack.length - 1].value
                const lengthDifference = this.value.length - oldText.length;
                this.value = oldText;
                this.selectionStart = lastState.cursorPositionStart - (lengthDifference + 1);
                this.selectionEnd = this.selectionStart;
            }
        } else if (e.key === 'Z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            if (editorConfigs.redoStack.length > 0) {
                editorConfigs.undoStack.push(editorConfigs.redoStack.pop());
                this.value = editorConfigs.undoStack[editorConfigs.undoStack.length - 1].value;
                this.selectionStart = editorConfigs.undoStack[editorConfigs.undoStack.length - 1].cursorPositionEnd;
                this.selectionEnd = this.selectionStart;
            }
        }
        updateDots();
        updateLineCounter();
    });

    // Editor font size settings.
    document.getElementById('editor-font-button').addEventListener('click', function(e) {
        if (e.button === 0) {
            editorConfigs.fontSize = (editorConfigs.fontSize + 1) % Object.keys(configOptions.editorFontSize).length;
            this.textContent = updateEditorFontSize();
        }
    });

    document.getElementById('editor-font-button').addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const max = Object.keys(configOptions.editorFontSize).length;
        editorConfigs.fontSize = (editorConfigs.fontSize + max - 1) % max;
        this.textContent = updateEditorFontSize();
    });

    function updateEditorFontSize() {
        const objectKey = Object.keys(configOptions.editorFontSize)[editorConfigs.fontSize];
        const newFontSize = configOptions.editorFontSize[objectKey];
        document.getElementById('input').style.fontSize = newFontSize + 'rem';
        document.getElementById('dot-indicator').style.fontSize = newFontSize + 'rem';
        document.getElementById('line-count-template').style.fontSize = newFontSize + 'rem';
        document.getElementById('line-count-textarea').style.fontSize = newFontSize + 'rem';
        return objectKey;
    }
    
    // Root font size settings.
    document.getElementById('root-font-button').addEventListener('click', function(e) {
        if (e.button === 0) {
            editorConfigs.rootSize = (editorConfigs.rootSize + 1) % Object.keys(configOptions.rootFontSize).length;
            this.textContent = updateRootFontSize();
        }
    });

    document.getElementById('root-font-button').addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const max = Object.keys(configOptions.rootFontSize).length;
        editorConfigs.rootSize = (editorConfigs.rootSize + max - 1) % max;
        this.textContent = updateRootFontSize();
    });

    function updateRootFontSize() {
        const objectKey = Object.keys(configOptions.rootFontSize)[editorConfigs.rootSize];
        const newRootSize = configOptions.rootFontSize[objectKey];
        document.documentElement.style.fontSize = newRootSize + 'rem';
        return objectKey
    }

    // Tab spaces settings.
    document.getElementById('tab-space-button').addEventListener('click', function(e) {
        if (e.button === 0) {
            const currentValue = editorConfigs.tabSpaces;
            const min = configOptions.tabSpaces.min;
            const max = configOptions.tabSpaces.max;
            editorConfigs.tabSpaces = cycleOption(currentValue, min, max, 1);
            this.textContent = editorConfigs.tabSpaces;
        }
    });
    
    document.getElementById('tab-space-button').addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const currentValue = editorConfigs.tabSpaces;
        const min = configOptions.tabSpaces.min;
        const max = configOptions.tabSpaces.max;
        editorConfigs.tabSpaces = cycleOption(currentValue, min, max, -1);
        this.textContent = editorConfigs.tabSpaces;
    });

    // Undo stack size settings.
    document.getElementById('stack-size-button').addEventListener('click', function(e) {
        if (e.button === 0) {
            const currentValue = editorConfigs.undoStackSize;
            const min = configOptions.undoStackSize.min;
            const max = configOptions.undoStackSize.max;
            const interval = configOptions.undoStackSize.interval;
            editorConfigs.undoStackSize = cycleOption(currentValue, min, max, 1, interval);
            this.textContent = editorConfigs.undoStackSize;
        }
    });

    document.getElementById('stack-size-button').addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const currentValue = editorConfigs.undoStackSize;
        const min = configOptions.undoStackSize.min;
        const max = configOptions.undoStackSize.max;
        const interval = configOptions.undoStackSize.interval;
        editorConfigs.undoStackSize = cycleOption(currentValue, min, max, -1, interval);
        this.textContent = editorConfigs.undoStackSize;
    });

    // Replace spaces settings.
    document.getElementById('replace-space-button').addEventListener('click', function(e) {
        editorConfigs.replaceSpace = !editorConfigs.replaceSpace;
        this.textContent = editorConfigs.replaceSpace ? 'Yes' : 'No';
    });

    document.getElementById('replace-space-button').addEventListener('contextmenu', function(e) {
        e.preventDefault();
        editorConfigs.replaceSpace = !editorConfigs.replaceSpace;
        this.textContent = editorConfigs.replaceSpace ? 'Yes' : 'No';
    });

    // Line number settings.
    document.getElementById('show-lines-button').addEventListener('click', function(e) {
        toggleLines();
        this.textContent = editorConfigs.showLines ? 'Yes' : 'No';
    });
    
    document.getElementById('show-lines-button').addEventListener('contextmenu', function(e) {
        e.preventDefault();
        toggleLines();
        this.textContent = editorConfigs.showLines ? 'Yes' : 'No';
    });

    function toggleLines() {
        editorConfigs.showLines = !editorConfigs.showLines;
        if (editorConfigs.showLines) {
            document.getElementById('text-input-container').style.gridTemplateColumns = 'auto 1fr';
        } else {
            document.getElementById('text-input-container').style.gridTemplateColumns = '0 1fr';
        }
    }

    document.getElementById('statusbar').addEventListener('click', function() {
        document.getElementById('workspace').style.gridTemplateRows = '2.5rem 1fr auto';
        document.getElementById('status').classList.add('hovered');
    });

    document.getElementById('statusbar').addEventListener('mouseenter', function() {
        document.getElementById('workspace').style.gridTemplateRows = '2.5rem 1fr auto';
        document.getElementById('status').classList.add('hovered');
    });

    document.getElementById('statusbar').addEventListener('mouseleave', function() {
        document.getElementById('workspace').style.gridTemplateRows = '';
        document.getElementById('status').classList.remove('hovered');
    });

    // // Load test code.
    // fetch('./songs/dancing-in-the-moonlight/dancing-in-the-moonlight.moyai')
    //   .then(response => response.text())
    //   .then(data => textarea.value = data);
});

function growUndoStack(cursorPositionStart, cursorPositionEnd, value) {
    editorConfigs.undoStack.push({ cursorPositionStart, cursorPositionEnd, value });
    if (editorConfigs.undoStack.length > editorConfigs.undoStackSize) {
        editorConfigs.undoStack.shift();
    }
    editorConfigs.redoStack = [];
}

function toggleOptionsVisibility() {
    if (editorConfigs.showOptions) {
        document.getElementById('options-exit-button').style.display = 'none';
        document.getElementById('options-menu-text').style.display = 'none';
        document.getElementById('options-container').style.display = 'none';
        document.getElementById('input').focus();
    } else {
        document.getElementById('options-exit-button').style.display = 'block';
        document.getElementById('options-menu-text').style.display = 'block';
        document.getElementById('options-container').style.display = 'block';
    }
    document.getElementById('options-button').classList.toggle('menu-active');
    editorConfigs.showOptions = !editorConfigs.showOptions;
}

function updateDots() {
    document.getElementById('dot-indicator').value = document.getElementById('input').value.replaceAll(/(?![\r\n])\s/g, '·').replaceAll(/[^·\n]/g, ' ');
}

function updateLineCounter() {
    const numberOfLines = (document.getElementById('input').value.match(/\n/g) || []).length + 1;
    document.getElementById('line-count-template').textContent = `${numberOfLines}`;
    var linesText = '';
    for (let lineNumber = 0; lineNumber < numberOfLines; lineNumber++)
        linesText += (lineNumber + 1) + '\n';
    document.getElementById('line-count-textarea').value = linesText;
}

function cycleOption(value, min, max, delta, interval = 1) {
    const valueN = value - min;
    const maxN = (max - min) + interval;
    return ((valueN + maxN + delta * interval) % maxN) + min;
}
