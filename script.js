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

});