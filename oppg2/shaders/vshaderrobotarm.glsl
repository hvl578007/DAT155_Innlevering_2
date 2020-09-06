#version 300 es

in vec4 vPosition;
in vec4 aColor;
out vec4 vColor;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {

    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
  }
