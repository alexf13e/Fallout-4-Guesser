
let mapTranslations;
const mapBounds = [[0, 0], [1024, 1024]];
const panBounds = [[-512, -512], [1536, 1536]];
let map;

L.TileLayer.GameMap = L.TileLayer.extend({
    getTileUrl: function(coords) {
        /*map y coordinate becomes more negative from bottom to top, and starts at
        -1 at bottom. my tiles are 0,0 at top left, so need to convert y coordinate
        (probably doing something wrong but this works so whatever)*/
        //console.log("z: " + coords.z + ", y: " + coords.y + ", x: " + coords.x);
        let z = parseInt(coords.z)
        let x = coords.x;
        let y = (coords.y + 4 * Math.pow(2, z));
        return "assets/tiles/" + z + "/" + y + " " + x + ".jpg";
    }
})

L.TileLayer.gameMap = function() {
    return new L.TileLayer.GameMap("", {
        bounds: mapBounds,
        minZoom: -2,
        maxNativeZoom: 4
    });
}

let guessMarker;
let answerMarker;
let summaryMarkers;
let hintAreaCircle;
const hintAreaSizes = Object.freeze({ //in metres
    SMALL: 50,
    MEDIUM: 250
});

let hintAreaOptions = {
    color: "lime",
    fillOpacity: 0.05,
    radius: 0,
    pane: "tilePane"
};

let guessLine;
let guessLineOptions = {
    color: 'yellow',
    weight: 3,
    opacity: 0.8,
    smoothFactor: 1,
    pane: "tilePane"
};

let waypointIcon = L.icon({
    iconUrl: "./assets/waypoint.png",
    iconSize: [15, 40],
    iconAnchor: [7, 39]
});

let destinationIcon = L.icon({
    iconUrl: "./assets/destination.png",
    iconSize: [15, 40],
    iconAnchor: [7, 39]
});

function mapInit()
{
    //create map if it hasn't been already, and reset it to a default state
    if (!map)
    {
        map = L.map("dvMap", {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 5,
            maxBounds: panBounds,
            maxBoundsViscosity: 0.5,
            attributionControl: false
        });
    
        map.on("click", (event) => {
            //don't allow guess marker to be placed before round start or after guess made
            if (currentGameState != gameStates.GUESSING) return;
    
            //only have 1 guess marker
            if (guessMarker)
            {
                map.removeLayer(guessMarker);
            }
        
            guessMarker = mapCreateGuessMarker(event.latlng).addTo(map);
            guessPosWorld = mapToWorldPos(event.latlng);
        
            updateGuessPos();
        });

        summaryMarkers = L.layerGroup();
        map.addLayer(summaryMarkers);

        switch (getLocalStorage("mapType"))
        {
            case "satellite":
                //centreOffsetX, centreOffsetY, game units per map unit
                mapTranslations = {
                    centreOffsetX: 512,
                    centreOffsetY: 587,
                    gameUnitsPerMapUnit: 256
                };
                L.TileLayer.gameMap().addTo(map);
                L.imageOverlay("./assets/tiles/-2/0 0.jpg", mapBounds).addTo(map);
                break;

            case "ingame":
                mapTranslations = {
                    centreOffsetX: 550.6,
                    centreOffsetY: 598.5,
                    gameUnitsPerMapUnit: 261.5
                };
                L.imageOverlay("./assets/ingameMap.png", mapBounds).addTo(map);
                break;
        }
    }

    mapClear();
    mapDefaultPos();
}

function mapGenerateSummary()
{
    /*show every guess, and a line to it's corresponding answer. if no guess was made,
    show just the answer*/
    for (let pair of gameLocationSummary)
    {
        let guess = pair[0];
        let answer = pair[1];

        if (guess != null)
        {
            //a guess was made for this round, show it and a line
            let marker = mapCreateGuessMarker(guess);
            summaryMarkers.addLayer(marker);

            let line = mapCreateLine([guess, answer]);
            summaryMarkers.addLayer(line);
        }

        let marker = mapCreateAnswerMarker(answer);
        summaryMarkers.addLayer(marker);
    }
}

function mapCreateGuessMarker(pos)
{
    return L.marker(pos, {icon: waypointIcon});
}

function mapCreateAnswerMarker(pos)
{
    return L.marker(pos, {icon: destinationIcon});
}

function mapCreateLine(points)
{
    return new L.Polyline(points, guessLineOptions);
}

function mapAddHintArea(size)
{
    //randomly offset the area so the answer isnt in the centre, or closer than 10 metres to the edge of the area
    //offset is in game units, size is in metres to need to convert from metres to game units
    let randomOffset = [(Math.random() - 0.5) * (size - 20) / METRES_PER_GAME_UNIT, (Math.random() - 0.5) * (size - 20) / METRES_PER_GAME_UNIT];
    let pos = [currentImageData.pos[0] + randomOffset[0], currentImageData.pos[1] + randomOffset[1]];
    pos = worldToMapPos(pos);
    const radius = size / METRES_PER_GAME_UNIT / mapTranslations.gameUnitsPerMapUnit;
    hintAreaOptions.radius = radius;
    if (hintAreaCircle) map.removeLayer(hintAreaCircle);
    hintAreaCircle = L.circle(pos, hintAreaOptions).addTo(map);

    const BL = [pos["lat"] - radius, pos["lng"] - radius];
    const TR = [pos["lat"] + radius, pos["lng"] + radius];
    map.flyToBounds([BL, TR]);
}


function mapClear()
{
    //clear markers and lines from the map
    if (guessMarker) map.removeLayer(guessMarker);

    if (guessLine) map.removeLayer(guessLine);

    if (answerMarker) map.removeLayer(answerMarker);

    if (summaryMarkers)
    {
        summaryMarkers.clearLayers();
    }

    if (hintAreaCircle) map.removeLayer(hintAreaCircle);
}

function mapDefaultPos()
{
    //reset map to fit within the pipboy area
    map.fitBounds([[0, 0], [1024, 1024]]);
}

function mapToWorldPos(mapPos)
{
    return [(mapPos["lng"] - mapTranslations.centreOffsetX) * mapTranslations.gameUnitsPerMapUnit,
            (mapPos["lat"] - mapTranslations.centreOffsetY) * mapTranslations.gameUnitsPerMapUnit];
}

function worldToMapPos(worldPos)
{
    /*scale world units to map units, then offset so the scaled (0,0) matches the map (0,0).
    The scaling factor is world units per map unit. wu / (wu / mu) = wu * (mu / wu) = 1 * mu.
    (0,0) in the world is pretty much half way between camp kendal and greentech,
    but is not quite the centre of the map. The leaflet map is 1024 units accross, which is
    why the offset is in the 500-600 range*/
    let lat = worldPos[1] / mapTranslations.gameUnitsPerMapUnit + mapTranslations.centreOffsetY;
    let lng = worldPos[0] / mapTranslations.gameUnitsPerMapUnit + mapTranslations.centreOffsetX;
    return new L.LatLng(lat, lng);
}