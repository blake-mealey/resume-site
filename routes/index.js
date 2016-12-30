var fs = require('fs');
var jsonminify = require('jsonminify');
var converter = require('number-to-words');

var express = require('express');
var router = express.Router();

function readFile(fileName, callback) {
	var data = fs.readFileSync(fileName, "utf8");
	return JSON.parse(JSON.minify(data)); // minify so comments work in data files
}

var dataDirectory = "views/data/";

/* GET home page. */
router.get('/', function(req, res, next) {
	// Read in initial data from files
	var data = {
		title: "Blake Mealey Resume",
		links: readFile(dataDirectory + "links.json"),
		programming: readFile(dataDirectory + "programming.json"),
		software: readFile(dataDirectory + "software.json"),
		competitions: readFile(dataDirectory + "competitions.json"),
		experience: readFile(dataDirectory + "experience.json"),
		education: readFile(dataDirectory + "education.json"),
		activities: readFile(dataDirectory + "activities.json")
	};

	// Determine bar length and number of years experience for programming languages
	var currentYear = new Date().getFullYear();
	var longestYearsPassed = 0;
	var language;
	for(var i = data.programming.length - 1; i >= 0; i--) {
		language = data.programming[i];
		language.yearsPassed = currentYear - language.firstYear + 1;
		longestYearsPassed = Math.max(longestYearsPassed, language.yearsPassed);
	}

	for(i = data.programming.length - 1; i >= 0; i--) {
		language = data.programming[i];
		language.barValue = 100*(language.yearsPassed/longestYearsPassed) + "%";
		var wordNumber = converter.toWords(language.yearsPassed);

		language.description = (language.yearsOverride ? language.yearsOverride : wordNumber.charAt(0).toUpperCase() +
			wordNumber.slice(1).toLowerCase() + " year" + (language.yearsPassed == 1 ? "" : "s") + " experience") +
			(language.description ? language.description : "");
	}

	// Render the page
	res.render('index', data);
});

module.exports = router;
