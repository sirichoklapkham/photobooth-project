// ==========================================
// 1. ตั้งค่า LINE และ Google Drive
// ==========================================
const CONFIG = {
  // ใส่ ID ของโฟลเดอร์ Google Drive ที่ต้องการเก็บไฟล์สลิปและรูปภาพ
  DRIVE_FOLDER_ID: 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE', 
  LINE_ACCOUNTS: [
    {
      accessToken: 'uPruO0jMmyf8DykZpTRWg9HZ06F8xLZL3l7kR5o1sasyD4bFPOy8DmZP/Z1lyT2QOYaHNwCVzbyjVQ2Zir8pkhLLaEJjJ+C/2H9gJZG1wKoaJ8Y47MYM8Cj42SDru/w6A5xgXo+m3f1MyJXgjVV5zAdB04t89/1O/w1cDnyilFU=',
      targetId: 'U2ae25606675f180582d177ed50229ce2'
    }
  ]
};

// ==========================================
// 2. ฟังก์ชันรองรับการส่งข้อมูลจากหน้าเว็บ (doPost)
// ==========================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 1. จัดการอัปโหลด "สลิปโอนเงิน" ลง Google Drive
    let slipUrl = data.slipImage || '-';
    // เช็คกรณีส่ง Base64 มา (รองรับทั้ง slipImageBase64 หรือกรณีที่ slipImage เป็น base64 มาตรงๆ)
    if (data.slipImageBase64 && data.slipImageBase64.startsWith('data:image')) {
      slipUrl = saveFileToDrive(data.slipImageBase64, `Slip_${data.orderNo || Date.now()}.jpg`);
    } else if (data.slipImage && data.slipImage.startsWith('data:image')) {
      slipUrl = saveFileToDrive(data.slipImage, `Slip_${data.orderNo || Date.now()}.jpg`);
    }

    // 2. จัดการอัปโหลด "รูปภาพลูกค้า" ลง Google Drive
    let photoUrl = data.photoPreview || '-';
    // เช็คกรณีส่ง Base64 มา (รองรับทั้ง photoBase64 หรือ photoPreview ที่เป็น base64)
    if (data.photoBase64 && data.photoBase64.startsWith('data:image')) {
      photoUrl = saveFileToDrive(data.photoBase64, `Photo_${data.orderNo || Date.now()}.jpg`);
    } else if (data.photoPreview && data.photoPreview.startsWith('data:image')) {
      photoUrl = saveFileToDrive(data.photoPreview, `Photo_${data.orderNo || Date.now()}.jpg`);
    }

    // 3. บันทึกข้อมูลลง Google Sheets ตรงตามคอลัมน์ A - K
    sheet.appendRow([
      data.timestamp || new Date(),   // A: วันเวลาที่สั่ง
      data.orderNo || '-',            // B: รหัสรายการ
      data.customerName || '-',       // C: ชื่อลูกค้า
      data.customerPhone || '-',      // D: เบอร์โทรศัพท์
      data.templateName || '-',       // E: ชื่อแบบกรอบ
      data.quantity || 1,             // F: จำนวน
      data.couponCode || '-',         // G: โค้ดส่วนลด
      data.discount || 0,             // H: ส่วนลด
      data.grandTotal || 0,           // I: ยอดชำระ
      slipUrl,                        // J: สลิปโอนเงิน (ลิงก์ Google Drive)
      photoUrl                        // K: ลิงก์ดาวน์โหลดรูปภาพ (ลิงก์ Google Drive)
    ]);

    // 4. จัดข้อความแจ้งเตือนส่งเข้า LINE
    const message = `📸 มีรายการสั่งพิมพ์ใหม่!\n` +
                    `------------------------\n` +
                    `🆔 รหัสรายการ: ${data.orderNo || '-'}\n` +
                    `👤 ชื่อลูกค้า: ${data.customerName || '-'}\n` +
                    `📞 เบอร์โทรศัพท์: ${data.customerPhone || '-'}\n` +
                    `🖼️ ชื่อแบบกรอบ: ${data.templateName || '-'}\n` +
                    `🔢 จำนวน: ${data.quantity || 1} ใบ\n` +
                    `🏷️ โค้ดส่วนลด: ${data.couponCode || '-'}\n` +
                    `💸 ส่วนลด: ${data.discount || 0} บาท\n` +
                    `💰 ยอดชำระสุทธิ: ${data.grandTotal || 0} บาท\n` +
                    `🧾 สลิปโอนเงิน:\n${slipUrl}\n` +
                    `🕒 วันเวลาที่สั่ง: ${data.timestamp || '-'}\n` +
                    `------------------------\n` +
                    `📥 ลิงก์ดาวน์โหลดรูปภาพ:\n${photoUrl}`;

    sendNotificationsToAll(message);

    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      slipUrl: slipUrl,
      photoUrl: photoUrl 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 3. ฟังก์ชันแปลง Base64 และเซฟไฟล์ลง Google Drive
// ==========================================
function saveFileToDrive(base64Data, filename) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    
    // ดึงประเภทของไฟล์ (png/jpeg) และแปลงข้อความ Base64 เป็นไฟล์รูปภาพ
    const splitData = base64Data.split(',');
    const contentTypeMatch = splitData[0].match(/:(.*?);/);
    const contentType = contentTypeMatch ? contentTypeMatch[1] : 'image/jpeg';
    const bytes = Utilities.base64Decode(splitData[1]);
    const blob = Utilities.newBlob(bytes, contentType, filename);
    
    // สร้างไฟล์ในโฟลเดอร์ Google Drive
    const file = folder.createFile(blob);
    // ตั้งค่าสิทธิ์ให้ผู้ที่มีลิงก์สามารถดู/ดาวน์โหลดรูปได้
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (e) {
    Logger.log('Drive Upload Error: ' + e.toString());
    return 'Upload Failed';
  }
}

// ==========================================
// 4. ฟังก์ชันส่งแจ้งเตือนเข้า LINE
// ==========================================
function sendNotificationsToAll(message) {
  CONFIG.LINE_ACCOUNTS.forEach(acc => {
    try {
      const url = 'https://api.line.me/v2/bot/message/push';
      const payload = {
        to: acc.targetId,
        messages: [{ type: 'text', text: message }]
      };
      const options = {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + acc.accessToken
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      UrlFetchApp.fetch(url, options);
    } catch (e) {
      Logger.log('LINE Error: ' + e.toString());
    }
  });
}