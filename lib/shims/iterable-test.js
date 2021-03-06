/*
** Copyright (c) 2013 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/
IterableTest = (function() {

  var wtu = WebGLTestUtils;

  function run(test, iterations) {
    var target = iterations || 10;
    var count = 0;

    function doNextTest() {
      ++count;
      debug("Test " + count + " of " + target);
      var success = test();
      if (count < target && success !== false) {
        wtu.waitForComposite(null, doNextTest);
        //setTimeout(doNextTest, 100);
      } else {
        finishTest();
      }
    }

    doNextTest();
  }

  // Creates a canvas and a texture then exits. There are
  // no references to either so both should be garbage collected.
  function createContextCreationAndDestructionTest() {
    var textureSize = null;

    return function() {
      var canvas = document.createElement("canvas");
      // This is safe for any device. See drawingBufferWidth in spec.
      canvas.width = 2048;
      canvas.height = 2048;
      var gl = wtu.create3DContext(canvas);
      if (textureSize === null) {
        var maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        textureSize = Math.min(1024, maxTextureSize);
      }
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureSize, textureSize, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    null);
      gl.clear(gl.COLOR_BUFFER_BIT);
      wtu.glErrorShouldBe(gl, gl.NO_ERROR, "Should be no errors");

      return true;
    };
  }

  // Creates a canvas and a texture then exits. There are
  // no references to either so both should be garbage collected.
  function createMultisampleCorruptionTest(gl) {
    var lastContext = null;

    var program = wtu.loadStandardProgram(gl);
    var uniforms = wtu.getUniformMap(gl, program);
    gl.useProgram(program);

    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var vertexObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0,2.5,0, 1.5,1.5,0, 2.5,1.5,0 ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttrib3f(1, 0.0, 0.0, 1.0);

    var identityMat = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);

    gl.uniformMatrix4fv(uniforms.u_modelViewProjMatrix.location, false, identityMat);

    function test() {
      var gl2 = wtu.create3DContext(null, {antialias: true});

      gl2.canvas.width = gl2.canvas.height = 1024;
      gl2.canvas.style.width = gl2.canvas.style.height = "1px";
      document.body.appendChild(gl2.canvas);

      gl2.clearColor(1.0, 0.0, 0.0, 1.0);
      gl2.clear(gl2.COLOR_BUFFER_BIT);

      if(lastContext) {
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          var msg = "Canvas should be red";
          wtu.checkCanvasRectColor(gl,
              0, 0, gl.canvas.width, gl.canvas.height,
              [255, 0, 0, 255], null,
              function() {
                  testPassed(msg);
              },
              function() {
                  testFailed(msg);
                  return false;
              },
          debug);
          document.body.removeChild(lastContext.canvas);
      }

      lastContext = gl2;
      return true;
    };

    // First pass does initialization
    test();

    return test;
  }

  return {
    run: run,

    createContextCreationAndDestructionTest: createContextCreationAndDestructionTest,
    createMultisampleCorruptionTest: createMultisampleCorruptionTest
  };

})();
