(() => {
    const Stage = Crepengine(); // Include the game engine to the project.

    Stage.init(); // Initialize the game engine.

    let textImg1, textImg2;
    let textActor1, textActor2;

    Stage.setBrushColor(Vec4D(255, 0, 0, 1.0)); // textImg1's text color.
    textImg1 = Stage.createText("Hello, Stage!", 25); // Creates a text texture. 25px and the text is Hello, Stage!
    Stage.setBrushColor(Vec4D(0, 255, 0, 1.0)); // textImg2's text color.
    textImg2 = Stage.createText("Hello, Actor!", 25); // Creates a text texture. 25px and the text is Hello, Actor!

    textActor1 = Stage.hireActor(Vec2D(0.0), textImg1.size); // Creates an Actor in (0.0, 0.0) with textImg1's suitable sizes.
    textActor2 = Stage.hireActor(Vec2D(0.0), textImg2.size); // Creates an Actor in (0.0, 0.0) with textImg2's suitable sizes.

    let actorDegree = 0; // Starting degree of the actor's orbiting angle.

    Stage.stageScript(() => {
        Stage.setBrushImage(textImg1.data); // textActor1's brush image.
        textActor1.act(); // Render Actor.
        textActor2.setPos(
            Stage.math.orbitAround(actorDegree, 300, Vec2D(0.0)) // Changes actor position using orbitAround function.
        );
        Stage.setBrushImage(textImg2.data); // textActor2's brush image.
        textActor2.act(); // Render Actor.
        Stage.setBrushImage(null); // Delete brush image.
        Stage.setBrushColor(Vec4D(0, 0, 0, 1.0)); // Background color.
        actorDegree += 0.04;
    })

    Stage.beginShow(); // Start rendering.
})();