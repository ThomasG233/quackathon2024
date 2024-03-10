
let yourPerf = 0;

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

function diff_years(dt2, dt1) 
{
  // Calculate the difference in milliseconds between the two dates
  var diff = (dt2.getTime() - dt1.getTime()) / 1000;
  // Convert the difference from milliseconds to days
  diff /= (60 * 60 * 24);
  // Calculate the approximate number of years by dividing the difference in days by the average number of days in a year (365.25)
  return Math.abs(Math.round(diff / 365.25));
}

function percDiff(startPrice, currPrice){
	return ((parseFloat(currPrice)-parseFloat(startPrice))/(parseFloat(startPrice))) * 100.00;
}



const resultsChart = new Chart(document.getElementById("resultsChart"), {
		type: 'line',
		backgroundColor: '#36A2EB',
		data: {
			labels: [],
			datasets: [{
				label: 'SPY',
				data: [],
				borderWidth: 1,
				backgroundColor: '#FF0000',
			},
			{
				label: 'Gold',
				data: [],
				borderWidth: 1,
				backgroundColor: '#00FF00',
			},
			{
				label: 'Cash',
				data: [],
				borderWidth: 1,
				backgroundColor: '#0000FF',
			},
			{
				label: 'Your Picks',
				data: [],
				borderWidth: 1,
				backgroundColor: '#FF00FF',
			}
			]
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


async function reloadBoard() {
	let leaderBoard = document.getElementById("leaderboard");
	leaderBoard.innerHTML = "";
	const url = `http://apihack-env.eba-v8abcenj.us-east-1.elasticbeanstalk.com/api/leaderboard`;
	let response = await fetch(url);
	let data = await response.json();
	data = data.data;

	for(const entry of data) {
		leaderBoard.innerHTML += `<li class = "justify-content-center list-group-item list-group-item-warning"><strong>${entry.name}:</strong> ${entry.ror}%</li>`;
	}
}


async function addToBoard() {
	let name = document.getElementById("enterName").value;
	if(name == "") {
		return;
	}
	const url = `http://apihack-env.eba-v8abcenj.us-east-1.elasticbeanstalk.com/api/addToBoard/${name}/${yourPerf}`;
	await fetch(url);
	await reloadBoard();
}



async function genPage() {
	const params = new URLSearchParams(window.location.search);
	const userData = JSON.parse(params.get('data'))
	let portfolio = {"SPY": 10000, "GLD": 10000};
	for(const ticker of JSON.parse(params.get('bought'))) {
		portfolio[ticker] = 10000;
	}
	const url = `http://apihack-env.eba-v8abcenj.us-east-1.elasticbeanstalk.com/api/compound/${params.get('startDate')}/${getAPIDate(new Date(), true)}?portfolio=${JSON.stringify(portfolio)}`;
	const query = await fetch(url);
	let data = await query.json();
	data = data.data;

	const keys = Object.keys(userData);

	let finalGoodKey = undefined;
	for(const key of keys) {
		if(!(key in data)) {
			continue;
		}
		finalGoodKey = key;
		resultsChart.data.datasets[0].data.push(data[key].SPY/100.00);
		resultsChart.data.labels.push(key);
		resultsChart.data.datasets[1].data.push(data[key].GLD/100.00);
		resultsChart.data.datasets[2].data.push(100);
		resultsChart.data.datasets[3].data.push(userData[key]);
	}
	resultsChart.update();


	const numYears = diff_years(new Date(params.get('startDate')), new Date());


	yourPerf = (percDiff(userData[keys[0]], userData[finalGoodKey])/numYears).toFixed(2);

	const spyPerf = (percDiff(data[keys[0]].SPY, data[finalGoodKey].SPY)/numYears).toFixed(2);
	document.getElementById("avgPerformance").innerHTML = yourPerf;

	document.getElementById("SPYPerformance").innerHTML = spyPerf;

	if(spyPerf > yourPerf) {
		document.getElementById("resultSentance").innerHTML = "You would've been better off just buying SPY!";
	}
	else {
		document.getElementById("resultSentance").innerHTML = "You achieved better results than 87% of professional stock pickers. Could you do it again?";
	}

	await reloadBoard();

}


genPage()