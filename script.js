// calculating			

// models
var jfetIndex = 0;
var jfetName = [
    "2N3819",
    "BF245A",
    "BF245B",
    "BF245C",
    "BF246A",
    "BF256A",
    "BF259B"
];
/*
.MODEL BF245A NJF(VTO=-1.7372 BETA=1.16621m BETATCE=-0.5 LAMBDA=1.77211E-2 RD=9.01678 RS=9.01678 CGS=2.20000p CGD=2.20000p PB=7.80988E-1 IS=2.91797E-16 XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
.MODEL BF245B NJF(VTO=-2.3085 BETA=1.09045m BETATCE=-0.5 LAMBDA=2.31754E-2 RD=7.77648 RS=7.77648 CGS=2.00000p CGD=2.20000p PB=9.91494E-1 IS=2.59121E-16 XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
.MODEL BF245C NJF(VTO=-5.0014 BETA=5.43157E-4 BETATCE=-0.5 LAMBDA=2.71505E-2 RD=1.20869E1 RS=1.20869E1 CGS=2.00000p CGD=2.00000p PB=1.24659 IS=3.64346E-16 XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
.MODEL BF246A NJF(VTO=-5.3298 BETA=2.86527m BETATCE=-0.5 LAMBDA=6.19323E-2 RD=1.62278 RS=1.62278 CGS=1.05000E-11 CGD=1.30000E-11 PB=7.98217E-1 IS=1.18582f XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
.MODEL BF256A NJF(VTO=-2.1333 BETA=1.06491m BETATCE=-0.5 LAMBDA=1.68673E-2 RD=1.41231E1 RS=1.41231E1 CGS=2.10000p CGD=2.30000p PB=7.73895E-1 IS=3.50865E-16 XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
.MODEL BF256B NJF(VTO=-2.3085 BETA=1.09045m BETATCE=-0.5 LAMBDA=2.31754E-2 RD=7.77648 RS=7.77648 CGS=2.00000p CGD=2.20000p PB=9.91494E-1 IS=2.59121E-16 XTI=3 AF=1 FC=0.5 N=1 NR=2 MFG=PHILIPS)
*/
// default jfet
var jfetIndex = 0;
//params
var jfet = [
    // sequence: BETA, BETAtce, Rd, Rs, LAMBDA, V_TO, V_TOtc
    [1.304e-3, -0.5, 1, 1, 2.25e-3, -3, -2.5e-3],
    [1.16621e-3, -0.5, 9.01678, 9.01678, 1.77211e-2, -1.7372, -2.5e-3],
    [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, -2.5e-3],
    [5.43157e-4, -0.5, 1.20869e1, 1.20869e1, 2.71505e-2, -5.0014, -2.5e-3],
    [2.86527e-3, -0.5, 1.62278, 1.62278, 6.19323e-2, -5.3298, -2.5e-3],
    [1.06491e-3, -0.5, 1.41231e1, 1.41231e1, 1.68673e-2, -2.1333, -2.5e-3],
    [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, -2.5e-3],
];
// solver	
var solver = [
    1e-6, // tolerance
    100 // max iteration
];
var V_GSLow = jfet[jfetIndex][5];
var V_GSUp = 0;
var V_GSStep = 1e-2;
var T_ref = 26.85;
// calculated values
var I_DSS = 0.0;
var m;
var V_DS;
var I_D0;
var V_GS0;
var R_S;
var R_D;
// transfer characteristic
var transferV_GS = [];
var transferI_D = [];
// simulation
var T = 26.85;
var V_DD = 10.0;
var V_DDmax = 30.0;
var V_inp = 100e-3;
var V_GS0Changed = 0;


function jfetTransferCharacteristic(V_GS, V_DS, LAMBDA, BETA, V_TO) {
    return (V_GS < V_TO) ? 0.0 : ((BETA * Math.pow(V_GS - V_TO, 2)) * (1 + LAMBDA * V_DS));
}

function solveI_D(V_DD, V_GSActual, T, jfetIndex) {
    let
    // calculating
        V_DS = 0,
        I_DActual = 0.0,
        I_DPrevius = 0,
        V_TOCorrected = 0,
        BETACorrected = 0,
        iteration = 0,

        // parameters of the transistor    
        BETA = jfet[jfetIndex][0], // transcoductance parameter
        BETA_tce = jfet[jfetIndex][1] * 1e-2, // beta exponential temperature coeffitient [%/°C]
        R_D = jfet[jfetIndex][2], // drain ohmic resistance
        R_S = jfet[jfetIndex][3], // source ohmic resistance
        LAMBDA = jfet[jfetIndex][4], // chanel-lengt modulation
        V_TO = jfet[jfetIndex][5], // threshold voltage
        V_TOtc = jfet[jfetIndex][6]; // V_TO temperature coeffitient [V/°C^-1]

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

//console.log("I_DSS: " + I_DSS + "\nV_DS:" + V_DS + "\nI_D0: " + I_D0 + "\nV_GS0:" + V_GS0 + "\nR_S: " + R_S + "\nR_D: " + R_D);

// drawing
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

// logic

function updateChart(V_DD) {
    transferI_D = [];
    //jfetQPointCalc(jfetIndex, V_DD, 0, T);
    jfetTransferCharacteristicMake(jfetIndex, V_DD, T, V_GSLow, V_GSUp, V_GSStep);
    chart.data.datasets[0].data = transferI_D;
    chart.update();
}

function updateChartData(changedV_GS) {
    let
        tempBase,
        tempStatament,
        tempCondition;

    for (let i = 1 ; i <= 7 ; i++ )
    chart.data.datasets[i].data = [];

    newID_0 = solveI_D(V_DD, changedV_GS, T, jfetIndex);
    chart.data.datasets[1].data = [{ x: changedV_GS, y: newID_0 * 1e3, r: 5 }];
    chart.data.datasets[2].data = [{ x: changedV_GS, y: 0 }, { x: changedV_GS, y: newID_0 * 1e3 }];
    chart.data.datasets[3].data = [{ x: changedV_GS, y: newID_0 * 1e3 }, { x: 0, y: newID_0 * 1e3 }];

    // left
    tempBase = (changedV_GS - V_inp);
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

function updateResistor() {
    tempID_0 = solveI_D(V_DD, V_GS0, T, jfetIndex);
    R_S = Math.abs(V_GS0 / tempID_0);
    R_D = (V_DD - V_DS - Math.abs(V_GS0)) / tempID_0; 
    $("#valueOfR_S").text(R_S.toFixed(2));
    $("#valueOfR_D").text(R_D.toFixed(2));    
}
$(function() {
    // default values
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
    });
    // supply voltage
    $("#rangeV_DD").on('change', function() {
        V_DD = $(this).val();
        $('#valueOfRangeV_DD').text(V_DD);
        updateChart(V_DD);
        // VGS
        updateChartData(V_GS0);
        $("#rangeV_GS").prop('value', V_GS0);
        $("#valueOfI_D0").text(Number(solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3).toFixed(2));
        chart.options.scales.y.max = I_DSS * 1e3; //  <-- ITT A dinamikus ID
        chart.update(); //  <-- ITT A dinamikus ID
        updateResistor();
    });
    // input voltage
    $('#rangeV_inp').on('change', function() {
        V_inp = $(this).val() * 1e-3;
        $('#valueOfRangeV_inp').text(V_inp);
        updateChartData(V_GS0);
        $("#rangeV_GS").prop('value', V_GS0);
    });
    // jfet select
    $("#jfetSelect").on('change', function() {
        jfetIndex = $(this).val();
        //chart.options.scales.y.max = solveI_D(V_DDmax, 0, T, jfetIndex) * 1e3;    // <--- Ez a statikus ID
        // RESET ALL
        $("#rangeV_DD").prop('value', 10.0);
        $('#valueOfRangeV_DD').text($("#rangeV_DD").val());
        V_DD = 10.0;
        $("#rangeV_inp").prop('value', 100);
        $('#valueOfRangeV_inp').text($("#rangeV_inp").val());
        V_inp = 100e-3;
        // pop all items
        while (transferV_GS.length > 0)
            transferV_GS.pop();
        while (transferI_D.length > 0)
            transferI_D.pop();
        // the point of V_GS range
        jfetQPointCalc(jfetIndex, V_DD, 0, T);
        $("#rangeV_GS").prop('value', V_GS0);
        updateChartData(V_GS0);
        console.log("valtas: " + V_GS0);      
        // transfer characteristic and axis and range
        jfetTransferCharacteristicMake(jfetIndex, V_DD, T, jfet[jfetIndex][5], V_GSUp, V_GSStep);
        chart.data.datasets[0].data = transferI_D;
        chart.options.scales.x.min = jfet[jfetIndex][5];
        $('#rangeV_GS').attr('min', jfet[jfetIndex][5]);
        chart.options.scales.y.max = I_DSS * 1e3; //  <-- ITT A dinamikus ID
        chart.update();
        updateResistor();          
        // refreshing the "default" values
        $("#valueOfI_D0").text(Number(solveI_D(V_DD, V_GS0, T, jfetIndex) * 1e3).toFixed(2));
        $("#valueOfV_GS0").text(V_GS0.toFixed(2));
    });

});