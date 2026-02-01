# Medical Admission Workflow Structure

Complete workflow definition for patient admission at Bạch Mai Hospital.

## Quick Reference

- **Purpose**: Collect patient information for medical records/admission form
- **Output**: Structured data for admission form (tờ điều trị/phiếu khám vào viện)
- **Structure**: 3 main sections (A: Basic Info, B: Physical Exam, C: Vital Signs)

---

## Workflow DSL Structure

Each step is defined with:
- `step_id`: Unique identifier
- `question`: Display text for the user
- `input_type`: `select` | `number` | `text`
- `options`: List of choices (for select type)
- `branch`: Conditional logic based on input value
- `compute`: Python expression to calculate
- `workflow_ref`: Reference to sub-workflow (for detailed examination)

---

## STEP A: Thông tin cơ bản (Basic Information)

### A1. Giới tính (Gender)

```yaml
step_id: A1
question: "Bệnh nhân giới tính là gì?"
input_type: select
options:
  - "Nam"
  - "Nữ"
output_field: gioi_tinh
```

### A2. Tuổi (Age)

```yaml
step_id: A2
question: "Bệnh nhân bao nhiêu tuổi?"
input_type: number
output_field: tuoi
```

### A3. Lý do vào viện (Reason for Admission)

```yaml
step_id: A3
question: "Lý do vào viện là gì? (mô tả ngắn triệu chứng/chẩn đoán nghi ngờ)"
input_type: text
hint: "VD: sốt, ho, khó thở, đau bụng, nôn, tiêu chảy, đau ngực, yếu liệt…"
output_field: ly_do_vao_vien
```

### A4. Cách vào viện (Admission Method)

```yaml
step_id: A4
question: "Bệnh nhân vào viện bằng cách nào? (tự đến/cấp cứu/chuyển viện/xe cấp cứu/…)"
input_type: text
output_field: cach_vao_vien
```

---

## STEP B: Khám vào viện (Physical Examination)

### B1. Trạng thái tri giác (Consciousness)

#### B1.1 Base Question

```yaml
step_id: B1_1
question: "Hiện tại bệnh nhân tỉnh hay lơ mơ?"
input_type: select
options:
  - "Tỉnh"
  - "Lơ mơ"
output_field: tinh_lo_mo
branch:
  - if: "Tỉnh"
    goto: B1_T1
  - if: "Lơ mơ"
    goto: B1_L1
```

#### B1.T1: Alert Branch

```yaml
step_id: B1_T1
question: "Nếu bệnh nhân tỉnh, mức độ tiếp xúc thế nào?"
input_type: select
options:
  - "Tiếp xúc tốt"
  - "Khó tiếp xúc"
output_field: tiep_xuc
visible_when: tinh_lo_mo == "Tỉnh"
```

#### B1.L1-L3: Glasgow Coma Scale (Confused Branch)

```yaml
step_id: B1_L1
question: "Đánh giá Glasgow – Mở mắt (E)?"
input_type: select
options:
  - "E4: Tự mở"
  - "E3: Gọi mở"
  - "E2: Đau mở"
  - "E1: Không"
output_field: glasgow_E
output_value: 4  # Extracted from "E4: ..."
visible_when: tinh_lo_mo == "Lơ mơ"

step_id: B1_L2
question: "Đánh giá Glasgow – Lời nói (V)?"
input_type: select
options:
  - "V5: Định hướng tốt"
  - "V4: Lẫn lộn"
  - "V3: Nói từ không phù hợp"
  - "V2: Âm thanh"
  - "V1: Không"
output_field: glasgow_V
output_value: 5  # Extracted from "V5: ..."
visible_when: tinh_lo_mo == "Lơ mơ"

step_id: B1_L3
question: "Đánh giá Glasgow – Vận động (M)?"
input_type: select
options:
  - "M6: Làm theo lệnh"
  - "M5: Định vị đau"
  - "M4: Rút lui khi đau"
  - "M3: Gấp bất thường"
  - "M2: Duỗi bất thường"
  - "M1: Không"
output_field: glasgow_M
output_value: 6  # Extracted from "M6: ..."
visible_when: tinh_lo_mo == "Lơ mơ"

step_id: B1_L_compute
compute: "glasgow_total = glasgow_E + glasgow_V + glasgow_M"
compute_script: "scripts/calculate_metrics.py::calculate_glasgow"
output_field: glasgow_total
```

### B2. Da niêm mạc (Skin & Mucosa)

```yaml
step_id: B2
question: "Da niêm mạc hồng (bình thường) hay bất thường?"
input_type: select
options:
  - "Hồng (bình thường)"
  - "Bất thường"
output_field: da_niem_mac
branch:
  - if: "Hồng (bình thường)"
    goto: B3
  - if: "Bất thường"
    workflow_ref: sub_workflows/da_niem_mac_detail.md
```

### B3. Sốt (Fever)

```yaml
step_id: B3
question: "Bệnh nhân có sốt không?"
input_type: select
options:
  - "Không sốt"
  - "Có sốt"
output_field: sot
branch:
  - if: "Không sốt"
    goto: B4_1
  - if: "Có sốt"
    workflow_ref: sub_workflows/sot_detail.md
```

### B4. Thể trạng (Body Status - BMI)

#### B4.1 Cân nặng (Weight)

```yaml
step_id: B4_1
question: "Cân nặng bệnh nhân (kg)?"
input_type: number
output_field: can_nang
```

#### B4.2 Chiều cao (Height)

```yaml
step_id: B4_2
question: "Chiều cao bệnh nhân (cm)?"
input_type: number
output_field: chieu_cao
```

#### B4.3 Compute BMI

```yaml
step_id: B4_3
compute: "bmi = can_nang / ((chieu_cao / 100) ** 2)"
compute_script: "scripts/calculate_metrics.py::calculate_bmi"
output_field: bmi
format: ".1f"  # 1 decimal place
```

#### B4.4 Classify Body Status

```yaml
step_id: B4_4
compute: |
  if bmi < 18.5: "Gầy"
  elif bmi < 25.0: "Bình thường"
  elif bmi < 30.0: "Thừa cân"
  else: "Béo phì"
output_field: phan_loai_the_trang
rules: WHO  # Can be configured for Asian standards
```

### B5. Phù (Edema)

```yaml
step_id: B5
question: "Bệnh nhân có bộ phận nào phù không?"
input_type: select
options:
  - "Không phù"
  - "Có phù"
output_field: phu
branch:
  - if: "Không phù"
    goto: B6
  - if: "Có phù"
    workflow_ref: sub_workflows/phu_detail.md
```

### B6. Xuất huyết (Bleeding/Hemorrhage)

```yaml
step_id: B6
question: "Bệnh nhân có xuất huyết ở đâu không?"
input_type: select
options:
  - "Không"
  - "Có"
output_field: xuat_huyet
branch:
  - if: "Không"
    goto: B7
  - if: "Có"
    workflow_ref: sub_workflows/xuat_huyet_detail.md
```

### B7. Tuyến giáp (Thyroid Gland)

```yaml
step_id: B7
question: "Khám tuyến giáp: có to không?"
input_type: select
options:
  - "Không to"
  - "To"
output_field: tuyen_giap
branch:
  - if: "Không to"
    goto: B8
  - if: "To"
    workflow_ref: sub_workflows/tuyen_giap_detail.md
```

### B8. Hạch ngoại vi (Peripheral Lymph Nodes)

```yaml
step_id: B8
question: "Khám hạch ngoại vi: có sờ thấy hạch không?"
input_type: select
options:
  - "Không sờ thấy"
  - "Có"
output_field: hach_ngoai_vi
branch:
  - if: "Không sờ thấy"
    goto: B9
  - if: "Có"
    workflow_ref: sub_workflows/hach_ngoai_vi_detail.md
```

### B9. Tim (Heart)

```yaml
step_id: B9
question: "Khám tim: bình thường (đều, T1 T2 rõ) hay bất thường?"
input_type: select
options:
  - "Bình thường (đều, T1 T2 rõ)"
  - "Bất thường"
output_field: tim
branch:
  - if: "Bình thường (đều, T1 T2 rõ)"
    goto: B10
  - if: "Bất thường"
    workflow_ref: sub_workflows/tim_detail.md
```

### B10. Phổi (Lungs)

```yaml
step_id: B10
question: "Khám phổi: thông khí tốt, không ran hay bất thường?"
input_type: select
options:
  - "Bình thường (thông khí tốt, không ran)"
  - "Bất thường"
output_field: phoi
branch:
  - if: "Bình thường (thông khí tốt, không ran)"
    goto: B11
  - if: "Bất thường"
    workflow_ref: sub_workflows/phoi_detail.md
```

### B11. Bụng (Abdomen)

```yaml
step_id: B11
question: "Khám bụng: mềm, không chướng, không điểm đau hay bất thường?"
input_type: select
options:
  - "Bình thường (mềm, không chướng, không điểm đau)"
  - "Bất thường"
output_field: bung
branch:
  - if: "Bình thường (mềm, không chướng, không điểm đau)"
    goto: B12
  - if: "Bất thường"
    workflow_ref: sub_workflows/bung_detail.md
```

### B12. Đại tiện (Stool/Bowel Movement)

```yaml
step_id: B12
question: "Đại tiện: phân vàng khuôn (bình thường) hay bất thường?"
input_type: select
options:
  - "Bình thường (phân vàng khuôn)"
  - "Bất thường"
output_field: dai_tien
branch:
  - if: "Bình thường (phân vàng khuôn)"
    goto: B13
  - if: "Bất thường"
    workflow_ref: sub_workflows/dai_tien_detail.md
```

### B13. Tiểu tiện (Urination)

```yaml
step_id: B13
question: "Tiểu tiện: bình thường hay bất thường?"
input_type: select
options:
  - "Bình thường"
  - "Bất thường"
output_field: tieu_tien
branch:
  - if: "Bình thường"
    goto: C1
  - if: "Bất thường"
    workflow_ref: sub_workflows/tieu_tien_detail.md
```

---

## STEP C: Dấu hiệu sinh tồn (Vital Signs)

### C1. Huyết áp (Blood Pressure)

```yaml
step_id: C1
question: "Huyết áp (mmHg) là bao nhiêu? (VD: 120/80)"
input_type: text
pattern: "^\d{2,3}/\d{2,3}$"  # "120/80" format
output_field: huyet_ap
parse_script: "scripts/calculate_metrics.py::parse_blood_pressure"
parsed_fields: [huyet_ap_tam_thu, huyet_ap_tam_truong]
```

### C2. Mạch (Pulse)

```yaml
step_id: C2
question: "Mạch (lần/phút)?"
input_type: number
range: [0, 300]  # Reasonable bounds
output_field: mach
```

### C3. Nhịp thở (Respiratory Rate)

```yaml
step_id: C3
question: "Nhịp thở (lần/phút)?"
input_type: number
range: [0, 100]
output_field: nhip_tho
```

### C4. Nhiệt độ (Temperature)

```yaml
step_id: C4
question: "Nhiệt độ (°C)?"
input_type: number
allow_decimal: true
range: [30.0, 45.0]
output_field: nhiet_do
```

---

## Output Mapping

The collected data maps to the medical record (tờ điều trị) as follows:

### Administrative (Hành chính)
| Field | Source | Description |
|-------|--------|-------------|
| gioi_tinh | A1 | Patient gender |
| tuoi | A2 | Patient age |
| ly_do_vao_vien | A3 | Reason for admission |
| cach_vao_vien | A4 | Admission method |

### Consciousness (Tri giác)
| Field | Source | Condition |
|-------|--------|-----------|
| tinh_lo_mo | B1_1 | Alert/Confused |
| tiep_xuc | B1_T1 | If Alert |
| glasgow_E | B1_L1 | If Confused |
| glasgow_V | B1_L2 | If Confused |
| glasgow_M | B1_L3 | If Confused |
| glasgow_total | B1_L_compute | If Confused |

### Physical Exam (Khám toàn thân)
| Field | Source | Notes |
|-------|--------|-------|
| da_niem_mac | B2 | + ref if abnormal |
| sot | B3 | + ref if abnormal |
| can_nang | B4_1 | Weight (kg) |
| chieuu_cao | B4_2 | Height (cm) |
| bmi | B4_3 | Computed |
| phan_loai_the_trang | B4_4 | WHO classification |
| phu | B5 | + ref if abnormal |
| xuat_huyet | B6 | + ref if abnormal |
| tuyen_giap | B7 | + ref if abnormal |
| hach_ngoai_vi | B8 | + ref if abnormal |
| tim | B9 | + ref if abnormal |
| phoi | B10 | + ref if abnormal |
| bung | B11 | + ref if abnormal |
| dai_tien | B12 | + ref if abnormal |
| tieu_tien | B13 | + ref if abnormal |

### Vital Signs (Dấu hiệu sinh tồn)
| Field | Source | Description |
|-------|--------|-------------|
| huyet_ap | C1 | "120/80" format |
| huyet_ap_tam_thu | C1 (parsed) | Systolic |
| huyet_ap_tam_truong | C1 (parsed) | Diastolic |
| mach | C2 | Pulse (bpm) |
| nhip_tho | C3 | Respiratory rate |
| nhiet_do | C4 | Temperature (°C) |

---

## Sub-Workflow References

The following sub-workflows are triggered when abnormalities are detected:

- `da_niem_mac_detail.md` - Skin/mucosa abnormalities
- `sot_detail.md` - Fever details
- `phu_detail.md` - Edema details
- `xuat_huyet_detail.md` - Bleeding/hemorrhage details
- `tuyen_giap_detail.md` - Thyroid gland examination
- `hach_ngoai_vi_detail.md` - Lymph node examination
- `tim_detail.md` - Cardiac examination
- `phoi_detail.md` - Pulmonary examination
- `bung_detail.md` - Abdominal examination
- `dai_tien_detail.md` - Stool/bowel movement details
- `tieu_tien_detail.md` - Urination details

These are placeholder workflows (TODO) that can be implemented as needed.
