const editorConfigs = {
    spaces: 4,
    undoStack: [{ cursorPositionStart: 0, cursorPositionEnd: 0, value: '' }],
    redoStack: [],
}

document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('input');
    const button = document.getElementById('conspile-button');
    const dotIndicator = document.getElementById('dot-indicator');
    const lineCounter = document.getElementById('line-count-textarea');

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (document.activeElement === textarea)
                button.focus();
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
            const spacesAdded = editorConfigs.spaces - (col % editorConfigs.spaces) || editorConfigs.spaces;
            this.value = beforeString + ' '.repeat(spacesAdded) + currentValue.substring(cursorPosition);

            this.selectionStart = cursorPosition + spacesAdded;
            this.selectionEnd = this.selectionStart;

            growUndoStack(cursorPosition, this.selectionStart, this.value);
        } else if (e.key === 'Backspace') {
            const rowsBeforeCursor = currentValue.substring(0, cursorPosition).split('\n');
            const row = rowsBeforeCursor.length;
            const col = rowsBeforeCursor[rowsBeforeCursor.length - 1].length;

            const tabStartPosition = Math.floor((col - 1) / editorConfigs.spaces) * editorConfigs.spaces;
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
                const fullSpaces = ' '.repeat(editorConfigs.spaces);
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
        } else if (/^\S$/.test(e.key) && !(e.ctrlKey || e.metaKey) && currentValue[cursorPosition] === ' ') {
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
                this.value = editorConfigs.undoStack[editorConfigs.undoStack.length - 1].value;
                this.selectionStart = lastState.cursorPositionStart;
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

    // // Load test code.
    // fetch('./songs/dancing-in-the-moonlight/dancing-in-the-moonlight.moyai')
    //   .then(response => response.text())
    //   .then(data => textarea.value = data);
});

function growUndoStack(cursorPositionStart, cursorPositionEnd, value) {
    editorConfigs.undoStack.push({ cursorPositionStart, cursorPositionEnd, value });
    if (editorConfigs.undoStack.length > 50) {
        editorConfigs.undoStack.shift();
    }
    editorConfigs.redoStack = [];
}

function changeFontSize() {
    const selectedOption = document.getElementById('font').value;
    document.getElementById('input').style.fontSize = selectedOption + 'rem';
    document.getElementById('dot-indicator').style.fontSize = selectedOption + 'rem';
    document.getElementById('line-count-template').style.fontSize = selectedOption + 'rem';
    document.getElementById('line-count-textarea').style.fontSize = selectedOption + 'rem';
}

function changeTabSpace() {
    const selectedOption = document.getElementById('tab-space').value;
    editorConfigs.spaces = parseInt(selectedOption, 10);
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