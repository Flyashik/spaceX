import {SpaceX} from "./api/spacex";
import * as d3 from "d3";
import * as Geo from './geo.json'

document.addEventListener("DOMContentLoaded", setup)

const width = 640;
const height = 480;
const margin = {top: 20, right: 10, bottom: 40, left: 100};

let cachedLaunches = {};
let cachedLaunchpads = {};
let mapProjection;
let lastSelectedItem;

function setup() {
    const spaceX = new SpaceX();
    spaceX.launchpads().then(launchPadsData => {
        mapProjection = drawMap();
        cachedLaunchpads = launchPadsData;
        spaceX.launches().then(launchesData => {
            cachedLaunches = launchesData;
            RenderLaunchesList(launchesData, document.getElementById("launches-list"));
            RenderLaunchesOnMap(launchesData, launchPadsData, d3.select('#map>svg'))
        });
    });
}

function getLaunchpad(launchId) {
    return cachedLaunchpads.find(entry => entry.id === cachedLaunches.find( l => l.id === launchId).launchpad);
}

function resetLastSelectedItem() {
    if (typeof lastSelectedItem == "undefined") {
        return;
    }
    lastSelectedItem.className = "li-launch-unselected"
    const pad = getLaunchpad(lastSelectedItem.id.split('_')[1])
    document.getElementById(`pad_stroke_${pad.id}`).remove();
}

function changeTargetOnMap(launchId) {
    resetLastSelectedItem()
    const listItem = document.getElementById(launchId);
    listItem.className = "li-launch-selected"
    const map = d3.select('#map>svg');
    const pad = getLaunchpad(launchId.split("_")[1])
    console.log(pad);
    document.getElementById('pad-info').innerText = pad.name
    map.append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")").append("path")
        .attr("class", "launchpad-stroke")
        .attr("id", `pad_stroke_${pad.id}`)
        .attr("d", getGeoGenerator()(getGeoCircle([pad.longitude, pad.latitude], 7)()))
        .attr("stroke", "red")
        .attr("fill", "transparent")
    lastSelectedItem = listItem
}

function RenderLaunchesList(launches, list) {
    list.innerHTML = '';
    launches.forEach(launch => {
        const item = document.createElement("li");
        item.className = "li-launch-unselected"
        item.id = `launch_${launch.id}`
        item.innerHTML = launch.name;
        list.appendChild(item);
    })
    list.onclick = function (event) {
        changeTargetOnMap(event.target.id);
    };
}

function drawMap() {
    const svg = d3.select('#map').append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    const projection = d3.geoMercator()
        .scale(70)
        .center([0, 20])
        .translate([width / 2 - margin.left, height / 2]);
    svg.append("g")
        .selectAll("path")
        .data(Geo.features)
        .enter()
        .append("path")
        .attr("class", "topo")
        .attr("d", d3.geoPath()
            .projection(projection)
        )
        .attr("fill", function (d) {
            return d3.color(0);
        })
        .style("opacity", .7)
    return projection;
}

function getGeoCircle(longlat, rad) {
    return d3.geoCircle()
        .center([longlat[0], longlat[1]])
        .radius(rad);
}

function getGeoGenerator(){
    return d3.geoPath()
        .projection(mapProjection);
}

function RenderLaunchesOnMap(launches, launchpads, map) {
    cachedLaunchpads.forEach((pad) => {
        console.log(pad.id, pad.name)
        map.append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")").append("path")
            .attr("class", "launchpad")
            .attr("id", `pad_${pad.id}`)
            .attr("d", getGeoGenerator()(getGeoCircle([pad.longitude, pad.latitude], 3)()))
            .attr("fill", "black")
    })

}
