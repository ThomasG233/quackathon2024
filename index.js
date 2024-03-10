let darkModeOn = false;
let currDate = 0;
let currValue = 0;
let startDate = 0;
const errorBox = document.getElementById("errorBox");

let boughtStocks = [];


const performanceChart = new Chart(document.getElementById("currentPerformance"), {
		type: 'line',
		backgroundColor: '#36A2EB',
		data: {
			labels: [],
			datasets: [{
				label: 'Portfolio Value',
				data: [],
				borderWidth: 1,
				backgroundColor: '#FF0000',
			}]
		},
		options: {
			scales: {
			y: {
				beginAtZero: true
				},
			},
		}
	})

let buyInPrices = {};

function darkMode(){
	html = document.getElementById("global");
	
	if (darkModeOn){
		html.setAttribute("data-bs-theme","light");
		darkModeOn = false;
	} else{
		html.setAttribute("data-bs-theme","dark");
		darkModeOn = true;
	}
}

function getAPIDate(date, addOne) {
	if(addOne) {
		let newDate = new Date(date);
		newDate.setDate(newDate.getDate() + 1);
		date = newDate;
	}
	const year = date.getFullYear();
	const month = date.getMonth()+1;
	const day = date.getDate();

	return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}


function percDiff(startPrice, currPrice){
	return ((parseFloat(currPrice)-parseFloat(startPrice))/(parseFloat(startPrice))) * 100.00;
}



function getRandomDate(from, to) {
	const fromTime = from.getTime();
	const toTime = to.getTime();
	return new Date(fromTime + Math.random() * (toTime - fromTime));
}

function getPortfolio() {
	const stockContainer = document.getElementById("stockContainer");
	let ret = {};
	for(const card of stockContainer.children) {
		let ticker = card.querySelector(".ticker").innerHTML;
		let value = card.querySelector(".holdingValue").value;
		let outVal = parseFloat(value);
		if(isNaN(outVal) || outVal == 0) {
			continue;
		}
		ret[ticker] = parseInt(outVal * 100);
	}
	return ret;
}

function setPortfolio(newPortfolio) {
	const stockContainer = document.getElementById("stockContainer");
	for(const card of stockContainer.children) {
		let ticker = card.querySelector(".ticker").innerHTML;
		if(!(ticker in newPortfolio)) {
			if(ticker in buyInPrices) {
				delete buyInPrices[ticker];
			}
			continue;
		}
		if(!(ticker in boughtStocks)) {
			boughtStocks.push(ticker);
		}
		const newAmount = parseInt(newPortfolio[ticker]);
		if(!(ticker in buyInPrices)) {
			buyInPrices[ticker] = parseInt(card.querySelector(".holdingValue").value) * 100;
		}
		card.querySelector(".holdingValue").value = `${newAmount/100}`;
		if(buyInPrices[ticker] > newAmount) {
			card.querySelector(".percentage").innerHTML = `<i class="fa-solid fa-angle-down" style="color: red;"></i> ${percDiff(buyInPrices[ticker], newAmount).toFixed(2)}%`;
			card.querySelector(".percentage").style.color = "red";
		}
		else {
			card.querySelector(".percentage").innerHTML = `<i class="fa-solid fa-angle-up" style="color: #00b006;"></i> ${percDiff(buyInPrices[ticker], newAmount).toFixed(2)}%`;
			card.querySelector(".percentage").style.color = "#00b006";
		}
	}
}


function setDate(date) {
	currDate = date;
	document.getElementById("currDate").innerHTML = date.toLocaleDateString();
}

function setValue(value) {
	currValue = value;
	performanceChart.data.datasets[0].data.push(value/100);
	performanceChart.data.labels.push(getAPIDate(currDate));
	performanceChart.update()
	document.getElementById("currValue").innerHTML = `${value/100}`;
}



function getDataset() {
	result = Object.assign.apply({}, performanceChart.data.labels.map( (v, i) => ( {[v]: performanceChart.data.datasets[0].data[i]} ) ) );
	return JSON.stringify(result);
}


async function moveForward(newDate) {
	errorBox.innerHTML = "";

	let shouldRedirect = false;
	if(new Date() < newDate) {
		newDate = new Date();
		shouldRedirect = true;
	}

	const currPortfolio = getPortfolio();
	
	if(Object.keys(currPortfolio).length == 0) {
		setDate(newDate);
		setValue(currValue);
		return;
	}

	let portfolioCost = Object.values(currPortfolio).reduce((a, b) => a + b, 0);
	if(portfolioCost > currValue) {
		errorBox.innerHTML = "Your stocks are too expensive!";
		return;
	}
	const url = `http://apihack-env.eba-v8abcenj.us-east-1.elasticbeanstalk.com/api/compound/${getAPIDate(currDate, false)}/${getAPIDate(newDate, true)}?portfolio=${JSON.stringify(currPortfolio)}`;
	const query = await fetch(url);
	let data = await query.json();
	data = data.data;

	const keys = Object.keys(data);
	const end = data[keys[keys.length - 1]];
	setPortfolio(end);
	setDate(newDate);

	for(const key of keys) {
		performanceChart.data.datasets[0].data.push((currValue - portfolioCost + data[key].total)/100.00);
		performanceChart.data.labels.push(key);

	}
	setValue(currValue - portfolioCost + end.total);
	performanceChart.update();

	if(shouldRedirect) {
		window.open(`results.html?bought=${JSON.stringify(boughtStocks)}&startDate=${getAPIDate(startDate, false)}&data=${getDataset()}`,"_self");
		return;
	}

}


async function moveForwardWithOffset(day, month, year) {
	let newDate = new Date(currDate);
	newDate.setDate(newDate.getDate() + day);
	newDate.setMonth(newDate.getMonth() + month);
	newDate.setFullYear(newDate.getFullYear() + year);
	await moveForward(newDate);
}

async function startGame() {
	while(true) {
		try {
			setDate(getRandomDate(new Date("2003-01-01"), new Date("2014-01-01")));
			const url = `http://apihack-env.eba-v8abcenj.us-east-1.elasticbeanstalk.com/api/compound/${getAPIDate(currDate, false)}/${getAPIDate(currDate, true)}?portfolio={"SPY": 10000, "GLD": 10000}`;
			const query = await fetch(url);
			let data = await query.json();
			break;
		}
		catch(e) {}
		
	}

	setValue(10000);



	startDate = currDate;
	const url = "http://apihack-env.eba-v8abcenj.us-east-1.elasticbeanstalk.com/api/stocks";
	const query = await fetch(url);
	let data = await query.json();
	data = data.stocks;
	const stockContainer = document.getElementById("stockContainer");
	for(const ticker of Object.keys(data)) {
		stockContainer.innerHTML += 
			`<div class="card" style="width: 18rem;">
				<div class="card-body">
				<div class="row">
					<h5 class="card-title col ticker">${ticker}</h5>
					<p class="col percentage" style="color: #00b006;"><i class="fa-solid fa-angle-up" style="color: #00b006;"></i> 0.00%</p>
				</div>
				<p class="card-subtitle mb-2 text-body-secondary">${data[ticker]}</p>
				<div class="input-group mb-3"><span class="input-group-text">£</span><input type="text" class="form-control holdingValue" aria-label="Amount"></div>
				<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#pastPerfModal" data-bs-ticker="${ticker}">Past Performance</button></div>
				</div>
			</div>`;
	}
}
startGame();


let ppChart = undefined;
$('#pastPerfModal').on('show.bs.modal', async function (event) {
	var button = event.relatedTarget // Button that triggered the modal
	var ticker = button.getAttribute('data-bs-ticker') // Extract info from data-* attributes
	// If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
	// Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
	var modal = $(this)
	modal.find('.modal-title').text(`Past performance of ${ticker}`)
	var body = modal.find('.modal-body');

	if(ppChart != undefined) {
		ppChart.destroy();
	}

	var dataFromJSON = await fetch(`http://apihack-env.eba-v8abcenj.us-east-1.elasticbeanstalk.com/api/stock/${ticker}/${getAPIDate(startDate, false)}/${getAPIDate(currDate, true)}`);

	dataArray = await dataFromJSON.json();
	dataArray = dataArray.data;


	ppChart = new Chart(body[0], {
		type: 'line',
		backgroundColor: '#36A2EB',
		data: {
			labels: Object.keys(dataArray),
			datasets: [{
				label: 'Stock Value',
				data: Object.values(dataArray).map(x => parseFloat(x)/100.00),
				borderWidth: 1,
				backgroundColor: '#FF0000',
			}]
		},
		options: {
			scales: {
			y: {
				beginAtZero: true
				},
			},
		}
	})

})



