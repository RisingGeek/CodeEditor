import React from 'react';
import styles from './main.module.css';
import { Select, Input } from 'antd';
const { Option } = Select;
const { TextArea } = Input;

const SideDrawer = props => {
    const { handleLang, lang, handleRun, handleInput, input, output } = props;
    const textAreaSize = { minRows: 3, maxRows: 6 };
    return (
        <div className={styles.sideDrawer}>
            <Select defaultValue='cpp' onChange={handleLang} value={lang}>
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