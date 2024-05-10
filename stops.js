var map;
var origins;
var destinations;
var stats;
var terTariffs = {};
var stops = {};
function setup(){
	map = L.map('map').setView([45, 10], 5);
	const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19,attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
    origins = L.markerClusterGroup({maxClusterRadius:40});
	map.addLayer(origins);
    destinations = L.markerClusterGroup({maxClusterRadius:40});
	map.addLayer(destinations);
	getStops();
	getTarrifs();
 }

 async function getTarrifs(){
	const url= `././tarifs-ter-par-od.json`;
	const response = await fetch(url);
	terTariffs = await response.json();
 }

 async function getStops(){
	const url= `./referentiel-gares-voyageurs.json`;
	const response = await fetch(url);
	const stopsjson = await response.json();
	
    Object.entries(stopsjson).forEach((entry) => {
		let [id, stop] = entry;
		//{"code": "02027-2", "code_gare": "02027", "uic_code": "0087733667", "dtfinval": null, "alias_libelle_noncontraint": "Mareil-Marly T13", "adresse_cp": "78750", "commune_code": "367", "commune_libellemin": "Mareil-Marly", "departement_numero": "78", "departement_libellemin": "Yvelines", "longitude_entreeprincipale_wgs84": null, "latitude_entreeprincipale_wgs84": null, "segmentdrg_libelle": null, "niveauservice_libelle": null, "rg_libelle": "Gares C Ile-de-France", "gare_alias_libelle_noncontraint": "Mareil-Marly", "gare_alias_libelle_fronton": "Mareil-Marly", "gare_agencegc_libelle": "DGIF", "gare_regionsncf_libelle": "REGION DE PARIS SAINT-LAZARE", "gare_ug_libelle": null, "gare_ut_libelle": "MAREIL MARLY GARE", "gare_nbpltf": 2, "tvs": null, "wgs_84": null}
		if (stop.longitude_entreeprincipale_wgs84){
			stop.uic8 = parseInt(stop.uic_code).toString();
			stops[stop.uic8] = stop;
			let my_icon = L.icon({iconUrl: `./departure_board.png`,iconSize: [24, 24], iconAnchor: [12,24]});
			let marker = L.marker([stop.latitude_entreeprincipale_wgs84, stop.longitude_entreeprincipale_wgs84],{icon:my_icon});
			marker.bindTooltip(decodeURI(stop.gare_ut_libelle));
			marker.properties = stop;
			marker.addEventListener('click', _showConnections);
			marker.addTo(origins);
		}
	  });
  }

async function _showConnections(e){
	destinations.clearLayers();
	//origins.clearLayers();
	document.getElementById("details").innerHTML = "";
	document.getElementById("details").insertAdjacentHTML('beforeend',`<h5>${e.sourceTarget.properties.gare_ut_libelle}</h5>`);	
    Object.entries(terTariffs).forEach((entry) => {
		const [id, tariff] = entry;
		if(tariff.origine_uic == e.sourceTarget.properties.uic8 && tariff.type_tarif=="Tarif normal"){
			let dest = stops[tariff.destination_uic]; 
			element = `
				<div class="card">
				<div class="card-body">
				<ul class="list-group list-group-flush">
				<li class="list-group-item">${tariff.destination}: ${tariff.prix_eur}</li>
				</ul>
				</div>
				</div>`;
			document.getElementById("details").insertAdjacentHTML('beforeend',element);

			let my_icon = L.icon({iconUrl: `./hop.png`,iconSize: [24, 24], iconAnchor: [12,24]});
			let marker = L.marker([dest.latitude_entreeprincipale_wgs84, dest.longitude_entreeprincipale_wgs84],{icon:my_icon});
			marker.properties = tariff;
			marker.addEventListener('click', _showDetails);
			marker.addTo(destinations);
		}
	});
	var of = document.getElementById("offcanvasDetails");
	var offcanvas = new bootstrap.Offcanvas(of);
	offcanvas.toggle();
}

function formatTime(timestamp){
	if(timestamp){
		return timestamp.substr(11,8);
	}
	else{
		return "";
	}

}

function _showDetails(e){
	let tariff = e.sourceTarget.properties;
	let popupText = `<ul class="list-group list-group-flush">
		<li class="list-group-item">${tariff.destination}</li>
		<li class="list-group-item">${tariff.prix_eur}</li>
		</ul>`;
	L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popupText).openOn(map);	
}

function setupStops(){
	let stopList = [];
    Object.entries(stops).forEach((entry) => {
      const [id, stop] = entry;
      stopList.push({"value": id,"text": stop.name});
    });
    let stopSelect = new SlimSelect({
      select: '#stopSelect',
      data: stopList
    })
 }

async function getMissedConnectionsForSelectedItem(){
	document.getElementById("results").innerHTML = "<ul></ul>";
	let stopId = document.getElementById("stopSelect").value;
	let stats = await getMissedConnctions(stopId, transferTime);
	document.getElementById("results").insertAdjacentHTML('beforeend',`<li>arrivals: ${stats.arrivals}</li>`);
	document.getElementById("results").insertAdjacentHTML('beforeend',`<li>ontime:   ${stats.onTimeCount}</li>`);
	document.getElementById("results").insertAdjacentHTML('beforeend',`<li>late:     ${stats.lateCount}</li>`);
	document.getElementById("results").insertAdjacentHTML('beforeend',`<li>atRisk:   ${stats.atRisk}</li>`);
	document.getElementById("results").insertAdjacentHTML('beforeend',`<li>missed connections: ${stats.missedConnections}</li>`);

	stats.details.forEach(item=>{
	document.getElementById("results").insertAdjacentHTML('beforeend',`<li>${item}</li>`);		
	});
}
	
