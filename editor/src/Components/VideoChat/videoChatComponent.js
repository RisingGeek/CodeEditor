import React from 'react';
import Draggable from 'react-draggable';
import styles from './main.module.css';
import { Row, Col } from 'antd';

const VideoChatComponent = props => {
    const { draggableRef,
        remoteRef,
        localRef,
        peerConnected,
        controls,
        gotMediaDevice,
        toggleVideo,
        toggleAudio,
        createOffer,
        connecting,
    } = props;
    return (
        <React.Fragment>
            <Draggable nodeRef={draggableRef} >
                <div className={styles.outer} ref={draggableRef}>
                    <div className={styles.remote}>
                        <video
                            className={styles.remoteVideo}
                            ref={remoteRef}
                            autoPlay={true}
                            muted={!peerConnected}>
                        </video>
                        {connecting && <div className={styles.overlay}>
                            <h2>Connecting...</h2>
                        </div>
                        }
                        <div className={styles.local}>
                            <video
                                className={styles.localVideo}
                                ref={localRef}
                                autoPlay={true}
                                muted={true}>
                            </video>
                        </div>
                        {peerConnected &&
                            <div className={styles.controls}>
                                <Row>
                                    <Col span={12}>
                                        <button onClick={toggleVideo}>
                                            {controls.video ?
                                                <img src="https://img.icons8.com/metro/26/000000/video-call.png" alt="Audio On" /> :
                                                <img src="https://img.icons8.com/metro/26/000000/no-video.png" alt="Video Off" />}
                                        </button>
                                    </Col>
                                    <Col span={12}>
                                        <button onClick={toggleAudio}>
                                            {controls.audio ?
                                                <img src="https://img.icons8.com/ios-glyphs/26/000000/microphone.png" alt="Video On" /> :
                                                <img src="https://img.icons8.com/ios-glyphs/30/000000/no-microphone.png" alt="Video Off" />}
                                        </button>
                                    </Col>
                                </Row>
                            </div>
                        }
                        {gotMediaDevice && !peerConnected &&
                            <div className={styles.connect}>
                                <button
                                    className="btn_primary"
                                    onClick={createOffer}
                                >
                                    start
                                </button>
                            </div>

                        }
                    </div>

                </div>
            </Draggable>
        </React.Fragment>
    );
}

export default VideoChatComponent;