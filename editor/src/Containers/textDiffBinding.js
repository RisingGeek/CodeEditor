class TextDiffBinding {
  constructor(element, compoThis, doc, path) {
    this.element = element;
    this.compoThis = compoThis || null;
    this.doc = doc;
    this.path = path || [];
  }

  _get = () => {
    var value = this.doc.data;
    for (var i = 0; i < this.path.length; i++) {
      var segment = this.path[i];
      value = value[segment];
    }
    return value;
  };

  _getInputEnd = (previous, value) => {
    // if (this.element !== document.activeElement) return null;
    var end = value.length - this.element.selectionStart;
    if (end === 0) return end;
    if (previous.slice(previous.length - end) !== value.slice(value.length - end)) return null;
    return end;
  };

  onInput = (prevValue, newValue, e) => {
    var previous = this.doc.data.content;
    // Monaco Editor considers new line as \r\n.
    let value = newValue.replace(/\r\n/g, '\n'); 
    if (previous === value) return;

    var start = 0;
    // Attempt to use the DOM cursor position to find the end
    var end = this._getInputEnd(previous, value);
    if (end === null) {
      // If we failed to find the end based on the cursor, do a diff. When
      // ambiguous, prefer to locate ops at the end of the string, since users
      // more frequently add or remove from the end of a text input
      while (previous.charAt(start) === value.charAt(start)) {
        start++;
      }
      end = 0;
      while (
        previous.charAt(previous.length - 1 - end) === value.charAt(value.length - 1 - end) &&
        end + start < previous.length &&
        end + start < value.length
      ) {
        end++;
      }
    } else {
      while (
        previous.charAt(start) === value.charAt(start) &&
        start + end < previous.length &&
        start + end < value.length
      ) {
        start++;
      }
    }
    if (previous.length !== start + end) {
      var removed = previous.slice(start, previous.length - end);
      this._remove(start, removed, e.changes[0].rangeOffset);
    }
    if (value.length !== start + end) {
      var inserted = value.slice(start, value.length - end);
      this._insert(start, inserted, e.changes[0].rangeOffset);
    }
  };

  _insert = (index, text, rangeOffset) => {
    var path = this.path.concat(index);
    var op = { p: path, si: text, rangeOffset: rangeOffset };
    this.doc.submitOp(op, { source: this });
  };

  _remove = (index, text, rangeOffset) => {
    var path = this.path.concat(index);
    var op = { p: path, sd: text, rangeOffset: rangeOffset };
    this.doc.submitOp(op, { source: this });
  };

  onInsert = (rangeOffset, length) => {
    this._transformSelectionAndUpdate(rangeOffset, length, this.insertCursorTransform);
  };
  insertCursorTransform = (rangeOffset, length, cursorOffset) => {
    //rangeOffset->rangeOffset of editor which actually edited
    //cursorOffset->rangeOffset of my editor
    return (rangeOffset < cursorOffset) ? cursorOffset + length : cursorOffset;
  }

  onRemove = (rangeOffset, length) => {
    this._transformSelectionAndUpdate(rangeOffset, length, this.removeCursorTransform);
  };
  removeCursorTransform = (rangeOffset, length, cursorOffset) => {
    // rangeOffset, cursorOffset same as insertCursorTransform()
    // Taking minimum because if one user deletes text written by other(cursor position), 
    // cursorOffset will become -ve if we do cursorOffset-length
    return (rangeOffset < cursorOffset) ? cursorOffset -= Math.min(length, cursorOffset - rangeOffset) : cursorOffset;
  }

  _transformSelectionAndUpdate = (rangeOffset, length, transformCursor) => {
    let editor = this.compoThis.state.editor;
    let cursorOffset = editor.getModel().getOffsetAt(editor.getPosition());
    var startOffset = transformCursor(rangeOffset, length, cursorOffset);
    this.update();
    editor.setSelection(new this.compoThis.state.monaco.Range(
      editor.getModel().getPositionAt(startOffset).lineNumber, editor.getModel().getPositionAt(startOffset).column,
      editor.getModel().getPositionAt(startOffset).lineNumber, editor.getModel().getPositionAt(startOffset).column)
    );
  };

  update = (isSetup) => {
    var value = this._get();
    this.compoThis.setState({ code: value });
    if (isSetup) {
      // Current cursor position
      this.compoThis.state.editor.setSelection(new this.compoThis.state.monaco.Range(1, 1, 1, 1));
    }
  };
  
}
export default TextDiffBinding;

// This code has been modified according to the needs.
// Original code of StringBinding is present at https://github.com/share/text-diff-binding