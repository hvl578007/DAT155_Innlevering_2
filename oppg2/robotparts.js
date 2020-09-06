"use strict";
class RobotParts {

    constructor() {
        this._BASE = 0;
        this._LOWER_ARM = 1;
        this._UPPER_ARM = 2;
        this._CLAW = 3;
    }

    get BASE() {
        return this._BASE;
    }

    get LOWER_ARM() {
        return this._LOWER_ARM;
    }

    get UPPER_ARM() {
        return this._UPPER_ARM;
    }

    get CLAW() {
        return this._LOWER_ARM;
    }
}