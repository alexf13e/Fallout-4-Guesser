var guessImageDragging = false;
var cnvTransitioning = false;

cnvGuess.addEventListener("mousedown", (event) => {
    if (!guessImageLoaded) return;

    pzGuessImage.mouseDown(event);
    if (playerReady) cnvGuess.style.cursor = "grabbing";
    guessImageDragging = true;
});

cnvGuess.addEventListener("wheel", (event) => {
    if (!guessImageLoaded) return;

    event.stopPropagation();
    event.preventDefault();
    pzGuessImage.scrolled(event);
    requestAnimationFrame(drawGuessImage);
});

cnvGuess.addEventListener("mouseenter", () => {
    if (playerReady)
    {
        if (guessImageDragging) cnvGuess.style.cursor = "grabbing";
        else cnvGuess.style.cursor = "grab";
    }
});

cnvGuess.addEventListener("mouseleave", () => {
    if (guessImageDragging && playerReady) document.body.style.cursor = "grabbing";
});

cnvGuess.addEventListener("transitionstart", () => {
    cnvTransitioning = true;
});

cnvGuess.addEventListener("transitionend", () => {
    cnvTransitioning = false;
    if (guessImageLoaded && playerReady)
    {
        pzGuessImage.draw(ctxGuess);
        cnvGuess.style.opacity = "1";
    }
});

window.addEventListener("mousemove", (event) => {
    if (guessImageDragging)
    {
        pzGuessImage.mouseMoved(event);
        requestAnimationFrame(drawGuessImage);
    }
});

window.addEventListener("mouseup", (event) => {
    if (guessImageDragging)
    {
        pzGuessImage.mouseUp(event);
        guessImageDragging = false;
        document.body.style.cursor = "default";
        if (playerReady) cnvGuess.style.cursor = "grab";
    }
});

document.onkeydown = (e) => {
    if (e.key == "h") pipSetVisible(false);
};

document.onkeyup = (e) => {
    if (e.key == "h") pipSetVisible(true);
};


let inputs = document.getElementsByTagName("input");

for (let i = 0; i < inputs.length; i++)
{
    if (inputs[i].type != "text" || inputs[i].id == "shareCodeInput") continue;

    inputs[i].addEventListener("keypress", (event) => {
        event.preventDefault();
        validateInput(event);
        validateRange(event, event.target.min, event.target.max);
    });

    inputs[i].addEventListener("paste", (event) => {
        event.preventDefault();
        validatePaste(event);
        validateRange(event, event.target.min, event.target.max);
    });

    inputs[i].addEventListener("focusout", (event) => {
        validateDeselect(event);
    });
}

let selects = document.getElementsByTagName("select");

for (let i = 0; i < selects.length; i++)
{
    selects[i].addEventListener("change", (event) => updateDifficultySelects(event));
}

let inpShareCode = document.getElementById("shareCodeInput");

inpShareCode.addEventListener("paste", (event) => {
    if (!validatePaste(event))
    {
        event.preventDefault();
    }
});

inpShareCode.addEventListener("keyup", (event) => {
    readShareCode(event);
});