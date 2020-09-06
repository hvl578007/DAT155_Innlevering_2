"use strict";

// Define ids
//burde vere enum ein eller annan plass.. (laga ein klasse RobotParts men idk?)
const BASE = 0;
const LOWER_ARM = 1;
const UPPER_ARM = 2;
const CLAW = 3;

// Parameters controlling the size of the Robot's arm
const BASE_HEIGHT      = 2.0;
const BASE_WIDTH       = 5.0;
const LOWER_ARM_HEIGHT = 4.0;
const LOWER_ARM_WIDTH  = 0.5;
const UPPER_ARM_HEIGHT = 3.0;
const UPPER_ARM_WIDTH  = 0.5;
const CLAW_LOWER_WIDTH = 0.1;
const CLAW_LOWER_HEIGHT = 0.9;
const CLAW_UPPER_WIDTH = 0.1;
const CLAW_UPPER_HEIGHT = 0.7;


// Needed because of a GL callback for rendering
let view;

/**
 * Initialise webGL for the robot arm.
 */
class RobotArmGL {

    /**
     * Initialisation code.
     *
     * @param model
     */
    constructor(model) {
        this._model = model;

        /** @type {HTMLCanvasElement} */
        let canvas = document.getElementById("gl-canvas");

        //vinklar dei ulike delene beveger seg, [0] = base, [1] = lower arm, [2] = upper arm, [3] = klo, sjå const øvst i programmet
        this._theta = [0, 0, 0, 0];
        this.numVertices = 36;

        //denne @type er berre for VSCode autofylling/intellisense
        /** @type {WebGL2RenderingContext} */
        let gl = canvas.getContext('webgl2');
        this._gl = gl;
        if (!gl) {
            alert("WebGL 2.0 isn't available");
        }

        //set basen som standard valt del for rotasjon med tastaturet
        this._chosenPart = BASE;

        let indices = [
            [1, 0, 3, 1, 3, 2],
            [2, 3, 7, 2, 7, 6],
            [3, 0, 4, 3, 4, 7],
            [6, 5, 1, 6, 1, 2],
            [4, 5, 6, 4, 6, 7],
            [5, 4, 0, 5, 0, 1]
        ];

        //kva fargar som skal bli brukt på dei ulike sidene av robotarmen
        let fargeRekkjefolgje = [1,2,3,6,4,5];

        let points = [];

        // triangulerer
        let sideColors = [];
        for (let j = 0; j < 6; ++j) {
            for (let i = 0; i < 6; ++i) {
                points.push(this._model.vertices[indices[j][i]]);

                // for solid colored faces use i = 0
                sideColors.push(this._model.colors[fargeRekkjefolgje[j]]);

            }
        }

        this._gl.viewport(0, 0, canvas.width, canvas.height);
        this._gl.clearColor(1.0, 1.0, 1.0, 1.0);

        this._gl.enable(this._gl.DEPTH_TEST);

        //
        //  Load shaders and initialize attribute buffers
        //
        let program = initShaders(this._gl, "./shaders/vshaderrobotarm.glsl", "./shaders/fshaderrobotarm.glsl");
        this._gl.useProgram(program);

        let cBuffer = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, cBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, flatten(sideColors), this._gl.STATIC_DRAW);

        let aColor = this._gl.getAttribLocation(program, "aColor");
        this._gl.vertexAttribPointer(aColor, 4, this._gl.FLOAT, false, 0, 0);
        this._gl.enableVertexAttribArray(aColor);

        let vBuffer = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, flatten(points), this._gl.STATIC_DRAW);

        let vPosition = this._gl.getAttribLocation(program, "vPosition");
        this._gl.vertexAttribPointer(vPosition, 4, this._gl.FLOAT, false, 0, 0);
        this._gl.enableVertexAttribArray(vPosition);

        //henter lokasjon til uniform for matrise
        this.modelViewMatrixLoc = this._gl.getUniformLocation(program, "modelViewMatrix");

        this.projectionMatrix = ortho(-12, 12, -12, 12, -12, 12);
        this._gl.uniformMatrix4fv(this._gl.getUniformLocation(program, "projectionMatrix"), false, flatten(this.projectionMatrix));

        view = this;
        render();
    }

    /**
     * Update the robot arm.
     */
    update() {
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);

        //flytta rotasjon ut frå shader så det er ein uniform-variabel. Skulle denne firkanten rotere?

        //roterer basen og teiknar den
        this.modelViewMatrix = rotate(this._theta[BASE], 0, 1, 0);
        this.base();

        //roterer den nedre armen, flyttar den opp og teiknar den
        this.modelViewMatrix = mult(this.modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
        this.modelViewMatrix = mult(this.modelViewMatrix, rotate(this._theta[LOWER_ARM], 0, 0, 1));
        this.lowerArm();

        //roterer den øvre armen, flyttar den opp og teiknar den
        this.modelViewMatrix = mult(this.modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
        this.modelViewMatrix = mult(this.modelViewMatrix, rotate(this._theta[UPPER_ARM], 0, 0, 1));
        this.upperArm();

        //flyttar over øvre armen
        this.modelViewMatrix = mult(this.modelViewMatrix, translate(0.0, UPPER_ARM_HEIGHT, 0.0));

        //lagar ein enkel stabel for å enklare gå tilbake og teikne den andre fingeren
        let stack = [];
        stack.push(this.modelViewMatrix);
        //roterer høgre finger på kloa
        this.modelViewMatrix = mult(this.modelViewMatrix, rotate(this._theta[CLAW], 0, 0, 1));
        this.clawLowerRight();

        //flyttar den øvre delen over den nedre delen av fingeren
        this.modelViewMatrix = mult(this.modelViewMatrix, translate(0.0, CLAW_LOWER_HEIGHT, 0.0));
        //flyttar den øvre delen i x-retning slik at den treff betre med den nedre delen av fingeren, vinkel burde nok vere konstant
        this.modelViewMatrix = mult(this.modelViewMatrix, translate(Math.sin(-30)*CLAW_LOWER_HEIGHT/2, 0.0, 0.0))
        this.clawUpperRight();

        //poppar av stabelen og teiknar den andre fingeren
        this.modelViewMatrix = stack.pop();
        //roterer venstre finger på kloa
        this.modelViewMatrix = mult(this.modelViewMatrix, rotate(-this._theta[CLAW], 0, 0, 1));
        this.clawLowerLeft();

        //flyttar den øvre delen over den nedre delen av fingeren
        this.modelViewMatrix = mult(this.modelViewMatrix, translate(0.0, CLAW_LOWER_HEIGHT, 0.0));
        //flyttar den øvre delen i x-retning slik at den treff betre med den nedre delen av fingeren, vinkel burde nok vere konstant
        this.modelViewMatrix = mult(this.modelViewMatrix, translate(Math.sin(30)*CLAW_LOWER_HEIGHT/2, 0.0, 0.0))
        this.clawUpperLeft();
        
    }

    /**
     * Teiknar basen
     */
    base() {
        //skalerer ned
        let s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);

        //flytter den slik at botn er i origo
        let instanceMatrix = mult(translate(0.0, 0.5 * BASE_HEIGHT, 0.0), s);

        let t = mult(this.modelViewMatrix, instanceMatrix);

        //sender over matrisa og teikner
        this._gl.uniformMatrix4fv(this.modelViewMatrixLoc, false, flatten(t));
        this._gl.drawArrays(this._gl.TRIANGLES, 0, this.numVertices);

    }

    /**
     * Teiknar den nedre armen
     */
    lowerArm() {
        //skalerer til figuren
        let s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);

        //flytter den slik at botn er i origo
        let instanceMatrix = mult(translate(0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0), s);

        let t = mult(this.modelViewMatrix, instanceMatrix);

        //sender over matrisa og teikner
        this._gl.uniformMatrix4fv(this.modelViewMatrixLoc, false, flatten(t));
        this._gl.drawArrays(this._gl.TRIANGLES, 0, this.numVertices);
    }

    /**
     * Teiknar den øvre armen
     */
    upperArm() {
        //skalerer til figuren
        let s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);

        //flytter den slik at botn er i origo
        let instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0), s);

        let t = mult(this.modelViewMatrix, instanceMatrix);

        //sender over matrisa og teikner
        this._gl.uniformMatrix4fv(this.modelViewMatrixLoc, false, flatten(t));
        this._gl.drawArrays(this._gl.TRIANGLES, 0, this.numVertices);
    }

    /**
     * Teiknar den nedste delen av den høgre fingeren
     */
    clawLowerRight() {
        //skalerer til figuren
        let s = scale(CLAW_LOWER_WIDTH, CLAW_LOWER_HEIGHT, CLAW_LOWER_WIDTH);

        //flytter den slik at botn er i origo og roterer litt for å få ein finger som er bøyd
        //dei 30 gradene burde nok vere ein const i klassen eller noko
        let instanceMatrix = mult(rotate(30, 0, 0, 1), translate(0.0, 0.5 * CLAW_LOWER_HEIGHT, 0.0));
        instanceMatrix = mult(instanceMatrix, s);

        let t = mult(this.modelViewMatrix, instanceMatrix);

        //sender over matrisa og teikner
        this._gl.uniformMatrix4fv(this.modelViewMatrixLoc, false, flatten(t));
        this._gl.drawArrays(this._gl.TRIANGLES, 0, this.numVertices);
    }

    /**
     * Teiknar den øvste delen av den høgre fingeren
     */
    clawUpperRight() {
        //skalerer til figuren
        let s = scale(CLAW_UPPER_WIDTH, CLAW_UPPER_HEIGHT, CLAW_UPPER_WIDTH);

        //flytter den slik at botn er i origo og roterer litt for å få ein finger som er bøyd
        let instanceMatrix = mult(rotate(-30, 0, 0, 1), translate(0.0, 0.5 * CLAW_UPPER_HEIGHT, 0.0));
        instanceMatrix = mult(instanceMatrix, s);

        let t = mult(this.modelViewMatrix, instanceMatrix);

        //sender over matrisa og teikner
        this._gl.uniformMatrix4fv(this.modelViewMatrixLoc, false, flatten(t));
        this._gl.drawArrays(this._gl.TRIANGLES, 0, this.numVertices);
    }

    /**
     * Teiknar ned nedste delen av den venstre fingeren
     */
    clawLowerLeft() {
        //skalerer til figuren
        let s = scale(CLAW_LOWER_WIDTH, CLAW_LOWER_HEIGHT, CLAW_LOWER_WIDTH);

        //flytter den slik at botn er i origo og roterer litt for å få ein finger som er bøyd
        let instanceMatrix = mult(rotate(-30, 0, 0, 1), translate(0.0, 0.5 * CLAW_LOWER_HEIGHT, 0.0));
        instanceMatrix = mult(instanceMatrix, s);

        let t = mult(this.modelViewMatrix, instanceMatrix);

        //sender over matrisa og teikner
        this._gl.uniformMatrix4fv(this.modelViewMatrixLoc, false, flatten(t));
        this._gl.drawArrays(this._gl.TRIANGLES, 0, this.numVertices);
    }

    /**
     * Teiknar den øvste delen av den venstre fingeren
     */
    clawUpperLeft() {
        //skalerer til figuren
        let s = scale(CLAW_UPPER_WIDTH, CLAW_UPPER_HEIGHT, CLAW_UPPER_WIDTH);

        //flytter den slik at botn er i origo og roterer litt for å få ein finger som er bøyd
        let instanceMatrix = mult(rotate(30, 0, 0, 1), translate(0.0, 0.5 * CLAW_UPPER_HEIGHT, 0.0));
        instanceMatrix = mult(instanceMatrix, s);

        let t = mult(this.modelViewMatrix, instanceMatrix);

        //sender over matrisa og teikner
        this._gl.uniformMatrix4fv(this.modelViewMatrixLoc, false, flatten(t));
        this._gl.drawArrays(this._gl.TRIANGLES, 0, this.numVertices);
    }

    set thetaBase(verdi) {
        this._theta[BASE] = verdi;
    }

    set thetaLower(verdi) {
        this._theta[LOWER_ARM] = verdi;
    }

    set thetaUpper(verdi) {
        this._theta[UPPER_ARM] = verdi;
    }

    set thetaClaw(verdi) {
        this._theta[CLAW] = verdi;
    }

    /**
     * Legg til grader på theta for den delen som er valt
     * @param {Number} verdi 
     */
    addTheta(verdi) {
        this._theta[this._chosenPart] += verdi;
    }

    get theta() {
        return this._theta;
    }

    set chosenPart(verdi) {
        this._chosenPart = verdi;
    }

    get chosenPart() {
        return this._chosenPart;
    }
}

/**
 * Rendering function. In this example is this rendering function needed as callback from GL.
 */
function render() {
    view.update();
    requestAnimationFrame(render);
}
