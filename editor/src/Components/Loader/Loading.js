import React from "react";
import styles from "./main.module.css";

const Loading = () => {
  return (
    <div className={styles.loader}>
      <div className={styles["loader-content"]}>Loading...</div>
    </div>
  );
};

export default Loading;
