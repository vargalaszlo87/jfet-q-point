# JFET Q-point v1.0.1

## Overview

This application calculates the optimal middle Q-point of a JFET transistor for maximum input signal swing. The Q-point is essential in small-signal amplifier design, as it determines the optimal operating point for a JFET transistor. The application is also suitable for educational purposes, offering a visual representation of the JFET's behavior in an amplifier circuit.

This project is licensed under the GNU General Public License v3.0 or later.

## Features

- **Multiple JFET Models:** Built-in parameters for popular JFET models including 2N3819, 2N5434, BF245, and BF256 series.
- **Q-point Calculation:** Computes optimal operating points ($V_{GS0}$, $I_{D0}$, $R_S$, $R_D$) dynamically for maximum unclipped signal swing.
- **Interactive Simulation:** Real-time adjustment of parameters such as input voltage ($V_{inp}$), load impedance ($Z_{load}$), ambient temperature ($T$), and supply voltage ($V_{DD}$).
- **Visual Charts:** Real-time transfer characteristic plot ($I_D$ vs $V_{GS}$) displaying the Q-point, input signal modulation, and output current waveforms.

## Try it!

[Live demo!](http://ha1cx.hu/jfet-q-point)

## Screenshot of the dashboard

![Dashboard Screenshot](https://github.com/user-attachments/assets/580ddf3b-286b-4a83-b03b-10e2e1853ae6)

## Usage

1. Select the desired JFET model from the dropdown menu.
2. Adjust the input voltage ($V_{inp}$), load impedance ($Z_{load}$), temperature, and supply voltage using the sliders.
3. The application automatically recalculates the optimal Q-point, voltage gain ($A_v$), current gain ($A_i$), and nearest E24 resistor values.
4. The interactive Chart.js canvas visualizes the transfer characteristics and small-signal sine waves in real time.

## Supported JFET Models

The application supports the following JFET models, defined by key parameters including BETA ($\beta$), $V_{TO}$ (threshold voltage), and LAMBDA ($\lambda$):

const jfetModels = [
    { name: "2N3819", params: [1.304e-3, -0.5, 1, 1, 2.25e-3, -3, -2.5e-3] },
    { name: "2N5434", params: [18e-3, -0.5, 1, 1, 25e-3, -1.9, -2.5e-3] },
    { name: "BF245A", params: [1.16621e-3, -0.5, 9.01678, 9.01678, 1.77211e-2, -1.7372, -2.5e-3] },
    { name: "BF245B", params: [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, -2.5e-3] },
    { name: "BF245C", params: [5.43157e-4, -0.5, 1.20869e1, 1.20869e1, 2.71505e-2, -5.0014, -2.5e-3] },
    { name: "BF256A", params: [1.06491e-3, -0.5, 1.41231e1, 1.41231e1, 1.68673e-2, -2.1333, -2.5e-3] },
    { name: "BF256B", params: [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, -2.5e-3] }
];

## Equations (Saturation Region)

$$I_{D} = \beta' \cdot (V_{GS} - V_{TO}')^2 \cdot (1 + \lambda \cdot V_{DS})$$

$$\beta' = \beta \cdot \exp(\beta_{tce} \cdot (T - T_{ref}))$$

$$V_{TO}' = V_{TO} + V_{TOtc} \cdot (T - T_{ref})$$

$$V_{DS} = \frac{V_{DD} - |V_{TO}'|}{2} + |V_{TO}'|$$

$$I_{DSS} = I_{D} \quad (\text{where } V_{GS} = 0 \text{ and } V_{DS} = V_{DD})$$

$$m = \frac{-I_{DSS}}{V_{DD}}$$

$$I_{D0} = I_{DSS} - |m| \cdot V_{DS}$$

$$V_{GS0} = V_{TO}' + \sqrt{\frac{I_{D0}}{\beta \cdot (1 + \lambda \cdot V_{DS})}}$$

$$R_{S} = \left|\frac{V_{GS0}}{I_{D0}}\right|$$

$$R_{D} = \frac{V_{DD} - V_{DS} - |V_{GS0}|}{I_{D0}}$$

## Installation

1. Clone the repository:
   git clone https://github.com/vargalaszlo87/jfet-q-point.git

2. Navigate to the project directory:
   cd jfet-q-point

3. Open index.html in any standard modern web browser.

## How It Works

### Key Functions

- jfet.SolvingCurrent(V_DD, V_GSActual, T, jfetIndex): Calculates the drain current ($I_D$) using numerical iteration for a given $V_{GS}$, $V_{DS}$, and temperature $T$.
- jfet.QPointCalc(jfetIndex, V_DD, V_GS, T): Computes the optimal DC operating point ($I_{D0}$, $V_{DS}$, $R_S$, $R_D$).
- jfet.TransferCharacteristicMake(...): Generates data points for plotting the static transfer curve.

### Key Data Structures

let component = {
    Z_load: 10e3, // Load impedance (ohms)
    Z_in: 1e6,    // Input impedance (ohms)
    Z_out: 0,     // Output impedance (ohms)
    C_s: 10e-6,   // Source bypass capacitor (farads)
    C_in: 1e-6,   // Input coupling capacitor (farads)
    C_out: 1e-6   // Output coupling capacitor (farads)
};

let simulation = {
    amp: 0,
    inverted: true,
    T: 26.85,      // Ambient temperature in °C
    T_ref: 26.85,  // Reference temperature in °C
    V_DD: 10.0,    // Supply voltage (V)
    V_DDmax: 30.0, // Maximum supply voltage (V)
    V_inp: 200e-3  // Input peak voltage (V)
};

Note: This tool uses an idealized small-signal model ($Z_{in} = 1\text{ M}\Omega$). In physical circuits, extreme parameter values (such as very low load impedance) may cause non-linear distortion and signal attenuation, causing real-world amplifier performance to differ from theoretical calculations.

## License

This project is licensed under the GNU General Public License v3.0 or later. See the LICENSE file for details.

## Links

- GitHub: [JFET Q-point Repository](https://github.com/vargalaszlo87/jfet-q-point)
- Author: [Varga László](http://vargalaszlo.com)
- Call sign / Website: [HA1CX](http://ha1cx.hu)
