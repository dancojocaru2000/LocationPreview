<script lang="ts">
	import L from 'leaflet';
	import { onMount } from 'svelte';

	let MAPBOX_ACCESS_TOKEN: string | undefined = void 0;

	let error: string | undefined = void 0;
	let followLocation = true;

	let darkMode = false;
	let map: L.Map | undefined = void 0;
	const mapLayers = () => ({
		dark: L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox/dark-v10',
			tileSize: 512,
			zoomOffset: -1,
			accessToken: MAPBOX_ACCESS_TOKEN,
		}),
		light: L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox/light-v10',
			tileSize: 512,
			zoomOffset: -1,
			accessToken: MAPBOX_ACCESS_TOKEN,
		}),
	});
	const locationCircleLayerGroup = L.layerGroup();
	$: if (map) {
		locationCircleLayerGroup.addTo(map);
	}

	const geolocation = navigator.geolocation;
	if (!geolocation) {
		error = 'Geolocation not available';
	}
	let geoWatchHandle: ReturnType<InstanceType<typeof Geolocation>["watchPosition"]> | undefined = void 0;

	if (window.matchMedia) {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
			if (!darkMode && e.matches) {
				darkMode = true;
			}
			else if (darkMode && !e.matches) {
				darkMode = false;
			}
		});
	}

	onMount(async () => {
		const matResp = await fetch('/MAPBOX_ACCESS_TOKEN.txt');
		MAPBOX_ACCESS_TOKEN = (await matResp.text()).trim();

		map = L.map('mapid', {
			zoomDelta: 1,
			zoomSnap: 0.25,
		}).setView([0, 0], 1);
	});

	// Set light or dark mode MapBox layer
	$: {
		if (map) {
			if (!darkMode) {
				mapLayers().light.addTo(map);
			}
			else {
				mapLayers().dark.addTo(map);
			}
		}
	}

	let coords: GeolocationCoordinates | undefined = void 0;
	$: if (coords) {
		locationCircleLayerGroup.clearLayers();
		L.circle({lat: coords.latitude, lng: coords.longitude, alt: coords.altitude}, {
			radius: coords.accuracy,
			opacity: 0.2,
		}).addTo(locationCircleLayerGroup);
		L.circle([coords.latitude, coords.longitude], {
			radius: 10,
			opacity: 0.75,
		}).addTo(locationCircleLayerGroup);
	}
	else {
		locationCircleLayerGroup.clearLayers();
	}

	const locationFollowLogic = {
		follow: false,
		coords: void 0,
		setFollow: function(shouldFollow: boolean) {
			if (this.follow && !shouldFollow) {
				map.setZoom(1, {
					animate: true,
					duration: 5,
				});
			}
			this.follow = shouldFollow;
		},
		update: function(coords: GeolocationCoordinates) {
			this.coords = coords;
			if (this.coords && this.follow) {
				map.fitBounds(
					L.latLng(this.coords.latitude, this.coords.longitude).toBounds(this.coords.accuracy * 2), 
					{
						animate: true, 
						duration: 1,
					},
				);
			}
		},
	};

	$: locationFollowLogic.setFollow(followLocation);
	$: locationFollowLogic.update(coords);

	function onPosition(e: GeolocationPosition) {
		error = void 0;
		coords = e.coords;
	}

	function onLocationButtonClick() {
		if (geoWatchHandle === void 0) {
			geoWatchHandle = geolocation.watchPosition(onPosition, (e) => {
				setTimeout(() => {geoWatchHandle = void 0;}, 0);
				if (e.code === e.PERMISSION_DENIED) {
					error = 'Geolocation Permission Denied';
				}
				else if (e.code === e.POSITION_UNAVAILABLE) {
					error = 'Geolocation Unavailable';
				}
				else {
					error = `Unknown Error: ${e}`;
				}
			}, {
				enableHighAccuracy: true,
			});
		}
		else {
			geolocation.clearWatch(geoWatchHandle);
			geoWatchHandle = void 0;
			setTimeout(() => {
				coords = void 0;
			}, 1000);
		}
	}

	function toggleFollowLocation() {
		followLocation = !followLocation;
	}
</script>

<main>
	<h1>Location Preview</h1>
	{#if error}
		<p class="error">{error}</p>
	{/if}
	{#if coords}
		<div id="coordsDiv">
			<table>
				<tr>
					<th>Field</th>
					<th>Value</th>
				</tr>
				<tr>
					<td>Latitude</td>
					<td>{coords.latitude}</td>
				</tr>
				<tr>
					<td>Longitude</td>
					<td>{coords.longitude}</td>
				</tr>
				<tr>
					<td>Accuracy</td>
					<td>{Math.round(coords.accuracy)} m</td>
				</tr>
			</table>
		</div>
	{/if}
	<div id="button-area">
		{#key geoWatchHandle}
			<button on:click={onLocationButtonClick}>{geoWatchHandle !== (void 0) ? "Stop Watching" : "Find Location"}</button>
		{/key}
		{#key followLocation}
			<button on:click={toggleFollowLocation}>{followLocation ? "Stop Zooming to Location" : "Zoom to Location"}</button>
		{/key}
	</div>

	<div id="mapid"></div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 100;
	}

	p.error {
		font-size: 1.25em;
		color: #D32F2F;
		border-left: 5px #D32F2F solid;
		margin-left: auto;
		margin-right: auto;
	}

	#mapid {
		height: 300px;
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
	}

	#coordsDiv {
		display: flex;
		justify-content: center;
	}
	#coordsDiv table {
		border-collapse: collapse;
	}
	#coordsDiv td {
		border: 1px solid black;
		padding: 8px;
	}
</style>