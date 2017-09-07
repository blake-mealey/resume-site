var fs = require('fs');
var jsonminify = require('jsonminify');
var converter = require('number-to-words');

var express = require('express');
var router = express.Router();

var dataDirectory = "views/data/";
function readFile(fileName) {
	var data = fs.readFileSync(dataDirectory + fileName, "utf8");
	return JSON.parse(JSON.minify(data)); // minify so comments work in data files
}

/* GET home page. */
router.get('/', function(req, res, next) {
	// Read in initial data from files
	var data = {
		title: "Blake Mealey Resume",
		links: readFile("links.json"),
		programming: readFile("programming.json"),
		software: readFile("software.json"),
		competitions: readFile("competitions.json"),
		experience: readFile("experience.json"),
		education: readFile("education.json"),
		activities: readFile("activities.json")
	};

	// Determine bar length and number of years experience for programming languages
	var mostYears = 0, language;
	for(var i = data.programming.length - 1; i >= 0; i--) {
		language = data.programming[i];
		mostYears = Math.max(mostYears, language.years);
	}

	for(i = data.programming.length - 1; i >= 0; i--) {
		language = data.programming[i];
		language.barValue = 100*(language.years/mostYears) + "%";
		var wordNumber = converter.toWords(language.years);

		language.description = (language.yearsOverride ? language.yearsOverride : wordNumber.charAt(0).toUpperCase() +
			wordNumber.slice(1).toLowerCase() + " year" + (language.years == 1 ? "" : "s")) + " experience" +
			(language.description ? ", " + language.description : "");
	}

	// Render the page
	res.render('index', data);
});

module.exports = router;
