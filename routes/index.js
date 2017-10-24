var fs = require('fs');
var jsonminify = require('jsonminify');
var converter = require('number-to-words');
var request = require('request');
var path = require('path');
var converter = require('number-to-words');

var express = require('express');
var router = express.Router();

var dataDirectory = "views/data/";
var secretsDirectory = "secrets/";
function readFile(fileName, dir) {
	dir = dir || dataDirectory;
	var data = fs.readFileSync(path.join(dir, fileName), "utf8");
	return JSON.parse(JSON.minify(data)); // minify so comments work in data files
}

/* Backwards-compatible resume link */
router.get('/files/Blake%20Mealey%20Resume.pdf', function(req, res, next) {
	res.redirect('/files/Blake-Mealey-Resume.pdf');
});

/* GET home page. */
router.get('/', function(req, res, next) {
	// Read in initial data from files
	var data = {
		title: "Blake Mealey Resume",
		links: readFile("links.json"),
		experience: readFile("experience.json"),
		education: readFile("education.json"),
		projects: readFile("projects.json"),
		programming: readFile("programming.json"),
		software: readFile("software.json"),
		miscellaneous: readFile("miscellaneous.json"),
		achievements: readFile("achievements.json"),
		activities: readFile("activities.json")
	};

	for (var i = 0; i < data.achievements.competitions.length; i++) {
		var ordinal = converter.toOrdinal(data.achievements.competitions[i].place);
		data.achievements.competitions[i].place = {
			num: ordinal.match(/[0-9]+/),
			postfix: ordinal.match(/[a-z]+/)
		}
	}

	// Determine bar length and number of years experience for programming languages
	var mostYears = 0, language;
	for(i = data.programming.length - 1; i >= 0; i--) {
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

var githubUser = readFile("githubUser.json", secretsDirectory);
var repoHost = 'https://raw.githubusercontent.com/';
var repoPath = githubUser.user + '/resume-data/master/';
var authHeaders = {
	Authorization: "Basic " + new Buffer(githubUser.user + ":" + githubUser.pass).toString("base64")
}

/* Update page data */
router.post('/update', function(req, res, next) {
	console.log("Updating data files.");
	res.send();

	setTimeout(doUpdateData, 2000);
});

function doUpdateData() {
	request.get({
		url: repoHost + path.join(repoPath, "header.json"),
		json: true,
		headers: authHeaders
	}, function(err, res, body) {
		if (err) return console.log("Error downloading header file: " + err);
		console.log(body.files);
		function getFile(fileName) {
			request
				.get({
					url: repoHost + path.join(repoPath, fileName),
					headers: authHeaders
				}).on('error', function(err) {
					console.log("Error downloading file '" + fileName + "': " + err);
				})
				.pipe(fs.createWriteStream(path.join(dataDirectory, fileName)))
				.on('finish', function() {
					console.log("Downloaded file '" + fileName + "'");
				});
		}
		for (var i = 0; i < body.files.length; i++) {
			getFile(body.files[i]);
		}
	});
}

doUpdateData();
module.exports = router;
