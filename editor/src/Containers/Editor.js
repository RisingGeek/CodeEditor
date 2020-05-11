import React, { Component } from 'react';
import { Row, Col } from 'antd';

class Editor extends Component {
    state = {
        lines: 1,
        codes: ["this is it"],
    }

    handleChange = (e, idx) => {
    }

    handleKeyDown = e => {
        if (e.key === 'Enter') {
            this.setState({ lines: this.state.lines + 1 });
        }
        console.log(e.key);
    }

    render() {
        console.log(this.state.lines);
        return (
            <div>
                <Row>
                    <Col span={2}>
                        {
                            //spread operator iterable to loop over lines
                            [...Array(this.state.lines).keys()].map(key => (
                                <div onKeyDown={this.handleKeyDown}>{key + 1}</div>
                            ))
                        }
                    </Col>
                    <Col span={22}>
                        {
                            this.state.codes.map((code, idx) => (
                            <input type="text" value={code} onChange={e => this.handleChange(e, idx)} />
                            ))
                        }
                    </Col>
                </Row>
            </div>
        );
    }
}

export default Editor;