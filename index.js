darkModeOn = false;



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

function percDiff(stock, startDate, endDate){
	var dataArray = [];
        async function getData()
        {
            var dataFromJSON = await fetch("http://apihack-env.eba-v8abcenj.us-east-1.elasticbeanstalk.com/api/stock/" + stock + "/" + startDate + "/" + endDate);

            dataArray = await dataFromJSON.json();
			dataArray = dataArray.data;
			
			valuesArray = Object.values(dataArray);
			
			if (valuesArray[valuesArray.length-1] > valuesArray[0]){
				diff = valuesArray[valuesArray.length-1]/valuesArray[0]
			} else{
				diff = valuesArray[0]/valuesArray[valuesArray.length-1] * -1
			}
			
			
			return diff*100;
        }
		return getData();
}

function drawChart(stock, startDate, endDate){
	var dataArray = [];
        async function getData()
        {
            var dataFromJSON = await fetch("http://apihack-env.eba-v8abcenj.us-east-1.elasticbeanstalk.com/api/stock/" + stock + "/" + startDate + "/" + endDate);

            dataArray = await dataFromJSON.json();
			dataArray = dataArray.data;
			console.log(Object.values(dataArray));

            ctx = document.getElementById('barChart');
                new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Object.keys(dataArray),
                    datasets: [{
                    label: '',
                    data: Object.values(dataArray),
                    borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                    y: {
                        beginAtZero: true
                        }
                    }
                }
            })
        }
		getData();
}
