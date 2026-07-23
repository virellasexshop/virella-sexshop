import Image from "next/image";
import styles from "./HomeBrandVisual.module.css";

export default function HomeBrandVisual() {
  return (
    <div className={styles.visual}>
      <div className={styles.brand}>
        <Image
          src="/images/logo-virella.png"
          alt="Virella Sex Shop"
          width={350}
          height={350}
          priority
        />
      </div>

      <div className={styles.copy}>
        <span>Curadoria Premium</span>
        <h2>Intimidade tratada com elegância.</h2>
      </div>
    </div>
  );
}
