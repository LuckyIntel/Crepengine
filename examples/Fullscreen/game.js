(() => {
    const Stage = Crepengine(); // Include the engine.

    Stage.init(); // Initialize the engine.

    Stage.changeResolution(Vec2D(window.innerWidth, window.innerHeight)); // Change resolution to window resolution
    Stage.onResize(Stage.changeResolution); // When browser window resizes, it will run Stage.changeResolution

    let refActor = Stage.hireActor(Vec2D(0.0), Vec2D(50.0)); // Create an Actor.

    Stage.stageScript(() => {
        Stage.setBrushColor(Vec4D(255, 0, 0, 1.0)); // Actor's color.
        refActor.act(); // Render the Actor.
        Stage.setBrushColor(Vec4D(0, 0, 0, 1.0)); // Background color.
    });

    Stage.beginShow(); // Start rendering.
})();