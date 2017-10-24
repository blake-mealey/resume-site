$(document).ready(function() {
	var stickyNavTop = $("#info").offset().top;
	var stickyNav = function() {
		var scrollTop = $(window).scrollTop();
		if(scrollTop > stickyNavTop) {
			$("#info").removeClass("relative");
			$("#info").addClass("sticky");
		} else {
			$("#info").removeClass("sticky");
			$("#info").addClass("relative");
		}
	};

	stickyNav();
	$(window).scroll(function() {
		stickyNav();
	});
});
