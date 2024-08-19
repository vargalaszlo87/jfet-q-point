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
            var jfet = [
                // sequence: BETA, BETAtce, Rd, Rs, LAMBDA, V_TO, V_TOtc
                [1.304e-3, -0.5, 1, 1, 2.25e-3, -3, -2.5e-3],
                [1.16621e-3, -0.5, 9.01678, 9.01678, 1.77211e-2, -1.7372, 0],
                [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, 0],
                [5.43157e-4, -0.5, 1.20869e1, 1.20869e1, 2.71505e-2, -5.0014, 0],
                [2.86527e-3, -0.5, 1.62278, 1.62278, 6.19323e-2, -5.3298, 0],
                [1.06491e-3, -0.5, 1.41231e1, 1.41231e1, 1.68673e-2, -2.1333, 0],
                [1.09045e-3, -0.5, 7.77648, 7.77648, 2.31754e-2, -2.3085, 0],
            ];
                // solver	
            var solver = [
                1e-6, // tolerance
                100 // max iteration
            ];
            var V_GSLow = jfet[5];
            var V_GSUp = 0;
            var V_GSStep = 0.1;
            var T_ref = 26.85;
            // calculated values
            var I_DSS = 0.0;
            var m;
            var V_DS;
            var I_D0;
            var V_GS0;
            var Rs;
            var Rd;			
            // transfer characteristic
            var transferV_GS = [];
            var transferI_D = [];
            // simulation
            var T = 26.85;
            var V_DD = 10.0;
    
            function jfetTransferCharacteristic(V_GS, V_DS, LAMBDA, BETA, V_TO) {
                return (V_GS < V_TO) ? 0.0 : ((BETA * Math.pow(V_GS - V_TO, 2)) * (1 + LAMBDA * V_DS));
            }
    
            function solveI_D(V_DD, V_GSActual, T, jfetIndex) {
                let
                    I_DActual = 0.0,
                    I_DPrevius,
                    V_TOCorrected,
                    BETACorrected;
                let iteration = 0;
    
                let BETA = jfet[jfetIndex][0]; // transcoductance parameter
                let BETA_tce = jfet[jfetIndex][1] * 1e-2; // beta exponential temperature coeffitient [%/°C]
                let R_D = jfet[jfetIndex][2]; // drain ohmic resistance
                let R_S = jfet[jfetIndex][3]; // source ohmic resistance
                let LAMBDA = jfet[jfetIndex][4]; // chanel-lengt modulation
                let V_TO = jfet[jfetIndex][5]; // threshold voltage
                let V_TOtc = jfet[jfetIndex][6]; // V_TO temperature coeffitient [V/°C^-1]
    
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
    
            function jfetQPointCalc(jfetIndex, V_DD, V_GS, T) {
                I_DSS = solveI_D(V_DD, V_GS, T, jfetIndex);
                m = -I_DSS / V_DD; // m = (y2 - y1) / (x2 - x1);
                V_DS = ((V_DD - Math.abs(jfet[jfetIndex][5])) / 2) + Math.abs(jfet[jfetIndex][5]);
                I_D0 = I_DSS - Math.abs(m) * V_DS;
                V_GS0 = jfet[jfetIndex][5] + Math.sqrt(I_D0 / (jfet[jfetIndex][0] * (1 + jfet[jfetIndex][4] * V_DS)));
                Rs = Math.abs(V_GS0 / I_D0);
                Rd = (V_DD - V_DS - Math.abs(V_GS0)) / I_D0;
            }


            function jfetTransferCharacteristicMake(jfetIndex, V_DD, T, _V_GSLow, _V_GSUp, V_GSStep) {
                // n channel
                V_GSLow = _V_GSLow;
                V_GSUp = _V_GSUp;
                let i = 0;
                let V_GSActucal;
                for (V_GSActual = V_GSLow; V_GSActual <= V_GSUp; V_GSActual += V_GSStep) { 
                    transferI_D.push(solveI_D(V_DD, V_GSActual, T, jfetIndex)*1e3);
                    transferV_GS.push(V_GSActual.toFixed(4));
                }
                if (I_DSS == 0.0)
                        I_DSS = solveI_D(V_DD, 0, T, jfetIndex);					
                if (transferI_D.slice(-1) < I_DSS*1e3) {
                    transferI_D.push(I_DSS*1e3);
                    transferV_GS.push('0');
                }
            }
    
            // (jfetIndex, V_DD, V_GS, Temperature)
            jfetQPointCalc(0, V_DD, 0, T); 
    
/*            console.log("uds: " + V_DS);
            console.log("ugs0: " + V_GS0);
            console.log("I_D0: " + I_D0);
            console.log("I_DSS: " + I_DSS);
            console.log("---");				
            console.log("RS: " + Rs);
            console.log("RD: " + Rd);
*/
            // (jfetIndex, V_DD, Temperature, V_GSLow, V_GSUp, V_GSStep)           
            jfetTransferCharacteristicMake(0, V_DD, T, -3.0, 0, V_GSStep);
/*            
            console.log(transferI_D);
            console.log(transferV_GS);
*/


            