$("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });
 $("#menu-toggle-2").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled-2");
    $('#menu ul').hide();
});

function initMenu() {
    $('#menu ul').hide();
    $('#menu ul').children('.current').parent().show();
    $('#menu li a').click(
    function(e) {
        var checkElement = $(this).next();
        if(checkElement.is('ul')) {
            if (checkElement.is(':visible')) {
                checkElement.slideUp('normal');
                return false;
            } else {
                $('#menu ul:visible').slideUp('normal');
                checkElement.slideDown('normal');
                return false;
            }
        } else if ($(e.target).hasClass('first')) {
            return false;
        } else {
            $('#menu ul:visible').slideUp('normal');
            return false;
        }
    }
    );
}
$(document).ready(function() {initMenu();});