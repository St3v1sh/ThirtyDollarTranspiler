const editorConfigs = {
    fontSize: 5,
    rootSize: 2,
    tabSpaces: 4,
    undoStackSize: 50,
    replaceSpace: false,
    showLines: true,
    theme: 0,
    undoStack: [],
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
    themes: {
        'modern': {
            darker: '#16181f',
            dark: '#2b2d34',
            light: '#414755',
            lighter: '#a0a0a0',
            lighterRGB: '160, 160, 160',
        },
        'contrast': {
            darker: '#a5a5a5',
            dark: '#18262e',
            light: '#7b7b7b',
            lighter: '#ffffff',
            lighterRGB: '255, 255, 255',
        },
        'ocean': {
            darker: '#092749',
            dark: '#111111',
            light: '#0c3d75',
            lighter: '#7ea7c9',
            lighterRGB: '126, 167, 201',
        },
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('input');
    const transpileButton = document.getElementById('transpile-button');
    const dotIndicator = document.getElementById('dot-indicator');
    const lineCounter = document.getElementById('line-count-textarea');
    const lineCounterTemplate = document.getElementById('line-count-template');

    const preInputState = { selectionStart: 0, selectionEnd: 0, selectionDirection: 'forward', value: '' };

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (document.activeElement === textarea)
                transpileButton.focus();
            else
                textarea.focus();
        }
    });

    textarea.addEventListener('scroll', function () {
        updateScrolling();
    });

    textarea.addEventListener('input', function() {
        growUndoStack();
    });

    textarea.addEventListener('keydown', function(e) {
        preInputState.selectionStart = this.selectionStart;
        preInputState.selectionEnd = this.selectionEnd;
        preInputState.selectionDirection = this.selectionDirection;
        preInputState.value = this.value;

        switch(e.key.toLowerCase()) {
            case 'z':
                if (!(e.ctrlKey || e.metaKey))
                    break;
                e.preventDefault();

                // Ctrl + shift + z to redo.
                if (e.shiftKey) {
                    redo();
                    break;
                }

                // Ctrl + z to undo.
                undo();
                break;

            case 'y':
                if (!(e.ctrlKey || e.metaKey))
                    break;
                e.preventDefault();

                // Ctrl + y to redo.
                redo();
                break;
            default:
                if (e.ctrlKey || e.metaKey)
                    break;

                // Space replacing.
                if (editorConfigs.replaceSpace && this.selectionStart === this.selectionEnd && e.key.length === 1 && e.key !== ' ' && this.value[this.selectionStart] === ' ') {
                    e.preventDefault();

                    this.value = this.value.substring(0, this.selectionStart) + e.key + this.value.substring(this.selectionStart + 1);
                    this.selectionStart = preInputState.selectionStart + 1;
                    this.selectionEnd = this.selectionStart;

                    growUndoStack();
                }
        }
    });

    function growUndoStack() {
        const undoStackLength = editorConfigs.undoStack.length;
        if ((undoStackLength && editorConfigs.undoStack[undoStackLength - 1].value) === preInputState.value)
            return;
    
        while (editorConfigs.undoStack.length > editorConfigs.undoStackSize) {
            editorConfigs.undoStack.shift();
        }
        editorConfigs.undoStack.push({ ...preInputState });
        editorConfigs.redoStack = [];
        
        updateScrolling();
        updateDots();
        updateLineCounter();
    }

    function undo() {
        if (editorConfigs.undoStack.length < 1)
            return;

        const undoState = editorConfigs.undoStack.pop();
        editorConfigs.redoStack.push({ ...preInputState });

        restoreState(undoState);
        
    }

    function redo() {
        if (editorConfigs.redoStack.length < 1)
            return;

        const redoState = editorConfigs.redoStack.pop();
        editorConfigs.undoStack.push({ ...preInputState });

        restoreState(redoState);
    }

    function restoreState({ selectionStart, selectionEnd, selectionDirection, value }) {
        textarea.value = value;
        textarea.selectionStart = selectionStart;
        textarea.selectionEnd = selectionEnd;
        textarea.selectionDirection = selectionDirection;

        updateScrolling();
        updateDots();
        updateLineCounter();
    }

    function updateScrolling() {
        dotIndicator.scrollTop = textarea.scrollTop;
        dotIndicator.scrollLeft = textarea.scrollLeft;
        lineCounter.scrollTop = textarea.scrollTop;
    }

    function updateDots() {
        dotIndicator.value = textarea.value.replaceAll(/(?![\r\n])\s/g, '·').replaceAll(/[^·\n]/g, ' ');
    }
    
    function updateLineCounter() {
        const numberOfLines = (textarea.value.match(/\n/g) || []).length + 1;
        lineCounterTemplate.textContent = `${numberOfLines}`;
        var linesText = '';
        for (let lineNumber = 0; lineNumber < numberOfLines; lineNumber++)
            linesText += (lineNumber + 1) + '\n';
        lineCounter.value = linesText;
    }

    // textarea.addEventListener('input', function () {
    //     dotIndicator.scrollTop = textarea.scrollTop;
    //     dotIndicator.scrollLeft = textarea.scrollLeft;
    //     lineCounter.scrollTop = textarea.scrollTop;
    //     growUndoStack(this.selectionStart + 1, this.selectionStart, this.value);
    //     updateDots();
    //     updateLineCounter();
    // });

    // textarea.addEventListener('keydown', function (e) {
    //     const selectionStart = this.selectionStart;
    //     const selectionEnd = this.selectionEnd;
    //     const currentValue = this.value;

    //     if (e.key === 'Tab' && e.shiftKey) {
    //         e.preventDefault();

    //         if (selectionStart === selectionEnd) {

    //         } else {
    //             const beforeString = currentValue.substring(0, selectionStart);
    //             const rowsBeforeCursor = beforeString.split('\n');
    //             const col = rowsBeforeCursor[rowsBeforeCursor.length - 1].length;
    //             const selectionLineEnd = currentValue.indexOf('\n', selectionEnd);
    //             const selectionLineEndN = selectionLineEnd === -1 ? currentValue.length : selectionLineEnd;
    //             const beforeSelectionLineEnd = currentValue.substring(0, selectionLineEndN);
    //             const rows = beforeSelectionLineEnd.split('\n');
    //             const rowStart = (beforeString.match(/\n/g) || []).length;
    //             const rowEnd = rows.length;

    //             const rowsBeforeCursorEnd = currentValue.substring(0, selectionEnd).split('\n');
    //             const colEnd = rowsBeforeCursorEnd[rowsBeforeCursorEnd.length - 1].length;

    //             var lineShrinks = { first: 0, last: 0, total: 0 };
    //             this.value = beforeString.substring(0, beforeString.lastIndexOf('\n'));
    //             rows.slice(rowStart, rowEnd).forEach((row, index) => {
    //                 const tabbingRegex = new RegExp(`^ {1,${editorConfigs.tabSpaces}}`, 'g');

    //                 const spacesRemoved = (row.match(tabbingRegex) || [''])[0].length;
    //                 lineShrinks.total += spacesRemoved;
    //                 if (index === 0) {
    //                     if (col < editorConfigs.tabSpaces)
    //                         lineShrinks.first = col;
    //                     else
    //                         lineShrinks.first = spacesRemoved;
    //                 } else if (index === rowEnd - rowStart - 1) {
    //                     if (colEnd < editorConfigs.tabSpaces)
    //                         lineShrinks.last = colEnd;
    //                     else
    //                         lineShrinks.last = 0;
    //                 }

    //                 this.value += (this.value.length > 0 ? '\n' : '') + row.replace(tabbingRegex, '');
    //             });
    //             this.value += currentValue.substring(selectionLineEndN);

    //             this.selectionStart = selectionStart - lineShrinks.first;
    //             this.selectionEnd = selectionEnd - lineShrinks.total + (colEnd > editorConfigs.tabSpaces ? 0 : editorConfigs.tabSpaces - lineShrinks.last);

    //             growUndoStack(selectionStart, selectionEnd, this.value, tabbed = true);
    //         }
    //     } else if (e.key === 'Tab') {
    //         e.preventDefault();

    //         const beforeString = currentValue.substring(0, selectionStart);
    //         if (selectionStart === selectionEnd) {
    //             const rowsBeforeCursor = beforeString.split('\n');
    //             const col = rowsBeforeCursor[rowsBeforeCursor.length - 1].length;

    //             const spacesAdded = editorConfigs.tabSpaces - (col % editorConfigs.tabSpaces) || editorConfigs.tabSpaces;
    //             this.value = beforeString + ' '.repeat(spacesAdded) + currentValue.substring(selectionStart);

    //             this.selectionStart = selectionStart + spacesAdded;
    //             this.selectionEnd = this.selectionStart;

    //             growUndoStack(this.selectionStart, this.selectionStart, this.value);
    //         } else {
    //             const shouldFollow = /^\S$/.test(currentValue[selectionStart - 1]) ? true : false;
    //             const beforeSelectionEnd = currentValue.substring(0, selectionEnd);
    //             const rows = beforeSelectionEnd.split('\n');
    //             const rowStart = (beforeString.match(/\n/g) || []).length;
    //             const rowEnd = rows.length;

    //             var lineGrowths = { first: 0, total: 0 };
    //             this.value = beforeString.substring(0, beforeString.lastIndexOf('\n'));
    //             rows.slice(rowStart, rowEnd).forEach((row, index) => {
    //                 const col = row.search(/\S/);
    //                 const colN = col === -1 ? row.length : col;
    //                 const spacesAdded = editorConfigs.tabSpaces - (colN % editorConfigs.tabSpaces) || editorConfigs.tabSpaces;
    //                 const spacesAddedN = row.length > 0 ? spacesAdded : 0;
    //                 this.value += (this.value.length > 0 ? '\n' : '') + ' '.repeat(spacesAddedN) + row;

    //                 lineGrowths.total += spacesAddedN;
    //                 if (index === 0)
    //                     lineGrowths.first = spacesAddedN;
    //             });
    //             this.value += currentValue.substring(selectionEnd);

    //             this.selectionStart = selectionStart + (shouldFollow ? lineGrowths.first : 0);
    //             this.selectionEnd = selectionEnd + lineGrowths.total;

    //             growUndoStack(selectionStart, selectionEnd, this.value, tabbed = true);
    //         }
    //     } else if (e.key === 'Backspace') {
    //         const rowsBeforeCursor = currentValue.substring(0, selectionStart).split('\n');
    //         const row = rowsBeforeCursor.length;
    //         const col = rowsBeforeCursor[rowsBeforeCursor.length - 1].length;

    //         const tabStartPosition = Math.floor((col - 1) / editorConfigs.tabSpaces) * editorConfigs.tabSpaces;
    //         const extraSpaces = currentValue.substring(tabStartPosition, selectionStart);

    //         if (this.selectionStart != this.selectionEnd) {
    //             e.preventDefault();

    //             const originalStart = this.selectionStart;

    //             const beforeSelection = currentValue.substring(0, this.selectionStart);
    //             this.value = beforeSelection + currentValue.substring(this.selectionEnd);
    //             this.selectionStart = beforeSelection.length;
    //             this.selectionEnd = this.selectionStart;

    //             growUndoStack(originalStart + 1, this.selectionEnd, this.value);
    //         } else if (extraSpaces.endsWith(' ')) {
    //             e.preventDefault();

    //             var spacesSubstring;
    //             const fullSpaces = ' '.repeat(editorConfigs.tabSpaces);
    //             for (let i = 0; i < fullSpaces.length; i++) {
    //                 spacesSubstring = fullSpaces.substring(i);
    //                 if (currentValue.substring(tabStartPosition, selectionStart).endsWith(spacesSubstring)) {
    //                     break;
    //                 }
    //             }
    //             this.value = currentValue.substring(0, selectionStart - spacesSubstring.length) + currentValue.substring(selectionStart)

    //             this.selectionStart = selectionStart - spacesSubstring.length;
    //             this.selectionEnd = this.selectionStart;

    //             growUndoStack(selectionStart, this.selectionStart, this.value);
    //         }
    //     }
    // });

    // Editor font size settings.
    document.getElementById('editor-font-button').addEventListener('click', function (e) {
        if (e.button === 0) {
            editorConfigs.fontSize = (editorConfigs.fontSize + 1) % Object.keys(configOptions.editorFontSize).length;
            this.textContent = updateEditorFontSize();
        }
    });

    document.getElementById('editor-font-button').addEventListener('contextmenu', function (e) {
        e.preventDefault();
        const max = Object.keys(configOptions.editorFontSize).length;
        editorConfigs.fontSize = (editorConfigs.fontSize + max - 1) % max;
        this.textContent = updateEditorFontSize();
    });

    function updateEditorFontSize() {
        const objectKey = Object.keys(configOptions.editorFontSize)[editorConfigs.fontSize];
        const newFontSize = configOptions.editorFontSize[objectKey];
        textarea.style.fontSize = newFontSize + 'rem';
        dotIndicator.style.fontSize = newFontSize + 'rem';
        lineCounterTemplate.style.fontSize = newFontSize + 'rem';
        lineCounter.style.fontSize = newFontSize + 'rem';
        return objectKey;
    }

    // Root font size settings.
    document.getElementById('root-font-button').addEventListener('click', function (e) {
        if (e.button === 0) {
            editorConfigs.rootSize = (editorConfigs.rootSize + 1) % Object.keys(configOptions.rootFontSize).length;
            this.textContent = updateRootFontSize();
        }
    });

    document.getElementById('root-font-button').addEventListener('contextmenu', function (e) {
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
    document.getElementById('tab-space-button').addEventListener('click', function (e) {
        if (e.button === 0) {
            const currentValue = editorConfigs.tabSpaces;
            const min = configOptions.tabSpaces.min;
            const max = configOptions.tabSpaces.max;
            editorConfigs.tabSpaces = cycleOption(currentValue, min, max, 1);
            this.textContent = editorConfigs.tabSpaces;
        }
    });

    document.getElementById('tab-space-button').addEventListener('contextmenu', function (e) {
        e.preventDefault();
        const currentValue = editorConfigs.tabSpaces;
        const min = configOptions.tabSpaces.min;
        const max = configOptions.tabSpaces.max;
        editorConfigs.tabSpaces = cycleOption(currentValue, min, max, -1);
        this.textContent = editorConfigs.tabSpaces;
    });

    // Undo stack size settings.
    document.getElementById('stack-size-button').addEventListener('click', function (e) {
        if (e.button === 0) {
            const currentValue = editorConfigs.undoStackSize;
            const min = configOptions.undoStackSize.min;
            const max = configOptions.undoStackSize.max;
            const interval = configOptions.undoStackSize.interval;
            editorConfigs.undoStackSize = cycleOption(currentValue, min, max, 1, interval);
            this.textContent = editorConfigs.undoStackSize;
        }
    });

    document.getElementById('stack-size-button').addEventListener('contextmenu', function (e) {
        e.preventDefault();
        const currentValue = editorConfigs.undoStackSize;
        const min = configOptions.undoStackSize.min;
        const max = configOptions.undoStackSize.max;
        const interval = configOptions.undoStackSize.interval;
        editorConfigs.undoStackSize = cycleOption(currentValue, min, max, -1, interval);
        this.textContent = editorConfigs.undoStackSize;
    });

    // Replace spaces settings.
    document.getElementById('replace-space-button').addEventListener('click', function () {
        editorConfigs.replaceSpace = !editorConfigs.replaceSpace;
        this.textContent = editorConfigs.replaceSpace ? 'Yes' : 'No';
    });

    document.getElementById('replace-space-button').addEventListener('contextmenu', function (e) {
        e.preventDefault();
        editorConfigs.replaceSpace = !editorConfigs.replaceSpace;
        this.textContent = editorConfigs.replaceSpace ? 'Yes' : 'No';
    });

    // Line number settings.
    document.getElementById('show-lines-button').addEventListener('click', function () {
        toggleLines();
        this.textContent = editorConfigs.showLines ? 'Yes' : 'No';
    });

    document.getElementById('show-lines-button').addEventListener('contextmenu', function (e) {
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

    // Color theme settings.
    document.getElementById('change-theme-button').addEventListener('click', function (e) {
        if (e.button === 0) {
            editorConfigs.theme = (editorConfigs.theme + 1) % Object.keys(configOptions.themes).length;
            this.textContent = cycleThemes();
        }
    });

    document.getElementById('change-theme-button').addEventListener('contextmenu', function (e) {
        e.preventDefault();
        const max = Object.keys(configOptions.themes).length;
        editorConfigs.theme = (editorConfigs.theme + max - 1) % Object.keys(configOptions.themes).length;
        this.textContent = cycleThemes();
    });

    function cycleThemes() {
        const objectKey = Object.keys(configOptions.themes)[editorConfigs.theme];
        const newThemeColors = configOptions.themes[objectKey];
        Object.entries(newThemeColors).forEach(([color, value]) => {
            document.documentElement.style.setProperty(`--${color}`, value);
        });
        return objectKey;
    }

    // Status bar logic.
    document.getElementById('statusbar').addEventListener('click', function () {
        document.getElementById('workspace').style.gridTemplateRows = '2.5rem 1fr auto';
        document.getElementById('status').classList.add('hovered');
    });

    document.getElementById('statusbar').addEventListener('mouseenter', function () {
        document.getElementById('workspace').style.gridTemplateRows = '2.5rem 1fr auto';
        document.getElementById('status').classList.add('hovered');
    });

    document.getElementById('statusbar').addEventListener('mouseleave', function () {
        document.getElementById('workspace').style.gridTemplateRows = '';
        document.getElementById('status').classList.remove('hovered');
    });

    // // Load test code.
    // fetch('./songs/dancing-in-the-moonlight/dancing-in-the-moonlight.moyai')
    //   .then(response => response.text())
    //   .then(data => textarea.value = data);
});

function toggleOptionsVisibility() {
    editorConfigs.showOptions = !editorConfigs.showOptions;
    if (editorConfigs.showOptions) {
        document.getElementById('options-exit-button').style.display = 'block';
        document.getElementById('options-menu-text').style.display = 'block';
        document.getElementById('options-container').style.display = 'block';
        document.getElementById('options-button').classList.add('menu-active')
    } else {
        document.getElementById('options-exit-button').style.display = 'none';
        document.getElementById('options-menu-text').style.display = 'none';
        document.getElementById('options-container').style.display = 'none';
        document.getElementById('options-button').classList.remove('menu-active')
        document.getElementById('input').focus();
    }
}

function cycleOption(value, min, max, delta, interval = 1) {
    const valueN = value - min;
    const maxN = (max - min) + interval;
    return ((valueN + maxN + delta * interval) % maxN) + min;
}
