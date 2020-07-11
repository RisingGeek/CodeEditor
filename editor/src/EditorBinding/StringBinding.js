import TextDiffBinding from './TextDiffBinding';

class StringBinding extends TextDiffBinding {
  setup = () => {
    this.update(true);
    let docData = this.doc.data;
    this.updateInputOutput(this.input, docData.input[0], 'input');
    this.updateInputOutput(this.output, docData.output[0], 'output');
    this.attachDoc();
  };

  // Editor onChange listener
  _inputListener = (newValue, e) => {
    this.onInput(newValue, e);
  };

  // I/O input onChange listener
  _inoutListener = (before, after, key) => {
    if (before === after)
      return;
    let path = [key, 0];
    let op = { p: path, ld: before, li: after };
    this.doc.submitOp(op, { source: this });
  }

  attachDoc = () => {
    this.doc.on('op', this.onListener);
  };

  onListener = (op, source) => {
    let component = op[0];
    if (this.isSubpath(this.path, component.p)) {
      this._parseInsertRemoveOp(component, 'si', 'onInsert');
      this._parseInsertRemoveOp(component, 'sd', 'onRemove');
    } else if (this.isSubpath(component.p, this.path)) {
      this._parseParentOp();
    }
  };

  _parseInsertRemoveOp(component, key, onHandler) {
    if (!component[key]) return;
    let rangeOffset = component.rangeOffset;
    let length = component[key].length;
    this[onHandler](rangeOffset, length);
  }

  _parseParentOp = () => {
    this.update();
  };

  isSubpath = (path, testPath) => {
    for (var i = 0; i < path.length; i++) {
      if (testPath[i] !== path[i]) return false;
    }
    return true;
  }

  updateInputOutput(before, after, key) {
    if (before === after) return;
    //check
    // this.compoThis.setState({ [key]: after });
  }
}

export default StringBinding;

// This code has been modified to support Monaco Editor.
// Original code of StringBinding is present at https://github.com/share/sharedb-string-binding
