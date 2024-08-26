/*!
 * JFET Q-point v1.0.0 beta - not stable
 *
 * script.js
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

// variables

var jfetIndex = 0;
var jfetName = [
    "2N3819",
    "2N5434",
    "BF245A",
    "BF245B",
    "BF245C",
    "BF256A",
    "BF259B"
];
// default jfet
var jfetIndex = 0;
//params
var jfet = [
    // sequence: BETA, BETAtce, Rd, Rs, LAMBDA, V_TO, V_TOtc
    [1.304e-3, -0.5, 1, 1, 2.25e-3, -3, -2.5e-3],
    [18e-3, -0.5, 1, 1, 25e-3, -1.9, -2.5e-3],
    [1.16621e-3, -0.5, 9.01678, 9.01678, 1.77211e-2, -1.7372, -2.5e-3],
    [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, -2.5e-3],
    [5.43157e-4, -0.5, 1.20869e1, 1.20869e1, 2.71505e-2, -5.0014, -2.5e-3],
    [1.06491e-3, -0.5, 1.41231e1, 1.41231e1, 1.68673e-2, -2.1333, -2.5e-3],
    [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, -2.5e-3],
];
var
    BETA, // transcoductance parameter
    BETA_tce, // beta exponential temperature coeffitient [%/°C]
    BETACorrected, // BETA after correction
    LAMBDA, // chanel-lengt modulation
    V_TO, // threshold voltage
    V_TOtc, // V_TO temperature coeffitient [V/°C^-1]
    V_TOCorrected, // V_TO after correction
    y_21s, // transcoductance
    y_22s, // output conductance
    r_0; // drain-source resistance
var
    Z_load = 10e3, // load impedance
    Z_in = 1e6, // input impedance
    Z_out = 0, // output impedance
    Z_out_eff = 0, // effective output impedance (with Z_load)
    C_s = 10e-6, // source capacitor
    C_in = 1e-6, // input capacitor
    C_out = 1e-6; // output capacitor
// E24
var e24 = [
    1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1
];
// solver	
var solver = [
    1e-6, // tolerance
    100 // max iteration
];
var
    V_GSLow = jfet[jfetIndex][5], // the lowest voltage of V_GS
    V_GSUp = 0, // the highest voltage of V_GS
    V_GSStep = 1e-2, // number of step from V_GSLow to V_GSUp
    T_ref = 26.85; // temperature reference
// calculated values
var
    I_DSS = 0.0, // maximum current at V_GS = 0 point
    m, // the slope of the line between I_DS and V_DS in output-characteristics
    V_DS, // Drain-Source voltage
    I_D0, // the drain current of one of biasing point
    V_GS0, // the V_GS voltage of one of biasing point
    R_S, // source resistance
    R_D, // drain resistance
    A_v, // voltage gain
    A_i; // current grain
// transfer characteristic
var
    transferV_GS = [],
    transferI_D = [];
// simulation
var
    amp = 0, // type of amplifier
    inverted = true, // output signal inverting
    T = 26.85, // temperature of ambient
    V_DD = 10.0, // voltage of "circuit"
    V_DDmax = 30.0, // max coltage of "circuit"
    V_inp = 100e-3, // input voltage 
    V_GS0Changed = 0;

// equations for calculating

function jfetTransferCharacteristic(V_GS, V_DS, LAMBDA, BETA, V_TO) {
    return (V_GS < V_TO) ? 0.0 : ((BETA * Math.pow(V_GS - V_TO, 2)) * (1 + LAMBDA * V_DS));
}

function solveI_D(V_DD, V_GSActual, T, jfetIndex) {
    let
    // calculating
        V_DS = 0,
        I_DActual = 0.0,
        I_DPrevius = 0,
        iteration = 0;

    // parameters of the transistor    
    BETA = jfet[jfetIndex][0];
    BETA_tce = jfet[jfetIndex][1] * 1e-2;
    let R_D = jfet[jfetIndex][2]; // drain ohmic resistance
    let R_S = jfet[jfetIndex][3]; // source ohmic resistance
    LAMBDA = jfet[jfetIndex][4];
    V_TO = jfet[jfetIndex][5];
    V_TOtc = jfet[jfetIndex][6];

    // correction
    V_TOCorrected = V_TO + V_TOtc * (T - T_ref);
    BETACorrected = BETA * Math.exp(BETA_tce * (T - T_ref));

    // Newton method
    solverTolerance = solver[0];
    solverMaxIteration = solver[1];
    do {
        I_DPrevius = I_DActual;
        V_DS = V_DD - I_DActual * (R_D + R_S);
        I_DActual = jfetTransferCharacteristic(V_GSActual, V_DS, LAMBDA, BETACorrected, V_TOCorrected);
        iteration++;
    } while (Math.abs(I_DActual - I_DPrevius) > solverTolerance && iteration < solverMaxIteration);

    return I_DActual;
}

function jfetQPointCalc(_jfetIndex, V_DD, V_GS, T) {
    jfetIndex = _jfetIndex;
    I_DSS = solveI_D(V_DD, V_GS, T, jfetIndex);
    m = -I_DSS / V_DD; // m = (y2 - y1) / (x2 - x1);
    V_DS = ((V_DD - Math.abs(jfet[jfetIndex][5])) / 2) + Math.abs(jfet[jfetIndex][5]);
    I_D0 = I_DSS - Math.abs(m) * V_DS;
    V_GS0 = jfet[jfetIndex][5] + Math.sqrt(I_D0 / (jfet[jfetIndex][0] * (1 + jfet[jfetIndex][4] * V_DS)));
    R_S = Math.abs(V_GS0 / I_D0);
    R_D = (V_DD - V_DS - Math.abs(V_GS0)) / I_D0;
}

function jfetTransferCharacteristicMake(_jfetIndex, V_DD, T, _V_GSLow, _V_GSUp, V_GSStep) {
    jfetIndex = _jfetIndex;
    // n channel
    V_GSLow = _V_GSLow;
    V_GSUp = _V_GSUp;
    let i = 0;
    let V_GSActucal;
    for (V_GSActual = V_GSLow; V_GSActual <= V_GSUp; V_GSActual += V_GSStep) {
        transferI_D.push(solveI_D(V_DD, V_GSActual, T, jfetIndex) * 1e3);
        transferV_GS.push(V_GSActual.toFixed(4)); // toFixed(4)
    }
    if (I_DSS == 0.0)
        I_DSS = solveI_D(V_DD, 0, T, jfetIndex);
    if (transferI_D.slice(-1) < I_DSS * 1e3) {
        transferI_D.push(I_DSS * 1e3);
        transferV_GS.push('0');
    }
}

// default display

jfetQPointCalc(0, V_DD, 0, T);
jfetTransferCharacteristicMake(0, V_DD, T, V_GSLow, V_GSUp, V_GSStep);
updateResistor();
updateAv();
updateAi();

// setup and showing

const ctx = document.getElementById('jfet-transfer-characteristic');
const chart = new Chart(ctx, {
    data: {
        labels: transferV_GS,
        datasets: [{
                type: 'line',
                label: 'JFET transfer characteristic',
                data: transferI_D,
                //borderWidth: 3,
                borderColor: '#6699BB',
                pointRadius: 0
            }, {
                type: 'bubble',
                label: 'Q-point (optimum)',
                //      data: [{x: V_GS0, y: I_D0*1e3, r: 5}],
                data: [{ x: V_GS0, y: solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3, r: 5 }],
                borderWidth: 1,
                borderColor: '#ff0000',
                backgroundColor: '#ff0000'
            },
            // up to the Q-point
            {
                type: 'line',
                label: '',
                data: [
                    { x: V_GS0, y: 0 },
                    { x: V_GS0, y: solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3 }
                ],
                borderColor: '#52be80',
                backgroundColor: '#52be80',
                fill: false
            },
            // from the Q-point                
            {
                type: 'line',
                label: '',
                data: [
                    { x: V_GS0, y: solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3 },
                    { x: 0, y: solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3 }
                ],
                borderColor: '#52be80',
                backgroundColor: '#52be80',
                fill: false
            },
            // left side
            {
                type: 'line',
                label: '',
                data: [
                    { x: V_GS0 - V_inp, y: 0 },
                    { x: V_GS0 - V_inp, y: solveI_D(V_DD, V_GS0 - V_inp, T, jfetIndex) * 1e3 }
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
                    { x: V_GS0 + V_inp, y: 0 },
                    { x: V_GS0 + V_inp, y: solveI_D(V_DD, V_GS0 + V_inp, T, jfetIndex) * 1e3 }
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
                    { x: V_GS0 + V_inp, y: solveI_D(V_DD, V_GS0 + V_inp, T, jfetIndex) * 1e3 },
                    { x: 0, y: solveI_D(V_DD, V_GS0 + V_inp, T, jfetIndex) * 1e3 }
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
                    { x: V_GS0 - V_inp, y: solveI_D(V_DD, V_GS0 - V_inp, T, jfetIndex) * 1e3 },
                    { x: 0, y: solveI_D(V_DD, V_GS0 - V_inp, T, jfetIndex) * 1e3 }
                ],
                borderWidth: 1,
                pointRadius: 0,
                borderColor: '#616a6b',
                borderDash: [8, 2],
                fill: false
            },
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
                min: V_GSLow,
                max: V_GSUp,
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
                /*ticks: {
                    callback: function(value) {
                    return value.toFixed(2); 
                    }
                }*/
            },
            y: {
                offset: false,
                min: 0,
                max: I_DSS * 1e3,
                //max: solveI_D(V_DDmax, 0, T, jfetIndex) * 1e3,
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
});

// events for calculating and showing

function updateChart() {
    transferI_D = [];
    jfetTransferCharacteristicMake(jfetIndex, V_DD, T, V_GSLow, V_GSUp, V_GSStep);
    chart.data.datasets[0].data = transferI_D;
    chart.update();
}

function updateChartData(changedV_GS) {
    let
        tempBase,
        tempStatament,
        tempCondition;

    for (let i = 1; i <= 7; i++)
        chart.data.datasets[i].data = [];

    newID_0 = solveI_D(V_DD, changedV_GS, T, jfetIndex);
    chart.data.datasets[1].data = [{ x: changedV_GS, y: newID_0 * 1e3, r: 5 }];
    chart.data.datasets[2].data = [{ x: changedV_GS, y: 0 }, { x: changedV_GS, y: newID_0 * 1e3 }];
    chart.data.datasets[3].data = [{ x: changedV_GS, y: newID_0 * 1e3 }, { x: 0, y: newID_0 * 1e3 }];

    // left
    tempBase = (Number(changedV_GS) - Number(V_inp));
    tempCondition = tempBase > V_GSLow;
    tempStatament = tempCondition ? tempBase : V_GSLow;
    chart.data.datasets[4].data = [{ x: tempStatament, y: 0 }, { x: tempStatament, y: solveI_D(V_DD, tempBase, T, jfetIndex) * 1e3 }];

    // right
    tempBase = (Number(changedV_GS) + Number(V_inp));
    tempCondition = tempBase < V_GSUp;
    tempStatament = tempCondition ? (tempBase) : V_GSUp;
    chart.data.datasets[5].data = [{ x: tempStatament, y: 0 }, { x: tempStatament, y: tempCondition ? solveI_D(V_DD, tempBase, T, jfetIndex) * 1e3 : I_DSS }];

    // top side
    tempBase = Number(changedV_GS) + Number(V_inp);
    tempCondition = tempBase < I_DSS;
    tempStatament = tempCondition ? tempBase : 0;
    tempI_D0Up = solveI_D(V_DD, tempStatament, T, jfetIndex) * 1e3
    chart.data.datasets[6].data = [{ x: tempStatament, y: tempI_D0Up }, { x: V_GSUp, y: tempI_D0Up }];

    // bottom side
    chart.data.datasets[7].data = [{ x: changedV_GS - V_inp, y: solveI_D(V_DD, changedV_GS - V_inp, T, jfetIndex) * 1e3 }, { x: V_GSUp, y: solveI_D(V_DD, changedV_GS - V_inp, T, jfetIndex) * 1e3 }];

    // update
    chart.update();

    //const xScale = chart.scales.x;
    //const xAxisWidth = xScale.width;
    //console.log(xAxisWidth);
}

function searchInE24(resistor) {
    let digits = resistor.toFixed(0).toString().length;
    diff = [];
    let i = 0;
    for (i = 0; i < e24.length; i++) {
        diff.push(Math.abs(e24[i] * Math.pow(10, digits - 1) - resistor));
    }
    let temp = (e24[diff.indexOf(Math.min(...diff))] * Math.pow(10, digits - 1)).toFixed(0);
    if (temp >= 1e3)
        temp = (temp / 1e3).toString() + "k";
    if (temp >= 1e6)
        temp = (temp / 1e6).toString() + "M";
    return (temp);
}

function updateResistor() {
    tempID_0 = solveI_D(V_DD, V_GS0, T, jfetIndex);
    // calc the resistances
    let tempR_S = Math.abs(V_GS0 / tempID_0)
    R_S = (tempR_S > 0) ? tempR_S : 0.0;
    let tempR_D = (V_DD - V_DS - Math.abs(V_GS0)) / tempID_0;
    R_D = (tempR_D > 0) ? tempR_D : 0.0;
    $("#valueOfR_S").text(R_S.toFixed(2));
    $("#valueOfR_D").text(R_D.toFixed(2));
    // search in E24
    let E24R_S = (tempR_S > 0) ? searchInE24(R_S) : 0.0;
    let E24R_D = (tempR_D > 0) ? searchInE24(R_D) : 0.0;
    $("#valueOfR_SInE24").text(E24R_S);
    $("#valueOfR_DInE24").text(E24R_D);
    // output impadence
    y_22s = LAMBDA * I_D0;
    r_0 = 1 / y_22s;
    Z_out = 1 / ((1 / r_0) + (1 / R_D));
    $("#valueOfZ_out").text(Z_out.toFixed(2));
    Z_out_eff = 1 / ((1 / r_0) + (1 / R_D) + (1 / Z_load));
    $("#valueOfZ_out_eff").text(Z_out_eff.toFixed(2));
}

function updateAv() {
    y_21s = 2 * BETACorrected * (1 + LAMBDA * V_DS) * (V_GS0 - V_TOCorrected);
    y_22s = LAMBDA * I_D0;
    r_0 = 1 / y_22s;
    A_v = -y_21s * (1 / ((1 / r_0) + (1 / R_D) + (1 / Z_load)));
    $("#valueOfV_out").text(((V_inp * 1e3) * A_v).toFixed(0));
    $("#valueOfA_v").text((A_v).toFixed(2));
}

function updateAi() {
    A_i = A_v * (Z_in / Z_out);
    $("#valueOfA_i").text((A_i).toFixed(2));
}

$(function() {
    // default values
    // inverted
    if (amp == 0) {
        inverted = true;
        $(".inverted").text("inverted output signal")
    } else {
        inverted = false;
        $(".inverted").text("");
    }
    // drain current
    $("#valueOfI_D0").text(Number(solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3).toFixed(2));
    // gate-source voltage
    $("#valueOfV_GS0").text(V_GS0.toFixed(2));
    // gate-source voltage change    
    $('#rangeV_GS').width(550).attr('min', V_GSLow).attr('max', 0).attr('step', 'any').attr('value', V_GS0);
    // types of jfet
    for (let i = 0; i < jfetName.length; i++) {
        $('#jfetSelect').append(`<option value="${i}">${jfetName[i]}</option>`);
    }
    // changed values
    $('#rangeV_GS').on('change', function() {
        V_GS0Changed = $(this).val();
        V_GS0 = V_GS0Changed;
        updateChartData(V_GS0);
        $("#valueOfV_GS0").text(Number(V_GS0).toFixed(2));
        $("#valueOfI_D0").text(Number(solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3).toFixed(2));
        updateResistor();
        updateAv();
        updateAi();
    });
    // supply voltage
    $("#rangeV_DD").on('change', function() {
        V_DD = $(this).val();
        $('#valueOfRangeV_DD').text(V_DD);
        updateChart();
        // VGS
        updateChartData(V_GS0);
        $("#rangeV_GS").prop('value', V_GS0);
        $("#valueOfI_D0").text(Number(solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3).toFixed(2));
        //chart.options.scales.y.max = I_DSS * 1e3; //  <-- dynamic ID
        chart.options.scales.y.max = solveI_D(V_DD, 0, T, jfetIndex) * 1e3; // <--- static ID
        chart.update(); //  <-- dynamic ID
        updateResistor();
        updateAv();
        updateAi();

    });
    // changed ambient temperature
    $("#rangeT").on('change', function() {
        T = $(this).val();
        $('#valueOfRangeT').text(T);
        updateChart();
        // VGS
        updateChartData(V_GS0);
        $("#rangeV_GS").prop('value', V_GS0);
        $("#valueOfI_D0").text(Number(solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3).toFixed(2));
        //chart.options.scales.y.max = I_DSS * 1e3; //  <-- dynamic ID
        chart.options.scales.y.max = solveI_D(V_DD, 0, T, jfetIndex) * 1e3; // <--- static ID
        chart.update(); //  <-- dynamic ID
        updateResistor();
        updateAv();
        updateAi();
    });
    // input voltage
    $('#rangeV_inp').on('change', function() {
        V_inp = $(this).val() * 1e-3;
        $('#valueOfRangeV_inp').text((V_inp * 1e3).toFixed(0));
        updateChartData(V_GS0);
        $("#rangeV_GS").prop('value', V_GS0);
        // update Av, Ai
        updateAv();
        updateAi();
    });
    // load resistance
    $('#rangeZ_load').on('change', function() {
        Z_load = $(this).val() * 1e3;
        $('#valueOfRangeZ_load').text((Z_load * 1e-3).toFixed(1));
        updateAv();
        Z_out_eff = 1 / ((1 / r_0) + (1 / R_D) + (1 / Z_load));
        $("#valueOfZ_out_eff").text(Z_out_eff.toFixed(2));
    });
    // jfet select
    $("#jfetSelect").on('change', function() {
        jfetIndex = $(this).val();
        V_GSLow = jfet[jfetIndex][5];
        chart.options.scales.y.max = solveI_D(V_DDmax, 0, T, jfetIndex) * 1e3; // <--- static ID
        $('#rangeV_GS').attr('min', jfet[jfetIndex][5]);
        // RESET ALL
        // V_DD
        $("#rangeV_DD").prop('value', 10.0);
        $('#valueOfRangeV_DD').text($("#rangeV_DD").val());
        V_DD = 10.0;
        // T
        $("#rangeT").prop('value', 26.85);
        T = 26.85;
        $('#valueOfRangeT').text(T);
        // Z_load
        $("#rangeZ_load").prop('value', 10);
        Z_load = 10e3;
        $('#valueOfRangeZ_load').text((Z_load * 1e-3).toFixed(1));
        // V_inp
        $("#rangeV_inp").prop('value', 100);
        $('#valueOfRangeV_inp').text($("#rangeV_inp").val());
        V_inp = 100e-3;
        // pop all items
        while (transferV_GS.length > 0)
            transferV_GS.pop();
        while (transferI_D.length > 0)
            transferI_D.pop();
        // the point of V_GS range
        V_GS0 = 0;
        jfetQPointCalc(jfetIndex, V_DD, 0, T);
        $("#rangeV_GS").prop('value', V_GS0);
        updateChartData(V_GS0);
        // transfer characteristic and axis and range
        jfetTransferCharacteristicMake(jfetIndex, V_DD, T, jfet[jfetIndex][5], V_GSUp, V_GSStep);
        chart.data.datasets[0].data = transferI_D;
        chart.options.scales.x.min = jfet[jfetIndex][5];
        chart.options.scales.y.max = I_DSS * 1e3; //  <-- ITT A dinamikus ID
        chart.update();
        updateResistor();
        updateAv();
        updateAi();
        // refreshing the "default" values
        $("#valueOfI_D0").text(Number(solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3).toFixed(2));
        $("#valueOfV_GS0").text(V_GS0.toFixed(2));

    });

});