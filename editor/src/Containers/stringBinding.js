import TextDiffBinding from './textDiffBinding';

class StringBinding extends TextDiffBinding {
  constructor(element, compoThis, doc, path) {
    super(element, compoThis, doc,path);
    this._opListener = null;
    this._inputListener = null;
    this._outListener = null;
    this._inListener = null;
  }

  setup = () => {
    this.update(true);
    this.attachDoc();
    this.attachElement();
  };

  destroy = () => {
    this.doc.removeListener('op', this._opListener);
  };

  attachElement = () => {
    var binding = this;
    this._inputListener = (prevValue, newValue, e) => {
      binding.onInput(prevValue, newValue, e);
    };
    this._outListener = (before, output) => {
      binding._insertOut(before, output);
    }
    this._inListener = (before, input) => {
      binding._insertIn(before, input);
    }
  };

  attachDoc = () => {
    var binding = this;
    this._opListener = (op, source) => {
      binding._onOp(op, source);
    };
    this.doc.on('op', this._opListener);
  };

  _onOp = (op, source) => {
    if (source === this) return;
    if (op.length === 0) return;
    if (op.length > 1) {
      throw new Error('Op with multiple components emitted');
    }
    console.log(op, source);
    var component = op[0];
    if (component.p[0] === 'output') {
      this.updateOutput(component.ld, component.li);
    }
    else if (component.p[0] === 'input') {
      this.updateInput(component.ld, component.li);
    }
    else if (this.isSubpath(this.path, component.p)) {
      this._parseInsertOp(component);
      this._parseRemoveOp(component);
    } else if (this.isSubpath(component.p, this.path)) {
      this._parseParentOp();
    }
  };

  _parseInsertOp = (component) => {
    if (!component.si) return;
    var rangeOffset = component.rangeOffset;
    var length = component.si.length;
    let count = component.si.split("\n").length - 1;
    // console.log(count);
    length += count;
    this.onInsert(rangeOffset, length);
  };

  _parseRemoveOp = (component) => {
    if (!component.sd) return;
    var rangeOffset = component.rangeOffset;
    var length = component.sd.length;
    this.onRemove(rangeOffset, length);
  };

  _parseParentOp = () => {
    this.update();
  };


  _insertOut = (before, output) => {
    let path = ['output', 0];
    let op = { p: path, ld: before, li: output };
    this.doc.submitOp(op, { source: this });
  }

  _insertIn = (before, input) => {
    let path = ['input', 0];
    let op = { p: path, ld: before, li: input };
    this.doc.submitOp(op, { source: this });
  }

  isSubpath = (path, testPath) => {
    for (var i = 0; i < path.length; i++) {
      if (testPath[i] !== path[i]) return false;
    }
    return true;
  }
}

export default StringBinding;

// This code has been modified according to the needs.
// Original code of StringBinding is present at https://github.com/share/sharedb-string-binding
