let activeColor = 'red';
document.getElementById('button-red').classList.add('button-selected');
let isSelecting = false;
let startCell = null;
let endCell = null;
const grid = document.getElementById('text-grid');
const output = document.getElementById('output');

function adjustTextareaHeight(textarea) {
  textarea = document.getElementById('ascii-input')
  textarea.style.height = 'auto'; // Temporarily shrink to content size
  textarea.style.height = textarea.scrollHeight + 'px'; // Set to exact content height
}

// Event listener for input changes
document.getElementById('ascii-input').addEventListener('input', function() {
    adjustTextareaHeight();
});

// Initial adjustment
adjustTextareaHeight();

document.getElementById('colorize-button').addEventListener('click', () => {
  const inputText = document.getElementById('ascii-input').value;
  grid.innerHTML = ''; // Clear previous grid if any
  output.innerHTML = '';

  let row = 0;
  let maxCols = 0;
  inputText.split('\n').forEach((line) => {
    let col = 0;
    const lineDiv = document.createElement('div'); // Create a new div for each line
    line.split('').forEach((char) => {
      const charSpan = document.createElement('span');
      charSpan.id = `cell-${row}-${col}`;
      charSpan.row = row;
      charSpan.col = col;
      charSpan.innerHTML = char === ' ' ? '&nbsp;' : char;
      charSpan.classList.add('grid-cell'); // Add a class for styling
      lineDiv.appendChild(charSpan);
      maxCols = Math.max(maxCols, col);
      col++;
    });
    grid.appendChild(lineDiv);
    row++;
  });

  let maxRow = row;
  grid.dataset.rows = maxRow;
  grid.dataset.cols = maxCols;

  // document.getElementById('ascii-input').style.display = 'none';
  output.rows = row;
  output.cols = grid.cols;
  let color = getCurrentColor();
  applyColorToSelection(color);
  for (const elementId of [ 'text-grid', 'color-picker', 'output', 'copy-button' ]) {
    document.getElementById(elementId).style.display = 'block';
  }
});

grid.addEventListener('mousedown', (event) => {
  isSelecting = true;
  startCell = getCellFromEvent(event);
});

grid.addEventListener('mousemove', (event) => {
  if (!isSelecting) return;
  endCell = getCellFromEvent(event);
  highlightSelection();
});

grid.addEventListener('mouseup', () => {
  isSelecting = false;
  let color = getCurrentColor();
  applyColorToSelection(color);
});

function getCellFromEvent(event) {
  // Determine which cell the event occurred in
  // This can be done using event.target if each cell has a unique identifier
  return event.target;
}

function clearSelection(color) {
  // Clear existing selection highlights
  document.querySelectorAll(`.grid-cell.selected-${color}`).forEach(cell => {
    removeAllColors(cell);
    cell.classList.remove(`selected-${color}`);
  });
}

function highlightSelection() {
  let color = getCurrentColor();
  clearSelection(color);
  const startRow = parseInt(startCell.row);
  const startCol = parseInt(startCell.col);
  const endRow = parseInt(endCell.row);
  const endCol = parseInt(endCell.col);

  for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
    for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
      const cell = document.querySelector(`#cell-${row}-${col}`);
      removeAllColors(cell);
      cell.classList.add(`selected-${color}`);
    }
  }
}

function applyColorToSelection(color) {
  document.querySelectorAll(`.grid-cell.selected-${color}`).forEach(cell => {
    removeAllColors(cell);
    cell.classList.add(`applied-${color}`);
  });
  refreshOutput();
}

function deselectColorButtons() {
  document.querySelectorAll('.color-button').forEach(button => {
    button.classList.remove('button-selected');
  });
}

document.querySelectorAll('.color-button').forEach(button => {
  btn => btn.classList.remove('button-selected');
  button.addEventListener('click', function() {
    activeColor = event.target.dataset.color;
    deselectColorButtons();
    this.classList.add('button-selected');
  });
});

function getCurrentColor() {
  return activeColor || 'red';
}

function removeAllColors(cell) {
  const colors = Object.keys(colorToANSICode).filter(key => key !== 'default');
  for (let index = 0; index < colors.length; index++) {
    cell.classList.remove(`selected-${colors[index]}`);
    cell.classList.remove(`applied-${colors[index]}`);
  }
}

const colorToANSICode = {
  'black': '\\033[30m',
  'red': '\\033[31m',
  'green': '\\033[32m',
  'yellow': '\\033[33m',
  'blue': '\\033[34m',
  'magenta': '\\033[35m',
  'cyan': '\\033[36m',
  'white': '\\033[37m',
  'default': '\\033[0m' // Reset to default color
};

function extractCellColor(cell) {
  // Filter the classes to find the one that starts with 'applied-'
  const appliedClass = Array.from(cell.classList).find(className => className.startsWith('applied-'));

  if (appliedClass) {
    // Remove the 'applied-' prefix to get the color name
    return appliedClass.replace('applied-', '');
  }

  return 'default';
}

function generateANSIText() {
  let outputText = '';
  let lastColor = 'default';

  const inputText = document.getElementById('ascii-input');

  for (let row = 0; row <= grid.dataset.rows; row++) {
    if (row > 0) {
      outputText += colorToANSICode['default'];
      outputText += '\n'; // New line at the end of each row
    }
    for (let col = 0; col <= grid.dataset.cols; col++) {
      const cell = document.querySelector(`#cell-${row}-${col}`);
      if (cell) {
        const cellColor = extractCellColor(cell);
        let value = cell.textContent;
        if ((value == '') || (value == '&nbsp;')) {
          value = ' ';
        } else if (value == '\\') {
          value = '\\\\';
        }
        const cellText = value;

        if (cellColor !== lastColor) {
          outputText += colorToANSICode[cellColor] || '';
          lastColor = cellColor;
        }

        outputText += cellText;
      }
    };
  };

  return outputText;
}

function refreshOutput() {
  const output = generateANSIText();
  document.getElementById('output').value = output;
};

document.getElementById('copy-button').addEventListener('click', () => {
  const outputArea = document.getElementById('output');
  const copyButton = document.getElementById('copy-button');
  outputArea.select();
  outputArea.setSelectionRange(0, 99999);

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      copyButton.textContent = 'Copied!';
      outputArea.blur();
      // Set a timeout to revert the button text back after 1 second
      setTimeout(() => {
        copyButton.textContent = 'Copy to Clipboard';
      }, 1000);
    }
  } catch (err) {
    alert('Failed to copy text.');
  }
});
