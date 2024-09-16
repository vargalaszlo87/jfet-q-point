# JFET Q-point v1.0.0

## Overview

This application calculates the middle Q-point of a JFET transistor for maximum input signal. The Q-point is essential in small-signal amplifier design, as it determines the optimal operating point for a JFET transistor. The application is also suitable for educational purposes, offering a visual representation of the JFET's behavior in an amplifier circuit.

This project is licensed under the GNU General Public License v3.0 or later.

## Features

- **Multiple JFET Models:** Support for popular JFET models like 2N3819, 2N5434, and the BF245 series.
- **Q-point Calculation:** Finds the optimal Q-point for maximum signal swing.
- **Interactive Simulation:** Allows users to adjust parameters such as input voltage, load impedance, and supply voltage.
- **Visual Charts:** Displays the transfer characteristic of the JFET, along with the Q-point and input/output signals.

## Try it!

[Live demo!](http://ha1cx.hu/jfet-q-point)


## Screnshot of the dashboard

![kép](https://github.com/user-attachments/assets/580ddf3b-286b-4a83-b03b-10e2e1853ae6)

## Usage

1. Select the desired JFET model from the dropdown list.
2. Adjust the input voltage (V_inp), load impedance (Z_load), and other parameters using the sliders.
3. The application will automatically update the Q-point and calculate the necessary parameters such as drain current, gain, and resistor values.
4. The chart will update to reflect the current operating point and the JFET transfer characteristics.

## Supported JFET Models

The application supports the following JFET models, each defined with specific parameters such as BETA, V_TO (threshold voltage), and LAMBDA (channel-length modulation):

```javascript
const jfetModels = [
    { name: "2N3819", params: [1.304e-3, -0.5, 1, 1, 2.25e-3, -3, -2.5e-3] },
    { name: "2N5434", params: [18e-3, -0.5, 1, 1, 25e-3, -1.9, -2.5e-3] },
    { name: "BF245A", params: [1.16621e-3, -0.5, 9.01678, 9.01678, 1.77211e-2, -1.7372, -2.5e-3] },
    { name: "BF245B", params: [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, -2.5e-3] },
    { name: "BF245C", params: [5.43157e-4, -0.5, 1.20869e1, 1.20869e1, 2.71505e-2, -5.0014, -2.5e-3] }
];
```
## Equations with optimization (in saturation region)

$$I_{D} = \beta' * (V_{GS} - V_{TO}')^2 * (1 + \lambda * V_{DS})$$


$$\beta' = \beta * exp(\beta_{tce} * (T - T_{ref}))$$


$$V_{TO}' = V_{TO} + V_{TOtc} * (T - T_{ref})$$


$$V_{DS} = \left(V_{DD} - \left|V_{TO}'\right|\right) + \left|V_{TO}'\right|$$


$$I_{DSS} = I_{D} \text{ (where }V_{GS} = 0\text{ and }V_{DS} = V_{DD})$$


$$m = \frac{-I_{DSS}}{V_{DD}}$$


$$I_{D0} = I_{DSS} - \left|m\right| * V_{DS}$$


$$V_{GS0} = V_{TO}' + \sqrt{\frac{I_{D0}}{\beta*(1 + \lambda*V_{DS})}}$$


$$R_{S} = \left|\frac{V_{GS0}}{I_{D0}}\right|$$


$$R_{D} = \frac{V_{DD} - V_{DS} - \left|V_{GS0}\right|}{I_{D0}}$$

## Installation

> 1. Clone the repository from GitHub:

```git clone https://github.com/vargalaszlo87/jfet-q-point```

> 2. Open the project directory:

```cd jfet-q-point```

> 3. Open index.html in your web browser to run the application locally.

## How It Works

The application models the JFET's behavior and calculates the Q-point based on the parameters of the selected model. The Q-point is the optimal operating point for the JFET to allow the maximum signal swing without distortion.

### Key Functions

- **jfet.SolvingCurrent**(V_DD, V_GSActual, T, jfetIndex):

  ```Calculates the drain current (I_DActual) using the Newton method for a given gate-source voltage (V_GS), drain-source voltage (V_DS), and temperature.```

- **jfet.QPointCalc**(jfetIndex, V_DD, V_GS, T):
- 
  ```Computes the Q-point (operating point) for the selected JFET model. This function returns key values such as the drain current, drain-source voltage, and the source and drain resistances.```

- **jfet.TransferCharacteristic**(V_GS, V_DS, LAMBDA, BETA, V_TO):
- 
  ```Returns the transfer characteristic of the JFET, which is the relationship between the drain current and the gate-source voltage for a given set of JFET parameters.```

### Key Variables

- **jfetParameters:** Contains the key parameters of the selected JFET model, such as BETA, V_TO, and LAMBDA, along with temperature-corrected versions of these parameters.
```javascript
  let jfetParameters = {
      BETA: 0.0,
      BETA_tce: 0.0,
      BETACorrected: 0.0,
      LAMBDA: 0.0,
      V_TO: 0.0,
      V_TOtc: 0.0,
      V_TOCorrected: 0.0,
      y_21s: 0.0,
      y_22s: 0.0,
      r_0: 0.0
  };
```
  
- **component:** Holds the amplifier's component values, such as load impedance, input impedance, and capacitors.
```javascript
  let component = {
      Z_load: 10e3, // Load impedance
      Z_in: 1e6,    // Input impedance
      Z_out: 0,     // Output impedance
      C_s: 10e-6,   // Source capacitor
      C_in: 1e-6,   // Input capacitor
      C_out: 1e-6   // Output capacitor
  };
```

## Simulation Parameters

**simulation:** This object contains the parameters for the JFET amplifier circuit, such as the supply voltage (V_DD), the input voltage (V_inp), and the ambient temperature (T).

```javascript
let simulation = {
    amp: 0,
    inverted: true,
    T: 26.85,         // Ambient temperature in °C
    T_ref: 26.85,     // Reference temperature in °C
    V_DD: 10.0,       // Supply voltage in volts
    V_DDmax: 30.0,    // Maximum supply voltage in volts
    V_inp: 200e-3     // Input voltage in volts
};
```

## Chart Visualization

The application uses charts to display the transfer characteristics and Q-point visually. The chart shows the relationship between gate-source voltage (V_GS) and drain current (I_D). The Q-point is marked on the chart for easy identification of the optimal operating point.

```javascript
const config = {
    data: {
        labels: jfet.transferV_GS,
        datasets: [{
            type: 'line',
            label: 'JFET transfer characteristic',
            data: jfet.transferI_D,
            borderColor: '#6699BB',
            pointRadius: 0
        }]
    },
    options: {
        scales: {
            x: {
                title: { text: 'Gate-Source voltage' }
            },
            y: {
                title: { text: 'Drain current' }
            }
        }
    }
};
// ...etc.
```

## License

This project is licensed under the GNU General Public License v3.0 or later. See the LICENSE file for details.

## Links

- GitHub: [JFET Q-point Repository](https://github.com/vargalaszlo87/jfet-q-point)
- Author: [Varga László](http://vargalaszlo.com)
- Website: [HA1CX](http://ha1cx.hu)

