/*!
 * JFET Q-point v1.0.0
 *
 * jfet-q-point-1.0.0.js
 *
 * This application calculates the middle Q-point of the JFET for maximum input signal.
 * You can use it to calculate the important parameters for an JFET small signal amplifier. 
 * It shows the operation in a spectacular way, can also be used for educational purposes. 
 *
 * Copyright (C) 2024 Varga Laszlo
 * 
 * https://github.com/vargalaszlo87/jfet-q-point
 * http://vargalaszlo.com
 * http://ha1cx.hu
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of  MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Date: 2024-08-26
 */

// implemented models

/*
.model 2N3819 NJF(Beta=1.304m Betatce=-.5 Rd=1 Rs=1 Lambda=2.25m Vto=-3 Vtotc=-2.5m Is=33.57f Isr=322.4f N=1 Nr=2 Xti=3 Alpha=311.7u Vk=243.6 Cgd=1.6p M=.3622 Pb=1 Fc=.5 Cgs=2.414p Kf=9.882E-18 Af=1 mfg=Vishay)
.model 2N5434 NJF(Beta=18m Betatce=-.5    Rd=1 Rs=1 Lambda=25m Vto=-1.9 Vtotc=-2.5m Is=.5p Isr=5p Alpha=150u Vk=110 Cgd=35p M=.4283 Cgs=35p mfg=Vishay)
.MODEL BF245A NJF(VTO=-1.7372 BETA=1.16621m BETATCE=-0.5 LAMBDA=1.77211E-2 RD=9.01678 RS=9.01678 CGS=2.20000p CGD=2.20000p PB=7.80988E-1 IS=2.91797E-16 XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
.MODEL BF245B NJF(VTO=-2.3085 BETA=1.09045m BETATCE=-0.5 LAMBDA=2.31754E-2 RD=7.77648 RS=7.77648 CGS=2.00000p CGD=2.20000p PB=9.91494E-1 IS=2.59121E-16 XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
.MODEL BF245C NJF(VTO=-5.0014 BETA=5.43157E-4 BETATCE=-0.5 LAMBDA=2.71505E-2 RD=1.20869E1 RS=1.20869E1 CGS=2.00000p CGD=2.00000p PB=1.24659 IS=3.64346E-16 XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
.MODEL BF256A NJF(VTO=-2.1333 BETA=1.06491m BETATCE=-0.5 LAMBDA=1.68673E-2 RD=1.41231E1 RS=1.41231E1 CGS=2.10000p CGD=2.30000p PB=7.73895E-1 IS=3.50865E-16 XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
.MODEL BF256B NJF(VTO=-2.3085 BETA=1.09045m BETATCE=-0.5 LAMBDA=2.31754E-2 RD=7.77648 RS=7.77648 CGS=2.00000p CGD=2.20000p PB=9.91494E-1 IS=2.59121E-16 XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
*/

// objects

// default jfet
let jfetIndex = 0;

// models
const jfetModels = [
    { name: "2N3819", params: [1.304e-3, -0.5, 1, 1, 2.25e-3, -3, -2.5e-3] },
    { name: "2N5434", params: [18e-3, -0.5, 1, 1, 25e-3, -1.9, -2.5e-3] },
    { name: "BF245A", params: [1.16621e-3, -0.5, 9.01678, 9.01678, 1.77211e-2, -1.7372, -2.5e-3] },
    { name: "BF245B", params: [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, -2.5e-3] },
    { name: "BF245C", params: [5.43157e-4, -0.5, 1.20869e1, 1.20869e1, 2.71505e-2, -5.0014, -2.5e-3] },
    { name: "BF256A", params: [1.06491e-3, -0.5, 1.41231e1, 1.41231e1, 1.68673e-2, -2.1333, -2.5e-3] },
    { name: "BF259B", params: [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, -2.5e-3] },
];

// variables of jfet models
let jfetParameters = {
    BETA: 0.0, // transcoductance parameter
    BETA_tce: 0.0, // beta exponential temperature coeffitient [%/°C]
    BETACorrected: 0.0, // BETA after correction
    LAMBDA: 0.0, // chanel-lengt modulation
    V_TO: 0.0, // threshold voltage
    V_TOtc: 0.0, // V_TO temperature coeffitient [V/°C^-1]
    V_TOCorrected: 0.0, // V_TO after correction
    y_21s: 0.0, // transcoductance
    y_22s: 0.0, // output conductance
    r_0: 0.0 // drain-source resistance
};

// components for amplifier
let component = {
    Z_load: 10e3, // load impedance
    Z_in: 1e6, // input impedance
    Z_out: 0, // output impedance
    Z_out_eff: 0, // effective output impedance (with Z_load)
    C_s: 10e-6, // source capacitor (for the next version)
    C_in: 1e-6, // input capacitor (for the next version) 
    C_out: 1e-6 // output capacitor (for the next version)
};

// V_GS
let V_GS = {
    Low: jfetModels[jfetIndex].params[5], // the lowest voltage of V_GS
    Up: 0, // the highest voltage of V_GS
    Step: 1e-2 // number of step from V_GSLow to V_GSUp
};

// calculated values
let calculated = {
    I_DSS: 0.0, // maximum current at V_GS = 0 point
    m: 0.0, // the slope of the line between I_DS and V_DS in output-characteristics
    V_DS: 0.0, // Drain-Source voltage
    I_D0: 0.0, // the drain current of one of biasing point
    V_GS0: 0.0, // the V_GS voltage of one of biasing point
    R_S: 0.0, // source resistance
    R_D: 0.0, // drain resistance
    A_v: 0.0, // voltage gain
    A_i: 0.0 // current grain
};

// simulation
let simulation = {
    amp: 0, // type of amplifier
    inverted: true, // output signal inverting
    T: 26.85, // temperature of ambient
    T_ref: 26.85, // ref temperature of ambient 
    V_DD: 10.0, // voltage of "circuit"
    V_DDmax: 30.0, // max coltage of "circuit"
    V_inp: 200e-3 // input voltage 
};

// sine signal
let sin = {
    NumPoints: 50,
    OutputX: [],
    OutputY: []
}

// equations for calculating
const jfet = {
    solvingTolerance: 1e-6,
    solvingMaxIteration: 100,
    SolvingCurrent: (V_DD, V_GSActual, T, jfetIndex) => {
        let
        // calculating
            V_DS = 0,
            I_DActual = 0.0,
            I_DPrevius = 0,
            iteration = 0;
        // parameters of the transistor    
        jfetParameters.BETA = jfetModels[jfetIndex].params[0];
        jfetParameters.BETA_tce = jfetModels[jfetIndex].params[1] * 1e-2;
        let R_D = jfetModels[jfetIndex].params[2]; // drain ohmic resistance
        let R_S = jfetModels[jfetIndex].params[3]; // source ohmic resistance
        jfetParameters.LAMBDA = jfetModels[jfetIndex].params[4];
        jfetParameters.V_TO = jfetModels[jfetIndex].params[5];
        jfetParameters.V_TOtc = jfetModels[jfetIndex].params[6];
        // correction
        jfetParameters.V_TOCorrected = jfetParameters.V_TO + jfetParameters.V_TOtc * (T - simulation.T_ref);
        jfetParameters.BETACorrected = jfetParameters.BETA * Math.exp(jfetParameters.BETA_tce * (T - simulation.T_ref));
        // Newton method
        do {
            I_DPrevius = I_DActual;
            V_DS = V_DD - I_DActual * (R_D + R_S);
            I_DActual = jfet.TransferCharacteristic(V_GSActual, V_DS, jfetParameters.LAMBDA, jfetParameters.BETACorrected, jfetParameters.V_TOCorrected);
            iteration++;
        } while (Math.abs(I_DActual - I_DPrevius) > jfet.solvingTolerance && iteration < jfet.solvingMaxIteration);
        return I_DActual;
    },
    QPointCalc: (_jfetIndex, V_DD, V_GS, T) => {
        jfetIndex = _jfetIndex;
        calculated.I_DSS = jfet.SolvingCurrent(V_DD, V_GS, T, jfetIndex);
        calculated.m = -calculated.I_DSS / V_DD; // calculated: m = (y2 - y1) / (x2 - x1);
        calculated.V_DS = ((V_DD - Math.abs(jfetModels[jfetIndex].params[5])) / 2) + Math.abs(jfetModels[jfetIndex].params[5]);
        calculated.I_D0 = calculated.I_DSS - Math.abs(calculated.m) * calculated.V_DS;
        calculated.V_GS0 = jfetModels[jfetIndex].params[5] + Math.sqrt(calculated.I_D0 / (jfetModels[jfetIndex].params[0] * (1 + jfetModels[jfetIndex].params[4] * calculated.V_DS)));
        calculated.R_S = Math.abs(calculated.V_GS0 / calculated.I_D0);
        calculated.R_D = (V_DD - calculated.V_DS - Math.abs(calculated.V_GS0)) / calculated.I_D0;    
    },
    TransferCharacteristic: (V_GS, V_DS, LAMBDA, BETA, V_TO) => {
        return (V_GS < V_TO) ? 0.0 : ((BETA * Math.pow(V_GS - V_TO, 2)) * (1 + LAMBDA * V_DS));
    },
    transferI_D: [],
    transferV_GS: [],
    TransferCharacteristicMake: (_jfetIndex, V_DD, T, _V_GSLow, _V_GSUp, V_GSStep) => {
        jfetIndex = _jfetIndex;
        // n channel
        V_GS.Low = _V_GSLow;
        V_GS.Up = _V_GSUp;
        for (let V_GSActual = V_GS.Low; V_GSActual <= V_GS.Up; V_GSActual += V_GSStep) {
            jfet.transferI_D.push(jfet.SolvingCurrent(V_DD, V_GSActual, T, jfetIndex) * 1e3);
            jfet.transferV_GS.push(V_GSActual.toFixed(4));
        }
        if (calculated.I_DSS == 0.0)
            calculated.I_DSS = jfet.SolvingCurrent(V_DD, 0, T, jfetIndex);
        if (jfet.transferI_D.slice(-1) < calculated.I_DSS * 1e3) {
            jfet.transferI_D.push(calculated.I_DSS * 1e3);
            jfet.transferV_GS.push('0');
        }
    }
}

// default parameters
const defaultParam = {
    current: () => {
        return jfet.SolvingCurrent(simulation.V_DD, calculated.V_GS0, simulation.T, jfetIndex) * 1e3;
    },
    leftOrBottom: () => {
        return jfet.SolvingCurrent(simulation.V_DD, calculated.V_GS0 - simulation.V_inp, simulation.T, jfetIndex) * 1e3;       
    },
    rightOrTop: () => {
        return jfet.SolvingCurrent(simulation.V_DD, calculated.V_GS0 + simulation.V_inp, simulation.T, jfetIndex) * 1e3;
    }
}

// events for calculating and showing
const e24 = {
    array: [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1],
    search: (resistor) => {
        let digits = resistor.toFixed(0).toString().length;
        diff = [];
        e24.array.forEach((number) => {
            diff.push(Math.abs(number * Math.pow(10, digits - 1) - resistor));
        });
        let temp = (e24.array[diff.indexOf(Math.min(...diff))] * 10 ** (digits - 1)).toFixed(0);
        return (temp >= 1e6 ? `${(temp / 1e6)}M` : temp >= 1e3 ? `${(temp / 1e3)}k` : temp);
    }
}

const updatingValue = {
    resistor: () => {
        tempID_0 = jfet.SolvingCurrent(simulation.V_DD, calculated.V_GS0, simulation.T, jfetIndex);
        // calc the resistances
        let tempR_S = Math.abs(calculated.V_GS0 / tempID_0)
        calculated.R_S = (tempR_S > 0) ? tempR_S : 0.0;
        let tempR_D = (simulation.V_DD - calculated.V_DS - Math.abs(calculated.V_GS0)) / tempID_0;
        calculated.R_D = (tempR_D > 0) ? tempR_D : 0.0;
        $("#valueOfR_S").text(calculated.R_S.toFixed(2));
        $("#valueOfR_D").text(calculated.R_D.toFixed(2));
        // search in E24
        let E24R_S = (tempR_S > 0) ? e24.search(calculated.R_S) : 0.0;
        let E24R_D = (tempR_D > 0) ? e24.search(calculated.R_D) : 0.0;
        $("#valueOfR_SInE24").text(E24R_S);
        $("#valueOfR_DInE24").text(E24R_D);
        // output impadence
        jfetParameters.y_22s = jfetParameters.LAMBDA * calculated.I_D0;
        jfetParameters.r_0 = 1 / jfetParameters.y_22s;
        component.Z_out = 1 / ((1 / jfetParameters.r_0) + (1 / calculated.R_D));
        $("#valueOfZ_out").text(component.Z_out.toFixed(2));
        component.Z_out_eff = 1 / ((1 / jfetParameters.r_0) + (1 / calculated.R_D) + (1 / component.Z_load));
        $("#valueOfZ_out_eff").text(component.Z_out_eff.toFixed(2));
    },
    voltageGain: () => {
        jfetParameters.y_21s = 2 * jfetParameters.BETACorrected * (1 + jfetParameters.LAMBDA * calculated.V_DS) * (calculated.V_GS0 - jfetParameters.V_TOCorrected);
        jfetParameters.y_22s = jfetParameters.LAMBDA * calculated.I_D0;
        jfetParameters.r_0 = 1 / jfetParameters.y_22s;
        calculated.A_v = -jfetParameters.y_21s * (1 / ((1 / jfetParameters.r_0) + (1 / calculated.R_D) + (1 / component.Z_load)));
        $("#valueOfV_out").text(((simulation.V_inp * 1e3) * calculated.A_v).toFixed(0));
        $("#valueOfA_v").text((calculated.A_v).toFixed(2));
    },
    currentGain: () => {
        calculated.A_i = calculated.A_v * (component.Z_in / component.Z_out);
        $("#valueOfA_i").text((calculated.A_i).toFixed(2));
    },
    I_D0: () => {
        $("#valueOfI_D0").text(Number(defaultParam.current()).toFixed(2));
    },
    V_GS: () => {
        $("#rangeV_GS").prop('value', calculated.V_GS0);
    },
    V_GS0: () => {
        $("#valueOfV_GS0").text(calculated.V_GS0.toFixed(2));
    },
    positionOfCircuit: () => {
        let c = $("canvas").first();
        let positionCanvas = c.position();
        $("#circuit").css({left: positionCanvas.left + 70, top: positionCanvas.top + 20}); 
    }
}

// first values for Chart
jfet.QPointCalc(jfetIndex, simulation.V_DD, 0, simulation.T);
jfet.TransferCharacteristicMake(jfetIndex, simulation.V_DD, simulation.T, V_GS.Low, V_GS.Up, V_GS.Step);

updatingValue.resistor();
updatingValue.voltageGain();
updatingValue.currentGain();

// chart config
const config = {
    data: {
        labels: jfet.transferV_GS,
        datasets: [{
                type: 'line',
                label: 'JFET transfer characteristic',
                data: jfet.transferI_D,
                //borderWidth: 3,
                borderColor: '#6699BB',
                pointRadius: 0
            }, {
                type: 'bubble',
                label: 'Q-point (optimum)',
                //      data: [{x: calculated.V_GS0, y: calculated.I_D0*1e3, r: 5}],
                data: [{ x: calculated.V_GS0, y: defaultParam.current(), r: 5 }],
                borderWidth: 1,
                borderColor: '#ff0000',
                backgroundColor: '#ff0000'
            },
            // up to the Q-point
            {
                type: 'line',
                label: '',
                data: [
                    { x: calculated.V_GS0, y: 0 },
                    { x: calculated.V_GS0, y: defaultParam.current() }
                ],
                borderColor: '#52be80',
                backgroundColor: '#52be80',
                borderDash: [8, 2],
                fill: false
            },
            // from the Q-point                
            {
                type: 'line',
                label: '',
                data: [
                    { x: calculated.V_GS0, y: defaultParam.current() },
                    { x: 0, y: defaultParam.current() }
                ],
                borderColor: '#52be80',
                backgroundColor: '#52be80',
                borderDash: [8, 2],
                fill: false
            },
            // left side
            {
                type: 'line',
                label: '',
                data: [
                    { x: calculated.V_GS0 - simulation.V_inp, y: 0 },
                    { x: calculated.V_GS0 - simulation.V_inp, y: defaultParam.leftOrBottom() }
                ],
                borderWidth: 1,
                pointRadius: 0,
                borderColor: '#616a6b',
                borderDash: [8, 2],
                fill: false
            },
            // right side
            {
                type: 'line',
                label: '',
                data: [
                    { x: calculated.V_GS0 + simulation.V_inp, y: 0 },
                    { x: calculated.V_GS0 + simulation.V_inp, y: defaultParam.rightOrTop() }
                ],
                borderWidth: 1,
                pointRadius: 0,
                borderColor: '#616a6b',
                borderDash: [8, 2],
                fill: false
            },
            // top side
            {
                type: 'line',
                label: '',
                data: [
                    { x: calculated.V_GS0 + simulation.V_inp, y: defaultParam.rightOrTop() },
                    { x: 0, y: defaultParam.rightOrTop() }
                ],
                borderWidth: 1,
                pointRadius: 0,
                borderColor: '#616a6b',
                borderDash: [8, 2],
                fill: false
            },
            // bottom side
            {
                type: 'line',
                label: '',
                data: [
                    { x: calculated.V_GS0 - simulation.V_inp, y: defaultParam.leftOrBottom() },
                    { x: 0, y: defaultParam.leftOrBottom() }
                ],
                borderWidth: 1,
                pointRadius: 0,
                borderColor: '#616a6b',
                borderDash: [8, 2],
                fill: false
            },
            // input sine wave
            {
                type: 'line',
                label: '',
                data: Array.from({ length: sin.NumPoints }, (_, i) => {
                    const y = 0 + ((defaultParam.leftOrBottom()) - 0) * (i / (sin.NumPoints - 1)); 
                    const x = simulation.V_inp * Math.sin((i / (sin.NumPoints - 1)) * 4 * Math.PI) + calculated.V_GS0;
                    sin.OutputY.push(jfet.SolvingCurrent(simulation.V_DD, x, simulation.T, jfetIndex) * 1e3);
                    sin.OutputX.push((calculated.V_GS0 + simulation.V_inp) + (Math.abs(calculated.V_GS0 + simulation.V_inp)/sin.NumPoints) * i );
                    return { x, y };
                }),
                borderColor: '#ff0000',
                backgroundColor: '#ff0000',
                borderWidth: 1,
                pointRadius: 0,
                fill: false
            },
            // output sine wave
            {
                type: 'line',
                label: '',
                data: Array.from({ length: sin.NumPoints }, (_, i) => {
                    return { x: sin.OutputX.pop(), y: sin.OutputY.pop() };
                }),
                borderColor: '#ff0000',
                backgroundColor: '#ff0000',
                borderWidth: 1,
                pointRadius: 0,
                fill: false                
            }
        ]
    },
    options: {
        animation: {
            duration: 300
        },
        maintainAspectRatio: false,
        scales: {
            x: {
                offset: false,
                min: V_GS.Low,
                max: V_GS.Up,
                beginAtZero: false,
                type: 'linear',
                title: {
                    display: true,
                    text: 'Gate-Source voltage',
                    font: {
                        weight: 'bold',
                        size: '14'
                    }
                },
            },
            y: {
                offset: false,
                min: 0,
                max: calculated.I_DSS * 1e3,
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Drain current',
                    font: {
                        weight: 'bold',
                        size: '14'
                    }
                }
            },
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
};

// make chart
const ctx = document.getElementById('jfet-transfer-characteristic');
const chart = new Chart(ctx, config);

// updating of chart
const updatingChart = {
    draw: () => {
        jfet.transferI_D = [];
        jfet.TransferCharacteristicMake(jfetIndex, simulation.V_DD, simulation.T, V_GS.Low, V_GS.Up, V_GS.Step);
        chart.data.datasets[0].data = jfet.transferI_D;
        chart.update();
    },
    data: (changedV_GS) => {
            let
            tempBase,
            tempStatament,
            tempCondition;
        // main
        newID_0 = jfet.SolvingCurrent(simulation.V_DD, changedV_GS, simulation.T, jfetIndex);
        chart.data.datasets[1].data = [{ x: changedV_GS, y: newID_0 * 1e3, r: 5 }];
        chart.data.datasets[2].data = [{ x: changedV_GS, y: 0 }, { x: changedV_GS, y: newID_0 * 1e3 }];
        chart.data.datasets[3].data = [{ x: changedV_GS, y: newID_0 * 1e3 }, { x: 0, y: newID_0 * 1e3 }];
        // left
        tempBase = (Number(changedV_GS) - Number(simulation.V_inp));
        tempCondition = tempBase > V_GS.Low;
        tempStatament = tempCondition ? tempBase : V_GS.Low;
        chart.data.datasets[4].data = [{ x: tempStatament, y: 0 }, { x: tempStatament, y: jfet.SolvingCurrent(simulation.V_DD, tempBase, simulation.T, jfetIndex) * 1e3 }];
        // right
        tempBase = (Number(changedV_GS) + Number(simulation.V_inp));
        tempCondition = tempBase < V_GS.Up;
        tempStatament = tempCondition ? (tempBase) : V_GS.Up;
        chart.data.datasets[5].data = [{ x: tempStatament, y: 0 }, { x: tempStatament, y: tempCondition ? jfet.SolvingCurrent(simulation.V_DD, tempBase, simulation.T, jfetIndex) * 1e3 : calculated.I_DSS }];
        // top side
        tempBase = Number(changedV_GS) + Number(simulation.V_inp);
        tempCondition = tempBase < calculated.I_DSS;
        tempStatament = tempCondition ? tempBase : 0;
        tempI_D0Up = jfet.SolvingCurrent(simulation.V_DD, tempStatament, simulation.T, jfetIndex) * 1e3
        chart.data.datasets[6].data = [{ x: tempStatament, y: tempI_D0Up }, { x: V_GS.Up, y: tempI_D0Up }];
        // bottom side
        chart.data.datasets[7].data = [{ x: changedV_GS - simulation.V_inp, y: jfet.SolvingCurrent(simulation.V_DD, changedV_GS - simulation.V_inp, simulation.T, jfetIndex) * 1e3 }, { x: V_GS.Up, y: jfet.SolvingCurrent(simulation.V_DD, changedV_GS - simulation.V_inp, simulation.T, jfetIndex) * 1e3 }];
        // Vin sine
        tempArray = Array.from({ length: sin.NumPoints }, (_, i) => {
            const y = 0 + (Number(jfet.SolvingCurrent(simulation.V_DD, changedV_GS - Number(simulation.V_inp), simulation.T, jfetIndex) * 1e3) - 0) * (i / (sin.NumPoints - 1));
            const x = simulation.V_inp * Math.sin((i / (sin.NumPoints - 1)) * 4 * Math.PI) + Number(calculated.V_GS0);
            sin.OutputY.push(jfet.SolvingCurrent(simulation.V_DD, x, simulation.T, jfetIndex) * 1e3);
            sin.OutputX.push((Number(calculated.V_GS0) + simulation.V_inp) + (Math.abs(Number(calculated.V_GS0) + simulation.V_inp)/sin.NumPoints) * i);
            return { x, y };
        });
        chart.data.datasets[8].data = tempArray;
        // Vout sine
        tempArray2 = Array.from({ length: sin.NumPoints }, (_, i) => {
            return { x: sin.OutputX.pop(), y: sin.OutputY.pop() };
        });
        chart.data.datasets[9].data = tempArray2;
        // update
        chart.update();
    }
}

$(function() {
    // default values
    // images
    updatingValue.positionOfCircuit();
    $(window).resize(function() {
        updatingValue.positionOfCircuit();
    });

    // inverted
    simulation.inverted = (simulation.amp == 0);
    $(".inverted").text(simulation.inverted ? "inverted output signal" : "");

    // updating
    updatingValue.I_D0();
    updatingValue.V_GS0();

    // gate-source voltage change    
    $('#rangeV_GS').width(550).attr('min', V_GS.Low).attr('max', 0).attr('step', 'any').attr('value', calculated.V_GS0);
    // types of jfet
    jfetModels.forEach((model, index) => {
        $('#jfetSelect').append(`<option value="${index}">${model.name}</option>`);
    });

    // changed values
    $('#rangeV_GS').on('change', function() {
        V_GS0Changed = $(this).val();
        calculated.V_GS0 = V_GS0Changed;
        updatingChart.data(calculated.V_GS0);
        $("#valueOfV_GS0").text(Number(calculated.V_GS0).toFixed(2));
        updatingValue.I_D0();
        updatingValue.resistor();
        updatingValue.voltageGain();
        updatingValue.currentGain();
    });

    // supply voltage
    $("#rangeV_DD").on('change', function() {
        simulation.V_DD = $(this).val();
        $('#valueOfRangeV_DD').text(simulation.V_DD);
        updatingChart.draw();
        // VGS
        updatingChart.data(calculated.V_GS0);
        updatingValue.V_GS();
        updatingValue.I_D0();
        //chart.options.scales.y.max = calculated.I_DSS * 1e3; //  <-- dynamic ID
        chart.options.scales.y.max = jfet.SolvingCurrent(simulation.V_DD, 0, simulation.T, jfetIndex) * 1e3; // <--- static ID
        chart.update(); //  <-- dynamic ID
        updatingValue.resistor();
        updatingValue.voltageGain();
        updatingValue.currentGain();

    });

    // changed ambient temperature
    $("#rangeT").on('change', function() {
        simulation.T = $(this).val();
        $('#valueOfRangeT').text(simulation.T);
        updatingChart.draw();
        // VGS
        updatingChart.data(calculated.V_GS0);
        updatingValue.V_GS();
        updatingValue.I_D0();
        //chart.options.scales.y.max = calculated.I_DSS * 1e3; //  <-- dynamic ID
        chart.options.scales.y.max = jfet.SolvingCurrent(simulation.V_DD, 0,simulation.T, jfetIndex) * 1e3; // <--- static ID
        chart.update(); //  <-- dynamic ID
        updatingValue.resistor();
        updatingValue.voltageGain();
        updatingValue.currentGain();
    });

    // input voltage
    $('#rangeV_inp').on('change', function() {
        simulation.V_inp = $(this).val() * 1e-3;
        $('#valueOfRangeV_inp').text((simulation.V_inp * 1e3).toFixed(0));
        updatingChart.data(calculated.V_GS0);
        updatingValue.V_GS();
        // update Av, Ai
        updatingValue.voltageGain();
        updatingValue.currentGain();
    });

    // load resistance
    $('#rangeZ_load').on('change', function() {
        component.Z_load = $(this).val() * 1e3;
        $('#valueOfRangeZ_load').text((component.Z_load * 1e-3).toFixed(1));
        updatingValue.voltageGain();
        component.Z_out_eff = 1 / ((1 / jfetParameters.r_0) + (1 / calculated.R_D) + (1 / component.Z_load));
        $("#valueOfZ_out_eff").text(component.Z_out_eff.toFixed(2));
    });

    // jfet select
    $("#jfetSelect").on('change', function() {
        jfetIndex = $(this).val();
        V_GS.Low = jfetModels[jfetIndex].params[5];
        chart.options.scales.y.max = jfet.SolvingCurrent(simulation.V_DDmax, 0, simulation.T, jfetIndex) * 1e3; // <--- static ID
        $('#rangeV_GS').attr('min', jfetModels[jfetIndex].params[5]);
        // RESET ALL
        // V_DD
        simulation.V_DD = 10.0;
        $("#rangeV_DD").prop('value', simulation.V_DD);
        $('#valueOfRangeV_DD').text($("#rangeV_DD").val()); 
        // T
        simulation.T = simulation.T_ref;
        $("#rangeT").prop('value', simulation.T);
        $('#valueOfRangeT').text(simulation.T);
        // Z_load
        component.Z_load = 10e3;
        $("#rangeZ_load").prop('value', component.Z_load * 1e-3);
        $('#valueOfRangeZ_load').text((component.Z_load * 1e-3).toFixed(1));
        // V_inp
        simulation.V_inp = 200e-3;       
        $("#rangeV_inp").prop('value', simulation.V_inp*1e+3);
        $('#valueOfRangeV_inp').text($("#rangeV_inp").val());
        // pop all items
        while (jfet.transferV_GS.length > 0)
            jfet.transferV_GS.pop();
        while (jfet.transferI_D.length > 0)
            jfet.transferI_D.pop();
        // the point of V_GS range
        calculated.V_GS0 = 0;
        jfet.QPointCalc(jfetIndex, simulation.V_DD, 0, simulation.T);
        updatingValue.V_GS();
        updatingChart.data(calculated.V_GS0);
        // transfer characteristic and axis and range
        jfet.TransferCharacteristicMake(jfetIndex, simulation.V_DD, simulation.T, jfetModels[jfetIndex].params[5], V_GS.Up, V_GS.Step);
        chart.data.datasets[0].data = jfet.transferI_D;
        chart.options.scales.x.min = jfetModels[jfetIndex].params[5];
        chart.options.scales.y.max = calculated.I_DSS * 1e3; //  <-- ITT A dinamikus ID
        chart.update();
        updatingValue.resistor();
        updatingValue.voltageGain();
        updatingValue.currentGain();
        // refreshing the "default" values
        updatingValue.I_D0();
        updatingValue.V_GS0();
    });

});