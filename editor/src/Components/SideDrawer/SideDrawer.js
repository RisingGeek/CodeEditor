import React from 'react';
import styles from './main.module.css';
import { Select, Input, Row, Col, Popover } from 'antd';
const { Option } = Select;
const { TextArea } = Input;

const SideDrawer = props => {
    const { input, output, lang, handleLang, handleRun, handleInput, handleVideoChat } = props;
    const textAreaSize = { minRows: 3, maxRows: 6 };
    const inviteContent = (
        <div>
            <h3>Invite a peer!</h3>
            <p>Start pair programming with your peer by sharing this editor.</p>
            <h3>Invite via link:</h3>
            <Input value={window.location.href} readOnly={true} />
        </div>
    )
    return (
        <div className={styles.sideDrawer}>
            <Row>
                <Col span={12}>
                    <button onClick={handleVideoChat}>Make Call</button>
                </Col>
                <Col span={12}>
                    <Popover
                        content={inviteContent}
                        trigger="click"
                        placement="bottomRight"
                    >
                        <button>Invite</button>
                    </Popover>

                </Col>
            </Row>
            <Select defaultValue='cpp' onChange={handleLang} value={lang} className={styles.lang}>
                <Option value='cpp'>CPP</Option>
                <Option value='java'>Java</Option>
            </Select>

            <label className={styles.input}>Input:</label>
            <TextArea value={input} onChange={handleInput} rows={5} autoSize={textAreaSize} />
            <label className={styles.output}>Output:</label>
            <TextArea value={output} style={{ marginBottom: '20px' }} autoSize={textAreaSize} readOnly={true} />
            <button onClick={handleRun}>run code</button>
        </div>
    );
}

export default SideDrawer;