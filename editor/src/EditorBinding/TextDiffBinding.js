class TextDiffBinding {
  constructor(compoThis, doc, path) {
    this.compoThis = compoThis || null;
    this.doc = doc;
    this.path = path || [];
  }

  onInput = (newValue, e) => {
    let previous = this.doc.data[this.path[0]];
    // Monaco Editor considers new line as \r\n.
    let value = newValue;
    if (previous === value) return;

    let start = 0;
    let end = 0;
    while (previous.charAt(start) === value.charAt(start)) {
      start++;
    }
    while (
      previous.charAt(previous.length - 1 - end) === value.charAt(value.length - 1 - end) &&
      end + start < previous.length &&
      end + start < value.length
    ) {
      end++;
    }
    if (previous.length !== start + end) {
      let removed = previous.slice(start, previous.length - end);
      this._remove(start, removed, e.changes[0].rangeOffset);
    }
    if (value.length !== start + end) {
      let inserted = value.slice(start, value.length - end);
      this._insert(start, inserted, e.changes[0].rangeOffset);
    }
  };

  _insert = (index, text, rangeOffset) => {
    let path = this.path.concat(index);
    let op = { p: path, si: text, rangeOffset: rangeOffset };
    this.doc.submitOp(op, { source: this });
  };

  _remove = (index, text, rangeOffset) => {
    let path = this.path.concat(index);
    let op = { p: path, sd: text, rangeOffset: rangeOffset };
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
    let startOffset = transformCursor(rangeOffset, length, cursorOffset);
    this.update();
    editor.setSelection(new this.compoThis.state.monaco.Range(
      editor.getModel().getPositionAt(startOffset).lineNumber, editor.getModel().getPositionAt(startOffset).column,
      editor.getModel().getPositionAt(startOffset).lineNumber, editor.getModel().getPositionAt(startOffset).column)
    );
  };

  update = (isSetup) => {
    let value = this.doc.data[this.path[0]];
    this.compoThis.setState({ code: value }, () => {
      // Update peer cursor
      if (this.compoThis.state.range) {
        let range = this.compoThis.state.range;
        let isPos = range.startLineNumber === range.endLineNumber &&
          range.startColumn === range.endColumn;
        let decorations = this.compoThis.state.editor.deltaDecorations(this.compoThis.state.decorations, [
          {
            range: new this.compoThis.state.monaco.Range(range.startLineNumber, range.startColumn,
              range.endLineNumber, range.endColumn),
            options: { className: isPos ? 'cursor-position' : 'cursor-selection' }
          }
        ]);
        this.compoThis.setState({decorations: decorations});
      }
    });
  };

}
export default TextDiffBinding;

// This code has been modified according to the needs.
// Original code of StringBinding is present at https://github.com/share/text-diff-binding