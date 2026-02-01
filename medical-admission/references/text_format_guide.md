# Medical Admission Text Output Guide

## Output Format Structure

### Line 1: Patient Summary
```
Bệnh nhân {gioi_tinh}, {tuoi} tuổi lý do vào viện: {ly_do_vao_vien}
```

Mapping from medical-admission JSON:
- `gioi_tinh`: Nam/Nữ
- `tuoi`: age value
- `ly_do_vao_vien`: free text reason

### Section 1: Quá trình bệnh lý (Patient History)
Free text field for patient's medical history and course of illness.

### Section 2: Tiền sử bệnh (Medical History)
- Bản thân: Personal medical history
- Gia đình: Family medical history (optional - omit if empty)

### Section 3: Khám xét (Physical Examination)

#### 3.1 Toàn thân (General Examination)
Format: `Glasgow: {glasgow_total} điểm` or custom description

Mapping:
- If glasgow_total exists: `Glasgow: {glasgow_total} điểm`
- Otherwise: custom text describing general state

#### 3.2 Các bộ phận (Body Systems)

Each system should be on its own line:

| System | Format Template | JSON Source |
|--------|----------------|-------------|
| Tri giác | `Bệnh nhân {tinh_lo_mo}, {tiep_xuc}` | consciousness |
| Da niêm mạc | `Da, niêm mạc {status}` | da_niem_mac |
| Sốt | `{status}` or omit if none | sot |
| Thể trạng | `BMI: {bmi}, {phan_loai_the_trang}` | bmi, phan_loai_the_trang |
| Phù | `Không phù` or `{abnormal_details}` | phu |
| Xuất huyết | `Không xuất huyết dưới da` or `{abnormal_details}` | xuat_huyet |
| Tuyến giáp | `Tuyến giáp không to` or `{abnormal_details}` | tuyen_giap |
| Hạch ngoại vi | `Hạch ngoại vi không sờ thấy` or `{abnormal_details}` | hach_ngoai_vi |
| Phổi | `Phổi 2 bên {status}` or `{abnormal_details}` | phoi |
| Tim | `Tim nhịp {nhip_tinh}, tần số {mach} lần/phút` or `{abnormal_details}` | tim, mach |
| Bụng | `{status}` or `{abnormal_details}` | bung |
| Đại tiện | `{status}` or `{abnormal_details}` | dai_tien |
| Tiểu tiện | `{status}` or `{abnormal_details}` | tieu_tien |

Normal status templates:
- Da niêm mạc: `không xanh`
- Sốt: `Không sốt` (or omit entire line)
- Phù: `Không phù`
- Xuất huyết: `Không xuất huyết dưới da`
- Tuyến giáp: `không to`
- Hạch ngoại vi: `không sờ thấy`
- Phổi: `thông khí tốt, không ran`
- Tim: `nhịp đều, tần số {mach} lần/phút`
- Bụng: `mềm, không chướng, không điểm đau`
- Đại tiện: `phân vàng khuôn` (or omit)
- Tiểu tiện: `bình thường` (or omit)

### Section 4: Cận lâm sàng (Paraclinical)
Optional - include only if tests were ordered.

### Section 5: Chẩn đoán (Diagnosis)
Primary diagnosis or provisional diagnosis.

### Section 6: Định hướng (Plan/Direction)
Treatment plan or next steps.

## Complete Example Output

```
Bệnh nhân nữ, 29 tuổi lý do vào viện: Sốt, đau bụng

1. Quá trình bệnh lý:
Sản phụ đẻ thường tại BV PS HN, lúc đẻ có biến chứng rách CTC mất khoảng 800 ml máu, không có chỉ định truyền máu. BxN ổn định xuất viện. Cách vào viện x ngày, B xuất hiện sốt, nhiệt độ cao nhất 39 độ, không đau bụng hạ vị, sản dịch ít, thâm, không sưng đau TSM. Đã điều trị tại BV PSHN chẩn đoán: nhiễm trùng hậu sản, theo đơn về. Ngày nay bệnh nhân mệt nhiều, đau bụng vùng dưới gan, bệnh nhân nhập viện đa khoa Đan Phượng -> chuyển bạch mai

2. Tiền sử bệnh:
- Bản thân: Đẻ thường cách 18 ngày, đã điều trị nhiễm trùng hậu sản

3. Khám xét:
1. Toàn thân: Glasgow: 15 điểm
2. Các bộ phận:
Bệnh nhân tỉnh, tiếp xúc tốt
Da, niêm mạc không xanh
Không phù, không xuất huyết dưới da
Tuyến giáp không to, hạch ngoại vi không sờ thấy
Phổi 2 bên thông khí tốt
Tim nhịp đều, tần số 86 lần/phút
Đau bụng nhiều vùng dưới gan, PƯTB(+)
```

## Important Notes

1. **Plain text only**: No markdown formatting, no bold/italic symbols
2. **Line breaks**: Use single newline between sections
3. **Omission strategy**: If a section has no content, omit it entirely
4. **Abnormal findings**: When abnormal, include detailed description instead of "normal" template
5. **Vietnamese language**: All output must be in Vietnamese
6. **Clinical terminology**: Use appropriate medical terminology in Vietnamese
