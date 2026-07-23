import styles from "./HomeBrandVisual.module.css";

export default function HomeBrandVisual() {
  return (
    <div className={styles.visual}>
      <div className={styles.brand} aria-label="Virella Sexshop">
        <span>Virella</span>
        <strong>Sexshop</strong>
      </div>

      <div className={styles.copy}>
        <span>Curadoria Premium</span>
        <h2>Intimidade tratada com elegância.</h2>
      </div>
    </div>
  );
}
