var map;
var stopmarkers;
var stats;
var transferTime = 600;

function setup(){
	map = L.map('map').setView([45, 10], 5);
	const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19,attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
    stopmarkers = L.markerClusterGroup({maxClusterRadius:40});
	map.addLayer(stopmarkers);
	getStops();
 }

 async function getStops(){
	const url= `./referentiel-gares-voyageurs.json`;
	const response = await fetch(url);
	const stops = await response.json();
	
    Object.entries(stops).forEach((stop) => {
		//{"code": "02027-2", "code_gare": "02027", "uic_code": "0087733667", "dtfinval": null, "alias_libelle_noncontraint": "Mareil-Marly T13", "adresse_cp": "78750", "commune_code": "367", "commune_libellemin": "Mareil-Marly", "departement_numero": "78", "departement_libellemin": "Yvelines", "longitude_entreeprincipale_wgs84": null, "latitude_entreeprincipale_wgs84": null, "segmentdrg_libelle": null, "niveauservice_libelle": null, "rg_libelle": "Gares C Ile-de-France", "gare_alias_libelle_noncontraint": "Mareil-Marly", "gare_alias_libelle_fronton": "Mareil-Marly", "gare_agencegc_libelle": "DGIF", "gare_regionsncf_libelle": "REGION DE PARIS SAINT-LAZARE", "gare_ug_libelle": null, "gare_ut_libelle": "MAREIL MARLY GARE", "gare_nbpltf": 2, "tvs": null, "wgs_84": null}
		if (stop.longitude_entreeprincipale_wgs84){
			let my_icon = L.icon({iconUrl: `./departure_board.png`,iconSize: [24, 24], iconAnchor: [12,24]});
			let marker = L.marker([stop.latitude_entreeprincipale_wgs84, stop.longitude_entreeprincipale_wgs84],{icon:my_icon});
			marker.bindTooltip(decodeURI(stop.gare_ut_libelle));
			marker.properties = stop;
			marker.addEventListener('click', _showConnections);
			marker.addTo(stopmarkers);
		}
	  });
  }

async function _showConnections(e){
	L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(e.properties.gare_ut_libelle).openOn(map); 
}

function formatTime(timestamp){
	if(timestamp){
		return timestamp.substr(11,8);
	}
	else{
		return "";
	}

}

function showDetails(){
	document.getElementById("details").innerHTML = "";
	stats.details.forEach(item=>{
		if(item.status =="missed connection"){
			element = `
			<div class="card">
				<div class="card-header">${formatTime(item.arrival.when)} from ${item.arrival.provenance} ${item.arrival.delay/60} minutes late <span class="badge text-bg-danger">late</span>
				</div>
				<div class="card-body">
					<ul class="list-group list-group-flush">
					missed connection to ${item.departure.direction} 
					</ul>
					<ul class="list-group list-group-flush">
					Missed departure to ${item.departure.direction} at ${formatTime(item.departure.when)}
					</ul>
				</div>
			</div>	`;
			document.getElementById("details").insertAdjacentHTML('beforeend',element);
		}
		else if(item.status =="connection at risk"){
			element = `
			<div class="card">
				<div class="card-header">${formatTime(item.arrival.when)} from ${item.arrival.provenance} ${item.arrival.delay/60} minutes late <span class="badge text-bg-warning">late</span>
				</div>
				<div class="card-body">
				<ul class="list-group list-group-flush">
				Short interchange time for connection to ${item.departure.direction} at ${formatTime(item.departure.when)}
				</ul>
				</div>
			</div>`;
			document.getElementById("details").insertAdjacentHTML('beforeend',element);
		}
		else if(item.status =="arrival on time"){
		element = `
		<div class="card">
			<div class="card-header">${formatTime(item.arrival.when)} from ${item.arrival.provenance} <span class="badge text-bg-success">on time</span>
			</div>
		</div>`;
		document.getElementById("details").insertAdjacentHTML('beforeend',element);
		}
		else{
			element = `
			<div class="card">
				<div class="card-header">arrival from ${item.arrival.provenance}
				</div>
			</div>`;
			document.getElementById("details").insertAdjacentHTML('beforeend',element);			
		}
	})
	var of = document.getElementById("offcanvasDetails");
	var offcanvas = new bootstrap.Offcanvas(of);
	offcanvas.toggle();
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
	
