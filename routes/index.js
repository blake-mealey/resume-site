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

var formatGroup = 1;
var contentGroup = 2;
function formatTextForWeb(text) {
	do {
		var match = /<(latex|web):(.*):\1>/g.exec(text);
		if (match) {
			console.log(match)
			var content = match[formatGroup] == 'web' ? match[contentGroup] : '';
			text = text.substring(0, match.index) + content + text.substring(match.index + match[0].length);
			console.log(text);
		}
	} while (match);
	return text;
}

var data;
function updatePageData() {
	// Read in initial data from files
	var skills = readFile("skills.json");
	data = {
		title: "Blake Mealey Resume",
		links: readFile("links.json"),
		experience: readFile("experience.json"),
		education: readFile("education.json"),
		projects: skills.projects,
		programming: skills.programming,
		software: skills.software,
		miscellaneous: skills.misc,
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
	for (i = data.programming.length - 1; i >= 0; i--) {
		language = data.programming[i];
		mostYears = Math.max(mostYears, language.years);
	}

	for (i = data.programming.length - 1; i >= 0; i--) {
		language = data.programming[i];
		language.barValue = 100*(language.years/mostYears) + "%";
		var wordNumber = converter.toWords(language.years);

		language.description = (language.yearsOverride ? language.yearsOverride : wordNumber.charAt(0).toUpperCase() +
			wordNumber.slice(1).toLowerCase() + " year" + (language.years == 1 ? "" : "s")) + " experience" +
			(language.description ? ", " + language.description : "");
	}

	// Format text for web:
	var item;
	for (i = 0; i < data.experience.length; i++) {
		item = data.experience[i];
		item.position = formatTextForWeb(item.position);
		item.company = formatTextForWeb(item.company);
		item.dates = formatTextForWeb(item.dates);
		item.location = formatTextForWeb(item.location);
		for (j = 0; j < item.descriptionBullets.length; j++) {
			item.descriptionBullets[j] = formatTextForWeb(item.descriptionBullets[j]);
		}
	}

	for (i = 0; i < data.education.length; i++) {
		item = data.education[i];
		item.degree = formatTextForWeb(item.degree);
		item.school = formatTextForWeb(item.school);
		item.dates = formatTextForWeb(item.dates);
		item.location = formatTextForWeb(item.location);
		for (j = 0; j < item.descriptionBullets.length; j++) {
			item.descriptionBullets[j] = formatTextForWeb(item.descriptionBullets[j]);
		}
	}

	for (i = 0; i < data.projects.length; i++) {
		item = data.projects[i];
		item.name = formatTextForWeb(item.name);
		item.description = formatTextForWeb(item.description);
	}

	for (i = 0; i < data.programming.length; i++) {
		item = data.programming[i];
		item.language = formatTextForWeb(item.language);
		item.description = formatTextForWeb(item.description);
	}

	for (i = 0; i < data.software.length; i++) {
		var level = data.software[i];
		level.level = formatTextForWeb(level.level);
		for (j = 0; j < level.software.length; j++) {
			level.software[j].name = formatTextForWeb(level.software[j].name);
		}
	}

	for (i = 0; i < data.miscellaneous.length; i++) {
		data.miscellaneous[i] = formatTextForWeb(data.miscellaneous[i]);
	}

	for (i = 0; i < data.achievements.competitions.length; i++) {
		data.achievements.competitions[i].name = formatTextForWeb(data.achievements.competitions[i].name);
	}

	for (i = 0; i < data.achievements.academic.length; i++) {
		data.achievements.academic[i] = formatTextForWeb(data.achievements.academic[i]);
	}

	for (i = 0; i < data.activities.length; i++) {
		item = data.activities[i];
		item.title = formatTextForWeb(item.title);
		item.description = formatTextForWeb(item.description);
	}
}

/* GET home page. */
router.get('/', function(req, res, next) {
	// Render the page with the current page data
	if (data) {
		res.render('index', data);
	} else {
		res.send('This page is being built. Check back in a few seconds.');
	}
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
		var finished = 0;
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
					if (++finished == body.files.length) {
						updatePageData();
					}
				});
		}
		for (var i = 0; i < body.files.length; i++) {
			getFile(body.files[i]);
		}
	});
}

doUpdateData();
module.exports = router;
