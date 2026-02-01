#!/usr/bin/env python3
"""
Medical Admission Calculation Utilities

Functions for computing medical metrics including BMI, Glasgow Coma Scale,
and other clinical calculations used in patient admission workflows.
"""

from typing import Dict, Tuple, Literal


def calculate_bmi(weight_kg: float, height_cm: float) -> Tuple[float, str]:
    """
    Calculate BMI and classify according to WHO standards.

    Args:
        weight_kg: Weight in kilograms
        height_cm: Height in centimeters

    Returns:
        Tuple of (bmi_value, classification_label)

    BMI Classifications (WHO):
        <18.5: Underweight (Gầy)
        18.5-24.9: Normal (Bình thường)
        25.0-29.9: Overweight (Thừa cân)
        >=30: Obese (Béo phì)
    """
    height_m = height_cm / 100
    bmi = round(weight_kg / (height_m ** 2), 1)

    if bmi < 18.5:
        classification = "Gầy"
    elif bmi < 25.0:
        classification = "Bình thường"
    elif bmi < 30.0:
        classification = "Thừa cân"
    else:
        classification = "Béo phì"

    return bmi, classification


def calculate_glasgow(e_value: int, v_value: int, m_value: int) -> Tuple[int, str]:
    """
    Calculate Glasgow Coma Scale total and classify severity.

    Args:
        e_value: Eye opening score (1-4)
        v_value: Verbal response score (1-5)
        m_value: Motor response score (1-6)

    Returns:
        Tuple of (glasgow_total, severity_label)

    GCS Severity Classification:
        13-15: Mild (Nhẹ)
        9-12: Moderate (Trung bình)
        <=8: Severe (Nặng)
    """
    glasgow = e_value + v_value + m_value

    if glasgow >= 13:
        severity = "Nhẹ"
    elif glasgow >= 9:
        severity = "Trung bình"
    else:
        severity = "Nặng"

    return glasgow, severity


def parse_blood_pressure(bp_str: str) -> Tuple[int, int]:
    """
    Parse blood pressure string "120/80" into systolic and diastolic.

    Args:
        bp_str: Blood pressure string like "120/80"

    Returns:
        Tuple of (systolic, diastolic) in mmHg

    Raises:
        ValueError: If format is invalid
    """
    try:
        parts = bp_str.strip().split('/')
        if len(parts) != 2:
            raise ValueError(f"Invalid BP format: {bp_str}. Expected 'systolic/diastolic'")
        systolic = int(parts[0].strip())
        diastolic = int(parts[1].strip())
        return systolic, diastolic
    except (ValueError, IndexError) as e:
        raise ValueError(f"Invalid BP format: {bp_str}. {str(e)}")


def classify_vital_signs(vitals: Dict[str, float]) -> Dict[str, str]:
    """
    Classify vital signs as normal or abnormal based on standard ranges.

    Args:
        vitals: Dictionary containing vital sign values
            - blood_pressure_systolic: mmHg
            - blood_pressure_diastolic: mmHg
            - pulse: beats per minute
            - respiratory_rate: breaths per minute
            - temperature: Celsius

    Returns:
        Dictionary with classification labels for each vital sign
    """
    classifications = {}

    # Blood pressure
    if 'blood_pressure_systolic' in vitals and 'blood_pressure_diastolic' in vitals:
        sys_bp = vitals['blood_pressure_systolic']
        dia_bp = vitals['blood_pressure_diastolic']

        if sys_bp < 90 or dia_bp < 60:
            classifications['blood_pressure'] = "Hạ huyết áp"
        elif sys_bp > 140 or dia_bp > 90:
            classifications['blood_pressure'] = "Tăng huyết áp"
        else:
            classifications['blood_pressure'] = "Bình thường"

    # Pulse
    if 'pulse' in vitals:
        pulse = vitals['pulse']
        if pulse < 60:
            classifications['pulse'] = "Chậm (bradycardia)"
        elif pulse > 100:
            classifications['pulse'] = "Nhanh (tachycardia)"
        else:
            classifications['pulse'] = "Bình thường"

    # Respiratory rate
    if 'respiratory_rate' in vitals:
        rr = vitals['respiratory_rate']
        if rr < 12:
            classifications['respiratory_rate'] = "Chậm (bradypnea)"
        elif rr > 20:
            classifications['respiratory_rate'] = "Nhanh (tachypnea)"
        else:
            classifications['respiratory_rate'] = "Bình thường"

    # Temperature
    if 'temperature' in vitals:
        temp = vitals['temperature']
        if temp < 36.0:
            classifications['temperature'] = "Hạ thân nhiệt"
        elif temp > 37.5:
            classifications['temperature'] = "Sốt"
        else:
            classifications['temperature'] = "Bình thường"

    return classifications


def main():
    """Example usage and testing."""
    # Example BMI calculation
    print("=== BMI Calculation ===")
    weight = 70
    height = 170
    bmi, classification = calculate_bmi(weight, height)
    print(f"Weight: {weight}kg, Height: {height}cm")
    print(f"BMI: {bmi} ({classification})")
    print()

    # Example GCS calculation
    print("=== Glasgow Coma Scale ===")
    e, v, m = 4, 5, 6  # Eyes open spontaneously, oriented, obeys commands
    gcs, severity = calculate_glasgow(e, v, m)
    print(f"E={e}, V={v}, M={m}")
    print(f"GCS: {gcs}/15 ({severity})")
    print()

    # Example blood pressure parsing
    print("=== Blood Pressure ===")
    bp_str = "120/80"
    sys_bp, dia_bp = parse_blood_pressure(bp_str)
    print(f"Input: {bp_str}")
    print(f"Systolic: {sys_bp} mmHg, Diastolic: {dia_bp} mmHg")
    print()

    # Example vital signs classification
    print("=== Vital Signs Classification ===")
    vitals = {
        'blood_pressure_systolic': 120,
        'blood_pressure_diastolic': 80,
        'pulse': 72,
        'respiratory_rate': 16,
        'temperature': 36.5
    }
    classifications = classify_vital_signs(vitals)
    for key, value in classifications.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
