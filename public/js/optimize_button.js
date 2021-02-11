$(".add-label").click(function(evt) {
    let uri = $(this).find('input:first').attr('id')
    evt.stopPropagation();
    evt.preventDefault();
    $(this).toggleClass("btn-info");
    $(this).toggleClass("btn-secondary");

    var changeText, checked_bool;
    if ($(this).hasClass("btn-info")) {
        $('div[name="' + uri + '"]').show();
        changeText = "Add";
        checked_bool = true;
    }
    else {
        $('div[name="' + uri + '"]').hide();
        changeText = "Ignore";
        checked_bool = false;
    }
    $(this).contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith(changeText);
    $(this).contents().filter(function(){ return this.nodeType != 3; }).first().prop("checked", checked_bool);
});

$(".remove-label").click(function(evt) {
    let uri = $(this).find('input:first').attr('id')
    evt.stopPropagation();
    evt.preventDefault();
    $(this).toggleClass("btn-warning");
    $(this).toggleClass("btn-secondary");

    var changeText, checked_bool;
    if ($(this).hasClass("btn-warning")) {
        $('div[name="' + uri + '"]').hide();
        changeText = "Remove";
        checked_bool = true;
    }
    else {
        $('div[name="' + uri + '"]').show();
        changeText = "Ignore";
        checked_bool = false;
    }
    
    $(this).contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith(changeText);
    $(this).contents().filter(function(){ return this.nodeType != 3; }).first().prop("checked", checked_bool);
});

$(".keep-label").click(function(evt) {
    let uri = $(this).find('input:first').attr('id')
    evt.stopPropagation();
    evt.preventDefault();
    $(this).toggleClass("btn-primary");
    $(this).toggleClass("btn-warning");

    var changeText, checked_bool;
    if ($(this).hasClass("btn-primary")) {
        $('div[name="' + uri + '"]').show();
        changeText = "Keep";
        checked_bool = false;
    }
    else {
        $('div[name="' + uri + '"]').hide(); 
        changeText = "Remove";
        checked_bool = true;
    }
    
    $(this).contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith(changeText);
    $(this).contents().filter(function(){ return this.nodeType != 3; }).first().prop("checked", checked_bool);
});

// Hide remove, keep, and final song lists on page load
$(document).ready(function() {
    $(".remove-list").hide();
    $(".keep-list").hide();
    $(".final-list").hide();
    $(".final-hidden").hide();
})

$(".select-add").click(function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    if (!$(this).hasClass("active")) {
        $(this).addClass("active");
        $(".add-list").show("slow");
        $(".remove-list").hide();
        $(".keep-list").hide();
        $(".final-list").hide();
    }
    if ($(".select-remove").hasClass("active")) {
        $(".select-remove").removeClass("active");
        $(".remove-list").hide();
    }
    if ($(".select-keep").hasClass("active")) {
        $(".select-keep").removeClass("active")
        $(".keep-list").hide();
    }
    if ($(".select-final").hasClass("active")) {
        $(".select-final").removeClass("active")
        $(".final-list").hide();
    }
});

$(".select-remove").click(function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    if (!$(this).hasClass("active")) {
        $(this).addClass("active");
        $(".add-list").hide();
        $(".remove-list").show("slow");
        $(".keep-list").hide();
        $(".final-list").hide();
    }
    if ($(".select-add").hasClass("active")) {
        $(".select-add").removeClass("active");
        $(".add-list").hide();
    }
    if ($(".select-keep").hasClass("active")) {
        $(".select-keep").removeClass("active")
        $(".keep-list").hide();
    }
    if ($(".select-final").hasClass("active")) {
        $(".select-final").removeClass("active")
        $(".final-list").hide();
    }
});

$(".select-keep").click(function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    if (!$(this).hasClass("active")) {
        $(this).addClass("active");
        $(".add-list").hide();
        $(".remove-list").hide();
        $(".final-list").hide();
        $(".keep-list").show();
    }
    if ($(".select-remove").hasClass("active")) {
        $(".select-remove").removeClass("active");
        $(".remove-list").hide();
    }
    if ($(".select-add").hasClass("active")) {
        $(".select-add").removeClass("active")
        $(".add-list").hide();
    }
    if ($(".select-final").hasClass("active")) {
        $(".select-final").removeClass("active")
        $(".final-list").hide();
    }
});


$(".select-final").click(function(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    if (!$(this).hasClass("active")) {
        $(this).addClass("active");
        $(".final-list").show("slow");
        $(".add-list").hide();
        $(".remove-list").hide();
        $(".keep-list").hide();
    }
    if ($(".select-remove").hasClass("active")) {
        $(".select-remove").removeClass("active");
        $(".remove-list").hide();
    }
    if ($(".select-keep").hasClass("active")) {
        $(".select-keep").removeClass("active")
        $(".keep-list").hide();
    }
    if ($(".select-add").hasClass("active")) {
        $(".select-add").removeClass("active")
        $(".add-list").hide();
    }
});