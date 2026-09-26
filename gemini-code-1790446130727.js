// 1. Import Firebase SDK ผ่าน CDN (ใช้งานในบราวเซอร์ได้ทันที ไม่ต้องติดตั้ง npm)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. ใส่ Config ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyBOpSPzgknAzC7t656Af9fjVb0tYlq2tAc",
  authDomain: "photobooth-db-38df7.firebaseapp.com",
  projectId: "photobooth-db-38df7",
  storageBucket: "photobooth-db-38df7.firebasestorage.app",
  messagingSenderId: "114136029221",
  appId: "1:114136029221:web:4349151eff03fce03287cc",
  measurementId: "G-0G291KXJHS"
};

// 3. เริ่มต้นใช้งาน Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// อ้างอิงไปยังเอกสารคูปองใน Firestore
const couponDocRef = doc(db, "coupons", "coupon_data");

// -------------------------------------------------------------
// ระบบดึงข้อมูลคูปองแบบ Real-time (เปิดเครื่องไหน ข้อมูลก็อัปเดตตรงกันทันที)
// -------------------------------------------------------------
function listenToCoupons(callback) {
  onSnapshot(couponDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("อัปเดตข้อมูลคูปองปัจจุบัน:", data);
      if (callback) callback(data);
    } else {
      // หากยังไม่มีข้อมูลใน Database ให้สร้างข้อมูลเริ่มต้น
      initDefaultCoupons();
    }
  });
}

// สร้างข้อมูลคูปองเริ่มต้น (กรณีเปิดใช้งานครั้งแรก)
async function initDefaultCoupons() {
  const defaultData = {
    quota: 10, // โควตาเริ่มต้น
    codes: ["037CAFE01", "037CAFE02", "037CAFE03", "037CAFE04", "037CAFE05", 
            "037CAFE06", "037CAFE07", "037CAFE08", "037CAFE09", "037CAFE10"]
  };
  await setDoc(couponDocRef, defaultData);
}

// -------------------------------------------------------------
// ฟังก์ชันบันทึก / แก้ไขโควตาและคูปองจากหน้าเว็บ
// -------------------------------------------------------------
async function updateCouponData(newQuota, newCodesArray) {
  try {
    await setDoc(couponDocRef, {
      quota: Number(newQuota),
      codes: newCodesArray
    }, { merge: true });
    alert("บันทึกข้อมูลเรียบร้อยแล้ว! ทุกเครื่องจะอัปเดตตามทันที");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบันทึก:", error);
    alert("ไม่สามารถบันทึกข้อมูลได้");
  }
}

// เรียกใช้งานติดตามข้อมูลคูปองทันทีเมื่อโหลดหน้าเว็บ
listenToCoupons((couponData) => {
  // นำ couponData.quota และ couponData.codes ไปแสดงผลบนหน้า UI ของคุณได้เลย
  // ตัวอย่างเช่น:
  // document.getElementById("quotaInput").value = couponData.quota;
});