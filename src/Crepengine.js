/*
    Crepengine BETA (WebGL 1 / OpenGL ES 2.0)

    Game engine is called Crepengine because I love crepes.

    I made this game engine because I was bored at home.
    I really don't know how much time it took me to make (prob total 3 hours)
    this game engine but I tried to do something like this
    earlier but I deleted it all and started from scratch
    because simply I didn't like the way it worked.
    You can use this game engine to make simple games,
    it lacks some support for making a full game but
    hey, I will most likely also add them. This is a
    one-file game engine that you can most likely download
    and add to your html file without doing anything else.
    Oh by the way did this all in WebGL 1 because I wanted
    it to be compatible with more devices, I will try to add
    WebGL 2 support too.

    About how this game engine works:

    This engine works with a HTML Canvas element. This canvas
    element is referred as the "Stage" in the game engine.
    Stage is where your actors act. Stages also has settings
    which affects most stuff in the game engine. Actors also
    have rules that are connected to the settings of the stage.
    Like if you changed the stage setting FORCE_VISIBLE to false,
    every actor that was created after the setting has changed
    will not act in the stage until you change the actor's rule
    VISIBLE to true.

    To Do List:
    1. Add matrix rotation
    2. Add keys object and settings
    3. Fix the code and optimize like seriously bro what is this code lol
    4. Fix comments
    5. Fix mipmap related problems
*/

"use strict";

/**
 * 
 * @param {Number} X 
 * @param {Number} Y
 * @returns Object containing X and Y values.
 */
const Vec2D = (X, Y = undefined) => { 
    if (X != undefined && Y == undefined) Y = X;
    return {X: X, Y: Y}; 
};

/**
 * 
 * @param {Number} X Can be used as Red
 * @param {Number} Y Can be used as Green
 * @param {Number} Z Can be used as Blue
 * @param {Number} W Can be used as Alpha
 * @returns Object containing X, Y, Z and W values.
 */
const Vec4D = (X, Y = undefined, Z = undefined, W = undefined) => { 
    if (X != undefined && Y == undefined) W = Z = Y = X;
    return {X: X, Y: Y, Z: Z, W: W}; 
};

/**
 * @returns Engine functions. 
 */
const Crepengine = () => {
    const Stage = document.createElement("canvas");
    Stage.width = Stage.height = 500;
    Stage.oncontextmenu = () => { return false; };
    const GL = Stage.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        premultipliedAlpha: false
    });

    if (GL == null) alert("Device couldn't retrieve WebGL.");

    let didInit = false;
    let sProg = null;
    let brushColor = Vec4D(0.0, 0.0, 0.0, 1.0);
    let brushImage = null;
    let __gameLoop;
    let VBO, EBO;
    let projMat4 = null;
    let keyboardInputs = new Array();

    const RECT_VERTICES = new Float32Array([
        1.0, 1.0, 1.0, 1.0,
        1.0, -1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0, 0.0,
        -1.0, 1.0, 0.0, 1.0
    ]);

    const RECT_INDICES = new Uint16Array([0, 1, 3, 1, 2, 3]);

    /**
     * Settings of the Stage and it's
     * actors.
     */
    const settings = {
        //ENABLE_PHYSICS: false,
        /**
         * When allowed, it will use mipmap calculations.
         * 
         * Default is false.
         */
        ALLOW_MIPMAP: false,
        /**
         * When forced, it will make every new Actor act
         * based on their positions.
         * 
         * Default is true.
         */
        FORCE_FRUSTUM: true,
        /**
         * When forced, it will make every new Actor visible.
         * 
         * Default is true.
         */
        FORCE_VISIBLE: true
    };

    //const keys = { };

    /**
     * Built-in simple mathematics library for
     * the game engine.
     */
    const math = {
        /**
         * @param {Number} degrees 
         * @param {Number} radius 
         * @param {Object} centerVec2
         * @returns A Vec2D value of positions based on the parameters.
         */
        orbitAround: (degrees, radius, centerVec2) => {
            return Vec2D(
                centerVec2.X + Math.cos(degrees) * radius,
                centerVec2.Y + Math.sin(degrees) * radius
            );
        },
        /**
         * @param {Object} vec21 
         * @param {Object} vec22 
         * @returns Distance of 2 vectors, scalar value.
         */
        vec2dist: (vec21, vec22) => {
            return Math.sqrt(Math.pow(vec21.X - vec22.X, 2) + Math.pow(vec21.Y - vec22.Y, 2));
        }
    };

    //const physics = { };

    window.addEventListener("keydown", (e) => {
        if (keyboardInputs.indexOf(e.key) == -1) keyboardInputs.push(e.key);
        return;
    });

    window.addEventListener("keyup", (e) => {
        if (keyboardInputs.indexOf(e.key) > -1) keyboardInputs.splice(keyboardInputs.indexOf(e.key), 1);
        return;
    });

    const idMatrix = (value) => {
        let mat4 = new Float32Array(16);

        mat4[0] = value;
        mat4[1] = 0.0;
        mat4[2] = 0.0;
        mat4[3] = 0.0;
        mat4[4] = 0.0;
        mat4[5] = value;
        mat4[6] = 0.0;
        mat4[7] = 0.0;
        mat4[8] = 0.0;
        mat4[9] = 0.0;
        mat4[10] = value;
        mat4[11] = 0.0;
        mat4[12] = 0.0;
        mat4[13] = 0.0;
        mat4[14] = 0.0;
        mat4[15] = value;

        return mat4;
    };

    const copyMatrix = (mat4) => {
        let cMat4 = idMatrix(0.0);

        cMat4[0] = mat4[0];
        cMat4[1] = mat4[1];
        cMat4[2] = mat4[2];
        cMat4[3] = mat4[3];
        cMat4[4] = mat4[4];
        cMat4[5] = mat4[5];
        cMat4[6] = mat4[6];
        cMat4[7] = mat4[7];
        cMat4[8] = mat4[8];
        cMat4[9] = mat4[9];
        cMat4[10] = mat4[10];
        cMat4[11] = mat4[11];
        cMat4[12] = mat4[12];
        cMat4[13] = mat4[13];
        cMat4[14] = mat4[14];
        cMat4[15] = mat4[15];

        return cMat4;
    };
    
    const setPosMatrix = (mat4, matPos) => {
        let cMat4 = copyMatrix(mat4);

        cMat4[12] = matPos.X;
        cMat4[13] = matPos.Y;

        return cMat4;
    };

    const multiplyMatrix = (m1, m2) => {
        let rm = idMatrix(0.0);
        let cm1 = copyMatrix(m1);
        let cm2 = copyMatrix(m2);

        rm[0] = cm1[0] * cm2[0] + cm1[1] * cm2[4] + cm1[2] * cm2[8] + cm1[3] * cm2[12];
        rm[1] = cm1[0] * cm2[1] + cm1[1] * cm2[5] + cm1[2] * cm2[9] + cm1[3] * cm2[13];
        rm[2] = cm1[0] * cm2[2] + cm1[1] * cm2[6] + cm1[2] * cm2[10] + cm1[3] * cm2[14];
        rm[3] = cm1[0] * cm2[3] + cm1[1] * cm2[7] + cm1[2] * cm2[11] + cm1[3] * cm2[15];
        rm[4] = cm1[4] * cm2[0] + cm1[5] * cm2[4] + cm1[6] * cm2[8] + cm1[7] * cm2[12];
        rm[5] = cm1[4] * cm2[1] + cm1[5] * cm2[5] + cm1[6] * cm2[9] + cm1[7] * cm2[13];
        rm[6] = cm1[4] * cm2[2] + cm1[5] * cm2[6] + cm1[6] * cm2[10] + cm1[7] * cm2[14];
        rm[7] = cm1[4] * cm2[3] + cm1[5] * cm2[7] + cm1[6] * cm2[11] + cm1[7] * cm2[15];
        rm[8] = cm1[8] * cm2[0] + cm1[9] * cm2[4] + cm1[10] * cm2[8] + cm1[11] * cm2[12];
        rm[9] = cm1[8] * cm2[1] + cm1[9] * cm2[5] + cm1[10] * cm2[9] + cm1[11] * cm2[13];
        rm[10] = cm1[8] * cm2[2] + cm1[9] * cm2[6] + cm1[10] * cm2[10] + cm1[11] * cm2[14];
        rm[11] = cm1[8] * cm2[3] + cm1[9] * cm2[7] + cm1[10] * cm2[11] + cm1[11] * cm2[15];
        rm[12] = cm1[12] * cm2[0] + cm1[13] * cm2[4] + cm1[14] * cm2[8] + cm1[15] * cm2[12];
        rm[13] = cm1[12] * cm2[1] + cm1[13] * cm2[5] + cm1[14] * cm2[9] + cm1[15] * cm2[13];
        rm[14] = cm1[12] * cm2[2] + cm1[13] * cm2[6] + cm1[14] * cm2[10] + cm1[15] * cm2[14];
        rm[15] = cm1[12] * cm2[3] + cm1[13] * cm2[7] + cm1[14] * cm2[11] + cm1[15] * cm2[15];

        return rm;
    };

    // Formula from registry.khronos.org
    const orthoProjection = (left, right, bottom, top) => {
        let projMat4 = idMatrix(1.0);

        projMat4[0] = 2 / (right - left);
        projMat4[5] = 2 / (top - bottom);
        projMat4[10] = -1;

        projMat4[3] = -(right + left) / (right - left);
        projMat4[7] = -(top + bottom) / (top - bottom);

        return projMat4;
    };

    /**
     * Initializing of the Engine. Some functions
     * will not be functioning properly before
     * engine is initialized.
     */
    const init = () => {
        if (didInit) return;
        didInit = true;

        document.body.append(Stage);

        VBO = GL.createBuffer(); 
        EBO = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, VBO);
        GL.bufferData(GL.ARRAY_BUFFER, RECT_VERTICES, GL.STATIC_DRAW);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, EBO);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, RECT_INDICES, GL.STATIC_DRAW);
    
        GL.vertexAttribPointer(0, 2, GL.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, null);
        GL.vertexAttribPointer(1, 2, GL.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);

        GL.enableVertexAttribArray(0);
        GL.enableVertexAttribArray(1);

        GL.bindBuffer(GL.ARRAY_BUFFER, null);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);

        let vShader = GL.createShader(GL.VERTEX_SHADER);
        let fShader = GL.createShader(GL.FRAGMENT_SHADER);
        sProg = GL.createProgram();

        GL.shaderSource(vShader, [
            "precision mediump float;",
            "attribute vec2 lPosition;",
            "attribute vec2 texUV;",
            "uniform vec2 lSize;",
            "uniform mat4 pvm;",
            "varying vec2 texCoord;",
            "void main(void) {",
            "texCoord = texUV;",
            "gl_Position = pvm * vec4(lPosition * lSize, 0.0, 1.0); }"
        ].join("\n"));

        GL.shaderSource(fShader, [
            "precision mediump float;",
            "uniform vec4 lColor;",
            "uniform sampler2D texIdx;",
            "uniform bool texEnabled;",
            "varying vec2 texCoord;",
            "void main(void) {",
            "if (texEnabled) { gl_FragColor = texture2D(texIdx, texCoord); return; };",
            "gl_FragColor = lColor; }"
        ].join("\n"));

        GL.compileShader(vShader);
        GL.compileShader(fShader);

        //if (GL.getShaderParameter(vShader, GL.COMPILE_STATUS) == false) console.warn(GL.getShaderInfoLog(vShader));
        //if (GL.getShaderParameter(fShader, GL.COMPILE_STATUS) == false) console.warn(GL.getShaderInfoLog(fShader));

        GL.attachShader(sProg, vShader);
        GL.attachShader(sProg, fShader);
        GL.linkProgram(sProg);

        //if (GL.getProgramParameter(sProg, GL.LINK_STATUS) == false) console.warn(GL.getProgramInfoLog(sProg));

        GL.deleteShader(vShader);
        GL.deleteShader(fShader);

        vShader = fShader = null;
        
        GL.viewport(0, 0, Stage.width, Stage.height);
        projMat4 = orthoProjection(-Stage.width, Stage.width, -Stage.height, Stage.height);

        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
        GL.enable(GL.BLEND);
        GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
    };

    /**
     * @returns A timer class.
     */
    const createTimer = () => {
        let lastTime;
        let didStart = false;

        /**
         * Starts/resets the timer.
         */
        const start = () => {
            lastTime = performance.now();
            didStart = true;
        };

        /**
         * Will return 0 if the timer didn't start.
         * @returns Elapsed time in milliseconds.
         */
        const elapsedMilliSecs = () => {
            if (!didStart) return 0;
            return performance.now() - lastTime;
        };

        /**
         * Will return 0 if the timer didn't start.
         * @returns Elapsed time in seconds.
         */
        const elapsedSecs = () => {
            if (!didStart) return 0;
            return (performance.now() - lastTime) / 1000.0;
        };

        return {
            start: start,
            elapsedMilliSecs: elapsedMilliSecs,
            elapsedSecs: elapsedSecs
        };
    };

    /**
     * @param {String} keyChar String of the character.
     * @returns true or false.
     */
    const getKey = (keyChar) => {
        return (keyboardInputs.indexOf(keyChar) > -1);
    };

    /**
     * Changes the resolution of the Stage.
     * @param {Object} vec2value Vec2D value for new resolution. 
     */
    const changeResolution = (vec2value) => {
        Stage.width = vec2value.X;
        Stage.height = vec2value.Y;

        GL.viewport(0, 0, Stage.width, Stage.height);
        projMat4 = orthoProjection(-Stage.width, Stage.width, -Stage.height, Stage.height);
    };

    /**
     * Runs the function that are given in the parameter
     * when browser's window resizes.
     * @param {Function} resizeFunction 
     */
    const onResize = (resizeFunction) => {
        window.onresize = () => {
            resizeFunction(Vec2D(window.innerWidth, window.innerHeight));
        };
    };

    /**
     * Changes brush color to new colors.
     * @param {Object} newBrush Vec4D value.
     */
    const setBrushColor = (newBrush) => {
        brushColor = Vec4D(
            newBrush.X / 255,
            newBrush.Y / 255,
            newBrush.Z / 255,
            newBrush.W
        ); 
    };

    /**
     * Changes brush image to new image.
     * @param {*} newBrush Signed image.
     */
    const setBrushImage = (newBrush) => { brushImage = newBrush; };

    /**
     * Generates a texture based on the data array.
     * @param {Array} imgData Data Array.
     * @returns A signed image.
     */
    const signImage = (imgData) => {
        let ID = GL.createTexture();
        GL.bindTexture(GL.TEXTURE_2D, ID);

        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);

        if (
            settings.ALLOW_MIPMAP &&
            Math.log2(imgData.width) == Math.floor(Math.log2(imgData.width)) &&
            Math.log2(imgData.height) == Math.floor(Math.log2(imgData.height))
        ) 
        {
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_NEAREST);
            GL.generateMipmap(GL.TEXTURE_2D);
        };

        GL.texImage2D(
            GL.TEXTURE_2D,
            null,
            GL.RGBA,
            imgData.width,
            imgData.height,
            null,
            GL.RGBA,
            GL.UNSIGNED_BYTE,
            imgData.data
        );

        return ID;
    };

    /**
     * Will use the array that have been put
     * in the parameter to turn them into
     * image data array. This array will be later
     * get signed with the signImage function.
     * @param {Array} colorArray 
     * @returns A signed image.
     */
    const createTexture = (colorArray) => {
        let tempCanvas = document.createElement("canvas");
        let tempGL = tempCanvas.getContext("2d");
        let result;

        colorArray = colorArray[0];
        tempCanvas.width = colorArray[0].length;
        tempCanvas.height = colorArray.length;

        for (let y = 0; y < tempCanvas.height; y++)
        {
            for (let x = 0; x < tempCanvas.width; x++)
            {
                let colors = colorArray[y][x];

                tempGL.fillStyle = `rgba(${colors.X},${colors.Y},${colors.Z},${colors.W})`;
                tempGL.fillRect(x, y, 1, 1);
            };
        };

        result = signImage(tempGL.getImageData(0, 0, tempCanvas.width, tempCanvas.height));
        tempCanvas = tempGL = null;

        return result;
    };

    /**
     * Creates a transparent signed image with
     * text and px that has been put on the parameters.
     * @param {String} textStr Text string.
     * @param {Number} textPX PX of the Text.
     * @param {String} textFont
     * @returns An object containing "data" and "size" in it.
     */
    const createText = (textStr, textPX = 20, textFont = "Arial") => {
        let tempCanvas = document.createElement("canvas");
        let tempGL = tempCanvas.getContext("2d");
        let result;

        let colorX = brushColor.X * 255;
        let colorY = brushColor.Y * 255;
        let colorZ = brushColor.Z * 255;
        let colorW = brushColor.W;

        tempGL.font = `${textPX}px ${textFont}`;
        let tempWidth = Math.round(tempGL.measureText(textStr).width);

        tempCanvas.width = tempWidth;
        tempCanvas.height = textPX;
        //tempGL.fillStyle = "rgba(255, 0, 0, 1)";
        //tempGL.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempGL.font = `${textPX}px Arial`;
        tempGL.fillStyle = `rgba(${colorX},${colorY},${colorZ},${colorW})`;
        tempGL.fillText(textStr, 0, (tempCanvas.height + textPX / 2) / 2);

        result = signImage(tempGL.getImageData(0, 0, tempCanvas.width, tempCanvas.height));
        tempCanvas = tempGL = null;
        colorX = colorY = colorZ = colorW = null;
        
        return {
            data: result, 
            size: Vec2D(tempWidth, textPX)
        };
    };

    /**
     * @param {Object} position Vec2D value.
     * @param {Object} size Vec2D value.
     * @returns An Actor object.
     */
    const hireActor = (position = Vec2D(0.0), size = Vec2D(1.0)) => {
        let Model, modelPos, modelSize;
        modelPos = position;
        modelSize = size;
        let DELETED = false;

        /**
         * Rules are the settings of the actors. They
         * can be individually set on every actor.
         */
        const rules = {
            /**
             * Checks if the actor's position and size is in
             * the boundaries of the stage. If it's in the boundaries
             * the actor will act, however if it's not the actor
             * will refuse acting.
             * 
             * Default is the Stage's FORCE_FRUSTUM setting.
             */
            FRUSTUM: settings.FORCE_FRUSTUM,
            /**
             * Depending on the value given to it, the actor
             * will act or refuse to act.
             * 
             * Default is the Stage's FORCE_VISIBLE setting.
             */
            VISIBLE: settings.FORCE_VISIBLE,
            //PHYSICS: settings.ENABLE_PHYSICS
        };

        /**
         * @returns Vec2D value of actor's size.
         */
        const getSize = () => { return modelSize; };

        /**
         * Changes the actor's size.
         * @param {Object} vec2value Vec2D value.
         */
        const setSize = (vec2value) => { modelSize = vec2value; };

        /**
         * @returns Vec2D value of actor's position.
         */
        const getPos = () => { return modelPos; };

        /**
         * Changes the actor's position.
         * @param {Object} vec2value Vec2D value.
         */
        const setPos = (vec2value) => { modelPos = vec2value; };

        /**
         * Adds the Vec2D value given in the parameter
         * to the current position of the actor.
         * @param {Object} vec2value Vec2D value.
         */
        const move = (vec2value) => {
            modelPos.X += vec2value.X;
            modelPos.Y += vec2value.Y;
        };

        /**
         * Adds the scalar given in the parameter to
         * the current x position of the actor.
         * @param {Number} value Scalar value. 
         */
        const moveX = (value) => { modelPos.X += value; };

        /**
         * Adds the scalar given in the parameter to
         * the current y position of the actor.
         * @param {Number} value Scalar value. 
         */
        const moveY = (value) => { modelPos.Y += value; };

        const frustumCulling = () => {
            return (
                modelPos.X + modelSize.X >= -Stage.width &&
                modelPos.X - modelSize.X <= Stage.width &&
                modelPos.Y + modelSize.Y >= -Stage.height &&
                modelPos.Y - modelSize.Y <= Stage.height
            )
        };

        /**
         * Renders the actor on the stage.
         */
        const act = () => {
            if (DELETED) return;
            if (!rules.VISIBLE) return;
            if (rules.FRUSTUM && !frustumCulling()) return;

            Model = setPosMatrix(idMatrix(1.0), modelPos);
            Model = multiplyMatrix(Model, projMat4);

            GL.uniform2fv(GL.getUniformLocation(sProg, "lSize"), new Float32Array([modelSize.X, modelSize.Y]));

            if (brushImage != null)
            {
                GL.uniform1i(GL.getUniformLocation(sProg, "texIdx"), brushImage);
                GL.uniform1i(GL.getUniformLocation(sProg, "texEnabled"), true);
                GL.bindTexture(GL.TEXTURE_2D, brushImage);
            }
            else
            {
                GL.uniform1i(GL.getUniformLocation(sProg, "texEnabled"), false);
                GL.uniform4fv(GL.getUniformLocation(sProg, "lColor"), new Float32Array([
                    brushColor.X,
                    brushColor.Y,
                    brushColor.Z,
                    brushColor.W
                ]));
            };

            GL.uniformMatrix4fv(GL.getUniformLocation(sProg, "pvm"), false, Model);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, EBO);
            GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, null);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
        };

        return {
            rules: rules,
            getSize: getSize,
            setSize: setSize,
            getPos: getPos,
            setPos: setPos,
            move: move,
            moveX: moveX,
            moveY: moveY,
            act: act
        };
    };

    /**
     * When the show begins, the function given
     * in the parameter will play.
     * @param {Function} scriptFunction 
     */
    const stageScript = (scriptFunction) => {
        __gameLoop = scriptFunction;
    };

    /**
     * Starts the rendering process.
     */
    const beginShow = () => {
        requestAnimationFrame(beginShow);
        GL.clearColor(brushColor.X, brushColor.Y, brushColor.Z, brushColor.W);
        GL.clear(GL.COLOR_BUFFER_BIT);
        GL.useProgram(sProg);
        __gameLoop();
    };

    return {
        settings: settings,
        math: math,
        init: init,
        createTimer: createTimer,
        getKey: getKey,
        changeResolution: changeResolution,
        onResize: onResize,
        setBrushColor: setBrushColor,
        setBrushImage: setBrushImage,
        signImage: signImage,
        createTexture: createTexture,
        createText: createText,
        hireActor: hireActor,
        stageScript: stageScript,
        beginShow: beginShow
    };
};