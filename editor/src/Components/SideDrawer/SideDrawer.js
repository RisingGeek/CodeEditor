import React from 'react';
import styles from './main.module.css';
import { Select, Input, Row, Col, Popover } from 'antd';
const { Option } = Select;
const { TextArea } = Input;

const SideDrawer = props => {
    const {
        input,
        output,
        videoChat,
        lang,
        handleLang,
        handleRun,
        handleInput,
        handleVideoChat,
        runCodeDisabled
    } = props;
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
            <Row className={styles.topRow}>
                <Col span={12}>
                    <button
                        className={videoChat ? "btn_danger" : "btn_primary"}
                        onClick={handleVideoChat}
                    >
                        {videoChat ? "End Call" : "Video Call"}
                    </button>
                </Col>
                <Col span={12}>
                    <Popover
                        content={inviteContent}
                        trigger="click"
                        placement="bottomRight"
                    >
                        <button className="btn_primary">Invite</button>
                    </Popover>

                </Col>
            </Row>
            <Select defaultValue='cpp' onChange={handleLang} value={lang} className={styles.lang}>
                <Option value='cpp'>Cpp</Option>
                <Option value='java'>Java</Option>
                <Option value='python'>Python 2.x</Option>
            </Select>

            <label className={styles.input}>Input:</label>
            <TextArea value={input} onChange={handleInput} rows={5} autoSize={textAreaSize} />
            <label className={styles.output}>Output:</label>
            <TextArea value={output} style={{ marginBottom: '20px' }} autoSize={textAreaSize} readOnly={true} />
            <button 
            className={`btn_success ${runCodeDisabled && 'disabled'}`} 
            onClick={handleRun} 
            disabled={runCodeDisabled}
            >
                {runCodeDisabled ? "Running..." : "Run Code"}
            </button>
        </div>
    );
}

export default SideDrawer;