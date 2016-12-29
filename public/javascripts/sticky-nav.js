$(document).ready(function() {
	var stickyNavTop = $("#info").offset().top;
	var stickyNav = function() {
		var scrollTop = $(window).scrollTop();
		if(scrollTop > stickyNavTop) {
			$("#info").addClass("sticky");
		} else {
			$("#info").removeClass("sticky");
		}
	};

	stickyNav();
	$(window).scroll(function() {
		stickyNav();
	});
});
