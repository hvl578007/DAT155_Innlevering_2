"use strict";

/**
 * Controller for the robot arm project.
 */
class RobotArmController {

    /**
     * Creates a new RobotArmController object.
     */
    constructor() {
        this._model = new RobotArmData();
        this._view = new RobotArmGL(this._model);
    }

    /**
     * Endrar vinkelen til kroppen/basen
     */
    bodySliderChanged(verdi) {
        this._view.thetaBase = verdi;
    }

    /**
     * Endrar vinkelen til den nedre armen
     */
    lArmSliderChanged(verdi) {
        this._view.thetaLower = verdi;
    }

    /**
     * Endrar vikelen til den øvre armen
     */
    uArmSliderChanged(verdi) {
        this._view.thetaUpper = verdi;
    }

    /**
     * Endrar vinkelen til kloa
     */
    clawSliderChanged(verdi) {
        this._view.thetaClaw = verdi;
    }

    /**
     * Endrar kva del som er valt for rotering med tastatur
     * @param {*} verdi 
     */
    selectOptionChanged(verdi) {
        this._view.chosenPart = verdi;
    }

    /**
     * Legg til/fjernar grader på vinkelen til den delen som er valt basert på kva tast som blei trykka
     * @param {*} key 
     */
    keyPressed(key) {
        if(key === "d") {
            this._view.addTheta(10);
        } else if (key === "a") {
            this._view.addTheta(-10);
        }
    }

}


