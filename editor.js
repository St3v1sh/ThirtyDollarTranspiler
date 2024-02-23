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
  fileName: 'untitled',
  fileExtension: 'txt',
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
      darker: '#bbbbbb',
      dark: '#d2d2d2',
      light: '#898989',
      lighter: '#000000',
      lighterRGB: '0, 0, 0',
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
  const fileOpener = document.getElementById('file-opener');

  const preInputState = { selectionStart: 0, selectionEnd: 0, selectionDirection: 'forward', value: '' };
  var cutLine = '';

  // Load settings from localstorage.
  const fontSize = localStorage.getItem('fontSize');
  const rootSize = localStorage.getItem('rootSize');
  const tabSpaces = localStorage.getItem('tabSpaces');
  const undoStackSize = localStorage.getItem('undoStackSize');
  const replaceSpace = localStorage.getItem('replaceSpace');
  const showLines = localStorage.getItem('showLines');
  const theme = localStorage.getItem('theme');

  if (fontSize) {
    editorConfigs.fontSize = parseInt(fontSize, 10);
    updateEditorFontSize();
  }
  if (rootSize) {
    editorConfigs.rootSize = parseInt(rootSize, 10);
    updateRootFontSize();
  }
  if (tabSpaces) {
    editorConfigs.tabSpaces = parseInt(tabSpaces, 10);
    document.getElementById('tab-space-button').textContent = tabSpaces;
  }
  if (undoStackSize) {
    editorConfigs.undoStackSize = parseInt(undoStackSize, 10);
    document.getElementById('stack-size-button').textContent = undoStackSize;
  }
  if (replaceSpace) {
    editorConfigs.replaceSpace = JSON.parse(replaceSpace);
    document.getElementById('replace-space-button').textContent = replaceSpace ? 'Yes' : 'No';
  }
  if (showLines) {
    editorConfigs.showLines = JSON.parse(showLines);
    updateLinesVisibility();
  }
  if (theme) {
    editorConfigs.theme = theme;
    updateTheme();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.activeElement === textarea)
        transpileButton.focus();
      else
        textarea.focus();
    } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();

      saveToFile(textarea.value, editorConfigs.fileName, editorConfigs.fileExtension)
        .then(() => reportOK(`${editorConfigs.fileName}.${editorConfigs.fileExtension} saved.`))
        .catch(() => reportError('File save cancelled.'));
    } else if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      fileOpener.click();
    }
  });

  fileOpener.addEventListener('change', function () {
    const file = this.files[0];
    if (!file)
      return;

    const [fileName, fileExtension] = file.name.split('.');
    const reader = new FileReader();

    reader.onload = (e) => {
      textarea.value = e.target.result;
      editorConfigs.fileName = fileName;
      editorConfigs.fileExtension = fileExtension;

      updateScrolling();
      updateDots();
      updateLineCounter();
    };
    reader.readAsText(file);
  });

  textarea.addEventListener('scroll', function () {
    updateScrolling();
  });

  textarea.addEventListener('input', function () {
    growUndoStack();
  });

  textarea.addEventListener('keydown', function (e) {
    preInputState.selectionStart = this.selectionStart;
    preInputState.selectionEnd = this.selectionEnd;
    preInputState.selectionDirection = this.selectionDirection;
    preInputState.value = this.value;

    const ctrlKey = e.ctrlKey || e.metaKey;

    switch (e.key.toLowerCase()) {
      case 'z': {
        if (!ctrlKey)
          break;
        e.preventDefault();

        if (e.shiftKey) {
          // Ctrl + shift + z to redo.
          redo();
          break;
        }

        // Ctrl + z to undo.
        undo();
        break;
      }

      case 'y': {
        if (!ctrlKey)
          break;
        e.preventDefault();

        // Ctrl + y to redo.
        redo();
        break;
      }

      case 'enter': {
        if (ctrlKey || e.shiftKey)
          break;
        // Preserve line indent for new line.
        e.preventDefault();

        const colStart = getCol(this.selectionStart);
        const spacesPadding = this.value.substring(this.selectionStart - colStart, this.selectionStart).search(/\S/);
        const spacesPaddingN = spacesPadding === -1 ? colStart : spacesPadding;

        this.value = preInputState.value.substring(0, preInputState.selectionStart) + '\n' + ' '.repeat(spacesPaddingN) + preInputState.value.substring(preInputState.selectionEnd);

        const selectionStart = preInputState.selectionStart + spacesPaddingN + 1;
        setSelection(selectionStart, selectionStart, preInputState.selectionDirection);

        growUndoStack()
        break;
      }

      case 'x': {
        // Ctrl + x to cut line if there's no selection.
        if (!(ctrlKey && this.selectionStart === this.selectionEnd) || e.shiftKey)
          break;
        e.preventDefault();

        const colStart = getCol(this.selectionStart);
        const lineStart = this.selectionStart - colStart;
        const lineEnd = this.value.indexOf('\n', this.selectionStart);

        if (lineEnd === -1) {
          cutLine = this.value.substring(lineStart, this.value.length) + '\n';
          this.value = preInputState.value.substring(0, lineStart - 1);
        } else {
          cutLine = this.value.substring(lineStart, lineEnd + 1);
          this.value = preInputState.value.substring(0, lineStart) + preInputState.value.substring(lineStart + cutLine.length);
        }

        navigator.clipboard.writeText(cutLine);
        setSelection(lineStart, lineStart, preInputState.selectionDirection);

        growUndoStack();
        break;
      }

      case 'arrowup':
      case 'arrowdown': {
        if (e.shiftKey || !this.value.substring(this.selectionStart, this.selectionEnd).includes('\n'))
          break;
        e.preventDefault();

        const lineMarkers = { column: 0, current: 0, next: 0 };
        if (e.key.toLowerCase() === 'arrowup') {
          lineMarkers.column = getCol(this.selectionStart);

          const lineStart = this.value.substring(0, this.selectionStart).lastIndexOf('\n');
          lineMarkers.current = lineStart === -1 ? 0 : lineStart;

          lineMarkers.next = this.value.substring(0, lineMarkers.current).lastIndexOf('\n');
        } else {
          lineMarkers.column = getCol(this.selectionEnd);

          const lineEnd = this.value.indexOf('\n', this.selectionEnd);
          lineMarkers.next = lineEnd === -1 ? this.value.length : lineEnd;

          const nextLineEnd = this.value.indexOf('\n', lineMarkers.next + 1);
          lineMarkers.current = nextLineEnd === -1 ? this.value.length : nextLineEnd;
        }

        const selectionStart = Math.min(lineMarkers.next + lineMarkers.column + 1, lineMarkers.current);
        setSelection(selectionStart, selectionStart, preInputState.selectionDirection);
        break;
      }

      case 'backspace': {
        if (this.textLength && this.selectionStart === this.selectionEnd && this.value[this.selectionStart - 1] === ' ') {
          const col = getCol(this.selectionStart);
          const lineBeforeSelectionStart = this.value.substring(this.selectionStart - col, this.selectionStart);
          if (ctrlKey) {
            // Delete until the last word or until the last space.
            e.preventDefault();

            const trimmedLineBeforeSelectionStart = lineBeforeSelectionStart.trimEnd();
            const spacesRemoved = lineBeforeSelectionStart.length - trimmedLineBeforeSelectionStart.length;
            var amountRemoved = spacesRemoved;
            if (spacesRemoved === 1 && trimmedLineBeforeSelectionStart.length) {
              const lastWordPosition = trimmedLineBeforeSelectionStart.lastIndexOf(' ') + 1;
              amountRemoved = lineBeforeSelectionStart.length - lastWordPosition;
            }

            this.value = this.value.substring(0, this.selectionStart - amountRemoved) + this.value.substring(this.selectionStart);

            const selectionStart = preInputState.selectionStart - amountRemoved;
            setSelection(selectionStart, selectionStart, preInputState.selectionDirection);
          } else {
            // Delete spaces, snapping to tab spaces grid.
            if (lineBeforeSelectionStart.length === 0 || lineBeforeSelectionStart.trim().length !== 0)
              break;
            e.preventDefault();

            const spacesRemoved = (lineBeforeSelectionStart.length % editorConfigs.tabSpaces) || editorConfigs.tabSpaces;
            this.value = this.value.substring(0, this.selectionStart - spacesRemoved) + this.value.substring(this.selectionStart);

            const selectionStart = preInputState.selectionStart - spacesRemoved;
            setSelection(selectionStart, selectionStart, preInputState.selectionDirection);
          }
          growUndoStack();
        }
        break;
      }

      case 'tab': {
        e.preventDefault();

        const { row: rowStart, col: colStart } = getRowCol(this.selectionStart);
        const { row: rowEnd, col: colEnd } = getRowCol(this.selectionEnd);

        const isEndOfLineSelected = this.selectionEnd < this.value.length ? this.value[this.selectionEnd] === '\n' : true;
        const isLineSectionSelection = rowStart === rowEnd && !(colStart === 0 && isEndOfLineSelected);
        // Case: no line selection. Indent to the next grid line.
        if (!e.shiftKey && (this.selectionStart === this.selectionEnd || isLineSectionSelection)) {
          const spacesAdded = (editorConfigs.tabSpaces - (colStart % editorConfigs.tabSpaces)) || editorConfigs.tabSpaces;

          this.value = this.value.substring(0, this.selectionStart) + ' '.repeat(spacesAdded) + this.value.substring(this.selectionEnd);

          const selectionStart = preInputState.selectionStart + spacesAdded;
          setSelection(selectionStart, selectionStart, preInputState.selectionDirection);

          growUndoStack();
          break;
        }

        const selectionStartLineStart = this.selectionStart - colStart;
        const selectionEndLineEnd = this.value.indexOf('\n', this.value[this.selectionEnd - 1] == '\n' ? this.selectionEnd - 1 : this.selectionEnd);
        const selectionEndLineEndN = selectionEndLineEnd < selectionStartLineStart ? this.value.length : Math.max(selectionStartLineStart, selectionEndLineEnd);
        const rowsSlice = this.value.substring(selectionStartLineStart, selectionEndLineEndN).split('\n');

        const lineDeltas = { firstCorrection: 0, lastCorrection: 0, total: 0 }
        var newValue = this.value.substring(0, this.selectionStart - colStart);
        // Case: multi-line selection. Indent or outdent selected lines forwards or backwards a grid line.
        rowsSlice.forEach((row, index) => {
          const colContentStart = row.search(/\S/);
          const colContentStartN = colContentStart === -1 ? row.length : colContentStart;
          // Calculate the number of spaces added / removed.
          const spacesDelta = (row.length > 0) ? (
            (e.shiftKey) ? (
              (colContentStartN > 0) ? (
                colContentStartN % editorConfigs.tabSpaces || editorConfigs.tabSpaces
              ) : (
                0
              )
            ) : (
              editorConfigs.tabSpaces - (colContentStartN % editorConfigs.tabSpaces)
            )
          ) : (
            0
          );

          // Calculate the first line selection correction.
          if (index === 0)
            lineDeltas.firstCorrection = (colContentStartN < colStart) ? (
              spacesDelta
            ) : (
              (e.shiftKey && (colContentStartN - colStart < editorConfigs.tabSpaces)) ? (
                spacesDelta - (colContentStartN - colStart)
              ) : (
                0
              )
            );
          // Calculate the last line selection correction.
          if (index === rowsSlice.length - 1)
            lineDeltas.lastCorrection = (colEnd === 0 || colContentStartN < colEnd) ? (
              0
            ) : (
              (e.shiftKey && (colContentStartN - colEnd <= spacesDelta)) ? (
                colContentStartN - colEnd
              ) : (
                spacesDelta
              )
            );
          lineDeltas.total += spacesDelta;

          newValue += (index !== 0 ? '\n' : '');
          newValue += (e.shiftKey) ? (
            row.substring(spacesDelta)
          ) : (
            ' '.repeat(spacesDelta) + row
          );
        });
        this.value = newValue + this.value.substring(selectionEndLineEndN);

        if (lineDeltas.total === 0)
          break;

        if (e.shiftKey)
          setSelection(preInputState.selectionStart - lineDeltas.firstCorrection, preInputState.selectionEnd - lineDeltas.total + lineDeltas.lastCorrection, preInputState.selectionDirection);
        else
          setSelection(preInputState.selectionStart + lineDeltas.firstCorrection, preInputState.selectionEnd + lineDeltas.total - lineDeltas.lastCorrection, preInputState.selectionDirection);

        growUndoStack();
        break;
      }

      default: {
        if (ctrlKey)
          break;

        if (editorConfigs.replaceSpace && this.selectionStart === this.selectionEnd && e.key.length === 1 && e.key !== ' ' && this.value[this.selectionStart] === ' ') {
          // Replace space in front.
          e.preventDefault();

          this.value = this.value.substring(0, this.selectionStart) + e.key + this.value.substring(this.selectionStart + 1);

          const selectionStart = preInputState.selectionStart + 1;
          setSelection(selectionStart, selectionStart, preInputState.selectionDirection);

          growUndoStack();
        }
      }
    }
  });

  textarea.addEventListener('paste', function (e) {
    // If the pasted line is the cut line, paste like the caret is at the beginning of the line.
    const pastedText = (e.clipboardData || window.clipboardData).getData('text').replace(/\r/g, '');
    if (pastedText !== cutLine || this.selectionStart === this.value.length)
      return;
    e.preventDefault();

    const colStart = getCol(this.selectionStart);
    const lineStart = this.selectionStart - colStart;

    this.value = preInputState.value.substring(0, lineStart) + cutLine + preInputState.value.substring(lineStart);

    const selectionStart = lineStart + cutLine.length;
    setSelection(selectionStart, selectionStart, preInputState.selectionDirection);

    growUndoStack();
  });

  function setSelection(selectionStart, selectionEnd, selectionDirection) {
    textarea.selectionStart = selectionStart;
    textarea.selectionEnd = selectionEnd;
    textarea.selectionDirection = selectionDirection;
  }

  function getRow(position) {
    return (textarea.value.substring(0, position).match(/\n/g) || []).length;
  }

  function getCol(position) {
    return position - textarea.value.substring(0, position).lastIndexOf('\n') - 1
  }

  function getRowCol(position) {
    const prePositionValue = textarea.value.substring(0, position);
    const row = (prePositionValue.match(/\n/g) || []).length;
    const col = position - prePositionValue.lastIndexOf('\n') - 1;

    return { row, col };
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

  function growUndoStack() {
    const undoStackLength = editorConfigs.undoStack.length;
    if ((undoStackLength && editorConfigs.undoStack[undoStackLength - 1].value) === preInputState.value) {
      updateScrolling();
      updateDots();
      updateLineCounter();
      return;
    }

    while (editorConfigs.undoStack.length > editorConfigs.undoStackSize) {
      editorConfigs.undoStack.shift();
    }
    editorConfigs.undoStack.push({ ...preInputState });
    editorConfigs.redoStack = [];

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

  // Editor font size settings.
  document.getElementById('editor-font-button').addEventListener('click', function (e) {
    if (e.button === 0) {
      editorConfigs.fontSize = (editorConfigs.fontSize + 1) % Object.keys(configOptions.editorFontSize).length;
      updateEditorFontSize();

      localStorage.setItem('fontSize', editorConfigs.fontSize);
    }
  });

  document.getElementById('editor-font-button').addEventListener('contextmenu', function (e) {
    e.preventDefault();
    const max = Object.keys(configOptions.editorFontSize).length;
    editorConfigs.fontSize = (editorConfigs.fontSize + max - 1) % max;
    updateEditorFontSize();

    localStorage.setItem('fontSize', editorConfigs.fontSize);
  });

  function updateEditorFontSize() {
    const objectKey = Object.keys(configOptions.editorFontSize)[editorConfigs.fontSize];
    const fontSize = configOptions.editorFontSize[objectKey];
    textarea.style.fontSize = fontSize + 'rem';
    dotIndicator.style.fontSize = fontSize + 'rem';
    lineCounterTemplate.style.fontSize = fontSize + 'rem';
    lineCounter.style.fontSize = fontSize + 'rem';
    document.getElementById('editor-font-button').textContent = objectKey;
  }

  // Root font size settings.
  document.getElementById('root-font-button').addEventListener('click', function (e) {
    if (e.button === 0) {
      editorConfigs.rootSize = (editorConfigs.rootSize + 1) % Object.keys(configOptions.rootFontSize).length;
      updateRootFontSize();

      localStorage.setItem('rootSize', editorConfigs.rootSize);
    }
  });

  document.getElementById('root-font-button').addEventListener('contextmenu', function (e) {
    e.preventDefault();
    const max = Object.keys(configOptions.rootFontSize).length;
    editorConfigs.rootSize = (editorConfigs.rootSize + max - 1) % max;
    updateRootFontSize();

    localStorage.setItem('rootSize', editorConfigs.rootSize);
  });

  function updateRootFontSize() {
    const objectKey = Object.keys(configOptions.rootFontSize)[editorConfigs.rootSize];
    const newRootSize = configOptions.rootFontSize[objectKey];
    document.documentElement.style.fontSize = newRootSize + 'rem';
    document.getElementById('root-font-button').textContent = objectKey;
  }

  // Tab spaces settings.
  document.getElementById('tab-space-button').addEventListener('click', function (e) {
    if (e.button === 0) {
      const currentValue = editorConfigs.tabSpaces;
      const min = configOptions.tabSpaces.min;
      const max = configOptions.tabSpaces.max;
      editorConfigs.tabSpaces = cycleOption(currentValue, min, max, 1);
      this.textContent = editorConfigs.tabSpaces;

      localStorage.setItem('tabSpaces', editorConfigs.tabSpaces);
    }
  });

  document.getElementById('tab-space-button').addEventListener('contextmenu', function (e) {
    e.preventDefault();
    const currentValue = editorConfigs.tabSpaces;
    const min = configOptions.tabSpaces.min;
    const max = configOptions.tabSpaces.max;
    editorConfigs.tabSpaces = cycleOption(currentValue, min, max, -1);
    this.textContent = editorConfigs.tabSpaces;

    localStorage.setItem('tabSpaces', editorConfigs.tabSpaces);
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

      localStorage.setItem('undoStackSize', editorConfigs.undoStackSize);
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

    localStorage.setItem('undoStackSize', editorConfigs.undoStackSize);
  });

  // Replace spaces settings.
  document.getElementById('replace-space-button').addEventListener('click', function () {
    editorConfigs.replaceSpace = !editorConfigs.replaceSpace;
    this.textContent = editorConfigs.replaceSpace ? 'Yes' : 'No';

    localStorage.setItem('replaceSpace', editorConfigs.replaceSpace);
  });

  document.getElementById('replace-space-button').addEventListener('contextmenu', function (e) {
    e.preventDefault();
    editorConfigs.replaceSpace = !editorConfigs.replaceSpace;
    this.textContent = editorConfigs.replaceSpace ? 'Yes' : 'No';

    localStorage.setItem('replaceSpace', editorConfigs.replaceSpace);
  });

  // Line number settings.
  document.getElementById('show-lines-button').addEventListener('click', function () {
    editorConfigs.showLines = !editorConfigs.showLines;
    updateLinesVisibility();

    localStorage.setItem('showLines', editorConfigs.showLines);
  });

  document.getElementById('show-lines-button').addEventListener('contextmenu', function (e) {
    e.preventDefault();
    editorConfigs.showLines = !editorConfigs.showLines;
    updateLinesVisibility();

    localStorage.setItem('showLines', editorConfigs.showLines);
  });

  function updateLinesVisibility() {
    if (editorConfigs.showLines) {
      document.getElementById('show-lines-button').textContent = 'Yes';
      document.getElementById('text-input-container').style.gridTemplateColumns = 'auto 1fr';
    } else {
      document.getElementById('show-lines-button').textContent = 'No';
      document.getElementById('text-input-container').style.gridTemplateColumns = '0 1fr';
    }
  }

  // Color theme settings.
  document.getElementById('change-theme-button').addEventListener('click', function (e) {
    if (e.button === 0) {
      editorConfigs.theme = (editorConfigs.theme + 1) % Object.keys(configOptions.themes).length;
      this.textContent = updateTheme();

      localStorage.setItem('theme', editorConfigs.theme);
    }
  });

  document.getElementById('change-theme-button').addEventListener('contextmenu', function (e) {
    e.preventDefault();
    const max = Object.keys(configOptions.themes).length;
    editorConfigs.theme = (editorConfigs.theme + max - 1) % Object.keys(configOptions.themes).length;
    this.textContent = updateTheme();

    localStorage.setItem('theme', editorConfigs.theme);
  });

  function updateTheme() {
    const objectKey = Object.keys(configOptions.themes)[editorConfigs.theme];
    const newThemeColors = configOptions.themes[objectKey];
    Object.entries(newThemeColors).forEach(([color, value]) => {
      document.documentElement.style.setProperty(`--${color}`, value);
    });
    return objectKey;
  }

  // Status bar logic.
  document.getElementById('statusbar').addEventListener('click', function () {
    document.getElementById('workspace').style.gridTemplateRows = '3rem 1fr auto';
    document.getElementById('status').classList.add('hovered');
  });

  document.getElementById('statusbar').addEventListener('mouseenter', function () {
    document.getElementById('workspace').style.gridTemplateRows = '3rem 1fr auto';
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

// window.onbeforeunload = function () {
//   return true;
// }
