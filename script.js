/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/


/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
//Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5hbm1heSIsImEiOiJjbDk0azNmY3oxa203M3huMzhyZndlZDRoIn0.1L-fBYplQMuwz0LGctNeiA'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

//Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', //container id in HTML
    style: 'mapbox://styles/mapbox/dark-v11',  //****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 9 // starting zoom level
});

map.addControl(new mapboxgl.NavigationControl());


// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/ananmaysharan/ggr472-lab4/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        // console.log(response); //Check response in console
        collisiongeojson = response; // Store geojson as variable using URL from fetch response
    });

map.on('load', () => {

    bbox = turf.envelope(collisiongeojson)

    bboxTransformed = turf.transformScale(bbox, 1.1)

    bboxgeojson = {
        "type": "FeatureCollection",
        "features": [bboxTransformed]
    }

    const minX = bboxTransformed.geometry.coordinates[0][0][0];
    const minY = bboxTransformed.geometry.coordinates[0][0][1];
    const maxX = bboxTransformed.geometry.coordinates[0][2][0];
    const maxY = bboxTransformed.geometry.coordinates[0][2][1];

    let bboxcords = [minX, minY, maxX, maxY]

    const hexgrid = turf.hexGrid(bboxcords, 0.4, { units: 'kilometres' });

    let collishex = turf.collect(hexgrid, collisiongeojson, '_id', 'values')

    console.log(collishex)

    let maxcollis = 0;

    collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length
        if (feature.properties.COUNT > maxcollis) {
            maxcollis = feature.properties.COUNT
        }
    });

    console.log(maxcollis);


    //Add datasource using GeoJSON variable
    map.addSource('toronto-col', {
        type: 'geojson',
        data: collisiongeojson
    });

    map.addLayer({
        'id': 'toronto-col-pnts',
        'type': 'circle',
        'source': 'toronto-col',
        'paint': {
            'circle-radius': 1,
            'circle-color': '#eee'
        }
    });

    // map.addSource('collis-bbox', {
    //     type:'geojson',
    //     data: bboxgeojson
    // });

    // map.addLayer({
    //     'id': 'collis-bbox',
    //     'type':'fill',
    //     'source':'collis-bbox',
    //     'paint':
    //      {
    //         'fill-color': "#fff",
    //         'fill-opacity':0.5
    //      }
    // });

    // console.log(bboxTransformed)
    // console.log(bboxgeojson)

    map.addSource('collis-hexgrid', {
        type: 'geojson',
        data: collishex
    });


    const colorScheme = d3.schemeBlues[5];

    map.addLayer({
        'id': 'collis-hexgrid',
        'type': 'fill',
        'source': 'collis-hexgrid',
        'paint': {
            'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'COUNT'],
                0, colorScheme[0],
                maxcollis, colorScheme[colorScheme.length - 1]
            ],
            'fill-opacity': 0.5
        }
    });


    //Declare arrayy variables for labels and colours
const legendlabels = [
    '0-100,000',
    '100,000-500,000',
    '500,000-1,000,000',
    '1,000,000-5,000,000',
    '>5,000,000'
];

const legendcolours = [
    '#fd8d3c',
    '#fc4e2a',
    '#e31a1c',
    '#bd0026',
    '#800026'
];

//Declare legend variable using legend div tag
const legend = document.getElementById('legend');

//For each layer create a block to put the colour and label in
legendlabels.forEach((label, i) => {
    const color = legendcolours[i];

    const item = document.createElement('div'); //each layer gets a 'row' - this isn't in the legend yet, we do this later
    const key = document.createElement('span'); //add a 'key' to the row. A key will be the color circle

    key.className = 'legend-key'; //the key will take on the shape and style properties defined in css
    key.style.backgroundColor = color; // the background color is retreived from teh layers array

    const value = document.createElement('span'); //add a value variable to the 'row' in the legend
    value.innerHTML = `${label}`; //give the value variable text based on the label

    item.appendChild(key); //add the key (color cirlce) to the legend row
    item.appendChild(value); //add the value to the legend row

    legend.appendChild(item); //add row to the legend
});

});