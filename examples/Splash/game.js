(() => {
    const Stage = Crepengine(); // Include the game engine.

    Stage.init(); // Initialize the engine.

    Stage.setBrushColor(Vec4D(0, 0, 0, 1.0)); // splashText's text color.
    let splashText = Stage.createText("Crepengine Presents..."); // Creates a text.
    let splashActor = Stage.hireActor(Vec2D(0.0), splashText.size); // Creates an Actor.

    let splashTimer = Stage.createTimer(); // Creates a timer.
    let currentScript = null; // The function that will be played.

    let randomActor = Stage.hireActor(Vec2D(0.0), Vec2D(50.0)); // Creates an Actor.

    function splashScript()
    {
        splashActor.act(); // Render the Actor.
        Stage.setBrushColor(Vec4D(200, 200, 200, 1.0));
        if (splashTimer.elapsedSecs() <= 5) return; // If the time difference between the start of the timer and now is lower or equals to 5 seconds, don't proceed.
        Stage.setBrushImage(null); // No brush image.
        splashTimer = null; // Destroy splashTimer.
        splashText = null; // Destroy splashText.
        splashActor = null; // Destroy splashActor.
        currentScript = gameScript; // Play the gameScript function.
    };

    function gameScript()
    {
        Stage.setBrushColor(Vec4D(255, 0, 0, 1.0)); // Actor color.
        randomActor.act(); // Render the Actor.
        Stage.setBrushColor(Vec4D(0, 0, 0, 1.0)); // Background color.
    };

    Stage.setBrushImage(splashText.data); // Change brush image to splashText's image data
    currentScript = splashScript; // Play the splashScript function.
    splashTimer.start(); // Starts the timer.
    Stage.stageScript(() => {currentScript();});

    Stage.beginShow(); // Start rendering.
})();