$(document).ready(function() {
	var ctx = $("#programmingExperience");
	var programmingExperience = new Chart(ctx, {
		type: "horizontalBar",
		data: {
			labels: ["Lua", "Java", "JavaScript"],
			datasets: [{
				data: [6, 5, 4, 0],
				// backgroundColor: ["rgba(255, 99, 132, 0.2)", "rgba(255, 99, 132, 0.2)", "rgba(255, 99, 132, 0.2)"]
			}]
		},
		options: {
			responsive: false,
			scales: {
				yAxes: [{
					display: false,
				}],
				xAxes: [{
					display: false
				}]
			},
			legend: {
				display: false
			},
			tooltips: {
				custom: function(tooltip) {
					if(!tooltip) {
						return;
					}

					tooltip.cornerRadius = 0;
					tooltip.displayColors = false;
					tooltip.text = "hello";
				}
			}
		}
	});
});
