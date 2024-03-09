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