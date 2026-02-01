---
name: medical-admission
description: Medical admission workflow for collecting patient information, physical examination data, and vital signs for hospital admission forms. Supports both JSON and plain text output formats. Use when collecting patient intake data, conducting admission physical examinations, recording vital signs and consciousness assessments, creating structured medical admission records (tờ điều trị), generating Vietnamese medical text reports, or implementing branching medical questionnaires with Glasgow Coma Scale, BMI calculation, and abnormality triggered sub-workflows.
---

# Medical Admission Workflow

## Overview

Structured patient admission workflow for collecting comprehensive medical intake data. Handles branching logic for consciousness assessment (alert vs Glasgow Coma Scale), BMI computation, and triggers detailed sub-workflows when abnormalities are detected.

**Output formats supported:**
- **JSON**: Structured data for system integration (see `assets/output_template.json`)
- **Plain text**: Vietnamese medical records for hospital information systems

## When to Use This Skill

Use this skill when:
- Collecting patient information for hospital admission forms
- Conducting systematic physical examinations
- Calculating clinical metrics (BMI, Glasgow Coma Scale)
- Implementing branching medical questionnaires
- Creating structured medical records from patient intake
- **Generating Vietnamese plain text medical reports (tờ điều trị)**

## Quick Start

1. **Load the workflow structure**: See `references/workflow_structure.md` for complete step-by-step questions
2. **Use calculation scripts**: Execute `scripts/calculate_metrics.py` for BMI, GCS, and vital sign classifications
3. **Follow the sequence**: Start with Step A (basic info), then B (physical exam), then C (vital signs)
4. **Handle branching**: Consciousness assessment branches based on alert/ confused status
5. **Trigger sub-workflows**: When abnormalities detected, reference `sub_workflows/` for detailed examination
6. **Choose output format**: JSON or plain text Vietnamese report

## Workflow Structure

### Step A: Basic Information
- Gender, age, reason for admission, admission method

### Step B: Physical Examination
- **Consciousness**: Branches to (alert → contact level) or (confused → Glasgow Coma Scale)
- **Systematic exam**: Skin, fever, BMI, edema, bleeding, thyroid, lymph nodes, heart, lungs, abdomen, stool, urine
- **Abnormality handling**: Each exam point triggers sub-workflow if abnormal

### Step C: Vital Signs
- Blood pressure (systolic/diastolic), pulse, respiratory rate, temperature

## Output Formats

### JSON Output (Default)

Structured data format for system integration. See `assets/output_template.json` for complete structure.

### Plain Text Vietnamese Output

For generating medical records (tờ điều trị) in plain text format:

**Format structure:**
```
Bệnh nhân {gioi_tinh}, {tuoi} tuổi lý do vào viện: {ly_do_vao_vien}

1. Quá trình bệnh lý:
{Patient history}

2. Tiền sử bệnh:
- Bản thân: {Personal history}

3. Khám xét:
1. Toàn thân: Glasgow: {score} điểm
2. Các bộ phận:
{Each system on one line}
```

**Key rules for text output:**
- **Plain text only**: No markdown formatting (no **, *, #, etc.)
- **Vietnamese language**: All output in Vietnamese
- **Omit empty sections**: If no content, skip the section entirely
- **Normal status templates**: Use predefined phrases for normal findings

**Normal status templates:**
| System | Template |
|--------|----------|
| Tri giác | `Bệnh nhân tỉnh, tiếp xúc tốt` |
| Da niêm mạc | `Da, niêm mạc không xanh` |
| Phù | `Không phù` |
| Xuất huyết | `Không xuất huyết dưới da` |
| Tuyến giáp | `Tuyến giáp không to` |
| Hạch ngoại vi | `Hạch ngoại vi không sờ thấy` |
| Phổi | `Phổi 2 bên thông khí tốt` |
| Tim | `Tim nhịp đều, tần số {mach} lần/phút` |
| Bụng | `Bụng mềm, không chướng, không điểm đau` |

For complete text format mapping, see `references/text_format_guide.md`

## Calculation Scripts

### BMI Calculation
```python
from scripts.calculate_metrics import calculate_bmi
bmi, classification = calculate_bmi(weight_kg=70, height_cm=170)
# Returns: (24.2, "Bình thường")
```

### Glasgow Coma Scale
```python
from scripts.calculate_metrics import calculate_glasgow
gcs, severity = calculate_glasgow(e_value=4, v_value=5, m_value=6)
# Returns: (15, "Nhẹ")
```

### Vital Signs Classification
```python
from scripts.calculate_metrics import classify_vital_signs
classifications = classify_vital_signs({
    'blood_pressure_systolic': 120,
    'blood_pressure_diastolic': 80,
    'pulse': 72,
    'respiratory_rate': 16,
    'temperature': 36.5
})
```

### Blood Pressure Parsing
```python
from scripts.calculate_metrics import parse_blood_pressure
systolic, diastolic = parse_blood_pressure("120/80")
# Returns: (120, 80)
```

## Resources

### references/workflow_structure.md
Complete workflow DSL with all steps, questions, input types, branching logic, and output field mapping. Load this when implementing the full admission workflow or needing specific question details.

### references/text_format_guide.md
Complete mapping guide from JSON data to Vietnamese plain text format with all system templates and status options. Load this when generating text reports.

### references/sub_workflows/
Placeholder workflows for detailed organ/system examinations triggered when abnormalities detected:
- `da_niem_mac_detail.md` - Skin/mucosa abnormalities
- `sot_detail.md` - Fever assessment
- `phu_detail.md` - Edema evaluation
- `xuat_huyet_detail.md` - Bleeding assessment
- `tuyen_giap_detail.md` - Thyroid examination
- `hach_ngoai_vi_detail.md` - Lymph node evaluation
- `tim_detail.md` - Cardiac examination
- `phoi_detail.md` - Pulmonary examination
- `bung_detail.md` - Abdominal examination
- `dai_tien_detail.md` - Stool assessment
- `tieu_tien_detail.md` - Urination assessment

### scripts/calculate_metrics.py
Executable Python script for clinical calculations. Can be run directly without loading into context:
```bash
python3 scripts/calculate_metrics.py
```

### assets/output_template.json
JSON template showing expected output structure for medical records integration.

### assets/medical_record_template.txt
Template file with placeholder variables for Vietnamese text report generation.

## Implementation Notes

- **Branching logic**: Consciousness assessment (B1) is the primary branching point
- **GCS scoring**: E (1-4) + V (1-5) + M (1-6) = Total 3-15
- **BMI classification**: Uses WHO standards (<18.5 Gầy, 18.5-24.9 Bình thường, 25-29.9 Thừa cân, ≥30 Béo phì)
- **Sub-workflows**: Currently placeholders (TODO) - implement as needed for detailed examinations
- **Output mapping**: All fields map to medical record (tờ điều trị) structure defined in workflow_structure.md
- **Text output**: Use `references/text_format_guide.md` for Vietnamese plain text generation

## Common Patterns

### Consciousness Assessment Flow
```
B1_1: Alert or Confused?
├── If Alert → B1_T1: Contact level (good/poor)
└── If Confused → B1_L1/L2/L3: GCS E/V/M → Calculate total & severity
```

### Physical Exam Pattern
Each organ system follows the same pattern:
1. Normal vs Abnormal question
2. If Normal → Continue to next system
3. If Abnormal → Trigger sub-workflow reference

### Vital Signs Input
- Blood pressure: Text format "120/80" (parsed into systolic/diastolic)
- Others: Numeric values with decimal support for temperature

### Text Report Generation Pattern
1. Collect patient data using workflow
2. Map each field to Vietnamese text template
3. Apply normal/abnormal status templates
4. Combine into plain text format (no markdown)
5. Save to .txt file
