let performanceChart = undefined;


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

function getEndDate() {
    var date = new Date(2010, 1, 1);
    const year = parseInt(document.getElementById("numYears").value);
    date.setFullYear(date.getFullYear() + year);
    return date;
}

function getPortfolio() {
	const stockContainer = document.getElementById("stocksContainer");
	let ret = {};
	for(const card of stockContainer.children) {
		let ticker = card.querySelector(".ticker").value;
		let value = card.querySelector(".holdingValue").value;
		let outVal = parseFloat(value);
		if(isNaN(outVal) || outVal <= 0) {
			continue;
		}
		ret[ticker] = parseInt(outVal * 100);
	}
	return ret;
}

function percDiff(startPrice, currPrice){
	return ((parseFloat(currPrice)-parseFloat(startPrice))/(parseFloat(startPrice))) * 100.00;
}

function addStock() {
    document.getElementById("stocksContainer").innerHTML += `
    <div class="input-group mb-3">
    <input type="text" class="form-control ticker" placeholder="Ticker">
    <span class="input-group-text">£</span>
    <input type="text" class="form-control holdingValue" placeholder="Amount" aria-label="Amount">
    <button type="button" class="btn btn-dark text-center" style="width:24%" onclick="this.parentElement.remove();">Delete</button>
    </div>
    `;
}

async function calculate() {
    try {
	if(performanceChart != undefined) {
		performanceChart.destroy();
	}
    document.getElementById("erorrBox").innerHTML = "";
    document.getElementById("resultBox").innerHTML = "";

	const url = `http://apihack-env.eba-v8abcenj.us-east-1.elasticbeanstalk.com/api/compound/2010-01-01/${getAPIDate(getEndDate(), true)}?portfolio=${JSON.stringify(getPortfolio())}`;
	const query = await fetch(url);
	let data = await query.json();
	data = data.data;

	const keys = Object.keys(data);
	const end = data[keys[keys.length - 1]];


    performanceChart = new Chart(document.getElementById("resultsGraph"), {
		type: 'line',
		backgroundColor: '#36A2EB',
		data: {
			labels: Object.keys(data),
			datasets: [{
				label: 'Stock Value',
				data: Object.values(data).map(x => parseFloat(x.total)/100.00),
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
			responsive: true
		}
	})
    document.getElementById("resultBox").innerHTML = `Your final portfolio value is <strong>£${parseFloat(end.total)/100.00}!</strong> </h3> <p>Your total percentage change was <strong>${percDiff(parseFloat(data[keys[0]].total), parseFloat(end.total)).toFixed(2)}%.</strong></p>`;
}
catch(e) {
    document.getElementById("erorrBox").innerHTML = "An error occured.";
}

}