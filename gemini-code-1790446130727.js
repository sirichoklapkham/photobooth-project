// 1. Import Firebase Modules ผ่าน CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Firebase Configuration ของโปรเจกต์คุณ
const firebaseConfig = {
  apiKey: "AIzaSyBOpSPzgknAzC7t656Af9fjVb0tYlq2tAc",
  authDomain: "photobooth-db-38df7.firebaseapp.com",
  projectId: "photobooth-db-38df7",
  storageBucket: "photobooth-db-38df7.firebasestorage.app",
  messagingSenderId: "114136029221",
  appId: "1:114136029221:web:4349151eff03fce03287cc",
  measurementId: "G-0G291KXJHS"
};

// 3. Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// สร้าง Reference สำหรับเก็บข้อมูลตั้งค่ากลาง (คูปอง / โควตา)
const settingsDocRef = doc(db, "app_settings", "photobooth_config");

// -----------------------------------------------------------------
// 4. ระบบฟังข้อมูล Real-time (เปิดเครื่องไหนก็เห็นข้อมูลตรงกันทันที)
// -----------------------------------------------------------------
function listenToCloudSettings(onUpdateCallback) {
  onSnapshot(settingsDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("ดึงข้อมูลล่าสุดจาก Cloud:", data);
      
      // นำข้อมูลที่ได้ไปอัปเดตหน้าจอ UI
      if (onUpdateCallback) onUpdateCallback(data);
    } else {
      // หากเปิดใช้งานครั้งแรกและยังไม่มีข้อมูลใน Cloud ให้ตั้งค่าเริ่มต้น
      initCloudSettings();
    }
  });
}

// สร้างค่าเริ่มต้นใน Cloud
async function initCloudSettings() {
  const defaultConfig = {
    quota: 10,
    coupons: ["037CAFE01", "037CAFE02", "037CAFE03"],
    price: 40
  };
  await setDoc(settingsDocRef, defaultConfig);
}

// -----------------------------------------------------------------
// 5. ฟังก์ชันบันทึกข้อมูลขึ้น Cloud (เมื่อกดตั้งค่าจากเครื่องใดก็ตาม)
// -----------------------------------------------------------------
async function saveSettingsToCloud(newSettings) {
  try {
    await setDoc(settingsDocRef, newSettings, { merge: true });
    alert("บันทึกการตั้งค่าลง Cloud เรียบร้อยแล้ว! ทุกเครื่องจะอัปเดตตามทันที");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
    alert("บันทึกข้อมูลไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
  }
}

// -----------------------------------------------------------------
// ตัวอย่างการเรียกใช้งานในระบบของคุณ
// -----------------------------------------------------------------
// เริ่มติดตามข้อมูลจาก Cloud ทันทีที่โหลดหน้าเว็บ
listenToCloudSettings((config) => {
  // นำค่าที่ดึงได้ไปใส่ใน Input หรือแสดงบนหน้าเว็บ
  // เช่น:
  // document.getElementById("quotaDisplay").textContent = config.quota;
});
