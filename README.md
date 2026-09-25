# clinical-EHR

SOAP automation：門診 SOAP 病歷產生器（復健科／肌肉骨骼疼痛）

## 使用方式

直接用瀏覽器開啟 `index.html`，不需安裝任何軟體。

1. **主訴**：選擇主訴（Low back pain / Neck pain / Shoulder pain / Knee pain），填寫年齡、性別、側別、病程、NRS
2. **病史與理學檢查**：逐項點選 `+`／`−`（或 R / L / Bil），「其餘設為陰性」可一鍵記錄 pertinent negatives
3. **評估與病歷**：依勾選結果自動評分並建議診斷（附 ICD-10 參考）、彙整處置建議，產生 SOAP 文字，可複製或下載 `.txt`

有紅旗徵象時會顯示警示，並把對應的處置放在最前面。

## 隱私

- 所有資料只在本機瀏覽器處理，**不儲存、不上傳**
- 介面不收集姓名、病歷號等識別資料，請勿自行輸入
- **請勿將任何病人資料或產出的病歷 commit 到此 repo**（`.gitignore` 已排除 `SOAP_*.txt`）

## 修改臨床內容

所有主訴、問診項目、理學檢查、診斷規則與建議都在 [`js/data.js`](js/data.js)，檔頭有欄位說明。
新增主訴只要在 `COMPLAINTS` 陣列加一個物件即可，不需改動 `app.js`。

## 檔案結構

```
index.html      介面
css/style.css   樣式
js/data.js      臨床內容（主訴、病史、檢查、診斷規則、建議）
js/app.js       介面邏輯與 SOAP 產生
```

## 免責聲明

本工具僅為臨床文書輔助，診斷建議與 ICD-10 代碼僅供參考，所有內容須由醫師確認。
