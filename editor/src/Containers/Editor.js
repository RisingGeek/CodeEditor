import React, { Component, Fragment } from 'react';
import { Row, Col } from 'antd';

class Editor extends Component {
    state = {
        codes: ["#include<iostream>"],
        col: 0
    }

    handleChange = (e, idx) => {
        //shallow copy of codes
        let codes = [...this.state.codes];
        let str = e.currentTarget.value;
        codes[idx]=str;
        this.setState({codes});
    }

    handleKeyUp = (e, idx) => {
        let ctrl = e.currentTarget;
        if (e.key === 'Enter') {
            //shallow copy of codes
            let codes = [...this.state.codes];
            //copy remaining string from cursor ro end
            let end = ctrl.selectionEnd;
            let nextString = codes[idx].substring(end);
            codes[idx] = codes[idx].substring(0, end);
            //add new row
            codes.splice(idx+1, 0, nextString);
            this.setState({codes}, () => {
                //move cursor to next input on enter
                //ctrl = next input element
                ctrl = ctrl.parentElement.nextSibling.children[0];
                ctrl.focus();
                ctrl.setSelectionRange(0, 0);
            });
        }
        else if(e.key === 'Backspace' && this.state.codes[idx].length === 0 && this.state.codes.length > 1) {
            //move cursor to prev input when current input is empty
            //ctrl = previous input element
            let ctrl = e.currentTarget.parentElement.previousSibling.children[0];
            //setSelectionRange sets the start and end positions of current text selection in <input />
            let pos = ctrl.value.length;
            ctrl.focus();
            ctrl.setSelectionRange(pos, pos);
            
            //delete current row
            let codes = [...this.state.codes];
            codes.splice(idx, 1);
            this.setState({codes});
        }
        else if(e.key === 'ArrowDown' && idx != this.state.codes.length-1) {
            let ctrl = e.currentTarget.parentElement.nextSibling.children[0];
            ctrl.focus();
            ctrl.setSelectionRange(this.state.col, this.state.col);
        }
        else if(e.key === 'ArrowUp' && idx != 0) {
            let ctrl = e.currentTarget.parentElement.previousSibling.children[0];
            ctrl.focus();
            ctrl.setSelectionRange(this.state.col, this.state.col);
        }
    }

    handleKeyDown = e => {
        if(e.key === 'ArrowDown') {
            this.setState({col: e.currentTarget.selectionEnd});
        }
        else if(e.key === 'ArrowUp') {
            this.setState({col: e.currentTarget.selectionEnd});
        }
    }


    render() {
        const codes = this.state.codes;
        return (
            <Fragment>
            <Row>
                <Col span={2}>
                {
                    //spread operator iterable to loop over lines
                    codes.map((code, key) => (
                        <input type="text" value={key+1} readOnly />
                        ))
                }
                </Col>
                <Col span={22}>
                {
                    codes.map((code, idx) => (
                    <div>
                    <input type="text" value={code} 
                    onChange={e => this.handleChange(e, idx)}
                    onKeyDown={this.handleKeyDown}
                    onKeyUp={e => this.handleKeyUp(e, idx)}
                    />
                    </div>
                    ))
                }
                </Col>
            </Row>
            </Fragment>
            );
    }
}

export default Editor;