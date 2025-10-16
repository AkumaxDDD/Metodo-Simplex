let myChart = null;
function actualizarRestricciones() {
    const numRestricciones = document.getElementById('numRestricciones').value;
    const restriccionesDiv = document.getElementById('restricciones');
    restriccionesDiv.innerHTML = '';

    for (let i = 1; i <= numRestricciones; i++) {
        const restriccionDiv = document.createElement('div');
        restriccionDiv.className = 'restriccion';
        restriccionDiv.innerHTML = `
            <input placeholder="x${i}" id="x${i}" type="number">
            <label class="vari">+</label>
            <input placeholder="y${i}" id="y${i}" type="number">
            <select id="ineq${i}">
                <option value="≤">≤</option>
                <option value="≥">≥</option>
            </select>
            <input id="b${i}" type="number">
        `;
        restriccionesDiv.appendChild(restriccionDiv);
    }
}

function resolverSimplex() {
    const numRestricciones = parseInt(document.getElementById('numRestricciones').value);
    const restricciones = [];

    // Recolecta las restricciones
    for (let i = 1; i <= numRestricciones; i++) {
        restricciones.push({
            coeficientes: [
                parseFloat(document.getElementById(`x${i}`).value),
                parseFloat(document.getElementById(`y${i}`).value)
            ],
            desigualdad: document.getElementById(`ineq${i}`).value,
            constante: parseFloat(document.getElementById(`b${i}`).value)
        });
    }

    for (let i = 0 ; i < restricciones.length; i++){
        console.log(restricciones[i])
        if(restricciones[i].desigualdad !== '≤'){
            restricciones[i].coeficientes[0]*=-1
            restricciones[i].coeficientes[1]*=-1
            restricciones[i].constante*=-1
            restricciones[i].desigualdad = '≤'
        }
    }
    // Recolecta la función objetivo
    const objetivo = [
        parseFloat(document.getElementById("c1").value),
        parseFloat(document.getElementById("c2").value)
    ];

    const solucionadorSimplex = new SolucionadorSimplex(restricciones, objetivo);
    const resultado = solucionadorSimplex.resolver();

    // Muestra los resultados
    document.getElementById("tablas").innerHTML = resultado.tablas.map((tabla, indice) => {
        return `<h4>Tabla ${indice + 1}</h4>${tablaAHtml(tabla)}`;
    }).join('');
    document.getElementById("solucionOptima").innerHTML = `<h4>Solución Óptima</h4><p>Z = ${resultado.valorOptimo}</p><p>x1 = ${resultado.solucion[0]}, x2 = ${resultado.solucion[1]}</p>`;

    dibujarGrafico(restricciones, resultado.solucion);
}

// Dibujar el gráfico
function dibujarGrafico(restricciones, solucion) {

    const ctx = document.getElementById('myChart').getContext('2d');
    let maxRange = 0;
    const datasets = restricciones.map((restriccion, index) => {
        const { coeficientes, constante, desigualdad } = restriccion;
        const rectas = [];
        
        const xIntercept = coeficientes[0] !== 0 ? (constante) / (coeficientes[0]) : 0;
        const yIntercept = coeficientes[1] !== 0 ? (constante) / (coeficientes[1]) : 0;

        maxRange = Math.max(maxRange, Math.abs(xIntercept), Math.abs(yIntercept));

        const x1 = -maxRange;
        const y1 = (constante - coeficientes[0] * x1) / coeficientes[1];
        const x2 = maxRange;
        const y2 = (constante - coeficientes[0] * x2) / coeficientes[1];

        rectas.push({ x: x1, y: y1 });
        rectas.push({ x: x2, y: y2 });

        const borderColor = `rgba(${index * 40}, ${index * 60}, ${index * 80}, 1)`;
        const backgroundColor = `rgba(${index * 40}, ${index * 60}, ${index * 80}, 0.2)`;

        return{
            label: `Recta ${index + 1}`,
            data: rectas,
            borderColor: `hsl(${index * 360 / restricciones.length}, 100%, 50%)`,
            borderWidth: 2,
            fill: {
                target: desigualdad === '≤' ? 'origin' : 'start',
                above: backgroundColor,
                below: backgroundColor,
            },
            showLine: true,
        }
    });
    const datasets1 = restricciones.map((restriccion, index) => {
        const { coeficientes, constante, desigualdad } = restriccion;
        const puntos = [];
        
        const xIntercept = coeficientes[0] !== 0 ? (constante) / (coeficientes[0]) : 0;
        const yIntercept = coeficientes[1] !== 0 ? (constante) / (coeficientes[1]) : 0;

        maxRange = Math.max(maxRange, Math.abs(xIntercept), Math.abs(yIntercept));


        if (coeficientes[0] === 0) {
            puntos.push({ x: 0, y: yIntercept });
            puntos.push({ x: maxRange, y: yIntercept });
        } else if (coeficientes[1] === 0) {
            puntos.push({ x: xIntercept, y: 0 });
            puntos.push({ x: xIntercept, y: maxRange });
        } else {
            puntos.push({ x: xIntercept, y: 0 });
            puntos.push({ x: 0, y: yIntercept });
        }

        const borderColor = `rgba(${index * 40}, ${index * 60}, ${index * 80}, 1)`;
        const backgroundColor = `rgba(${index * 40}, ${index * 60}, ${index * 80}, 0.2)`;

        return{
            label: `Restricción ${index + 1}`,
            data: puntos,
            borderColor: `hsl(${index * 360 / restricciones.length}, 100%, 50%)`,
            borderWidth: 2,
            fill: {
                target: desigualdad === '≤' ? 'origin' : 'start',
                above: backgroundColor,
                below: backgroundColor,
            },
            showLine: true,
        };
    });
    
    datasets.push({
        label: 'Solución Óptima',
        data: [{ x: solucion[0], y: solucion[1] }],
        pointRadius: 5,
        pointBackgroundColor: 'red',
        fill: true
    });
    datasets.push(...datasets1)
    // Agregar condiciones de no negatividad
    const ejeX = [
        { x: 0, y: -maxRange },
        { x: 0, y: maxRange }
    ];
    const ejeY = [
        { x: -maxRange, y: 0 },
        { x: maxRange, y: 0 }
    ];

    datasets.push({
        label: 'Condición x >= 0',
        data: ejeX,
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 2,
        fill: {
            target: 'origin',
            above: 'rgba(0, 0, 0, 0.2)',
            below: 'rgba(0, 0, 0, 0.2)',
        },
        showLine: true,
        tension: 0
    });

    datasets.push({
        label: 'Condición y >= 0',
        data: ejeY,
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 2,
        fill: {
            target: 'origin',
            above: 'rgba(0, 0, 0, 0.2)',
            below: 'rgba(0, 0, 0, 0.2)',
        },
        showLine: true,
        tension: 0
    });




    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -maxRange,
                    max: maxRange
                },
                y: {
                    type: 'linear',
                    min: -maxRange,
                    max: maxRange
                }
            },
            // plugins: {
            //     legend: {
            //         display: true,
            //         labels: {
            //             filter: (legendItem) => legendItem.text !== undefined
            //         }
            //     }
            // }
        }
    });
}


function tablaAHtml(tabla) {
    let html = '<table><tr>';
    tabla[0].forEach((_, colIndex) => {
        html += `<th>Col ${colIndex}</th>`;
    });
    html += '</tr>';
    tabla.forEach(fila => {
        html += '<tr>';
        fila.forEach(celda => {
            html += `<td>${celda.toFixed(2)}</td>`;
        });
        html += '</tr>';
    });
    html += '</table>';
    return html;
}

class SolucionadorSimplex {
    constructor(restricciones, objetivo) {
        this.restricciones = restricciones;
        this.objetivo = objetivo;
        this.tabla = [];
        this.numVariables = objetivo.length;
        this.numRestricciones = restricciones.length;
        this.tablas = [];
    }

    resolver() {
        this.inicializarTabla();
        while (!this.esOptimo()) {
            this.pivote();
        }
        return {
            tablas: this.tablas,
            valorOptimo: this.tabla[this.numRestricciones][this.numVariables + this.numRestricciones],
            solucion: this.obtenerSolucion()
        };
    }

    inicializarTabla() {
        this.tabla = this.restricciones.map((restriccion, indice) => {
            let fila = [...restriccion.coeficientes];
            fila.push(...Array(this.numRestricciones).fill(0));
            fila[this.numVariables + indice] = 1;
            fila.push(restriccion.constante);
            return fila;
        });
        let filaObjetivo = [...this.objetivo.map(coef => -coef)];
        console.log(this.restricciones)
        filaObjetivo.push(...Array(this.numRestricciones + 1).fill(0));
        console.log(filaObjetivo)
        this.tabla.push(filaObjetivo);
        this.tablas.push(JSON.parse(JSON.stringify(this.tabla)));
    }

    esOptimo() {
        return this.tabla[this.numRestricciones].slice(0, this.numVariables + this.numRestricciones).every(valor => valor >= 0);
    }

    pivote() {
        let columnaPivote = this.obtenerColumnaPivote();
        let filaPivote = this.obtenerFilaPivote(columnaPivote);
        let valorPivote = this.tabla[filaPivote][columnaPivote];

        for (let i = 0; i < this.tabla[filaPivote].length; i++) {
            this.tabla[filaPivote][i] /= valorPivote;
        }

        for (let i = 0; i < this.tabla.length; i++) {
            if (i !== filaPivote) {
                let ratio = this.tabla[i][columnaPivote];
                for (let j = 0; j < this.tabla[i].length; j++) {
                    this.tabla[i][j] -= ratio * this.tabla[filaPivote][j];
                }
            }
        }

        this.tablas.push(JSON.parse(JSON.stringify(this.tabla)));
        console.log(this.tablas)
    }

    obtenerColumnaPivote() {
        return this.tabla[this.numRestricciones].slice(0, this.numVariables + this.numRestricciones).reduce((minIndice, valor, indice, array) => valor < array[minIndice] ? indice : minIndice, 0);
    }

    obtenerFilaPivote(columnaPivote) {
        return this.tabla.slice(0, this.numRestricciones).reduce((minIndice, fila, indice, array) => {
            console.log(this.tabla.slice(0, this.numRestricciones))
            let valor = fila[columnaPivote] > 0 ? fila[fila.length - 1] / fila[columnaPivote] : Infinity;
            let valorMin = array[minIndice][columnaPivote] > 0 ? array[minIndice][array[minIndice].length - 1] / array[minIndice][columnaPivote] : Infinity;
            return valor < valorMin ? indice : minIndice;
        }, 0);
    }

    obtenerSolucion() {
        let solucion = Array(this.numVariables).fill(0);
        for (let i = 0; i < this.numRestricciones; i++) {
            for (let j = 0; j < this.numVariables; j++) {
                if (this.tabla[i][j] === 1) {
                    solucion[j] = this.tabla[i][this.numVariables + this.numRestricciones];
                }
            }
        }
        return solucion;
    }
}

window.onload = actualizarRestricciones;