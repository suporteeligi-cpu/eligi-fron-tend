'use client';

import Image from 'next/image';
import styles from './AppLoading.module.css';

export default function AppLoading() {
  return (
    <main className={styles.root}>
      <div className={styles.glass}>
        <div className={styles.logoWrapper}>
          <Image
            src="/images/globo-eligi.png"
            alt="ELIGI"
            width={96}
            height={70}
            priority
            className={styles.logoFlip}
          />
        </div>
      </div>
    </main>
  );
}
