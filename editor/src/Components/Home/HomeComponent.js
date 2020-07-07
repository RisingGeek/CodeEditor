import React from 'react';
import { Link } from 'react-router-dom';
import styles from './main.module.css';

const HomeComponent = props => {
    const { createId } = props;
    return (
        <div className={styles.home}>
            <h1>Peer Share</h1>
            <p className={styles.heading}>Pair programming with peers</p>
            <p className={styles.description}>An online code editor for pair programming, interviews, teaching and much more...</p>
            <Link to={`/${createId()}`}>
                <button className={`${styles.btn} btn_primary`}>Start Coding</button>
            </Link>
        </div>
    );
}

export default HomeComponent;