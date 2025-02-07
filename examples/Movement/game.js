(() => {
    const Stage = Crepengine(); // Include the game engine into the project.

    Stage.init(); // Initialization of the game engine.

    const Player = Stage.hireActor(Vec2D(0.0), Vec2D(50.0)); // Create an Actor. Position (0.0, 0.0) size (50.0, 50.0)
    let plrSpd = 6;

    function movementFunc()
    {
        // Check if the keys here is getting pressed, if they do the Actor
        // moves in X or Y axis depending on the key.
        if (Stage.getKey("w")) Player.moveY(plrSpd);
        if (Stage.getKey("a")) Player.moveX(-plrSpd);
        if (Stage.getKey("s")) Player.moveY(-plrSpd);
        if (Stage.getKey("d")) Player.moveX(plrSpd);
    };

    Stage.stageScript(() => {
        movementFunc();
        Stage.setBrushColor(Vec4D(255, 0, 0, 1.0)); // Player's quad color.
        Player.act(); // Render the player.
        Stage.setBrushColor(Vec4D(0, 0, 0, 1.0)); // Background color.
    });

    Stage.beginShow(); // Start rendering.
})();