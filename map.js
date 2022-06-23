
//centreOffsetX, centreOffsetY, game units per map unit
//512 587 256 (leaflet map)
//550.5 425 256 in-game map

var mapTranslations;
var mapBounds = [[0,0], [1024,1024]];
var map;
var wantsReInit = false;

L.TileLayer.GameMap = L.TileLayer.extend({
    getTileUrl: function(coords) {
        /*map y coordinate becomes more negative from bottom to top, and starts at
        -1 at bottom. my tiles are 0,0 at top left, so need to convert y coordinate
        (probably doing something wrong but this works so whatever)*/
        //console.log("z: " + coords.z + ", y: " + coords.y + ", x: " + coords.x);
        return "assets/tiles/" + coords.z + "/" + (coords.y + 4 * Math.pow(2, coords.z)) + " " + (coords.x) + ".jpg";
    }
})

L.TileLayer.gameMap = function() {
    return new L.TileLayer.GameMap("", {
        bounds: mapBounds,
        minZoom: -2,
    });
}

var guessMarker;
var answerMarker;
var summaryMarkers;

var guessLine;
var guessLineOptions = {
    color: 'yellow',
    weight: 3,
    opacity: 0.8,
    smoothFactor: 1
};

var waypointIcon = L.icon({
    iconUrl: "./assets/waypoint.png",
    iconSize: [15, 40],
    iconAnchor: [7, 39]
});

var destinationIcon = L.icon({
    iconUrl: "./assets/destination.png",
    iconSize: [15, 40],
    iconAnchor: [7, 39]
});

function mapInit()
{
    //create map if it hasn't been already, and reset it to a default state
    switch (localStorage.getItem("mapType"))
    {
        case "satellite":
            mapInitSatellite();
            break;

        case "ingame":
            mapInitIngame();
            break;
    }
}

function mapInitSatellite()
{
    if (!map)
    {
        mapTranslations = [512, 587, 256];

        map = L.map("dvMap", {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 4,
            zoomSnap: 0.5,
            maxBounds: mapBounds,
            maxBoundsViscosity: 0.5
        });
    
        L.TileLayer.gameMap().addTo(map);
        map.fitBounds(mapBounds);
    
        map.on("click", (event) => {
            //don't allow guess marker to be placed before round start or after guess made
            if (!playerReady || guessConfirmed) return;
    
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
    }

    mapClear();
    mapDefaultPos();
}

function mapInitIngame()
{
    if (!map)
    {
        mapTranslations = [550.6, 598.5, 261.5];

        map = L.map("dvMap", {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 3,
            zoomSnap: 0.5,
            maxBounds: mapBounds,
            maxBoundsViscosity: 0.5
        });
    
        L.imageOverlay("./assets/ingameMap.png", mapBounds).addTo(map);
        map.fitBounds(mapBounds);
    
        map.on("click", (event) => {
            //don't allow guess marker to be placed before round start or after guess made
            if (!playerReady || guessConfirmed) return;
    
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
    }


    mapClear();
    mapDefaultPos();
}

function mapGenerateSummary()
{
    //show every guess, and a line to it's corresponding answer
    for (let pair of gameLocationSummary)
    {
        let guess = pair[0];
        let answer = pair[1];

        if (guess != 0)
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
}

function mapDefaultPos()
{
    //reset map to fully zoomed out and visible
    map.fitBounds(mapBounds);
}

function mapToWorldPos(mapPos)
{
    return [(mapPos["lng"] - mapTranslations[0]) * mapTranslations[2], (mapPos["lat"] - mapTranslations[1]) * mapTranslations[2]];
}

function worldToMapPos(worldPos)
{
    let lat = worldPos[1] / mapTranslations[2] + mapTranslations[1];
    let lng = worldPos[0] / mapTranslations[2] + mapTranslations[0];
    return new L.LatLng(lat, lng);
}