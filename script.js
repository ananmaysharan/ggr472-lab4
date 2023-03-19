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
        "type":"FeatureCollection",
        "features":[bboxTransformed]
        }

        const minX = bboxTransformed.geometry.coordinates[0][0][0];
        const minY = bboxTransformed.geometry.coordinates[0][0][1];
        const maxX = bboxTransformed.geometry.coordinates[0][2][0];
        const maxY = bboxTransformed.geometry.coordinates[0][2][1];

        let bboxcords = [minX,minY,maxX,maxY]

        const hexgrid = turf.hexGrid(bboxcords, 0.5, {units: 'kilometres'});

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
                'circle-radius': 5,
                'circle-color': 'blue'
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
    type:'geojson',
    data: hexgrid
});

map.addLayer({
    'id': 'collis-hexgrid',
    'type':'fill',
    'source':'collis-hexgrid',
    'paint':
     {
        'fill-color': "#fff",
        'fill-opacity':0.5
     }
});

/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty

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


// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


});