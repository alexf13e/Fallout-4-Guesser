class PipUIElement
{
    constructor(element, visibleMode, visibleScreens = [], visibleGameStates = [], specificDisplayConditions = () => true)
    {
        this.element = element;
        this.visibleMode = visibleMode;
        this.visibleScreens = visibleScreens;
        this.visibleGameStates = visibleGameStates;
        this.specificDisplayConditions = specificDisplayConditions;
    }

    updateVisibility(screen, gameState)
    {
        let suitableScreen = this.visibleScreens.length == 0 || this.visibleScreens.includes(screen);
        let suitableState = this.visibleGameStates.length == 0 || this.visibleGameStates.includes(gameState);
        let specificConditionsMet = this.specificDisplayConditions();

        this.forceVisibility(suitableScreen && suitableState && specificConditionsMet);
    }

    forceVisibility(visible)
    {
        this.element.style.display = visible ? this.visibleMode : "none";
    }
}