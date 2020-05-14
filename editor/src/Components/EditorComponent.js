import React from 'react';
import { Row, Col, Input } from 'antd';

const EditorComponent = props => {
    const codes = props.codes;
    console.log(codes);
    return (
        <div>
            <Row>
                <Col span={16}>
                    {
                        codes.map((code, idx) => (
                            <Input
                                type="text"
                                value={code}
                                size="small"
                                addonBefore={idx + 1}
                                onChange={e => props.handleChange(e, idx)}
                                onKeyDown={e => props.handleKeyDown(e, idx)}
                                onKeyUp={e => props.handleKeyUp(e, idx)}
                            />
                        ))
                    }
                </Col>
                <Col span={8}>
                </Col>
            </Row>
            <button type="button" style={{ marginTop: '10px' }} onClick={props.handleRun}> run code</button>
        </div>
    );
}

export default EditorComponent;