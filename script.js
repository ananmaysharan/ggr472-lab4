/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/


//Access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5hbm1heSIsImEiOiJjbDk0azNmY3oxa203M3huMzhyZndlZDRoIn0.1L-fBYplQMuwz0LGctNeiA'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

//Initialize map 
const map = new mapboxgl.Map({
    container: 'map', //container id 
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-79.37, 43.71],  // starting point, longitude/latitude
    zoom: 10.5 // starting zoom level
});


//Adding control
map.addControl(new mapboxgl.NavigationControl());


// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/ananmaysharan/ggr472-lab4/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        // console.log(response); //Check response in console
        collisiongeojson = response; // Store geojson as variable using URL from fetch response
    });

//Map Load
map.on('load', () => {

    //Bounding box and hexgrid creation
    bbox = turf.envelope(collisiongeojson)

    bboxTransformed = turf.transformScale(bbox, 1.1)

    bboxgeojson = {
        "type": "FeatureCollection",
        "features": [bboxTransformed]
    }

    //coords
    const minX = bboxTransformed.geometry.coordinates[0][0][0];
    const minY = bboxTransformed.geometry.coordinates[0][0][1];
    const maxX = bboxTransformed.geometry.coordinates[0][2][0];
    const maxY = bboxTransformed.geometry.coordinates[0][2][1];

    let bboxcords = [minX, minY, maxX, maxY]

    const hexgrid = turf.hexGrid(bboxcords, 0.4, { units: 'kilometres' });

    let collishex = turf.collect(hexgrid, collisiongeojson, '_id', 'values')

    //console.log(collishex)

    let maxcollis = 0;


    //adding count for loop
    collishex.features.forEach((feature) => { //iterate through features
        feature.properties.COUNT = feature.properties.values.length //create new property count to be the length of the values array
        if (feature.properties.COUNT > maxcollis) { //if the count of this feature is greater than the current max number collisions
            maxcollis = feature.properties.COUNT //set the max collisions variable to be the count for this feature 
        }
    });

    //console.log(maxcollis);


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

    //adding hexgrid
    map.addSource('collis-hexgrid', {
        type: 'geojson',
        data: collishex
    });

    //console.log(collishex)


    //adding colorscheme and styling hexgrid
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
            'fill-opacity': 0.3
        }
    });
    
    //adding popup
    map.on('click', 'collis-hexgrid', (e) => {
        const count = e.features[0].properties.COUNT;
        const coordinates = e.features[0].geometry.coordinates.slice();
    
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML("Number of Collisions: " + count)
            .addTo(map);

    });

    // Change the cursor to a pointer when hovering over the fill layer
    map.on('mouseenter', 'fill-layer', function () {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    // Change the cursor back to the default when no longer hovering over the fill layer
    map.on('mouseleave', 'fill-layer', function () {
        map.getCanvas().style.cursor = '';
    });
    
    //adding legend labels
    const minLabel = document.querySelector('.minlabel');
    const maxLabel = document.querySelector('.maxlabel');

    minLabel.textContent = '0';
    maxLabel.textContent = maxcollis;

});

