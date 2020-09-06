"use strict";

// connects HTML and JavaScript

// Get sliders from the DOM
/** @type {HTMLInputElement} */
let bodyInputSlider = document.getElementById("bodySlider");
/** @type {HTMLInputElement} */
let lArmInputSlider = document.getElementById("lArmSlider");
/** @type {HTMLInputElement} */
let uArmInputSlider = document.getElementById("uArmSlider");
/** @type {HTMLInputElement} */
let clawInputSlider = document.getElementById("clawSlider");
/** @type {HTMLSelectElement} */
let selectOption = document.getElementById("robotDel");

// Create a controller for the robot arm app
let controller = new RobotArmController();

// listener functions
// needed because a callback of a method don't work
function bodySlide() {
    controller.bodySliderChanged(bodyInputSlider.value);
}

function lArmSlide() {
    controller.lArmSliderChanged(lArmInputSlider.value);
}

function uArmSlide() {
    controller.uArmSliderChanged(uArmInputSlider.value);
}

function clawSlide() {
    controller.clawSliderChanged(clawInputSlider.value);
}

function selectPart() {
    controller.selectOptionChanged(selectOption.value);
}

function keyPress(e) {
    controller.keyPressed(e.key);
}

// Add listeners to events and let the controller take actions
bodyInputSlider.addEventListener("change", bodySlide);
lArmInputSlider.addEventListener("change", lArmSlide);
uArmInputSlider.addEventListener("change", uArmSlide);
clawInputSlider.addEventListener("change", clawSlide);
selectOption.addEventListener("change", selectPart);

document.addEventListener("keydown", keyPress);